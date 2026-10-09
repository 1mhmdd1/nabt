import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { PerkQr } from "../../src/components/LotusArt";
import { BackBar, Kicker, useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { useNodeRewards } from "../../src/live/nodeRewards";

function clock(ms: number) {
  const left = Math.max(0, Math.floor((ms - Date.now()) / 1000));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Redeem() {
  const { static: frozenFlag } = useLocalSearchParams<{ static?: string }>();
  const frozen = frozenFlag === "1";
  const rewards = useNodeRewards();
  const perk = rewards.perks.find((p) => p.tier === 3);
  const code = rewards.redemption;
  const [label, setLabel] = useState(code?.expiresLabel || "10:00");
  useScreenReady("phone-11d", rewards.ready && Boolean(code));
  useEffect(() => {
    if (frozen || !code?.expiresAt) {
      setLabel(code?.expiresLabel || "10:00");
      return;
    }
    const tick = () => setLabel(clock(code.expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [frozen, code?.expiresAt, code?.expiresLabel]);
  if (!code) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={{ flex: 1, marginTop: -20 }}>
      <BackBar title="Your perk" />
      <View style={{ paddingHorizontal: 24, alignItems: "center" }}>
        <Kicker>Perk · 3 lotuses</Kicker>
        <Text style={[t(700, 24, 30), { marginTop: 8, textAlign: "center" }]}>{code.showTitle || perk?.showTitle}</Text>
        <Text style={[t(500, 13, 18), { marginTop: 6, color: C.w64 }]}>{perk?.counterLine || "Proposed partner · show this at the counter"}</Text>
        <View style={{ marginTop: 26, width: 260, height: 260, borderRadius: 24, backgroundColor: C.white, alignItems: "center", justifyContent: "center" }}>
          <PerkQr size={220} />
        </View>
        <Text style={[t(500, 15, 20), { marginTop: 20, color: C.w80 }]}>
          Valid <Text style={t(700, 15, 20)}>{label}</Text>
        </Text>
        <Text style={[t(500, 13, 18), { marginTop: 8, color: C.w64 }]}>{perk?.once || "Once per semester · no cash value"}</Text>
        <Text style={[t(500, 12, 17), { marginTop: 10, textAlign: "center", color: C.w64 }]}>
          {perk?.privacy || "The cafeteria sees only valid/used. Never your name or garden."}
        </Text>
        <Text style={[t(500, 12, 17), { marginTop: 8, textAlign: "center", color: C.w64 }]}>Using a perk never removes a lotus.</Text>
        <Text style={[t(500, 12, 16), { marginTop: 10, color: C.w64 }]}>{perk?.partnerLine}</Text>
      </View>
      </View>
    </Screen>
  );
}
