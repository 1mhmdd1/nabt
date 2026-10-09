import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, GoldButton } from "../../src/components/Chrome";
import { LotusArt } from "../../src/components/LotusArt";
import { BackBar, GhostButton, useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { latestLotus, nameBloom, useNodeRewards } from "../../src/live/nodeRewards";

export default function NameBloom() {
  const rewards = useNodeRewards();
  const lotus = latestLotus(rewards.lotuses);
  const [name, setName] = useState(lotus?.name || "");
  useEffect(() => {
    if (lotus?.name) setName((cur) => cur || lotus.name);
  }, [lotus?.name]);
  useScreenReady("phone-s42", rewards.ready && Boolean(lotus));
  if (!lotus) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar title="Name your bloom" />
      <View style={{ paddingHorizontal: 24, alignItems: "center" }}>
        <LotusArt width={140} height={96} />
        <Text style={[t(400, 15, 22), { marginTop: 12, color: C.w80, textAlign: "center" }]}>A name only you see in your garden.</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={{ marginTop: 16, width: "100%", height: 52, borderRadius: 16, backgroundColor: C.card, paddingHorizontal: 16, ...t(500, 16, 20) }}
          accessibilityLabel="Bloom name"
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, justifyContent: "center" }}>
          {lotus.suggestions.map((chip) => (
            <Pressable key={chip} onPress={() => setName(chip)} style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: C.w40, justifyContent: "center" }}>
              <Text style={t(600, 13, 16)}>{chip}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ width: "100%", marginTop: 22, gap: 10 }}>
          <GoldButton
            label="Save name"
            onPress={async () => {
              await nameBloom(lotus.id, name);
              router.push(`/garden/${lotus.id}` as never);
            }}
          />
          <GhostButton label="Share story card" onPress={() => router.push("/story" as never)} />
        </View>
      </View>
    </Screen>
  );
}
