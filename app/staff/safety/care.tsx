import { NavSpacer } from "../../../src/components/navSpace";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Avatar, Chip, GoldButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";

export default function CareCase() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = useStaff((s) => s.cases.find((c) => c.id === (id || "fig-care")));
  if (!item) {
    return (
      <StaffFrame title="Care signal" back="/staff/safety">
        <Text style={{ color: C.white, padding: 20 }}>Opening…</Text>
      </StaffFrame>
    );
  }
  return (
    <StaffFrame title="Care signal" chip="No content" back="/staff/safety" tab="safety" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={styles.who}>
          <Avatar letter={item.initial || "Q"} />
          <View style={{ flex: 1 }}>
            <Text style={t(700, 16, 20)}>{item.nickname}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64 }]}>Identity hidden · signal from the student’s phone · {item.when}</Text>
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.eyb}>Care level</Text>
          <View style={styles.bars}>
            <View style={[styles.bar, styles.barOn]} />
            <View style={[styles.bar, styles.barOn]} />
            <View style={styles.bar} />
          </View>
          <View style={styles.lv}>
            <Text style={[t(600, 12, 16), { color: C.w64 }]}>Gentle watch</Text>
            <Text style={t(700, 12, 16)}>Needs care</Text>
            <Text style={[t(600, 12, 16), { color: C.w64 }]}>Reach out now</Text>
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.eyb}>Why, in plain words</Text>
          {(item.reasons || []).map((line) => (
            <Text key={line} style={[t(500, 14, 20), { marginTop: 8 }]}>{line}</Text>
          ))}
        </View>
        <View style={styles.panel}>
          <Text style={styles.eyb}>Softer steps so far</Text>
          {(item.steps || []).map((step) => (
            <View key={step.title} style={{ marginTop: 8 }}>
              <Text style={t(600, 14, 18)}>{step.state === "done" ? "✓  " : "2  "}{step.title}</Text>
              <Text style={[t(500, 12, 16), { color: C.w64 }]}>{step.sub}</Text>
            </View>
          ))}
        </View>
        <Text style={[t(500, 13, 18), { color: C.w80, marginTop: 10 }]}>No score, recording or message left the phone.</Text>
        <View style={{ marginTop: 8 }}>
          <GoldButton label="Reach out anonymously" onPress={() => router.push("/staff/safety/outreach?caseId=fig-shared" as never)} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Chip label={item.careLabel || "Needs care"} on />
        </View>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: "row", gap: 12, alignItems: "center" },
  panel: { marginTop: 10, backgroundColor: C.card, borderRadius: 18, padding: 14 },
  eyb: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  bars: { flexDirection: "row", gap: 6, marginTop: 10 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)" },
  barOn: { backgroundColor: C.white },
  lv: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
});
