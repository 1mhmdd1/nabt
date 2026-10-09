import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { GoldButton, StaffFrame } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { publishYouSaid, useImpact } from "../../src/live/impact";

export default function YouSaidScreen() {
  const rows = useImpact((s) => s.youSaid);
  const [title, setTitle] = useState("");
  const [line, setLine] = useState("");
  const [source, setSource] = useState("");
  const [link, setLink] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  async function publish() {
    setError("");
    try {
      await publishYouSaid({ title, line, source, link, date });
      setTitle("");
      setLine("");
      setSource("");
      setLink("");
      setDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post.");
    }
  }

  return (
    <StaffFrame title="You said, we did" back="/staff/overview" tab="none">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
        <Text style={[t(500, 13, 18), { color: C.w64 }]}>A short note on what changed.</Text>
        <Field value={title} onChange={setTitle} label="Title" />
        <Field value={line} onChange={setLine} label="One line" />
        <Field value={source} onChange={setSource} label="Source, optional" />
        <Field value={link} onChange={setLink} label="Link, optional" />
        <Field value={date} onChange={setDate} label="Date · Oct 8" />
        {error ? <Text style={[t(500, 13, 18), { color: C.w80 }]}>{error}</Text> : null}
        <GoldButton label="Post update" onPress={() => void publish()} />
        {rows.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 8 }]}>No updates yet.</Text> : null}
        {rows.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={t(600, 15, 20)}>{item.title}</Text>
            <Text style={[t(400, 14, 20), { color: C.w80, marginTop: 2 }]}>{item.line}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{item.date}{item.source ? ` · ${item.source}` : ""}</Text>
          </View>
        ))}
      </ScrollView>
    </StaffFrame>
  );
}

function Field({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <TextInput value={value} onChangeText={onChange} placeholder={label} placeholderTextColor={C.w64} style={styles.input} />
  );
}

const styles = {
  input: { backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, ...t(500, 15, 20) },
  row: { backgroundColor: C.card, borderRadius: 14, padding: 12, marginTop: 4 },
};
