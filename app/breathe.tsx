import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../src/components/Chrome";
import { BreathRing } from "../src/components/NodeChrome";
import { Outline, Top } from "../src/components/voice/Kit";
import { useNabt } from "../src/state";
import { C, t } from "../src/theme";
import { ScrollBody } from "../src/components/ScrollBody";

/** Breathing from support and the distress card. Tap the ring to pause. Calm mode keeps it still. */
export default function Breathe() {
  const calm = useNabt((s) => s.calmMode);
  return (
    <Screen bg={C.ground}>
      <Top title="Breathe" />
      <ScrollBody>
        <View style={styles.main}>
          <BreathRing size={240} />
          <Text style={styles.guide}>In for 4 · hold for 2 · out for 6</Text>
          <Text style={styles.sub}>{calm ? "Calm mode is on, so the ring stays still. Follow the count." : "Tap the ring to pause."}</Text>
        </View>
        <View style={styles.foot}>
          <Outline label="I’m done" onPress={() => (router.canGoBack() ? router.back() : router.replace("/home" as never))} />
        </View>
      </ScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  guide: {
    ...t(600, 16, 20),
    color: C.white,
    marginTop: 28,
    textAlign: "center",
  },
  sub: { ...t(400, 13, 18), color: C.w64, marginTop: 8, textAlign: "center" },
  foot: { paddingHorizontal: 24, paddingBottom: 24 },
});
