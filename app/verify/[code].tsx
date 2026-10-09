import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { LotusArt } from "../../src/components/LotusArt";
import { C, t } from "../../src/theme";
import { usePublicCertificate } from "../../src/live/records";

export default function VerifyCertificate() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const row = usePublicCertificate(String(code || ""));
  const valid = Boolean(row?.valid);
  return (
    <Screen>
      <BackBar title="Verify" />
      <View style={{ paddingHorizontal: 24, alignItems: "center" }}>
        <View style={{ width: 120, height: 84, alignItems: "center", justifyContent: "center" }}>
          <LotusArt width={110} height={76} />
        </View>
        <Text style={[t(600, 12, 16), { color: C.w64, letterSpacing: 1.2, marginTop: 8 }]}>{valid ? "VALID" : row === undefined ? "CHECKING" : "NOT VALID"}</Text>
        {valid && row ? (
          <>
            <Text style={[t(700, 26, 32), { marginTop: 12, textAlign: "center" }]}>{row.fullName}</Text>
            <Text style={[t(500, 16, 22), { color: C.w80, marginTop: 8, textAlign: "center" }]}>{row.eventTitle}</Text>
            <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 4 }]}>{row.dateLabel}</Text>
          </>
        ) : row === null ? (
          <Text style={[t(500, 16, 22), { color: C.w80, marginTop: 14, textAlign: "center" }]}>This code is not a NABT certificate.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
