import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, GoldButton } from "../../src/components/Chrome";
import { IconLeaf, IconLock } from "../../src/components/Icons";
import { useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { useNodeRewards, type EarnedBadge } from "../../src/live/nodeRewards";

export default function Badges() {
  const earned = useNodeRewards((s) => s.earned);
  const ready = useNodeRewards((s) => s.ready);
  useScreenReady("phone-s43", ready && earned.length > 0);
  const pinned = earned.filter((b) => b.pinned).length;
  const groups: { name: string; items: EarnedBadge[] }[] = [];
  for (const badge of earned) {
    const found = groups.find((g) => g.name === badge.group);
    if (found) found.items.push(badge);
    else groups.push({ name: badge.group, items: [badge] });
  }
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: "rgba(20,4,5,0.62)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginBottom: 14 }} />
          <Text style={t(700, 20, 24)}>Badges · pin up to 3</Text>
          <Text style={[t(400, 12.5, 18), { marginTop: 4, color: "rgba(255,255,255,0.72)" }]}>
            {pinned} of 3 pinned. Limited badges stay yours even after the window closes.
          </Text>
          {groups.map((group) => (
            <View key={group.name}>
              <Text style={[t(600, 11, 14), { marginTop: 12, marginBottom: 6, letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>{group.name}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {group.items.map((badge) => (
                  <Pressable key={badge.id} onPress={() => router.push(`/badges/${badge.id}` as never)} style={{ width: 78, alignItems: "center" }}>
                    <View style={{ width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: badge.locked ? "rgba(255,255,255,0.25)" : C.gold, alignItems: "center", justifyContent: "center" }}>
                      {badge.locked ? <IconLock size={14} color={C.w64} /> : <IconLeaf color={C.gold} />}
                    </View>
                    <Text style={[t(600, 10.5, 13), { textAlign: "center", marginTop: 5, color: badge.locked ? C.w64 : C.white }]}>{badge.name}</Text>
                    {badge.pinned ? <Text style={[t(500, 10, 12), { color: C.w64 }]}>Pinned</Text> : null}
                    {badge.limited && !badge.pinned ? <Text style={[t(500, 10, 12), { color: C.w64 }]}>Limited</Text> : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <View style={{ marginTop: 14 }}>
            <GoldButton label="Done" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
