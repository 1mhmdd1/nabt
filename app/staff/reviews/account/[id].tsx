import { NavSpacer } from "../../../../src/components/navSpace";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { Chip, GoldButton, OutlineButton, StaffFrame } from "../../../../src/components/staff/StaffChrome";
import { C, t } from "../../../../src/theme";
import { decideAccount, useStaff } from "../../../../src/live/staff";

export default function AccountReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = useStaff((s) => s.accounts.find((a) => a.id === id));
  if (!card) {
    return (
      <StaffFrame title="Account" back="/staff/reviews">
        <Text style={{ color: C.white, padding: 20 }}>Opening the account…</Text>
      </StaffFrame>
    );
  }
  return (
    <StaffFrame title={card.name} chip={card.role} back="/staff/reviews" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", gap: 14 }}>
          <View style={styles.cardArt}>
            <Svg width={92} height={58} viewBox="0 0 92 58">
              <Rect x="1" y="1" width="90" height="56" rx="8" fill="#2F0D0E" stroke="rgba(255,255,255,0.35)" />
              <Rect x="10" y="12" width="28" height="34" rx="3" fill="rgba(255,255,255,0.16)" />
              <Path d="M48 18h32M48 26h24M48 34h28" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={[t(500, 11, 14), { color: C.w64, marginTop: 6, textAlign: "center" }]}>Tap to zoom</Text>
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Chip label={`${card.edited} edited fields`} />
            <Text style={[t(500, 12.5, 17), { color: C.w80 }]}>Compare the card with what the student submitted. Edits are highlighted.</Text>
            <View style={styles.email}>
              <Text style={styles.fl}>UA email</Text>
              <Text style={t(500, 12.5, 16)}>{card.email || "—"} ✓</Text>
            </View>
            <Text style={[t(500, 11.5, 15), { color: C.w64 }]}>Submitted {card.submitted || card.when} · pending access active</Text>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          {(card.fields || []).map((f) => (
            <View key={f.label} style={[styles.fr, f.edited && styles.ed]}>
              <Text style={styles.fl}>{f.label}</Text>
              <Text style={t(500, 13, 18)}><Text style={styles.k}>Scanned  </Text>{f.scanned}</Text>
              <Text style={t(500, 13, 18)}>
                <Text style={styles.k}>Submitted  </Text>
                {f.submitted}
                {f.edited ? <Text style={{ color: C.white }}>  edited</Text> : null}
                {f.locked ? "  🔒" : null}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 8 }]}>Role comes from the card and can’t be edited by the student.</Text>
        <View style={{ marginTop: 12 }}>
          <GoldButton label="Approve" onPress={() => decideAccount(card.uid, "approve")} />
        </View>
        <View style={styles.row}>
          <OutlineButton label="Request new photo" onPress={() => decideAccount(card.uid, "new_photo")} />
          <OutlineButton label="Reject" onPress={() => decideAccount(card.uid, "reject")} />
        </View>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  cardArt: { width: 110, alignItems: "center" },
  email: { backgroundColor: C.card, borderRadius: 14, padding: 10 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  fr: { backgroundColor: C.card, borderRadius: 14, padding: 12, marginTop: 8 },
  ed: { borderWidth: 1.5, borderColor: C.white },
  k: { color: C.w64 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
});
