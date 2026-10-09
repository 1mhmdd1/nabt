import { useEffect } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Chrome";
import { Gate, Outline, Top, useScreen, WhiteBtn } from "../../src/components/voice/Kit";
import { markSofterStep } from "../../src/voice/session";
import { C, t } from "../../src/theme";

type Copy = { only: string; title: string; body: string; better: string; heavy: string; call: string; sent: string; peer: string };

export default function GentleInChat() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("gentleChat");
  useEffect(() => {
    void markSofterStep("next_day_checkin");
  }, []);
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Top title="Exam Week" />
      <View style={{ paddingHorizontal: 20 }}>
        <View style={styles.msg}>
          <View style={styles.av}>
            <Text style={[t(600, 13, 16), { color: C.gold }]}>P</Text>
          </View>
          <View style={styles.bub}>
            <Text style={t(400, 14.5, 20)}>{copy.peer}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.fl}>{copy.only}</Text>
          <Text style={styles.h}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <WhiteBtn label={copy.better} onPress={() => void markSofterStep("next_day_checkin")} />
            </View>
            <View style={{ flex: 1 }}>
              <Outline label={copy.heavy} onPress={() => void markSofterStep("next_day_checkin")} />
            </View>
          </View>
          <Text style={styles.call} onPress={() => void Linking.openURL("tel:1564")}>
            {copy.call}
          </Text>
        </View>
        <Text style={styles.sys}>{copy.sent}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  msg: { marginTop: 8, flexDirection: "row", gap: 8 },
  av: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  bub: { padding: 12, borderRadius: 16, backgroundColor: C.card, maxWidth: 250 },
  card: { marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  h: { marginTop: 10, ...t(600, 17, 22), color: C.white },
  body: { marginTop: 4, ...t(400, 13, 18), color: "rgba(255,255,255,0.75)" },
  row: { marginTop: 12, flexDirection: "row", gap: 8 },
  call: { marginTop: 10, ...t(600, 13, 18), color: C.white },
  sys: { marginTop: 16, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
});
