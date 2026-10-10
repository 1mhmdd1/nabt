import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, GoldButton } from "../src/components/Chrome";
import { IconBack, IconWordLotus } from "../src/components/Icons";
import { C, t } from "../src/theme";
import { useNabt, type Mood } from "../src/state";
import { recordCheckIn } from "../src/live";
import { noteHeavyCheckIn } from "../src/voice/journal";
import { ScrollBody } from "../src/components/ScrollBody";

const MOODS: Mood[] = ["Heavy", "Tired", "Okay", "Lighter", "Good"];

export default function CheckIn() {
  const savedNote = useNabt((s) => s.note);
  const save = useNabt((s) => s.saveCheckIn);
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState(savedNote);
  const [label, setLabel] = useState("Save");

  return (
    <Screen bg={C.ground}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}>
          <IconBack />
        </Pressable>
        <Text style={styles.h}>Calm check-in</Text>
      </View>
      <ScrollBody contentContainerStyle={[styles.body, { paddingBottom: 24 }]}>
        <IconWordLotus width={48} height={32} />
        <Text style={styles.q}>How does right now feel?</Text>
        <View style={styles.cos}>
          {MOODS.map((m) => (
            <Pressable key={m} onPress={() => setMood(m)} style={[styles.co, mood === m && styles.on]} accessibilityState={{ selected: mood === m }}>
              <Text style={[t(600, 14, 14), { color: mood === m ? C.burgundy : C.white }]}>{m}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.priv}>Saved privately on your phone. There’s no mood feed and nobody sees this.</Text>
        <Text style={styles.k}>A note for your plant</Text>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, 80))}
          placeholder="Optional · 80 characters"
          placeholderTextColor={C.w64}
          maxLength={80}
          style={styles.note}
          accessibilityLabel="Note for your plant, up to 80 characters"
        />
        <Text style={styles.count}>{note.length}/80</Text>
        <View style={{ alignSelf: "stretch", width: "100%", marginTop: 16 }}>
        <GoldButton
          block
          label={label}
          disabled={!mood || label === "Saved"}
          onPress={() => {
            if (!mood) return;
            const picked = mood;
            setLabel("Saved");
            save(picked, note.trim());
            const stressed = picked === "Heavy" || picked === "Tired";
            void (async () => {
              if (stressed) await noteHeavyCheckIn().catch(() => undefined);
              await recordCheckIn().catch(() => undefined);
              router.replace("/home" as never);
            })();
          }}
        />
        </View>
      </ScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 8, paddingRight: 12, gap: 6 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  h: { ...t(600, 17, 17), color: C.white },
  body: { paddingHorizontal: 20, paddingTop: 28, alignItems: "center" },
  q: { marginTop: 20, ...t(700, 24, 28), color: C.white, textAlign: "center" },
  cos: { marginTop: 22, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  co: { height: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1.5, borderColor: C.w40, alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: C.white, borderColor: C.white },
  priv: { marginTop: 18, ...t(400, 13, 20), color: "rgba(255,255,255,0.7)", textAlign: "center" },
  k: { alignSelf: "flex-start", marginTop: 18, ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  note: {
    marginTop: 8,
    alignSelf: "stretch",
    height: 48,
    borderRadius: 16,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    ...t(500, 15, 18),
    color: C.white,
  },
  count: { alignSelf: "flex-end", marginTop: 6, marginBottom: 16, ...t(500, 12, 12), color: C.w64 },
});
