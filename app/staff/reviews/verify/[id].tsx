import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Chip, GoldButton, OutlineButton, StaffFrame } from "../../../../src/components/staff/StaffChrome";
import { C, t } from "../../../../src/theme";
import { verifyCommunity, useStaff } from "../../../../src/live/staff";

export default function VerifyDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = useStaff((s) => s.notice);
  const item = useStaff((s) => s.reviews.find((r) => r.id === id));
  if (!item) {
    return (
      <StaffFrame title="Review Circle" back="/staff/reviews/verify">
        <Text style={{ color: C.white, padding: 20 }}>Opening…</Text>
      </StaffFrame>
    );
  }
  return (
    <StaffFrame title={item.name} chip="Applying" back="/staff/reviews/verify" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <View style={styles.hs}>
          <Stat n={String(item.members)} l="members" />
          <Stat n={String(item.activeMonth || 0)} l="active this month" />
          <Stat n={String(item.eventsTerm || 0)} l="events this term" />
        </View>
        <View style={styles.card}>
          <Text style={styles.fl}>Charter</Text>
          <Text style={[t(500, 14, 20), { marginTop: 6 }]}>{item.charter}</Text>
        </View>
        <View style={styles.list}>
          <Row title={`Chair · ${item.chair}`} sub="Your only contact for this Circle · UA email confirmed" v="✓" />
          <Row title="Board" sub="Members confirmed · names stay in the Circle" v={String(item.board || 0)} />
          <Row title="Faculty advisor" sub={item.advisor || ""} v="—" />
          <Row title="Setup checklist" sub="Steps done" v={item.checklist || ""} />
        </View>
        {notice ? <Text accessibilityLabel="Verify notice">{notice}</Text> : null}
        <View style={{ marginTop: 12 }}>
          <GoldButton label="Verify Circle" onPress={() => verifyCommunity(item.id, "verified")} />
        </View>
        <View style={styles.row}>
          <OutlineButton compact label="Request changes" onPress={() => verifyCommunity(item.id, "changes")} />
          <OutlineButton compact label="Decline" onPress={() => verifyCommunity(item.id, "declined")} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Chip label="“Almost there, add an advisor?”" />
          <Chip label="“Let’s meet first”" />
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={t(700, 18, 20)}>{n}</Text>
      <Text style={[t(500, 11, 14), { color: C.w64 }]}>{l}</Text>
    </View>
  );
}
function Row({ title, sub, v }: { title: string; sub: string; v: string }) {
  return (
    <View style={styles.it}>
      <View style={{ flex: 1 }}>
        <Text style={t(600, 14, 18)}>{title}</Text>
        <Text style={[t(500, 12, 16), { color: C.w64 }]}>{sub}</Text>
      </View>
      <Text style={[t(500, 13, 16), { color: C.w70 }]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hs: { flexDirection: "row", gap: 8 },
  card: { marginTop: 10, backgroundColor: C.card, borderRadius: 18, padding: 14 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  list: { marginTop: 8, backgroundColor: C.card, borderRadius: 18, overflow: "hidden" },
  it: { paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
});
