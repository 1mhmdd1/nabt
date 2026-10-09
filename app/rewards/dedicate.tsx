import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, GoldButton, Avatar } from "../../src/components/Chrome";
import { BackBar, useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { dedicateBloom, latestLotus, useNodeRewards } from "../../src/live/nodeRewards";

export default function Dedicate() {
  const rewards = useNodeRewards();
  const lotus = latestLotus(rewards.lotuses);
  const givers = lotus?.rootGivers || [];
  const [pick, setPick] = useState(0);
  const [note, setNote] = useState(lotus?.dedicationNote || "");
  useEffect(() => {
    if (lotus?.dedicationNote) setNote((cur) => cur || lotus.dedicationNote);
  }, [lotus?.dedicationNote]);
  const [sent, setSent] = useState(false);
  useScreenReady("phone-11b", rewards.ready && Boolean(lotus));
  const who = givers[pick];
  if (!lotus || !who) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackBar title="Dedicate this bloom" />
      <View style={{ paddingHorizontal: 24 }}>
        <Text style={[t(400, 15, 22), { color: C.w80 }]}>Who gave you roots? Pick one person. It’s a thank-you, not a transfer.</Text>
        <View style={{ marginTop: 14, gap: 8 }}>
          {givers.map((g, i) => (
            <Pressable
              key={g.nickname}
              onPress={() => setPick(i)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: C.card, borderWidth: i === pick ? 1.5 : 0, borderColor: C.white }}
            >
              <Avatar letter={g.initial} size={36} font={14} />
              <View style={{ flex: 1 }}>
                <Text style={t(600, 15, 18)}>{g.nickname}</Text>
                <Text style={[t(500, 12, 16), { color: C.w64 }]}>gave you {g.roots} {g.roots === 1 ? "root" : "roots"}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={[t(600, 11, 14), { marginTop: 16, letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>Note · optional</Text>
        <TextInput
          value={note}
          onChangeText={(v) => setNote(v.slice(0, 80))}
          maxLength={80}
          style={{ marginTop: 8, minHeight: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 12, ...t(500, 15, 20) }}
          accessibilityLabel="Dedication note, up to 80 characters"
        />
        <Text style={[t(500, 12, 14), { alignSelf: "flex-end", marginTop: 4, color: C.w64 }]}>{note.length} / 80</Text>
        <Text style={[t(600, 12, 16), { marginTop: 8, color: C.w64 }]}>What {who.nickname} receives</Text>
        <View style={{ marginTop: 8, padding: 14, borderRadius: 16, backgroundColor: C.card }}>
          <Text style={t(600, 14, 18)}>{rewards.nickname || "A student"} dedicated a bloom to you</Text>
          <Text style={[t(400, 14, 20), { marginTop: 4, color: C.w80 }]}>“{note}”</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <GoldButton
            label={sent ? "Dedication sent" : "Send dedication"}
            onPress={async () => {
              await dedicateBloom(lotus.id, who.nickname, note);
              setSent(true);
              router.push("/garden" as never);
            }}
          />
        </View>
        <Text style={[t(500, 12, 16), { marginTop: 10, textAlign: "center", color: C.w64 }]}>
          Your lotus stays yours. {who.nickname} gets the thank-you.
        </Text>
      </View>
    </Screen>
  );
}
