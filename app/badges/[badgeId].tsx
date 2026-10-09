import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, GoldButton } from "../../src/components/Chrome";
import { IconLeaf } from "../../src/components/Icons";
import { useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { pinBadge, useNodeRewards } from "../../src/live/nodeRewards";

export default function BadgeDetail() {
  const { badgeId } = useLocalSearchParams<{ badgeId: string }>();
  const badge = useNodeRewards((s) => s.earned.find((b) => b.id === badgeId));
  const ready = useNodeRewards((s) => s.ready);
  const [pinned, setPinned] = useState(false);
  useScreenReady("phone-s44", ready && Boolean(badge));
  if (!badge) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={{ flex: 1, backgroundColor: "rgba(20,4,5,0.62)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginBottom: 14 }} />
          <Text style={t(700, 20, 24)}>{badge.name}</Text>
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center" }}>
              <IconLeaf color={C.gold} />
            </View>
          </View>
          <View style={{ marginTop: 12, borderRadius: 18, backgroundColor: C.ground, overflow: "hidden" }}>
            <Row k="Source" v={badge.source} />
            <Row k="Earned" v={badge.earned} />
            <Row k="Limited window" v={badge.window} />
          </View>
          <View style={{ marginTop: 14 }}>
            <GoldButton
              label={badge.locked ? "Locked" : pinned || badge.pinned ? "Pinned" : "Pin to profile"}
              onPress={async () => {
                if (badge.locked) return;
                await pinBadge(badge.id, true);
                setPinned(true);
              }}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <View style={{ minHeight: 52, paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 0 }}>
      <Text style={t(600, 14, 18)}>{k}</Text>
      <Text style={[t(500, 12, 16), { marginTop: 3, color: C.w64 }]}>{v}</Text>
    </View>
  );
}
