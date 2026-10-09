import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, Chip, Seg, SmallButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { setVenueStatus, useStaff } from "../../../src/live/staff";

export default function Requests() {
  const venues = useStaff((s) => s.venues);
  const rows = venues.filter((v) => v.queue === "event");
  const open = rows.filter((v) => v.status === "sent").length;
  return (
    <StaffFrame title="Events" tab="events">
      <Seg
        items={[
          { label: "Schedule", href: "/staff/events" },
          { label: "Spaces", href: "/staff/events/spaces" },
          { label: "Requests", count: open, on: true, href: "/staff/events/requests" },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 140 }}>
        {rows.map((r, i) => (
          <View key={r.id} style={[styles.case, i === 0 && r.status === "sent" && styles.sel]}>
            <View style={styles.r1}>
              <Avatar letter={r.initial} size={28} />
              <Text style={t(600, 12, 16)}>{r.circle}</Text>
              <Text style={[t(500, 11.5, 14), { marginLeft: "auto", color: C.w64 }]}>{r.time}</Text>
            </View>
            <Text style={[t(600, 14.5, 18), { marginTop: 9 }]}>{r.title}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{r.detail}</Text>
            {r.clash ? <View style={{ marginTop: 6, alignSelf: "flex-start" }}><Chip label={r.status === "sent" ? r.clash : r.status} /></View> : null}
            {r.status === "sent" && i < 2 ? (
              <View style={styles.row}>
                <SmallButton label="Approve" on onPress={() => setVenueStatus(r.id, "approved")} />
                <SmallButton label="Suggest time" onPress={() => setVenueStatus(r.id, "suggested")} />
                <SmallButton label="Decline" onPress={() => setVenueStatus(r.id, "declined")} />
              </View>
            ) : null}
          </View>
        ))}
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>Approved requests book the room and show in Discover.</Text>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  case: { padding: 13, borderRadius: 18, backgroundColor: C.card, marginBottom: 8 },
  sel: { borderWidth: 1.5, borderColor: C.white },
  r1: { flexDirection: "row", alignItems: "center", gap: 8 },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
});
