import { NavSpacer } from "../../../src/components/navSpace";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { OutlineButton, StaffFrame, WhiteButton } from "../../../src/components/staff/StaffChrome";
import { demoLocal } from "../../../src/local/mode";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";

export default function Live() {
  const live = useStaff((s) => s.live);
  const doors = (live?.doors as { name: string; sub: string; n: string }[]) || [];
  const checked = Number(live?.checked || 0);
  const rsvp = Number(live?.rsvp || 0);
  const shown = (v: unknown) => (v == null || v === "" ? "—" : String(v));
  return (
    <StaffFrame title={String(live?.title || "Breathe before finals")} chip="Live" chipOn back="/staff/events">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={[t(500, 13, 17), { color: C.w64, marginTop: 4 }]}>{String(live?.line || "")}</Text>
        <View style={styles.rg}>
          <View style={{ width: 150, height: 150 }}>
            <Svg width={150} height={150} viewBox="0 0 150 150" accessibilityLabel={`${checked} of ${rsvp} checked in`}>
              <Circle cx={75} cy={75} r={64} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={10} />
              <Circle
                cx={75}
                cy={75}
                r={64}
                fill="none"
                stroke="#fff"
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={`${rsvp ? Math.round((Math.min(checked, rsvp) / rsvp) * 402) : 0} 402`}
                transform="rotate(-90 75 75)"
              />
            </Svg>
            <View style={styles.rc}>
              <Text style={t(700, 32, 34)}>{checked}</Text>
              <Text style={[t(500, 12, 16), { color: C.w64 }]}>of {rsvp} RSVPs</Text>
            </View>
          </View>
          <View style={{ flex: 1, gap: 10 }}>
            <Stat n={shown(live?.walkIns)} label="walk-ins without RSVP" />
            <Stat n={shown(live?.freeSeats)} label={`seats free${live?.cap != null ? ` · ${live.cap} cap` : ""}`} />
          </View>
        </View>
        {/* Hope Node doors are a future concept; the phone demo leaves them out. */}
        {!demoLocal() && doors.length ? (
          <>
            <Text style={styles.fl}>Hope Nodes</Text>
            <View style={styles.list}>
              {doors.map((d, i) => (
                <View key={d.name} style={[styles.it, i > 0 && styles.line]}>
                  <View style={styles.dot} />
                  <View style={{ flex: 1 }}>
                    <Text style={t(600, 14, 18)}>{d.name}</Text>
                    <Text style={styles.sub}>{d.sub}</Text>
                  </View>
                  <Text style={t(600, 16, 18)}>{d.n}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>Counts only. Staff never see who checked in.</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <WhiteButton label="End & send pulse" onPress={() => router.push("/staff/events/insights" as never)} />
          </View>
        </View>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <View>
      <Text style={t(700, 20, 22)}>{n}</Text>
      <Text style={[t(500, 12, 16), { color: C.w64 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rg: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12 },
  rc: { position: "absolute", left: 0, right: 0, top: 48, alignItems: "center" },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 14, marginBottom: 8 },
  chart: { borderRadius: 18, backgroundColor: C.card, padding: 12 },
  list: { borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
});
