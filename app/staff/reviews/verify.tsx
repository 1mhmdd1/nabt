import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Avatar, Chevron, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { useStaff } from "../../../src/live/staff";

export default function VerifyQueue() {
  const allReviews = useStaff((s) => s.reviews);
  const reviews = allReviews.filter((r) => r.status === "waiting");
  return (
    <StaffFrame title="Verification" chip={`${reviews.length} waiting`} tab="reviews">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 140 }}>
        <View style={styles.list}>
          {reviews.map((r, i) => (
            <Pressable key={r.id} onPress={() => router.push(`/staff/reviews/verify/${r.id}` as never)} style={[styles.it, i > 0 && styles.line]}>
              <Avatar letter={r.initial} />
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{r.name}</Text>
                <Text style={styles.sub}>{r.sub}</Text>
              </View>
              <Chevron />
            </Pressable>
          ))}
        </View>
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>Verified Circles get room priority and fast-track venue requests.</Text>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: C.card, borderRadius: 18, overflow: "hidden" },
  it: { minHeight: 58, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
});
