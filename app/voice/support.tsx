import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, InfoIcon, LockLine, Outline, PlantLotus, useScreen } from "../../src/components/voice/Kit";
import { IconChevronRight } from "../../src/components/Icons";
import { declineAndMaybeSignal, markSofterStep } from "../../src/voice/session";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";
import { voiceCopy } from "../../src/voice/copy";
import { TONE_COPY } from "../../src/voice/signals";

type Copy = {
  title: string;
  titlePlain: string;
  body: string;
  bodyPlain: string;
  explain: string;
  primary: string;
  primarySub: string;
  callTitle: string;
  callSub: string;
  breatheTitle: string;
  breatheSub: string;
  shareTitle: string;
  shareSub: string;
  skip: string;
  reflection: string;
  footer: string;
};

export default function VoiceSupport() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const seeded = useScreen<Copy>("supportFirst");
  const copy = seeded ?? voiceCopy.support;
  const plain = useNabt((s) => s.plainLanguage);
  useEffect(() => {
    void markSofterStep("extra_card");
  }, []);
  return (
    <Screen bg={C.ground}>
      <View style={styles.main}>
        <PlantLotus width={110} height={76} />
        <Text style={styles.h}>{plain ? copy.titlePlain : copy.title}</Text>
        <Text style={styles.body}>{TONE_COPY}</Text>
        <Text style={styles.body}>{plain ? copy.bodyPlain : copy.body}</Text>
        {plain ? (
          <View style={styles.explain}>
            <InfoIcon />
            <Text style={styles.explainText}>{copy.explain}</Text>
          </View>
        ) : null}
        <View style={{ marginTop: 22, alignSelf: "stretch" }}>
          <Gold label={copy.primary} onPress={() => router.push("/care/message" as never)} />
        </View>
        <Text style={styles.sub}>{copy.primarySub}</Text>
        <Pressable style={styles.row} onPress={() => void Linking.openURL("tel:1564")}>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 15, 18)}>{copy.callTitle}</Text>
            <Text style={styles.small}>{copy.callSub}</Text>
          </View>
          <View style={styles.call}>
            <Text style={[t(700, 13, 16), { color: C.burgundy }]}>Call</Text>
          </View>
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/breathe" as never)}>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 15, 18)}>{copy.breatheTitle}</Text>
            <Text style={styles.small}>{copy.breatheSub}</Text>
          </View>
          <IconChevronRight />
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push("/support/share" as never)}>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 15, 18)}>{copy.shareTitle}</Text>
            <Text style={styles.small}>{copy.shareSub}</Text>
          </View>
          <IconChevronRight />
        </Pressable>
        <View style={{ marginTop: 14, alignSelf: "stretch" }}>
          <Outline
            label={copy.skip}
            onPress={() => {
              void declineAndMaybeSignal();
              router.replace("/home" as never);
            }}
          />
        </View>
        <View style={{ alignSelf: "stretch" }}>
          <Outline label={copy.reflection} ghost onPress={() => router.push("/voice/result" as never)} />
        </View>
        <LockLine>{copy.footer}</LockLine>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: { paddingHorizontal: 20, paddingTop: 28, alignItems: "center" },
  h: { marginTop: 8, ...t(700, 30, 36), color: C.white, textAlign: "center" },
  body: { marginTop: 8, ...t(400, 15, 22), color: "rgba(255,255,255,0.82)", textAlign: "center" },
  explain: { marginTop: 10, flexDirection: "row", gap: 6, alignItems: "flex-start" },
  explainText: { flex: 1, ...t(500, 12, 16), color: C.w64 },
  sub: { marginTop: 8, ...t(500, 12, 16), color: C.w64, textAlign: "center" },
  row: { marginTop: 8, alignSelf: "stretch", minHeight: 56, borderRadius: 16, backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  small: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  call: { height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
});
