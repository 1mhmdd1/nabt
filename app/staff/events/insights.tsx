import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Chevron, StaffFrame, StaffMark } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff, type Kpi } from "../../../src/live/staff";
import { FeedbackSummary } from "../../../src/components/FeedbackSummary";
import { useFeedbackBoards } from "../../../src/live/records";

export default function Insights() {
  const insights = useStaff((s) => s.insights);
  const kpis = (insights?.kpis as Kpi[]) || [];
  const moods = (insights?.moods as { label: string; pct: string; width: number; opacity: number }[]) || [];
  const next = (insights?.next as { title: string; sub: string }[]) || [];
  const feedback = useFeedbackBoards();
  return (
    <StaffFrame title={String(insights?.title || "After: Breathe before finals")} chip={String(insights?.chip || "Thu Dec 4")} back="/staff/events/live">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={styles.kpis}>
          {kpis.map((k) => (
            <View key={k.label} style={styles.kpi}>
              <Text style={t(700, 24, 26)}>{k.n}</Text>
              <Text style={[t(500, 11, 14), { color: C.w70, marginTop: 6 }]}>{k.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.fl}>Anonymous mood pulse · {String(insights?.replies ?? 51)} replies</Text>
        <View style={styles.list}>
          {moods.map((m) => (
            <View key={m.label} style={styles.mb}>
              <Text style={[t(500, 13, 16), { width: 64 }]}>{m.label}</Text>
              <View style={styles.prog}><View style={[styles.bar, { width: `${Math.round(m.width * 100)}%`, opacity: Math.max(m.opacity, 0.64) }]} /></View>
              <Text style={[t(700, 13, 16), { width: 40, textAlign: "right" }]}>{m.pct}</Text>
            </View>
          ))}
        </View>
        <View style={styles.badge}>
          <StaffMark width={36} height={24} />
          <View style={{ flex: 1 }}>
            <Text style={t(700, 15, 18)}>{String(insights?.petals || "78 petals planted")}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 2 }]}>{String(insights?.petalSub || "")}</Text>
          </View>
        </View>
        {feedback.map((row) => (
          <View key={row.eventId}>
            <Text style={styles.fl}>{row.eventTitle}</Text>
            <FeedbackSummary row={row} />
          </View>
        ))}
        <Text style={styles.fl}>Next time</Text>
        <View style={styles.list}>
          {next.map((n, i) => (
            <View key={n.title} style={[styles.it, i > 0 && styles.line]}>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{n.title}</Text>
                <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 2 }]}>{n.sub}</Text>
              </View>
              <Chevron />
            </View>
          ))}
        </View>
        <View style={styles.note}>
          <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
            <Path d="M10 2.2 3.6 4.6v5c0 3.9 2.7 6.9 6.4 8.2 3.7-1.3 6.4-4.3 6.4-8.2v-5L10 2.2Z" stroke="#fff" strokeWidth={1.7} strokeLinejoin="round" />
          </Svg>
          <Text style={[t(500, 12, 16), { color: C.w64, flex: 1 }]}>No names or IDs. Results with under 5 replies are hidden.</Text>
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  kpis: { flexDirection: "row", gap: 8, marginTop: 4 },
  kpi: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: C.card },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 16, marginBottom: 8 },
  list: { borderRadius: 18, backgroundColor: C.card, padding: 14, overflow: "hidden" },
  mb: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  prog: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  bar: { height: "100%", backgroundColor: C.white },
  badge: { marginTop: 12, flexDirection: "row", gap: 12, alignItems: "center", padding: 12, borderRadius: 18, backgroundColor: C.card },
  it: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  note: { flexDirection: "row", gap: 6, marginTop: 10, alignItems: "flex-start" },
});
