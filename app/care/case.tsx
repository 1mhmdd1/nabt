import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, LockLine, Top, useScreen } from "../../src/components/voice/Kit";
import { IconLotus } from "../../src/components/Icons";
import { C, t } from "../../src/theme";

type Step = { title: string; sub: string; state: string };
type Copy = {
  title: string;
  chip: string;
  nickname: string;
  initial: string;
  meta: string;
  levelLabel: string;
  levels: string[];
  active: number;
  why: string;
  reasons: string[];
  stepsLabel: string;
  steps: Step[];
  foot: string;
  primary: string;
};

export default function CareCase() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("careCase");
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Top
        title={copy.title}
        right={
          <View style={styles.chip}>
            <Text style={t(600, 11, 14)}>{copy.chip}</Text>
          </View>
        }
      />
      <View style={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View style={styles.who}>
          <View style={styles.av}>
            <Text style={[t(600, 16, 18), { color: C.gold }]}>{copy.initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 16, 20)}>{copy.nickname}</Text>
            <Text style={styles.meta}>{copy.meta}</Text>
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.ey}>{copy.levelLabel}</Text>
          <View style={styles.dots}>
            {copy.levels.map((label, i) => (
              <View key={label} style={[styles.dot, i <= copy.active ? styles.dotOn : null]} />
            ))}
          </View>
          <View style={styles.levels}>
            {copy.levels.map((label, i) => (
              <Text key={label} style={[styles.lv, i === copy.active && styles.lvOn]}>
                {label}
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.ey}>{copy.why}</Text>
          {copy.reasons.map((r) => (
            <Text key={r} style={styles.reason}>
              {r}
            </Text>
          ))}
        </View>
        <View style={styles.panel}>
          <Text style={styles.ey}>{copy.stepsLabel}</Text>
          {copy.steps.map((s) => (
            <View key={s.title} style={styles.step}>
              <View style={[styles.mark, s.state === "now" && styles.markNow]} />
              <View>
                <Text style={t(600, 13, 18)}>{s.title}</Text>
                <Text style={styles.sub}>{s.sub}</Text>
              </View>
            </View>
          ))}
        </View>
        <LockLine>{copy.foot}</LockLine>
        <View style={{ marginTop: 8 }}>
          <Gold label={copy.primary} onPress={() => router.push("/care/message" as never)} />
        </View>
      </View>
      <StaffBar active="Safety" />
    </Screen>
  );
}

const STAFF_TABS: Record<string, string> = {
  Overview: "/staff/overview",
  Events: "/staff/events",
  Safety: "/staff/safety",
  Reviews: "/staff/reviews",
};

export function StaffBar({ active }: { active: string }) {
  const tabs = ["Overview", "Events", "Safety", "Reviews"];
  return (
    <View style={[styles.nav, { pointerEvents: "box-none" }]}>
      <View style={styles.bar}>
        {tabs.slice(0, 2).map((label) => (
          <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: label === active }} onPress={() => router.push(STAFF_TABS[label] as never)} style={styles.tabHit}>
            <Text style={[styles.tab, label === active && styles.tabOn]}>{label}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={() => router.push("/staff/events/create" as never)} style={styles.fab}>
          <IconLotus size={26} color={C.white} />
        </Pressable>
        {tabs.slice(2).map((label) => (
          <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: label === active }} onPress={() => router.push(STAFF_TABS[label] as never)} style={styles.tabHit}>
            <Text style={[styles.tab, label === active && styles.tabOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", justifyContent: "center" },
  who: { flexDirection: "row", gap: 10, alignItems: "center" },
  av: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  meta: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  panel: { marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: C.card },
  ey: { ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  dots: { marginTop: 10, flexDirection: "row", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" },
  dotOn: { backgroundColor: C.white, borderColor: C.white },
  levels: { marginTop: 8, flexDirection: "row", justifyContent: "space-between" },
  lv: { ...t(500, 12, 16), color: "rgba(255,255,255,0.7)" },
  lvOn: { ...t(700, 12, 16), color: C.white },
  reason: { marginTop: 8, ...t(500, 13.5, 18), color: "rgba(255,255,255,0.88)" },
  step: { marginTop: 10, flexDirection: "row", gap: 10 },
  mark: { width: 10, height: 10, borderRadius: 5, marginTop: 4, backgroundColor: C.white },
  markNow: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)" },
  sub: { ...t(500, 11.5, 16), color: C.w64 },
  nav: { position: "absolute", left: 12, right: 12, bottom: 24, height: 64 },
  bar: { flex: 1, borderRadius: 999, backgroundColor: C.raised, borderWidth: 1, borderColor: C.w10, flexDirection: "row", alignItems: "center" },
  tabHit: { flex: 1, alignItems: "center", justifyContent: "center" },
  tab: { textAlign: "center", ...t(600, 10, 12), color: C.w64 },
  tabOn: { color: C.white },
  fab: { width: 56, height: 56, borderRadius: 28, marginTop: -18, backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16, alignItems: "center", justifyContent: "center" },
});
