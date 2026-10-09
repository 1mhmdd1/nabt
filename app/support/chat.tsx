import { useEffect } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, InfoIcon, Outline, Top, useScreen } from "../../src/components/voice/Kit";
import { classifyText, toSafetySignal } from "../../src/moderation";
import { writeSafetySignal, useVoiceSafety } from "../../src/live/voiceSafety";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";

type Copy = {
  only: string;
  title: string;
  titlePlain: string;
  body: string;
  bodyPlain: string;
  explain: string;
  primary: string;
  call: string;
  share: string;
  skip: string;
  peer: string;
  mine: string;
  composer: string;
};

export default function SupportInChat() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("chatCard");
  const plain = useNabt((s) => s.plainLanguage);
  const anonId = useVoiceSafety((s) => s.anonId);
  useEffect(() => {
    if (!copy || !anonId) return;
    const result = classifyText(copy.mine);
    const signal = toSafetySignal(result, "circle", anonId);
    if (signal) void writeSafetySignal(signal).catch(() => undefined);
  }, [anonId, copy]);
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Top title="Exam Week" />
      <Text style={styles.members}>5 members</Text>
      <View style={{ paddingHorizontal: 20 }}>
        <Line letter="O" text={copy.peer} />
        <View style={[styles.bub, styles.mine]}>
          <Text style={[t(400, 14.5, 20), { color: C.burgundy }]}>{copy.mine}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.fl}>{copy.only}</Text>
          <Text style={styles.h}>{plain ? copy.titlePlain : copy.title}</Text>
          <Text style={styles.body}>{plain ? copy.bodyPlain : copy.body}</Text>
          {plain ? (
            <View style={styles.explain}>
              <InfoIcon />
              <Text style={styles.explainText}>{copy.explain}</Text>
            </View>
          ) : null}
          <View style={{ marginTop: 12 }}>
            <Gold label={copy.primary} onPress={() => router.push("/support" as never)} />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Outline label={copy.call} onPress={() => void Linking.openURL("tel:1564")} />
            </View>
            <View style={{ flex: 1 }}>
              <Outline label={copy.share} onPress={() => router.push("/support/share" as never)} />
            </View>
          </View>
          <Text style={styles.hide} onPress={() => router.back()}>
            {copy.skip}
          </Text>
        </View>
      </View>
      <View style={styles.cmp}>
        <Text style={styles.ph}>{copy.composer}</Text>
      </View>
    </Screen>
  );
}

function Line({ letter, text }: { letter: string; text: string }) {
  return (
    <View style={styles.msg}>
      <View style={styles.av}>
        <Text style={[t(600, 13, 16), { color: C.gold }]}>{letter}</Text>
      </View>
      <View style={styles.bub}>
        <Text style={t(400, 14.5, 20)}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  members: { marginLeft: 56, marginTop: -8, ...t(500, 11.5, 16), color: C.w64 },
  msg: { marginTop: 12, flexDirection: "row", gap: 8 },
  av: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  bub: { maxWidth: 250, padding: 12, borderRadius: 16, backgroundColor: C.card },
  mine: { alignSelf: "flex-end", marginTop: 12, backgroundColor: C.white },
  card: { marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  h: { marginTop: 10, ...t(600, 17, 22) },
  body: { marginTop: 4, ...t(400, 13, 18), color: "rgba(255,255,255,0.78)" },
  explain: { marginTop: 8, flexDirection: "row", gap: 6 },
  explainText: { flex: 1, ...t(500, 12, 16), color: C.w64 },
  row: { marginTop: 8, flexDirection: "row", gap: 8 },
  hide: { marginTop: 10, textAlign: "center", ...t(600, 12, 16), color: "rgba(255,255,255,0.65)" },
  cmp: { marginTop: "auto", marginHorizontal: 16, marginBottom: 28, height: 48, borderRadius: 24, backgroundColor: C.card, justifyContent: "center", paddingHorizontal: 16 },
  ph: { ...t(500, 14, 18), color: C.w64 },
});
