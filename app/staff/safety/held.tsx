import { NavSpacer } from "../../../src/components/navSpace";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Sev, SmallButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { setHeld, useStaff } from "../../../src/live/staff";

export default function Held() {
  const heldAll = useStaff((s) => s.held);
  const held = heldAll.filter((h) => h.status === "held");
  return (
    <StaffFrame title="Held content" chip={String(held.length)} tab="safety">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 8 }}>
        {held.map((h) => (
          <View key={h.id} style={styles.case}>
            <View style={styles.r1}>
              <Sev level={h.severity === "medium" ? "medium" : "low"} />
              <Text style={[t(500, 12, 16), { marginLeft: "auto", color: C.w64 }]}>{h.where}</Text>
            </View>
            <Text style={[t(600, 14.5, 18), { marginTop: 8 }]}>{h.text}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{h.topic}</Text>
            <View style={styles.row}>
              <SmallButton label="Release" onPress={() => setHeld(h.id, "released")} />
              <SmallButton label="Remove" on onPress={() => setHeld(h.id, "removed")} />
            </View>
          </View>
        ))}
        <View style={styles.fine}>
          <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
            <Path d="M10 2.2 3.6 4.6v5c0 3.9 2.7 6.9 6.4 8.2 3.7-1.3 6.4-4.3 6.4-8.2v-5L10 2.2Z" stroke="rgba(255,255,255,0.64)" strokeWidth={1.7} />
          </Svg>
          <Text style={[t(500, 12, 16), { color: C.w64, flex: 1 }]}>
            Held by the on-phone filter. If the wording suggests distress, the author already got a private support card.
          </Text>
        </View>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  case: { backgroundColor: C.card, borderRadius: 18, padding: 13 },
  r1: { flexDirection: "row", alignItems: "center", gap: 8 },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  fine: { flexDirection: "row", gap: 6, marginTop: 10, alignItems: "flex-start" },
});
