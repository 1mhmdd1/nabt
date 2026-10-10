import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { FloatingNav } from "../../src/components/Nav";
import { Gate, Gold, LockLine, Outline, PlantLotus, useScreen } from "../../src/components/voice/Kit";
import { markSofterStep } from "../../src/voice/session";
import { C, t } from "../../src/theme";
import { ScrollBody } from "../../src/components/ScrollBody";

type Copy = {
  greeting: string;
  eyebrow: string;
  title: string;
  moods: string[];
  selected: string;
  save: string;
  skip: string;
  callTitle: string;
  callSub: string;
  call: string;
  foot: string;
};

export default function CareGentle() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("careGentle");
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState(copy?.selected || "");
  useEffect(() => {
    void markSofterStep("next_day_checkin");
  }, []);
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Text style={styles.greet}>{copy.greeting}</Text>
      <ScrollBody nav contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={styles.panel}>
          <View style={{ alignSelf: "center" }}>
            <PlantLotus width={88} height={60} />
          </View>
          <Text style={styles.ey}>{copy.eyebrow}</Text>
          <Text style={styles.h}>{copy.title}</Text>
          <View style={styles.cos}>
            {copy.moods.map((m) => (
              <Pressable key={m} onPress={() => setMood(m)} style={[styles.co, mood === m && styles.on]}>
                <Text style={[t(600, 13, 16), { color: mood === m ? C.burgundy : C.white }]}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ marginTop: 18, alignSelf: "stretch" }}>
            <Gold label={copy.save} onPress={() => router.replace("/home" as never)} />
          </View>
          <Outline
            label={copy.skip}
            ghost
            onPress={() => {
              void markSofterStep("next_day_checkin");
              router.replace("/home" as never);
            }}
          />
        </View>
        <Pressable style={styles.call} onPress={() => void Linking.openURL("tel:1564")}>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 14, 18)}>{copy.callTitle}</Text>
            <Text style={styles.sub}>{copy.callSub}</Text>
          </View>
          <View style={styles.callBtn}>
            <Text style={[t(700, 13, 16), { color: C.burgundy }]}>{copy.call}</Text>
          </View>
        </Pressable>
        <LockLine>{copy.foot}</LockLine>
      </ScrollBody>
      <FloatingNav active="home" quiet open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greet: { paddingHorizontal: 20, paddingTop: 12, ...t(700, 28, 32), color: C.white },
  panel: { marginTop: 22, paddingHorizontal: 20, paddingTop: 26, paddingBottom: 12, borderRadius: 22, backgroundColor: C.card, alignItems: "stretch" },
  ey: { marginTop: 14, ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  h: { marginTop: 10, ...t(600, 21, 28), color: C.white, textAlign: "center" },
  cos: { marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  co: { height: 42, paddingHorizontal: 12, borderRadius: 21, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: C.white, borderColor: C.white },
  call: { marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: C.card, flexDirection: "row", alignItems: "center", gap: 10 },
  sub: { marginTop: 2, ...t(500, 12, 16), color: "rgba(255,255,255,0.7)" },
  callBtn: { height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
});
