import { NavSpacer } from "../../../../src/components/navSpace";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Chip, WhiteButton, StaffFrame } from "../../../../src/components/staff/StaffChrome";
import { C, t } from "../../../../src/theme";
import { changeChair, findCampusMember, loadCircleRoster, useStaff } from "../../../../src/live/staff";
import { toast } from "../../../../src/toast";

const REASONS = [
  { id: "new_semester", label: "New semester" },
  { id: "stepped_down", label: "Chair stepped down" },
  { id: "graduated", label: "Graduated" },
  { id: "other", label: "Other" },
];

export default function AssignChair() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const row = useStaff((s) => s.communities.find((c) => c.id === id));
  const notice = useStaff((s) => s.notice);
  const [extra, setExtra] = useState<{ id: string; name: string; sub: string; current?: boolean }[]>([]);
  const [email, setEmail] = useState("");
  const [pick, setPick] = useState("");
  const [reason, setReason] = useState("new_semester");
  const [lookupError, setLookupError] = useState("");
  useEffect(() => {
    if (!id) return;
    void loadCircleRoster(id)
      .then((members) => {
        setExtra(members);
        const current = members.find((member) => member.current);
        if (current) setPick(current.id);
      })
      .catch(() => setLookupError("The member list is still loading."));
  }, [id]);
  if (!row) {
    return (
      <StaffFrame title="Chair" back="/staff/reviews/communities">
        <Text style={{ color: C.white, padding: 20 }}>Opening…</Text>
      </StaffFrame>
    );
  }
  const candidates = extra.length ? extra : row.candidates || [];
  const chosen = candidates.find((c) => c.id === pick) || candidates[0];
  return (
    <StaffFrame title={`Chair · ${row.name}`} chip="Verified" back="/staff/reviews/communities">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <Text style={[t(500, 13, 18), { color: C.w80 }]}>
          Only Student Affairs assigns or changes a Verified community’s Chair. The Chair is the community’s single contact with you.
        </Text>
        <Text style={styles.fl}>Choose Chair</Text>
        {candidates.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64 }]}>No members yet.</Text> : null}
        {candidates.map((c) => (
          <Pressable key={c.id} style={[styles.alt, pick === c.id && styles.on]} onPress={() => setPick(c.id)}>
            <View style={[styles.rd, pick === c.id && styles.rdOn]} />
            <View>
              <Text style={t(600, 15, 18)}>{c.name}</Text>
              <Text style={[t(500, 12, 16), { color: C.w64 }]}>{c.sub}</Text>
            </View>
          </Pressable>
        ))}
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          accessibilityLabel="UA email"
          placeholder="Find by UA email"
          placeholderTextColor={C.w64}
          style={styles.find}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Find member"
          onPress={() => {
            setLookupError("");
            void findCampusMember(email)
              .then((found) => {
                if (!found.id) return;
                setExtra((cur) => (cur.some((row) => row.id === found.id) ? cur : [...cur, found]));
                setPick(found.id);
                toast(`Found ${found.name}`);
              })
              .catch((err) => setLookupError(err instanceof Error ? err.message : "No account with that email."));
          }}
          style={styles.findBtn}
        >
          <Text style={[t(600, 14, 18), { color: C.burgundy }]}>Find member</Text>
        </Pressable>
        {lookupError ? <Text style={[t(500, 13, 18), { color: C.w80 }]}>{lookupError}</Text> : null}
        <Text style={styles.fl}>Reason · logged</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {REASONS.map((r) => (
            <Pressable key={r.id} onPress={() => setReason(r.id)}>
              <Chip label={r.label} on={reason === r.id} />
            </Pressable>
          ))}
        </View>
        <Text style={[t(500, 13, 18), { color: C.w80, marginTop: 10 }]}>
          The old and new Chair and the board are notified. Board roles stay as they are. Logged for the Admin.
        </Text>
        {notice ? <Text style={[t(600, 13, 18), { marginTop: 8 }]}>{notice}</Text> : null}
        <View style={{ marginTop: 12 }}>
          <WhiteButton
            label="Confirm Chair"
            onPress={() => chosen && changeChair(row.id, chosen.id, chosen.name, reason, row.chair || "")}
          />
        </View>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 14, marginBottom: 6 },
  alt: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: C.card, borderRadius: 14, padding: 12, marginBottom: 8 },
  on: { borderWidth: 1.5, borderColor: C.white },
  rd: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)" },
  rdOn: { backgroundColor: C.white },
  find: { height: 46, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 12, marginBottom: 8, ...t(500, 15, 20) },
  findBtn: { height: 44, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 8 },
});
