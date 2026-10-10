import { Text, View } from "react-native";
import { Screen, GoldButton } from "../src/components/Chrome";
import { LotusArt } from "../src/components/LotusArt";
import { BackBar, GhostButton, shareCard, useScreenReady } from "../src/components/NodeChrome";
import { C, t } from "../src/theme";
import { useNodeRewards } from "../src/live/nodeRewards";
import { ScrollBody } from "../src/components/ScrollBody";

export default function StoryCard() {
  const story = useNodeRewards((s) => s.story);
  const ready = useNodeRewards((s) => s.ready);
  useScreenReady("phone-s45", ready && Boolean(story));
  if (!story) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar title="Story card" />
      <ScrollBody contentContainerStyle={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: 24 }}>
        <View style={{ width: 236, height: 420, borderRadius: 22, backgroundColor: C.deep, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", padding: 22, alignItems: "center" }}>
          <Text style={[t(700, 12, 14), { letterSpacing: 2.4 }]}>NABT</Text>
          <View style={{ marginTop: 18 }}>
            <LotusArt width={150} height={104} />
          </View>
          <Text style={[t(700, 20, 24), { marginTop: 14, textAlign: "center" }]}>{story.title}</Text>
          <Text style={[t(500, 12, 16), { marginTop: 4, color: C.w70 }]}>{story.line}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 16 }}>
            {story.badges.map((name) => (
              <View key={name} style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1, borderColor: C.gold, justifyContent: "center" }}>
                <Text style={[t(600, 10, 12), { color: C.gold }]}>{name}</Text>
              </View>
            ))}
          </View>
          <Text style={[t(500, 11, 15), { marginTop: 18, color: C.w64, textAlign: "center" }]}>{story.place}</Text>
        </View>
        <Text style={[t(500, 12, 16), { marginTop: 12, color: C.w64, textAlign: "center" }]}>{story.footnote}</Text>
        <View style={{ width: "100%", marginTop: 14, gap: 10 }}>
          <GoldButton label="Share to Instagram" onPress={() => shareCard(`${story.title}. ${story.line}`)} />
          <GhostButton label="Save image" onPress={() => shareCard(story.title)} />
        </View>
      </ScrollBody>
    </Screen>
  );
}
