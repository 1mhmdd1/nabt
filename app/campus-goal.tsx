import { Text, View } from "react-native";
import { Screen, Avatar } from "../src/components/Chrome";
import { BackBar, useScreenReady } from "../src/components/NodeChrome";
import { C, t } from "../src/theme";
import { useNodeRewards } from "../src/live/nodeRewards";

export default function CampusGoal() {
  const rewards = useNodeRewards();
  const goal = rewards.goal;
  useScreenReady("phone-11e", rewards.ready && Boolean(goal));
  if (!goal) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  const ratio = goal.target ? Math.min(1, goal.current / goal.target) : 0;
  return (
    <Screen>
      <BackBar title={goal.title} />
      <View style={{ paddingHorizontal: 24 }}>
        <View style={{ alignSelf: "flex-start", height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: C.w40, justifyContent: "center" }}>
          <Text style={t(600, 11.5, 14)}>{goal.chip}</Text>
        </View>
        <Text style={[t(700, 40, 46), { marginTop: 14 }]}>
          {goal.current}
          <Text style={[t(500, 18, 24), { color: C.w64 }]}> / {goal.target} lotuses</Text>
        </Text>
        <View style={{ marginTop: 12, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)" }}>
          <View style={{ width: `${Math.round(ratio * 100)}%`, height: 8, borderRadius: 4, backgroundColor: C.white }} />
        </View>
        <Text style={[t(500, 15, 22), { marginTop: 16, color: C.w80 }]}>
          At {goal.target} we plant <Text style={t(700, 15, 22)}>{goal.trees} native cedars</Text> {goal.body}
        </Text>
        <Text style={[t(500, 13, 18), { marginTop: 8, color: C.w64 }]}>{goal.pending}</Text>
        <Text style={[t(500, 12, 16), { marginTop: 6, color: C.w64 }]}>{goal.partner}</Text>
        <Text style={[t(600, 11, 14), { marginTop: 22, letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>Recent dedications</Text>
        <View style={{ marginTop: 10, gap: 8 }}>
          {rewards.dedications.map((d) => (
            <View key={d.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Avatar letter={d.initial} size={32} font={13} />
              <Text style={[t(500, 14, 18), { flex: 1, color: C.w80 }]}>
                <Text style={t(600, 14, 18)}>{d.from}</Text> dedicated a bloom to <Text style={t(600, 14, 18)}>{d.to}</Text>
              </Text>
              <Text style={[t(500, 12, 16), { color: C.w64 }]}>{d.ago}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
