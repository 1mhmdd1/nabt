import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, PlantLotus, Top, useScreen, WhiteBtn } from "../../src/components/voice/Kit";
import { C, t } from "../../src/theme";
import { ScrollBody } from "../../src/components/ScrollBody";

type Step = { title: string; sub: string; state: string };
type Copy = {
  title: string;
  lead: string;
  onPhone: string;
  steps: Step[];
  leaves: string;
  leavesBody: string;
  never: string;
  neverBody: string;
  danger: string;
  done: string;
};

export default function CareExplainer() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("careExplainer");
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Top title={copy.title} />
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={{ alignItems: "center" }}>
          <PlantLotus width={96} height={66} />
        </View>
        <Text style={styles.lead}>{copy.lead}</Text>
        <View style={styles.panel}>
          <Text style={styles.ey}>{copy.onPhone}</Text>
          {copy.steps.map((s) => (
            <View key={s.title} style={styles.step}>
              <View style={[styles.mark, s.state === "now" && styles.now]} />
              <View style={{ flex: 1 }}>
                <Text style={t(600, 13, 18)}>{s.title}</Text>
                <Text style={styles.sub}>{s.sub}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.panel}>
          <Text style={styles.ey}>{copy.leaves}</Text>
          <Text style={styles.body}>{copy.leavesBody}</Text>
          <Text style={[styles.ey, { marginTop: 14 }]}>{copy.never}</Text>
          <Text style={styles.body}>{copy.neverBody}</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.body}>{copy.danger}</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <WhiteBtn label={copy.done} onPress={() => router.back()} />
        </View>
      </ScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: 12, textAlign: "center", ...t(400, 14, 22), color: "rgba(255,255,255,0.8)" },
  panel: { marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: C.card },
  ey: { ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  step: { marginTop: 12, flexDirection: "row", gap: 10 },
  mark: { width: 10, height: 10, borderRadius: 5, marginTop: 4, backgroundColor: C.white },
  now: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)" },
  sub: { ...t(500, 12, 16), color: C.w64 },
  body: { marginTop: 8, ...t(500, 13.5, 20), color: "rgba(255,255,255,0.88)" },
});
