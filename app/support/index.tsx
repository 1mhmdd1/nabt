import { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, InfoIcon, Outline, PlantLotus, useScreen } from "../../src/components/voice/Kit";
import { IconChevronRight } from "../../src/components/Icons";
import { declineAndMaybeSignal, markSofterStep } from "../../src/voice/session";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";

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
};

export default function SupportCard() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("supportCard");
  const plain = useNabt((s) => s.plainLanguage);
  useEffect(() => {
    void markSofterStep("extra_card");
  }, []);
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <View style={styles.main}>
        <PlantLotus width={110} height={76} />
        <Text style={styles.h}>{plain ? copy.titlePlain : copy.title}</Text>
        <Text style={styles.body}>{plain ? copy.bodyPlain : copy.body}</Text>
        {plain ? (
          <View style={styles.explain}>
            <InfoIcon />
            <Text style={styles.explainText}>{copy.explain}</Text>
          </View>
        ) : null}
        <View style={{ marginTop: 22, alignSelf: "stretch" }}>
          <Gold label={copy.primary} onPress={() => router.push("/support/outreach" as never)} />
        </View>
        <Text style={styles.sub}>{copy.primarySub}</Text>
        <View style={styles.list}>
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
        </View>
        <View style={{ marginTop: 16, alignSelf: "stretch" }}>
          <Outline
            label={copy.skip}
            ghost
            onPress={() => {
              void declineAndMaybeSignal();
              router.replace("/home" as never);
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: { paddingHorizontal: 20, paddingTop: 30, alignItems: "center" },
  h: { marginTop: 18, ...t(700, 30, 34), color: C.white, textAlign: "center" },
  body: { marginTop: 10, ...t(400, 15, 22), color: "rgba(255,255,255,0.82)", textAlign: "center" },
  explain: { marginTop: 10, flexDirection: "row", gap: 6 },
  explainText: { flex: 1, ...t(500, 12, 16), color: C.w64 },
  sub: { marginTop: 6, ...t(500, 12, 16), color: C.w64 },
  list: { marginTop: 16, alignSelf: "stretch", borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  row: { minHeight: 56, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  small: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  call: { height: 32, paddingHorizontal: 14, borderRadius: 16, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
});
