import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Chip, GoldButton, OutlineButton, StaffFrame } from "../../../../src/components/staff/StaffChrome";
import { C, t } from "../../../../src/theme";
import { replyVenue, setVenueStatus, useStaff } from "../../../../src/live/staff";

export default function VenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = useStaff((s) => s.notice);
  const [reply, setReply] = useState("");
  const row = useStaff((s) => s.venues.find((v) => v.id === id));
  if (!row) {
    return (
      <StaffFrame title="Venue request" back="/staff/events/venues">
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening the request…</Text>
      </StaffFrame>
    );
  }
  const slots = row.slots || [];
  return (
    <StaffFrame title="Venue request" chip={row.fast ? "Fast-track" : "Request"} back="/staff/events/venues" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={styles.card}>
          <View style={styles.r1}>
            <Chip label="Venue request" />
            <Text style={[t(500, 12, 16), { color: C.w64 }]}>{row.circle} · {row.memberCount} members</Text>
          </View>
          <Text style={[t(700, 18, 22), { marginTop: 10 }]}>{row.title}</Text>
          <View style={styles.inner}>
            <View style={styles.it}>
              <Text style={t(600, 14, 18)}>Venue</Text>
              <Text style={styles.sub}>{row.detail}</Text>
            </View>
            <View style={[styles.it, styles.line]}>
              <Text style={t(600, 14, 18)}>Date options</Text>
              <Text style={styles.sub}>{(row.slots || []).map((s) => s.label).join(" · ") || row.detail}</Text>
            </View>
          </View>
          <Text style={[t(500, 13, 17), { marginTop: 8 }]}>Sent by the Chair · {row.chairName || "the Chair"}</Text>
        </View>
        <View style={styles.list}>
          {slots.map((s, i) => (
            <View key={s.label} style={[styles.it, i > 0 && styles.line, { flexDirection: "row", alignItems: "center" }]}>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{s.label}</Text>
                <Text style={styles.sub}>{s.sub}</Text>
              </View>
              <Text style={t(700, 16, 18)}>{s.ok ? "✓" : "!"}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 12 }}>
          <GoldButton label="Approve Thu 16 Oct · Hall C lab" onPress={() => setVenueStatus(row.id, "approved")} />
        </View>
        {notice ? <Text accessibilityLabel="Venue notice">{notice}</Text> : null}
        <TextInput value={reply} onChangeText={setReply} accessibilityLabel="Venue reply" placeholder="Reply to the Chair" placeholderTextColor={C.w64} style={{ color: C.white, minHeight: 44, marginTop: 8 }} />
        <OutlineButton label="Send reply" onPress={() => void replyVenue(row.id, reply).then(() => setReply(""))} />
        <View style={styles.row}>
          <OutlineButton compact label="Suggest other slot" onPress={() => setVenueStatus(row.id, "suggested")} />
          <OutlineButton compact label="Decline" onPress={() => setVenueStatus(row.id, "declined")} />
        </View>
        <Text style={styles.fl}>Kind reply templates</Text>
        <View style={styles.chips}>
          <Chip label="That room’s taken, try Room 204?" />
          <Chip label="Not this week, here’s why" />
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1.5, borderColor: C.white, padding: 14 },
  r1: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  inner: { marginTop: 10, borderRadius: 14, backgroundColor: C.ground, overflow: "hidden" },
  it: { paddingHorizontal: 14, paddingVertical: 10 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  list: { marginTop: 10, borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 12, marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
