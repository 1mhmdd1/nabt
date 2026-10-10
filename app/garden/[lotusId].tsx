import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, Avatar } from "../../src/components/Chrome";
import { LotusArt } from "../../src/components/LotusArt";
import { BackBar, GhostButton, useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { useNodeRewards } from "../../src/live/nodeRewards";
import { ScrollBody } from "../../src/components/ScrollBody";

export default function LotusStory() {
  const { lotusId } = useLocalSearchParams<{ lotusId: string }>();
  const rewards = useNodeRewards();
  const lotus = rewards.lotuses.find((l) => l.id === lotusId) || rewards.lotuses[rewards.lotuses.length - 1];
  useScreenReady("phone-s125", rewards.ready);
  if (!rewards.ready || !lotus) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar title={`Lotus #${lotus.n}`} />
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 24, alignItems: "center", paddingBottom: 24 }}>
        <LotusArt width={180} height={124} />
        <Text style={[t(700, 26, 32), { marginTop: 16 }]}>{lotus.name}</Text>
        <Text style={[t(500, 14, 20), { marginTop: 6, color: C.w80, textAlign: "center" }]}>
          {lotus.bloomedLabel} · {lotus.days} days · {lotus.petals} petals · {lotus.roots} roots
        </Text>
        <Text style={[t(600, 11, 14), { marginTop: 18, letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>Who gave you roots</Text>
        <View style={{ width: "100%", marginTop: 10, gap: 8 }}>
          {lotus.rootGivers.map((g) => (
            <View key={g.nickname} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: C.card }}>
              <Avatar letter={g.initial} size={36} font={14} />
              <Text style={[t(600, 15, 18), { flex: 1 }]}>{g.nickname}</Text>
              <Text style={[t(500, 13, 16), { color: C.w64 }]}>{g.roots} {g.roots === 1 ? "root" : "roots"}</Text>
            </View>
          ))}
        </View>
        {lotus.dedicatedTo ? (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={t(600, 15, 20)}>Dedicated to {lotus.dedicatedTo}</Text>
            <Text style={[t(400, 14, 20), { marginTop: 4, color: C.w80 }]}>“{lotus.dedicationNote}”</Text>
          </View>
        ) : null}
        <View style={{ width: "100%", marginTop: 18 }}>
          <GhostButton label="Share story card" onPress={() => router.push("/story" as never)} />
        </View>
        <Pressable onPress={() => router.push("/rewards/name" as never)} style={{ marginTop: 12 }}>
          <Text style={[t(600, 14, 18), { color: C.w80 }]}>Name your bloom</Text>
        </Pressable>
      </ScrollBody>
    </Screen>
  );
}
