import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Line } from "react-native-svg";
import { Seg, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";

type Ev = { title: string; sub: string; left: number; width: number; tone: string; extra?: string; href?: string };
type Row = { name: string; sub: string; top: number; events: Ev[] };

export default function Schedule() {
  const schedule = useStaff((s) => s.schedule);
  const venues = useStaff((s) => s.venues);
  const requests = venues.filter((v) => v.queue === "event" && v.status === "sent").length;
  const days = (schedule?.days as { d: string; n: string; on?: boolean }[]) || [];
  const hours = (schedule?.hours as string[]) || [];
  const rows = (schedule?.rows as Row[]) || [];
  const summary = (schedule?.summary as { n: string; label: string }[]) || [];
  const nowLeft = Number(schedule?.nowLeft || 409);
  return (
    <StaffFrame title="Events" chip={String(schedule?.chip || "Thu · Dec 4")} tab="events">
      <Seg
        items={[
          { label: "Schedule", on: true, href: "/staff/events" },
          { label: "Spaces", href: "/staff/events/spaces" },
          { label: "Requests", count: requests, href: "/staff/events/requests" },
        ]}
      />
      <View style={styles.days}>
        {days.map((d) => (
          <View key={d.d} style={[styles.day, d.on && styles.dayOn]}>
            <Text style={[t(600, 10.5, 12), { color: d.on ? "rgba(65,21,21,0.7)" : C.w64 }]}>{d.d}</Text>
            <Text style={[t(700, 15, 16), { color: d.on ? C.burgundy : C.white, marginTop: 5 }]}>{d.n}</Text>
          </View>
        ))}
        <View style={styles.vw}><Text style={t(600, 12, 14)}>Day ▾</Text></View>
      </View>
      <View style={styles.tlw}>
        <View style={styles.tl2}>
          {hours.map((h, i) => {
            const left = 66 + i * 88;
            return (
              <View key={h}>
                <Text style={[styles.hr, { left: left - 12 }]}>{h}</Text>
                <View style={[styles.vl, { left }]} />
              </View>
            );
          })}
          {rows.map((row) =>
            row.events.map((ev) => (
              <Pressable
                key={ev.title}
                onPress={() => ev.href && router.push(ev.href as never)}
                style={[
                  styles.ev,
                  { left: ev.left, width: ev.width, top: row.top + 6 },
                  ev.tone === "live" && styles.live,
                  ev.tone === "p" && styles.pending,
                ]}
              >
                {ev.tone === "p" ? <PendingHatch /> : null}
                <Text numberOfLines={1} style={[t(700, 11.5, 14), ev.tone === "live" && { color: C.burgundy }]}>{ev.title}</Text>
                <Text numberOfLines={1} style={[t(500, 10, 13), { color: ev.tone === "live" ? "rgba(65,21,21,0.7)" : C.w64, marginTop: 3 }]}>{ev.sub}</Text>
                {ev.extra ? <Text style={[styles.em, ev.tone === "live" && { color: C.burgundy }]}>{ev.extra}</Text> : null}
              </Pressable>
            )),
          )}
          <View style={[styles.now, { left: nowLeft }]} />
          <View style={[styles.nowl, { left: nowLeft - 20 }]}>
            <Text style={[t(700, 9, 10), { color: C.burgundy }]}>{String(schedule?.nowLabel || "12:54")}</Text>
          </View>
        </View>
        {rows.flatMap((row) => row.events).map((ev) => (
          <Text key={ev.title} accessibilityLabel={`Scheduled ${ev.title}`}>{ev.title} · {ev.sub}</Text>
        ))}
        <View style={styles.vcol}>
          {rows.map((row) => (
            <View key={row.name} style={[styles.vn, { top: row.top }]}>
              <Text style={t(700, 11, 13)}>{row.name}</Text>
              <Text style={[t(500, 9.5, 12), { color: C.w64, marginTop: 4 }]}>{row.sub}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.pad}>
        <View style={styles.sum}>
          {summary.map((s) => (
            <Text key={s.label} style={[t(500, 11.5, 14), { color: C.w70 }]}>
              <Text style={t(700, 16, 18)}>{s.n} </Text>
              {s.label}
            </Text>
          ))}
        </View>
        <Text style={styles.ph}>Today’s rooms. Open a block for the event.</Text>
      </View>
    </StaffFrame>
  );
}

function PendingHatch() {
  const lines = [];
  for (let i = -2; i < 22; i += 1) {
    const x = i * 17;
    lines.push(
      <Line key={i} x1={x} y1={-8} x2={x - 100} y2={100} stroke="rgba(255,255,255,0.14)" strokeWidth={6} />,
    );
  }
  return (
    <Svg style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]} width="100%" height="100%">
      {lines}
    </Svg>
  );
}

const styles = StyleSheet.create({
  days: { flexDirection: "row", gap: 6, paddingHorizontal: 20, paddingTop: 12, alignItems: "center" },
  day: { width: 40, paddingVertical: 7, borderRadius: 12, alignItems: "center" },
  dayOn: { backgroundColor: C.white },
  vw: { marginLeft: "auto", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: C.w40 },
  tlw: { height: 398, marginTop: 6, overflow: "hidden" },
  tl2: { position: "absolute", top: 0, left: -220, width: 878, height: 398 },
  hr: { position: "absolute", top: 4, ...t(600, 10, 12), color: "rgba(255,255,255,0.64)" },
  vl: { position: "absolute", top: 20, height: 378, width: 1, backgroundColor: "rgba(255,255,255,0.12)" },
  ev: { position: "absolute", height: 78, paddingHorizontal: 9, paddingTop: 8, borderRadius: 14, backgroundColor: C.bubble, overflow: "hidden" },
  live: { backgroundColor: C.white },
  pending: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)" },
  em: { position: "absolute", left: 9, bottom: 8, ...t(700, 9, 10), letterSpacing: 0.6, textTransform: "uppercase" },
  now: { position: "absolute", top: 18, bottom: 0, width: 2, backgroundColor: "rgba(255,255,255,0.8)" },
  nowl: { position: "absolute", top: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, backgroundColor: C.white },
  vcol: { position: "absolute", left: 0, top: 0, bottom: 0, width: 64, backgroundColor: C.ground, zIndex: 3, boxShadow: "6px 0 10px -6px rgba(0,0,0,0.5)" },
  vn: { position: "absolute", left: 8, width: 54, height: 72 },
  pad: { paddingHorizontal: 20 },
  sum: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", padding: 12, borderRadius: 16, backgroundColor: C.card },
  ph: { ...t(500, 10.5, 14), color: C.w64, textAlign: "center", marginTop: 8 },
});
