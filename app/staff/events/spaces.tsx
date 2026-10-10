import { NavSpacer } from "../../../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Pills, Seg, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";

const PILLS = ["All 18", "Free now 7", "80+ seats", "Has node"];

export default function Spaces() {
  const spaces = useStaff((s) => s.spaces);
  const venues = useStaff((s) => s.venues);
  const requests = venues.filter((v) => v.queue === "event" && v.status === "sent").length;
  const [pill, setPill] = useState(PILLS[0]);
  const shown = spaces.filter((s) => {
    if (pill.startsWith("Free")) return s.state === "free";
    if (pill.startsWith("80")) return Number((s.cap.match(/\d+/) || ["0"])[0]) >= 80;
    if (pill.startsWith("Has")) return (s.eq || []).includes("Node");
    return true;
  }).filter((s) => s.stateLabel);
  return (
    <StaffFrame title="Events" chip="Now · 12:54" tab="events">
      <Seg
        items={[
          { label: "Schedule", href: "/staff/events" },
          { label: "Spaces", on: true, href: "/staff/events/spaces" },
          { label: "Requests", count: requests, href: "/staff/events/requests" },
        ]}
      />
      <Pills items={PILLS} value={pill} onChange={setPill} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 8 }}>
        {shown.map((s) => (
          <Pressable key={s.id} onPress={() => router.push(`/staff/events/room/${s.id}` as never)} style={[styles.sp, s.selected && styles.sel]}>
            <View style={styles.r1}>
              <View style={styles.st}>
                <View style={[styles.dot, s.state === "use" && styles.use, s.state === "free" && styles.free, s.state === "book" && styles.book]} />
                <Text style={[t(700, 10, 12), { letterSpacing: 0.6 }]}>{(s.stateLabel || "").toUpperCase()}</Text>
              </View>
              <Text style={[t(500, 12, 16), { color: C.w64, marginLeft: "auto" }]}>{s.cap}</Text>
            </View>
            <Text style={[t(700, 18, 22), { marginTop: 8 }]}>{s.name}</Text>
            <Text style={[t(500, 13, 17), { color: C.w64, marginTop: 4 }]}>{s.line}</Text>
            {s.progress != null ? (
              <View style={styles.prog}><View style={[styles.bar, { width: `${Math.round(s.progress * 100)}%` }]} /></View>
            ) : null}
            <View style={styles.eq}>
              {(s.eq || []).map((g) => (
                <View key={g} style={styles.tag}><Text style={t(600, 11, 14)}>{g}</Text></View>
              ))}
            </View>
          </Pressable>
        ))}
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  sp: { backgroundColor: C.card, borderRadius: 18, padding: 14 },
  sel: { borderWidth: 1.5, borderColor: C.white },
  r1: { flexDirection: "row", alignItems: "center" },
  st: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  use: { backgroundColor: C.white },
  free: { borderWidth: 1.5, borderColor: C.white },
  book: { backgroundColor: "rgba(255,255,255,0.5)" },
  prog: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", marginTop: 8, overflow: "hidden" },
  bar: { height: "100%", backgroundColor: C.white },
  eq: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  tag: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: C.w40, alignItems: "center", justifyContent: "center" },
});
