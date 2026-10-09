import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { Screen } from "../../src/components/Chrome";
import { GhostButton, useScreenReady } from "../../src/components/NodeChrome";
import { LotusArt } from "../../src/components/LotusArt";
import { C, t } from "../../src/theme";
import { useNodeRewards, vendorScan } from "../../src/live/nodeRewards";

export default function Vendor() {
  const { view, static: frozen } = useLocalSearchParams<{ view?: string; static?: string }>();
  const code = useNodeRewards((s) => s.redemption);
  const ready = useNodeRewards((s) => s.ready);
  const [live, setLive] = useState<"valid" | "used" | null>(null);
  const showUsed = view === "used" || live === "used";
  useScreenReady(showUsed ? "phone-11f2" : "phone-11f", ready && Boolean(code));
  if (!code) {
    return (
      <Screen bg={C.ground}>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14, gap: 4, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LotusArt width={30} height={21} />
            <Text style={[t(700, 14, 14), { letterSpacing: 1.1 }]}>NABT</Text>
            <Text style={t(500, 14, 14)}>Partner</Text>
          </View>
          <Text style={[t(500, 12, 16), { color: C.w64 }]}>{code.partnerName}</Text>
        </View>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 50 }}>
        <View style={{ alignItems: "center", borderRadius: 24, backgroundColor: showUsed ? C.card : C.white, paddingVertical: 30, paddingHorizontal: 20 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: showUsed ? "rgba(255,255,255,0.4)" : C.burgundy, alignItems: "center", justifyContent: "center" }}>
            {showUsed ? <UsedMark /> : <ValidCheck />}
          </View>
          <Text style={[t(700, 28, 28), { marginTop: 18, color: showUsed ? C.white : C.burgundy }]}>{showUsed ? code.usedHeadline : code.validHeadline}</Text>
          <Text style={[t(500, 14, 19), { marginTop: 8, textAlign: "center", color: showUsed ? "rgba(255,255,255,0.75)" : "rgba(65,21,21,0.75)" }]}>{showUsed ? code.usedBody : code.itemLine}</Text>
        </View>
        <View style={{ marginTop: 18 }}>
          <Meta k="Perk" v={code.perkShort} />
          <Meta k="Code" v={code.code} />
          <Meta k="Status" v={showUsed ? code.usedStatus : code.validStatus} />
        </View>
        <View style={{ flex: 1 }} />
        <GhostButton
          label="Scan next code"
          onPress={async () => {
            if (frozen === "1") return;
            const res = await vendorScan(code.code);
            setLive(res.result === "valid" ? "valid" : "used");
          }}
        />
        <Text style={[t(500, 12, 16), { marginTop: 12, marginBottom: 16, textAlign: "center", color: C.w64 }]}>{code.privacy}</Text>
        </View>
      </View>
    </Screen>
  );
}

function ValidCheck() {
  return (
    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
      <Path d="m5 12.5 4.5 4.5L19 7.5" stroke={C.burgundy} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UsedMark() {
  return (
    <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke="#fff" strokeWidth={2} />
      <Path d="M12 7.5v5M12 16.2v.1" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}>
      <Text style={[t(500, 14, 18), { color: C.w64 }]}>{k}</Text>
      <Text style={t(500, 14, 18)}>{v}</Text>
    </View>
  );
}
