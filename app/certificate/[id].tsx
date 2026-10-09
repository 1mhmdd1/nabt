import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { LotusArt } from "../../src/components/LotusArt";
import { C, t } from "../../src/theme";
import { certificateSvg, roleLabel, shareSvg, useCertificate } from "../../src/live/records";

export default function CertificateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cert = useCertificate(String(id || ""));
  return (
    <Screen>
      <BackBar title="Certificate" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36, alignItems: "center" }}>
        <View style={{ marginTop: 8, width: 168, height: 116, borderRadius: 20, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" }}>
          <LotusArt width={140} height={96} />
        </View>
        <Text style={[t(600, 12, 16), { color: C.w64, marginTop: 16, letterSpacing: 1.1 }]}>ANTONINE UNIVERSITY</Text>
        <Text style={[t(700, 26, 32), { marginTop: 10, textAlign: "center" }]}>{cert?.fullName || "…"}</Text>
        <Text style={[t(500, 16, 22), { color: C.w80, marginTop: 10, textAlign: "center" }]}>{cert?.eventTitle}</Text>
        <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 4, textAlign: "center" }]}>{cert?.circleName}</Text>
        <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 4, textAlign: "center" }]}>
          {cert?.dateLabel} · {cert ? roleLabel(cert.role) : ""}
        </Text>
        <Text style={[t(700, 18, 24), { marginTop: 22 }]}>{cert?.code}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (!cert) return;
            void shareSvg(
              `nabt-${cert.code}.svg`,
              certificateSvg(cert),
              `${cert.fullName} · ${cert.eventTitle} · ${cert.code}`,
            );
          }}
          style={{ marginTop: 22, height: 48, paddingHorizontal: 22, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={t(600, 15, 18)}>Share</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
