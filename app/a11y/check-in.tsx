import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Face, Gate, Gold, InfoIcon, Outline, Top, useScreen } from "../../src/components/voice/Kit";
import { IconChevronRight } from "../../src/components/Icons";
import { noteHeavyCheckIn } from "../../src/voice/journal";
import { recordCheckIn } from "../../src/live";
import { useVoiceSafety } from "../../src/live/voiceSafety";
import { useNabt, type Mood } from "../../src/state";
import { C, t } from "../../src/theme";

type Copy = {
  title: string;
  when: string;
  question: string;
  explain: string;
  moods: string[];
  selected: string;
  note: string;
  add: string;
  addSub: string;
  save: string;
  skip: string;
};

export default function PlainCheckIn() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("plainCheckin");
  const voiceOn = useVoiceSafety((s) => s.voiceOn);
  const saveMood = useNabt((s) => s.saveCheckIn);
  const [mood, setMood] = useState(copy?.selected || "Okay");
  if (!copy) return null;
  const save = () => {
    const next = (mood === "Heavy" || mood === "Tired" || mood === "Okay" || mood === "Lighter" || mood === "Good" ? mood : "Okay") as Mood;
    saveMood(next, "");
    const stressed = next === "Heavy" || next === "Tired";
    void (async () => {
      if (stressed) await noteHeavyCheckIn().catch(() => undefined);
      await recordCheckIn().catch(() => undefined);
      router.replace((stressed ? (voiceOn ? "/voice" : "/support") : "/home") as never);
    })();
  };
  return (
    <Screen bg={C.ground}>
      <Top title={copy.title} />
      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <Text style={styles.fl}>{copy.when}</Text>
        <Text style={styles.q}>{copy.question}</Text>
        <View style={styles.explain}>
          <InfoIcon />
          <Text style={styles.explainText}>{copy.explain}</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          {copy.moods.map((m) => {
            const on = mood === m;
            return (
              <Pressable key={m} accessibilityLabel={m} accessibilityState={{ selected: on }} onPress={() => setMood(m)} style={[styles.md, on && styles.on]}>
                <Face mood={m} color={on ? C.burgundy : C.white} />
                <Text style={[t(600, 16, 20), { color: on ? C.burgundy : C.white, flex: 1 }]}>{m}</Text>
                {on ? <Text style={[t(700, 16, 18), { color: C.burgundy }]}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.note}>{copy.note}</Text>
        <Pressable style={styles.add} onPress={() => router.push("/voice/type" as never)}>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 14.5, 18)}>{copy.add}</Text>
            <Text style={styles.small}>{copy.addSub}</Text>
          </View>
          <IconChevronRight />
        </Pressable>
        <View style={{ marginTop: 18 }}>
          <Gold label={copy.save} onPress={save} />
        </View>
        <Outline label={copy.skip} ghost onPress={() => router.replace("/home" as never)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fl: { ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  q: { marginTop: 10, ...t(600, 24, 30), color: C.white },
  explain: { marginTop: 10, flexDirection: "row", gap: 6 },
  explainText: { flex: 1, ...t(500, 13, 18), color: "rgba(255,255,255,0.8)" },
  md: { marginTop: 8, minHeight: 52, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  on: { backgroundColor: C.white, borderColor: C.white },
  note: { marginTop: 12, ...t(500, 13, 18), color: "rgba(255,255,255,0.7)" },
  add: { marginTop: 14, minHeight: 56, borderRadius: 18, backgroundColor: C.card, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  small: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
});
