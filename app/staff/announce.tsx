import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { GoldButton, Pills, StaffFrame } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { publishAnnouncement, useImpact } from "../../src/live/impact";

const AUDIENCES = ["Everyone", "A faculty"];

export default function Announce() {
  const rows = useImpact((s) => s.announcements);
  const notice = useImpact((s) => s.notice);
  const [audience, setAudience] = useState("Everyone");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [faculty, setFaculty] = useState("Faculty of Engineering");
  const [pinUntil, setPinUntil] = useState("");
  const [error, setError] = useState("");

  async function publish() {
    setError("");
    try {
      await publishAnnouncement({
        title,
        body,
        link,
        eventDate,
        pinUntil,
        audience: audience === "A faculty" ? "faculty" : "everyone",
        faculty,
      });
      setTitle("");
      setBody("");
      setLink("");
      setEventDate("");
      setPinUntil("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post.");
    }
  }

  return (
    <StaffFrame title="Announce" back="/staff/overview" tab="none">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
        <Pills items={AUDIENCES} value={audience} onChange={setAudience} />
        <Field value={title} onChange={setTitle} label="Title" />
        <Field value={body} onChange={setBody} label="Short note" multiline />
        <Field value={link} onChange={setLink} label="Link, optional" />
        <Field value={eventDate} onChange={setEventDate} label="Date, optional" />
        {audience === "A faculty" ? <Field value={faculty} onChange={setFaculty} label="Faculty" /> : null}
        <Field value={pinUntil} onChange={setPinUntil} label="Pin until · 2026-12-20" />
        {error ? <Text style={[t(500, 13, 18), { color: C.w80 }]}>{error}</Text> : null}
        {notice ? <Text style={[t(500, 13, 18), { color: C.w80 }]}>{notice}</Text> : null}
        <GoldButton label="Publish" onPress={() => void publish()} />
        <Text style={[t(600, 11, 14), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 8 }]}>Posted</Text>
        {rows.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64 }]}>Nothing posted yet.</Text> : null}
        {rows.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={t(600, 14, 18)}>{item.title}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 2 }]}>
              {item.verified ? "Verified · " : ""}
              {item.audience === "everyone" ? "Everyone" : item.faculty || "Circle"}
            </Text>
          </View>
        ))}
      </ScrollView>
    </StaffFrame>
  );
}

function Field({ value, onChange, label, multiline }: { value: string; onChange: (v: string) => void; label: string; multiline?: boolean }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={label}
      placeholderTextColor={C.w64}
      accessibilityLabel={label}
      multiline={multiline}
      style={[styles.input, multiline && { minHeight: 72, textAlignVertical: "top" }]}
    />
  );
}

const styles = {
  input: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...t(500, 15, 20),
  },
  row: { backgroundColor: C.card, borderRadius: 14, padding: 12 },
};
