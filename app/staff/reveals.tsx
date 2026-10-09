import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StaffFrame } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { useStaff } from "../../src/live/staff";

const REASON: Record<string, string> = {
  danger_to_self: "Danger to self",
  danger_to_others: "Danger to others",
  legal_requirement: "Legal requirement",
  other: "Other",
};

export default function Reveals() {
  const reveals = useStaff((s) => s.reveals);
  const profile = useStaff((s) => s.profile);
  return (
    <StaffFrame title="Identity reveals" chip={String(profile?.revealCount ?? reveals.length)} back="/staff/me">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={[t(500, 13, 18), { color: C.w64, marginBottom: 10 }]}>{String(profile?.revealLine || "")}</Text>
        {reveals.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.r1}>
              <Text style={t(700, 15, 18)}>{REASON[r.reason] || r.reason}</Text>
              <Text style={[t(500, 12, 16), { color: C.w64 }]}>{r.when}</Text>
            </View>
            <Text style={[t(400, 13, 18), { color: C.w80, marginTop: 6 }]}>{r.note}</Text>
          </View>
        ))}
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 8 }]}>Each reveal is on the Admin log and on that student’s privacy log. Staff never reveal without a written reason.</Text>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, padding: 14, marginBottom: 8 },
  r1: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
