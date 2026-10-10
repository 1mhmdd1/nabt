import { NavSpacer } from "../../../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Avatar, Chip, Pills, Seg, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";

export default function Reviews() {
  const accounts = useStaff((s) => s.accounts);
  const petitions = useStaff((s) => s.petitions);
  const meetups = useStaff((s) => s.meetups);
  const [pill, setPill] = useState("Pending 4");
  const pending = accounts.filter((a) => a.status === "pending" || a.status === "new_photo").length;
  const shown = accounts.filter((a) => {
    if (pill.startsWith("Pending")) return a.status === "pending" || a.status === "new_photo";
    if (pill === "Edited fields") return a.edited > 0;
    if (pill === "Alumni") return a.role === "Alumni";
    return a.status === "approved";
  });
  return (
    <StaffFrame title="Reviews" tab="reviews">
      <Seg
        items={[
          { label: "Accounts", count: accounts.length, on: true, href: "/staff/reviews" },
          { label: "Petitions", count: petitions.length, href: "/staff/reviews/petitions" },
          { label: "Meetups", count: meetups.filter((m) => m.status === "proposed").length, href: "/staff/reviews/meetups" },
        ]}
      />
      <Pills items={[`Pending ${pending}`, "Edited fields", "Alumni", "Done"]} value={pill} onChange={setPill} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        {shown.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 12 }]}>No accounts in this filter.</Text> : null}
        <View style={styles.list}>
          {shown.map((a, i) => (
            <Pressable key={a.id} onPress={() => router.push(`/staff/reviews/account/${a.id}` as never)} style={[styles.it, i > 0 && styles.line]}>
              <Avatar letter={a.initial} />
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{a.name}</Text>
                <Text style={styles.sub}>{a.role} · {a.edited} edited · {a.when}</Text>
              </View>
              <Chip label={a.chip} on={a.status === "pending" && a.chipOn} />
            </Pressable>
          ))}
        </View>
        <View style={styles.fine}>
          <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
            <Path d="M10 2.2 3.6 4.6v5c0 3.9 2.7 6.9 6.4 8.2 3.7-1.3 6.4-4.3 6.4-8.2v-5L10 2.2Z" stroke="rgba(255,255,255,0.64)" strokeWidth={1.7} />
          </Svg>
          <Text style={[t(500, 12, 16), { color: C.w64, flex: 1 }]}>Staff sign-ups go to the Admin, not here.</Text>
        </View>
        <Pressable onPress={() => router.push("/staff/reviews/verify" as never)} style={{ marginTop: 12 }}>
          <Text style={t(600, 14, 18)}>Verified community requests</Text>
          <Text style={[t(500, 12, 16), { color: C.w64 }]}>Circles waiting for a Student Affairs check</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/staff/reviews/communities" as never)} style={{ marginTop: 10 }}>
          <Text style={t(600, 14, 18)}>Communities · assign a Chair</Text>
          <Text style={[t(500, 12, 16), { color: C.w64 }]}>Counts, Chair changes, and semester reports.</Text>
        </Pressable>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: C.card, borderRadius: 18, overflow: "hidden", marginTop: 8 },
  it: { minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  fine: { flexDirection: "row", gap: 6, marginTop: 12, alignItems: "center" },
});
