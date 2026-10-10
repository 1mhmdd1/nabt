import { NavSpacer } from "../../../src/components/navSpace";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Chip, SmallButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";
import { reviewReport, useImpact } from "../../../src/live/impact";

export default function Communities() {
  const rows = useStaff((s) => s.communities);
  const eventCount = useStaff((s) => s.eventCount);
  const reports = useImpact((s) => s.reports);
  const members = rows.reduce((n, r) => n + (r.members || 0), 0);
  const requests = rows.reduce((n, r) => n + (r.requests || 0), 0);
  return (
    <StaffFrame title="Communities" chip={`${rows.length} verified`} tab="overview">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
        <View style={styles.kpis}>
          <Kpi n={String(members)} l="Active members" />
          <Kpi n={String(eventCount)} l="Events" />
          <Kpi n={String(requests)} l="Venue requests" />
        </View>
        {rows.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 12 }]}>No communities yet. A Chair creates one, then it shows up here.</Text> : null}
        {rows.map((r) => (
          <Pressable key={r.id} style={styles.card} onPress={() => router.push(`/staff/reviews/chair/${r.id}` as never)}>
            <View style={styles.r1}>
              <Text style={t(700, 16, 20)}>{r.name}</Text>
              <Chip label={r.next || ""} />
            </View>
            <View style={styles.hs}>
              <Text style={t(600, 13, 16)}><Text style={t(700, 13, 16)}>{r.members} </Text>active members</Text>
              <Text style={t(600, 13, 16)}><Text style={t(700, 13, 16)}>{r.last} </Text>last event</Text>
              <Text style={t(600, 13, 16)}><Text style={t(700, 13, 16)}>{r.requests} </Text>venue requests</Text>
            </View>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 6 }]}>{r.line}</Text>
          </Pressable>
        ))}
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>Counts only, never member nicknames.</Text>
        <Text style={[styles.k, { marginTop: 16 }]}>Semester reports</Text>
        {reports.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 8 }]}>No semester reports yet.</Text> : null}
        {reports.map((report) => (
          <View key={report.id} style={styles.card}>
            <Pressable onPress={() => router.push(`/staff/reviews/report/${report.id}` as never)}>
              <View style={styles.r1}>
                <Text style={t(700, 16, 20)}>{report.circleName}</Text>
                <Chip label={labelFor(report.status)} />
              </View>
              <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{report.eventsHeld} events · {report.uniqueAttendees} people</Text>
            </Pressable>
            {report.status === "submitted" ? (
              <View style={styles.actions}>
                <SmallButton label="Accept" on onPress={() => void reviewReport(report.id, "accepted", "")} />
                <SmallButton label="Ask for changes" onPress={() => router.push(`/staff/reviews/report/${report.id}` as never)} />
              </View>
            ) : null}
          </View>
        ))}
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

function labelFor(status: string) {
  if (status === "submitted") return "Submitted";
  if (status === "accepted") return "Accepted";
  if (status === "changes") return "Changes";
  return "With Chair";
}

function Kpi({ n, l }: { n: string; l: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={t(700, 22, 24)}>{n}</Text>
      <Text style={[t(500, 11, 14), { color: C.w70, marginTop: 4 }]}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kpis: { flexDirection: "row", gap: 8 },
  kpi: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12 },
  card: { marginTop: 8, backgroundColor: C.card, borderRadius: 18, padding: 14 },
  r1: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hs: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  k: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
});
