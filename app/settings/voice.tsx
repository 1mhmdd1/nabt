import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Gate, Gold, Outline, Sheet, useScreen } from "../../src/components/voice/Kit";
import { setVoiceCheckins, useVoiceSafety } from "../../src/live/voiceSafety";
import { C, t } from "../../src/theme";
import SettingsPage from "./index";
import { voiceCopy } from "../../src/voice/copy";
import { ScrollBody } from "../../src/components/ScrollBody";

type Copy = { title: string; body: string; toggle: string; toggleSub: string; points: string[]; care: string; careSub: string; on: string; off: string; skip: string };

/** AREA: voice-safety-a11y — the voice sheet sits on the real Settings screen. */
export default function VoiceSettings() {
  return (
    <Gate>
      <View style={{ flex: 1 }}>
        <SettingsPage />
        <SheetBody />
      </View>
    </Gate>
  );
}

function SheetBody() {
  const seeded = useScreen<Copy>("voiceSheet");
  const copy = seeded ?? voiceCopy.sheet;
  const on = useVoiceSafety((s) => s.voiceOn);
  const { height } = useWindowDimensions();
  return (
    <>
      <View style={styles.scrim} />
      <Sheet title={copy.title}>
        <ScrollBody style={{ flex: 0, maxHeight: height * 0.7 }}>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14.5, 18)}>{copy.toggle}</Text>
              <Text style={styles.small}>{copy.toggleSub}</Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel={copy.toggle}
              accessibilityState={{ checked: on }}
              onPress={() => void setVoiceCheckins(!on).catch(() => undefined)}
              style={[styles.tg, on && styles.tgOn]}
            >
              <View style={[styles.knob, on && { marginLeft: 18, backgroundColor: C.burgundy }]} />
            </Pressable>
          </View>
          {copy.points.map((p) => (
            <Text key={p} style={styles.point}>
              {p}
            </Text>
          ))}
          <Pressable style={styles.care} onPress={() => router.push("/care/explainer" as never)}>
            <Text style={t(600, 14, 18)}>{copy.care}</Text>
            <Text style={styles.small}>{copy.careSub}</Text>
          </Pressable>
          <View style={{ marginTop: 10 }}>
            <Gold label={on ? copy.off : copy.on} onPress={() => void setVoiceCheckins(!on).catch(() => undefined)} />
          </View>
          <Outline label={copy.skip} ghost onPress={() => router.back()} />
        </ScrollBody>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,4,5,0.62)", zIndex: 20 },
  body: { marginTop: 4, ...t(400, 14, 20), color: "rgba(255,255,255,0.8)" },
  toggleRow: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: C.ground, flexDirection: "row", alignItems: "center" },
  small: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  tg: { width: 44, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", paddingLeft: 3 },
  tgOn: { backgroundColor: C.white },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.white },
  point: { marginTop: 8, ...t(500, 13, 18), color: "rgba(255,255,255,0.85)" },
  care: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: C.ground },
});
