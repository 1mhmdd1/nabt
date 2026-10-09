import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { Muted, SubHead } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { useCampus } from "../../../src/live";
import { joinCommunity } from "../../../src/live/communities";

export default function JoinCommunity() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "";
  const circle = useCampus((s) => s.circles[id]);
  const campus = useCampus();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const name = circle?.name || "this Circle";

  async function join() {
    setBusy(true);
    setError("");
    try {
      const result = await joinCommunity(id, {
        nickname: campus.nickname || campus.greetingName,
        realName: campus.fullName,
        uaEmail: campus.email,
        phone: "",
      });
      if (result === "requested") {
        setError("Requested. The Chair will approve or decline.");
        setBusy(false);
        return;
      }
      router.replace(`/c/${id}?joined=1` as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join this Circle.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <SubHead title={name} chip={circle?.verified ? "✓ Verified" : undefined} chipGold={false} />
      <View style={{ paddingHorizontal: 20 }}>
        <Muted>
          {circle?.memberCount ?? 0} members · {circle?.officialLine || "Official UA club"}
        </Muted>
      </View>
      <Pressable style={styles.scrim} onPress={() => router.back()} accessibilityLabel="Dismiss" />
      <View style={styles.sheet}>
        <View style={styles.grab} />
        <Text style={t(700, 20, 26)}>Join {name}</Text>
        <View style={styles.notice}>
          <Text style={t(700, 14.5, 20)}>
            This community can see your name, UA email and contact info, and your training attendance.
          </Text>
        </View>
        <Muted>Never your plant, mood, Hope Node, DMs or other Circles.</Muted>
        {error ? <Text style={t(500, 13, 18)}>{error}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Join community" disabled={busy} onPress={() => void join()} style={styles.join}>
          <Text style={[t(700, 16, 20), { color: C.burgundy }]}>{busy ? "Joining…" : "Join community"}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.later}>
          <Text style={t(600, 14, 18)}>Not now</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrim: { position: "absolute", top: -44, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(20,4,5,0.62)", zIndex: 2 },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: C.card,
    gap: 10,
  },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginBottom: 4 },
  notice: { borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: C.white },
  join: { height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", marginTop: 6 },
  later: { height: 40, alignItems: "center", justifyContent: "center" },
});
