import { NavSpacer } from "../../../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Avatar, Chip, Pills, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";

const PILLS = ["New 3", "In discussion 2", "Approved", "Needs changes"];

export default function Venues() {
  const venues = useStaff((s) => s.venues);
  const rows = venues.filter((v) => v.queue === "pitch");
  const [pill, setPill] = useState(PILLS[0]);
  const shown = rows.filter((r) => {
    if (pill.startsWith("Approved")) return r.status === "approved";
    if (pill.startsWith("Needs")) return r.status === "changes";
    if (pill.startsWith("In discussion")) return r.status === "discussion";
    return r.status === "sent";
  });
  return (
    <StaffFrame title="Venue requests" chip={`${shown.length} new`} tab="events">
      <Pills items={PILLS} value={pill} onChange={setPill} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        {shown.map((r, i) => (
          <Pressable key={r.id} onPress={() => router.push(`/staff/events/venue/${r.id}` as never)} style={[styles.case, i === 0 && styles.sel]}>
            <View style={styles.r1}>
              <Avatar letter={r.initial} size={28} />
              <Text style={t(600, 12, 16)}>{r.circle}</Text>
              {r.fast ? <Chip label="Fast-track" /> : null}
              <Text style={[t(500, 11.5, 14), { marginLeft: "auto", color: C.w64 }]}>{r.time}</Text>
            </View>
            <Text style={[t(600, 14.5, 18), { marginTop: 9 }]}>{r.title}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{r.detail}</Text>
          </Pressable>
        ))}
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>Only Chairs send requests: venue + date. Fast-track = Verified Circle. Counts only.</Text>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  case: { padding: 13, borderRadius: 18, backgroundColor: C.card, marginBottom: 8 },
  sel: { borderWidth: 1.5, borderColor: C.white },
  r1: { flexDirection: "row", alignItems: "center", gap: 8 },
});
