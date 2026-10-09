import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip, OutlineButton, StaffFrame } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { addPerk, useStaff } from "../../src/live/staff";

export default function Perks() {
  const perks = useStaff((s) => s.perks);
  const rows = perks.filter((p) => p.kind !== "goal" && !p.chip && p.cost);
  const goal = perks.find((p) => p.kind === "goal");
  const log = perks.filter((p) => p.chip);
  const progress = typeof goal?.progress === "number" ? goal.progress : 0;
  const target = typeof goal?.target === "number" && goal.target > 0 ? goal.target : 0;
  return (
    <StaffFrame title="Perks & campus goal" back="/staff/me">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={styles.list}>
          {rows.map((p, i) => (
            <View key={p.id} style={[styles.it, i > 0 && styles.line]}>
              <View style={styles.bdg}><Text style={[t(700, 13, 16), { color: C.gold }]}>{p.cost}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{p.title}</Text>
                <Text style={styles.sub}>{p.detail}</Text>
              </View>
              <Text style={[t(500, 12.5, 16), { color: C.w70 }]}>{p.value || p.status}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 8 }}>
          <OutlineButton label="+ Add perk" onPress={() => addPerk("Campus walk perk")} />
        </View>
        <Text style={styles.fl}>Campus goal</Text>
        <View style={styles.case}>
          <View style={styles.r1}>
            <Chip label={goal?.chip || "Planned partnership"} />
            <Text style={[t(500, 12, 16), { color: C.w64 }]}>{goal?.partner}</Text>
          </View>
          <Text style={[t(700, 26, 30), { marginTop: 10 }]}>
            {goal ? progress : "—"} <Text style={[t(500, 13, 16), { color: C.w64 }]}>{goal ? `/ ${target} lotuses` : "No campus goal yet"}</Text>
          </Text>
          <View style={styles.prog}><View style={{ width: `${target ? Math.min(100, Math.round((progress / target) * 100)) : 0}%`, height: "100%", backgroundColor: C.white }} /></View>
          <Text style={[t(500, 13, 17), { color: C.w70, marginTop: 8 }]}>{goal?.reward}</Text>
        </View>
        <Text style={styles.fl}>Redemption log</Text>
        <View style={styles.list}>
          {log.map((p, i) => (
            <View key={p.id} style={[styles.it, i > 0 && styles.line]}>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{p.title}</Text>
                <Text style={styles.sub}>{p.sub}</Text>
              </View>
              <Chip label={p.chip || ""} />
            </View>
          ))}
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  bdg: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 14, marginBottom: 6 },
  case: { borderRadius: 18, backgroundColor: C.card, padding: 14 },
  r1: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prog: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", marginTop: 10, overflow: "hidden" },
});
