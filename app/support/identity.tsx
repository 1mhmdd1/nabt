import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, InfoIcon, LockLine, Outline, Sheet, Top, useScreen } from "../../src/components/voice/Kit";
import { shareIdentityConsent, useVoiceSafety } from "../../src/live/voiceSafety";
import { useCampus } from "../../src/live";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";
import { ScrollBody } from "../../src/components/ScrollBody";

type Copy = {
  sub: string;
  bubble: string;
  title: string;
  body: string;
  label: string;
  nameLabel: string;
  idLabel: string;
  foot: string;
  explain: string;
  primary: string;
  skip: string;
};

export default function ShareIdentity() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("identity");
  const name = useCampus((s) => s.fullName);
  const id = useCampus((s) => s.studentId);
  const plain = useNabt((s) => s.plainLanguage);
  const sent = useVoiceSafety((s) => s.sent);
  const { height } = useWindowDimensions();
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Top title="Student Affairs (counselor)" />
      <Text style={styles.sub}>{copy.sub}</Text>
      <View style={styles.msg}>
        <View style={styles.av}>
          <Text style={[t(600, 11, 14), { color: C.gold }]}>SA</Text>
        </View>
        <View style={styles.bub}>
          <Text style={t(400, 14.5, 20)}>{copy.bubble}</Text>
        </View>
      </View>
      <View style={styles.scrim} />
      <Sheet title={copy.title}>
        <ScrollBody style={{ flex: 0, maxHeight: height * 0.7 }}>
          <Text style={styles.body}>{copy.body}</Text>
          {plain ? (
            <View style={styles.explain}>
              <InfoIcon />
              <Text style={styles.explainText}>{copy.explain}</Text>
            </View>
          ) : null}
          <Text style={styles.fl}>{copy.label}</Text>
          <View style={styles.list}>
            <View style={styles.it}>
              <Text style={t(600, 14, 18)}>{copy.nameLabel}</Text>
              <Text style={styles.small}>{name}</Text>
            </View>
            <View style={styles.it}>
              <Text style={t(600, 14, 18)}>{copy.idLabel}</Text>
              <Text style={styles.small}>{id}</Text>
            </View>
          </View>
          <LockLine>{copy.foot}</LockLine>
          {sent ? <Text style={styles.sent}>{sent}</Text> : null}
          <View style={{ marginTop: 14 }}>
            <Gold label={copy.primary} onPress={() => void shareIdentityConsent().catch(() => undefined)} />
          </View>
          <Outline label={copy.skip} ghost onPress={() => router.push("/support/declined" as never)} />
        </ScrollBody>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginLeft: 56, ...t(500, 11.5, 16), color: C.w64 },
  msg: { marginTop: 16, paddingHorizontal: 20, flexDirection: "row", gap: 8 },
  av: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  bub: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: C.card },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,4,5,0.62)", zIndex: 20 },
  body: { marginTop: 6, ...t(400, 13, 20), color: "rgba(255,255,255,0.8)" },
  explain: { marginTop: 8, flexDirection: "row", gap: 6 },
  explainText: { flex: 1, ...t(500, 12, 16), color: C.w64 },
  fl: { marginTop: 12, ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  list: { marginTop: 6, borderRadius: 14, backgroundColor: C.ground, overflow: "hidden" },
  it: { paddingHorizontal: 14, paddingVertical: 10 },
  small: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  sent: { marginTop: 8, ...t(500, 12, 16), color: C.w80 },
});
