import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, LockLine, MicIcon, Outline, Top, useScreen } from "../../src/components/voice/Kit";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";
import { voiceCopy } from "../../src/voice/copy";
import { TONE_COPY } from "../../src/voice/signals";
import { ScrollBody } from "../../src/components/ScrollBody";

type Offer = {
  title: string;
  when: string;
  question: string;
  moods: string[];
  selected: string;
  offerTitle: string;
  offerBody: string;
  speak: string;
  typeInstead: string;
  skip: string;
  footer: string;
  misread: string;
};

export default function VoiceOffer() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const seeded = useScreen<Offer>("offer");
  const copy = seeded ?? voiceCopy.offer;
  const typing = useNabt((s) => s.offerTyping);
  const [mood, setMood] = useState(copy.selected || "Heavy");
  const stressed = mood === "Heavy" || mood === "Tired";
  return (
    <Screen bg={C.ground}>
      <Top title={copy.title} />
      <ScrollBody contentContainerStyle={[styles.main, { paddingBottom: 24 }]}>
        <Text style={styles.ey}>{copy.when}</Text>
        <Text style={styles.q}>{copy.question}</Text>
        <View style={styles.cos}>
          {copy.moods.map((m) => (
            <Pressable key={m} onPress={() => setMood(m)} style={[styles.co, mood === m && styles.on]} accessibilityState={{ selected: mood === m }}>
              <Text style={[t(600, 14, 18), { color: mood === m ? C.burgundy : C.white }]}>{m}</Text>
            </Pressable>
          ))}
        </View>
        {stressed ? (
          <View style={styles.offer}>
            <View style={styles.mic}>
              <MicIcon />
            </View>
            <Text style={styles.offerTitle}>{copy.offerTitle}</Text>
            <Text style={styles.body}>{copy.offerBody}</Text>
            <Text style={styles.body}>{TONE_COPY}</Text>
            <View style={styles.btn}>
              <Gold label={copy.speak} onPress={() => router.push("/voice/recording" as never)} />
            </View>
            {typing ? (
              <View style={styles.btnTight}>
                <Outline label={copy.typeInstead} onPress={() => router.push("/voice/type" as never)} />
              </View>
            ) : null}
            <Outline label={copy.skip} ghost onPress={() => router.replace("/home" as never)} />
          </View>
        ) : (
          <View style={{ marginTop: 28, alignSelf: "stretch" }}>
            <Gold label="Save" onPress={() => router.replace("/home" as never)} />
          </View>
        )}
        <LockLine>{copy.footer}</LockLine>
      </ScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: { paddingHorizontal: 20, paddingTop: 18, alignItems: "center" },
  ey: { ...t(600, 11, 14), letterSpacing: 1.6, textTransform: "uppercase", color: C.w64 },
  q: { marginTop: 10, ...t(600, 24, 30), color: C.white, textAlign: "center" },
  cos: { marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  co: { height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: C.white, borderColor: C.white },
  offer: { marginTop: 26, alignSelf: "stretch", paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12, borderRadius: 26, backgroundColor: C.raised, borderWidth: 1, borderColor: C.w10, alignItems: "stretch" },
  btn: { marginTop: 18, alignSelf: "stretch" },
  btnTight: { marginTop: 10, alignSelf: "stretch" },
  mic: { alignSelf: "center", width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  offerTitle: { ...t(600, 19, 24), color: C.white, textAlign: "center" },
  body: { marginTop: 8, ...t(400, 14.5, 22), color: "rgba(255,255,255,0.78)", textAlign: "center" },
});
