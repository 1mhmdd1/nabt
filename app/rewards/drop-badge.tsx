import { useState } from "react";
import { Text, View } from "react-native";
import { Screen, GoldButton } from "../../src/components/Chrome";
import { BackBar, GhostButton, shareCard, useScreenReady } from "../../src/components/NodeChrome";
import { IconLeaf } from "../../src/components/Icons";
import { C, t } from "../../src/theme";
import { pinBadge, useNodeRewards } from "../../src/live/nodeRewards";

export default function DropBadge() {
  const badge = useNodeRewards((s) => s.earned.find((b) => b.id === "breathing-hour"));
  const ready = useNodeRewards((s) => s.ready);
  const [pinned, setPinned] = useState(false);
  useScreenReady("phone-s60", ready && Boolean(badge));
  if (!badge) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar title="Badge" />
      <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 24 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center" }}>
          <IconLeaf />
        </View>
        <View style={{ marginTop: 16, height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: C.gold, justifyContent: "center" }}>
          <Text style={[t(600, 11.5, 14), { color: C.gold }]}>{badge.dropChip}</Text>
        </View>
        <Text style={[t(700, 26, 32), { marginTop: 12, textAlign: "center" }]}>{badge.dropTitle}</Text>
        <Text style={[t(500, 14, 20), { marginTop: 6, color: C.w80 }]}>{badge.dropEarned}</Text>
        <View style={{ width: "100%", marginTop: 28, gap: 10 }}>
          <GoldButton
            label={pinned || badge.pinned ? "Pinned" : "Pin to profile"}
            onPress={async () => {
              await pinBadge(badge.id, true);
              setPinned(true);
            }}
          />
          <GhostButton label="Share" onPress={() => shareCard(badge.dropTitle)} />
        </View>
      </View>
    </Screen>
  );
}
