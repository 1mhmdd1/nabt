import { Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { Screen, GoldButton } from "../../src/components/Chrome";
import { BloomingLotus } from "../../src/components/LotusArt";
import { GhostButton, useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { latestLotus, useNodeRewards } from "../../src/live/nodeRewards";

function BloomHalo() {
  return (
    <Svg width={340} height={340}>
      <Circle cx="170" cy="170" r="170" fill="rgba(255,255,255,0.04)" />
    </Svg>
  );
}

export default function BloomMoment() {
  const rewards = useNodeRewards();
  const lotus = latestLotus(rewards.lotuses);
  useScreenReady("phone-11a", rewards.ready && Boolean(lotus));
  if (!lotus) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <View style={{ position: "absolute", top: 76, left: 0, right: 0, alignItems: "center", pointerEvents: "none" }}>
          <BloomHalo />
        </View>
        <View style={{ flex: 1, alignItems: "center", paddingTop: 106, paddingHorizontal: 24 }}>
        <BloomingLotus width={300} height={208} />
        <Text style={[t(700, 30, 34), { marginTop: 44, textAlign: "center" }]}>Your lotus bloomed</Text>
        <Text style={[t(500, 15, 20), { marginTop: 10, color: C.w80 }]}>
          {lotus.petals} petals · {lotus.roots} roots · {lotus.days} days
        </Text>
        <View style={{ marginTop: 18, height: 28, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: C.w40, justifyContent: "center" }}>
          <Text style={t(600, 12.5, 16)}>Lotus #{lotus.n} joins your garden</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ width: "100%", gap: 12, marginBottom: 58 }}>
          <GoldButton label="Dedicate this bloom" onPress={() => router.push("/rewards/dedicate" as never)} />
          <GhostButton label="Share story card" onPress={() => router.push("/story" as never)} />
        </View>
        <Text style={[t(500, 12, 16), { position: "absolute", bottom: 28, color: C.w64 }]}>It stays in your garden forever.</Text>
        </View>
      </View>
    </Screen>
  );
}
