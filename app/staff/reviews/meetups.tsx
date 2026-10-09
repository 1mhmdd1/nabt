import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip, Seg, SmallButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { approveMeetup, declineMeetup, useStaff } from "../../../src/live/staff";

export default function Meetups() {
  const meetups = useStaff((s) => s.meetups);
  const spots = useStaff((s) => s.spots);
  const accounts = useStaff((s) => s.accounts);
  const petitions = useStaff((s) => s.petitions);
  const proposed = meetups.filter((m) => m.status === "proposed");
  return (
    <StaffFrame title="Reviews" tab="reviews">
      <Seg
        items={[
          { label: "Accounts", count: accounts.length, href: "/staff/reviews" },
          { label: "Petitions", count: petitions.length, href: "/staff/reviews/petitions" },
          { label: "Meetups", count: proposed.length, on: true, href: "/staff/reviews/meetups" },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}>
        <Text style={styles.fl}>Proposed · {proposed.length}</Text>
        {proposed.map((m) => (
          <View key={m.id} style={styles.case}>
            <View style={styles.r1}>
              <Chip label={m.circle} />
              <Text style={[t(500, 12, 16), { marginLeft: "auto", color: C.w64 }]}>by {m.by}</Text>
            </View>
            <Text style={[t(600, 14.5, 18), { marginTop: 8 }]}>{m.title}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{m.detail}</Text>
            {m.spot ? (
              <>
                <Text style={[styles.fl, { marginTop: 10 }]}>Spot</Text>
                <View style={styles.spot}><Text style={t(500, 14, 18)}>{m.spot}</Text></View>
              </>
            ) : null}
            <View style={styles.row}>
              <SmallButton label="Approve" on onPress={() => void approveMeetup(m.id, m.spot || "")} />
              <SmallButton label="Decline" onPress={() => void declineMeetup(m.id)} />
            </View>
          </View>
        ))}
        {proposed.length === 0 ? <Text style={styles.sub}>No meetups waiting.</Text> : null}
        <Text style={[styles.fl, { marginTop: 8 }]}>Approved spots</Text>
        <View style={styles.list}>
          {spots.map((s, i) => (
            <View key={s.id} style={[styles.it, i > 0 && styles.line]}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{s.name}</Text>
                <Text style={styles.sub}>{s.sub}</Text>
              </View>
              <Text style={[t(500, 12.5, 16), { color: C.w70 }]}>Counselor ✓</Text>
            </View>
          ))}
          {spots.length === 0 ? <Text style={[styles.sub, { padding: 14 }]}>No approved spots yet.</Text> : null}
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginVertical: 8 },
  case: { backgroundColor: C.card, borderRadius: 18, padding: 13, marginBottom: 8 },
  r1: { flexDirection: "row", alignItems: "center" },
  spot: { marginTop: 6, backgroundColor: C.ground, borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: C.white },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  list: { backgroundColor: C.card, borderRadius: 18, overflow: "hidden" },
  it: { minHeight: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
});
