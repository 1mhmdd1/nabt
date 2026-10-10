import { useState } from "react";
import { ScrollView, Text, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, GoldButton } from "../../../src/components/Chrome";
import { Muted, SubHead } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { useCampus } from "../../../src/live";
import { publishAnnouncement } from "../../../src/live/impact";
import { ChairOnly } from "../../../src/community/ChairOnly";

export default function CircleAnnounce() {
  return (
    <ChairOnly>
      <CircleAnnounceScreen />
    </ChairOnly>
  );
}

function CircleAnnounceScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "";
  const circle = useCampus((s) => s.circles[id]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [pinUntil, setPinUntil] = useState("");
  const [error, setError] = useState("");

  async function publish() {
    setError("");
    try {
      await publishAnnouncement({ title, body, link, eventDate, pinUntil, audience: "circle", circleId: id });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post.");
    }
  }

  return (
    <Screen>
      <SubHead title="Announce" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
        <Muted>Only {circle?.name || "this Circle"} will see it.</Muted>
        <Field value={title} onChange={setTitle} label="Title" />
        <Field value={body} onChange={setBody} label="Short note" />
        <Field value={link} onChange={setLink} label="Link, optional" />
        <Field value={eventDate} onChange={setEventDate} label="Date, optional" />
        <Field value={pinUntil} onChange={setPinUntil} label="Pin until · 2026-10-16" />
        {error ? <Text style={[t(500, 13, 18), { color: C.w80 }]}>{error}</Text> : null}
        <GoldButton label="Post to Circle" onPress={() => void publish()} />
      </ScrollView>
    </Screen>
  );
}

function Field({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <TextInput value={value} onChangeText={onChange} placeholder={label} placeholderTextColor={C.w64} style={{ backgroundColor: C.raised, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, ...t(500, 15, 20) }} />
  );
}
