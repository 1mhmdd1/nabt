import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { StaffFrame, Chevron } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { useStaff, type Kpi, type WeekBar } from "../../src/live/staff";
import { privacyCount, refreshImpact, useImpact, type WeekPoint } from "../../src/live/impact";
import { demoLocal } from "../../src/local/mode";

export default function Overview() {
  const overview = useStaff((s) => s.overview);
  const nodes = useStaff((s) => s.nodes);
  const ready = useStaff((s) => s.ready);
  const error = useStaff((s) => s.error);
  const openSupport = useStaff((s) => s.supportRequests.filter((row) => row.status === "open").length);
  const openVenues = useStaff((s) => s.venues.filter((row) => row.status === "sent").length);
  const waitingAccounts = useStaff((s) => s.accounts.filter((row) => row.status === "pending" || row.status === "new_photo").length);
  const impact = useImpact((s) => s.impact);
  useEffect(() => {
    void refreshImpact();
  }, []);
  if (!ready || !overview) {
    return (
      <StaffFrame title="Overview" tab="overview">
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>{error || "Opening Student Affairs…"}</Text>
      </StaffFrame>
    );
  }
  const liveKpis: Kpi[] = [
    { n: String(openSupport), label: "Open support" },
    { n: String(openVenues), label: "Venue requests" },
    { n: String(waitingAccounts), label: "Accounts waiting", white: true },
  ];
  const kpis = liveKpis;
  const weeks = (overview.weeks as WeekBar[]) || [];
  const legend = (overview.legend as { label: string; opacity: number }[]) || [];
  const today = (overview.today as { title: string; sub: string; href: string }[]) || [];
  return (
    <StaffFrame title="Overview" chip={String(overview.chip || "This week")} tab="overview">
      <ScrollView style={styles.pad} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.kpis}>
          {kpis.map((k) => (
            <View key={k.label} style={[styles.kpi, k.white && styles.kpiW]}>
              <Text style={[t(700, 24, 26), { color: k.white ? C.burgundy : C.white }]}>{k.n}</Text>
              <Text style={[t(500, 11, 14), { color: k.white ? "rgba(65,21,21,0.7)" : C.w70, marginTop: 6 }]}>{k.label}</Text>
            </View>
          ))}
        </View>
        {impact ? <ImpactBlock /> : null}
        <View style={styles.sec}>
          <Text style={styles.fl}>Safety trends · anonymous</Text>
          <Text style={styles.link} onPress={() => router.push("/staff/safety" as never)}>Inbox</Text>
        </View>
        {weeks.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64, marginBottom: 8 }]}>No safety trend yet.</Text> : null}
        <View style={styles.chartCard}>
          <Svg viewBox="0 0 330 130" width="100%" height={92} accessibilityLabel="Anonymous signals by category per week">
            {weeks.map((w) =>
              w.bars.map((b, i) => (
                <Rect key={`${w.label}-${i}`} x={w.x} y={b.y} width={30} height={Math.max(0, b.h)} rx={3} fill="#fff" fillOpacity={b.o} />
              )),
            )}
            {weeks.map((w) => (
              <SvgText key={w.label} x={w.x + 15} y={126} textAnchor="middle" fill="rgba(255,255,255,0.64)" fontSize={10} fontWeight="600">
                {w.label}
              </SvgText>
            ))}
          </Svg>
          <View style={styles.leg}>
            {legend.map((item) => (
              <View key={item.label} style={styles.legItem}>
                <View style={[styles.swatch, { opacity: item.opacity }]} />
                <Text style={[t(500, 11, 14), { color: C.w80 }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
        {demoLocal() ? null : (
          <>
            <Text style={[styles.fl, { marginTop: 12, marginBottom: 6 }]}>Hope Nodes</Text>
            {nodes.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64 }]}>No Hope Nodes yet.</Text> : null}
            <View style={styles.list}>
              {nodes.map((n, i) => (
                <View key={n.id} style={[styles.it, i > 0 && styles.line]}>
                  <View style={[styles.dot, !n.awake && styles.dotOff]} />
                  <View style={{ flex: 1 }}>
                    <Text style={t(600, 14, 18)}>{n.name}</Text>
                    <Text style={styles.sub}>{n.line}</Text>
                  </View>
                  <Text style={[t(500, 12.5, 16), { color: C.w70 }]}>{n.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={styles.sec}>
          <Text style={styles.fl}>Today</Text>
          <Text style={styles.link} onPress={() => router.push("/staff/me" as never)}>Events · Perks · Certificates</Text>
        </View>
        <View style={styles.list}>
          {today.map((item, i) => (
            <Pressable key={item.title} style={[styles.it, i > 0 && styles.line]} onPress={() => router.push(item.href as never)}>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{item.title}</Text>
                <Text style={styles.sub}>{item.sub}</Text>
              </View>
              <Chevron />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

function ImpactBlock() {
  const impact = useImpact((s) => s.impact);
  if (!impact) return null;
  const tiles: { n: string; label: string; white?: boolean }[] = [
    { n: privacyCount(impact.events), label: "Events" },
    { n: privacyCount(impact.checkIns), label: "Check-ins" },
    { n: privacyCount(impact.uniqueStudents), label: "Students reached", white: true },
    { n: privacyCount(impact.activeCircles), label: "Circles" },
    { n: privacyCount(impact.verifiedCommunities), label: "Verified" },
    { n: privacyCount(impact.newMembers), label: "New members" },
  ];
  if (typeof impact.avgRating === "number") tiles.push({ n: String(impact.avgRating), label: "Avg rating" });
  if (typeof impact.certificatesIssued === "number") tiles.push({ n: privacyCount(impact.certificatesIssued), label: "Certificates" });
  const maxTop = Math.max(1, ...impact.top.map((row) => row.score));
  return (
    <View>
      <View style={styles.sec}>
        <Text style={styles.fl}>{impact.semester}</Text>
        <Text style={styles.link} onPress={() => router.push("/staff/announce" as never)}>Announce</Text>
      </View>
      <View style={styles.kpis}>
        {tiles.map((k) => (
          <View key={k.label} style={[styles.kpi, k.white && styles.kpiW]}>
            <Text style={[t(700, 24, 26), { color: k.white ? C.burgundy : C.white }]}>{k.n}</Text>
            <Text style={[t(500, 11, 14), { color: k.white ? "rgba(65,21,21,0.7)" : C.w70, marginTop: 6 }]}>{k.label}</Text>
          </View>
        ))}
      </View>
      {impact.weeks.length > 0 ? (
        <View style={[styles.chartCard, { marginTop: 8 }]}>
          <Text style={[styles.fl, { marginBottom: 6 }]}>Wellbeing · anonymous</Text>
          <WeekChart weeks={impact.weeks} />
        </View>
      ) : null}
      <Text style={[styles.fl, { marginTop: 12, marginBottom: 6 }]}>Most active Circles</Text>
      <View style={styles.list}>
        {impact.top.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64 }]}>No Circle activity yet.</Text> : null}
      {impact.top.map((row, index) => (
          <View key={row.id} style={[styles.it, index > 0 && styles.line]}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>{row.name}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round((row.score / maxTop) * 100)}%` }]} />
              </View>
            </View>
            <Text style={[t(600, 13, 16), { color: C.w70 }]}>{privacyCount(row.score)}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.link, { marginTop: 8 }]} onPress={() => router.push("/staff/you-said" as never)}>You said, we did</Text>
    </View>
  );
}

function WeekChart({ weeks }: { weeks: WeekPoint[] }) {
  const max = Math.max(1, ...weeks.map((week) => week.score));
  const gap = 330 / Math.max(weeks.length, 1);
  return (
    <Svg viewBox="0 0 330 100" width="100%" height={108} accessibilityLabel="Anonymous wellbeing by week. Exam weeks are marked.">
      {weeks.map((week, index) => {
        const h = Math.max(4, (week.score / max) * 58);
        const x = index * gap + 16;
        return (
          <Rect key={week.label} x={x} y={68 - h} width={26} height={h} rx={3} fill="#fff" fillOpacity={week.exam ? 1 : 0.45} />
        );
      })}
      {weeks.map((week, index) => (
        <SvgText key={`${week.label}-l`} x={index * gap + 29} y={84} textAnchor="middle" fill="rgba(255,255,255,0.64)" fontSize={10} fontWeight="600">
          {week.label}
        </SvgText>
      ))}
      {weeks.filter((week) => week.exam).map((week) => {
        const index = weeks.indexOf(week);
        return (
          <SvgText key={`${week.label}-e`} x={index * gap + 29} y={96} textAnchor="middle" fill="rgba(255,255,255,0.80)" fontSize={9} fontWeight="600">
            Exam
          </SvgText>
        );
      })}
    </Svg>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20, paddingTop: 8 },
  kpis: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpi: { width: "31%", flexGrow: 1, backgroundColor: C.card, borderRadius: 16, padding: 12 },
  kpiW: { backgroundColor: C.white },
  sec: { marginTop: 12, marginBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  link: { ...t(600, 12, 14), color: C.white, opacity: 0.8 },
  chartCard: { backgroundColor: C.card, borderRadius: 18, padding: 12 },
  leg: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  swatch: { width: 9, height: 9, borderRadius: 2, backgroundColor: C.white },
  list: { backgroundColor: C.card, borderRadius: 18, overflow: "hidden" },
  it: { minHeight: 46, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  dotOff: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.45)" },
  track: { marginTop: 6, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.16)", overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: C.white },
});
