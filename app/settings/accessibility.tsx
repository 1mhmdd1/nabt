import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { IconBack } from "../../src/components/Icons";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";
import { saveAccessibility } from "../../src/live";

export default function Accessibility() {
  const calm = useNabt((s) => s.calmMode);
  const plain = useNabt((s) => s.plainLanguage);
  const quiet = useNabt((s) => s.quietPresence);
  const node = useNabt((s) => s.nodeTakeYourTime);
  const typing = useNabt((s) => s.offerTyping);
  const setCalm = useNabt((s) => s.setCalm);
  const setPlain = useNabt((s) => s.setPlain);
  const setQuiet = useNabt((s) => s.setQuiet);
  const setNode = useNabt((s) => s.setNodeTime);
  const setTyping = useNabt((s) => s.setTyping);

  return (
    <Screen bg={C.ground}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}>
          <IconBack />
        </Pressable>
        <Text style={styles.h1}>Accessibility</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}>
        <Toggle
          title="Calm mode"
          sub="Stops animations, haptics, glowing roots and the launch bloom. Your plant stays still."
          on={calm}
          label="Calm mode"
          set={(v) => persist("calmMode", v, setCalm)}
        />
        <Text style={styles.mt}>Follows your phone’s Reduce Motion setting.</Text>
        <View style={{ height: 10 }} />
        <Toggle
          title="Plain language"
          sub="Literal wording on support and safety screens, with an “Explain this” line."
          on={plain}
          label="Plain language"
          set={(v) => persist("plainLanguage", v, setPlain)}
        />
        <Text style={styles.fl}>Text size</Text>
        <View style={styles.list}>
          <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
            <Text style={t(600, 13, 16)}>
              Aa <Text style={{ fontSize: 17 }}>Aa</Text> <Text style={{ fontSize: 22 }}>Aa</Text>
            </Text>
            <Text style={styles.small}>Uses your phone’s text size. Every screen works at the largest size.</Text>
          </View>
        </View>
        <Text style={styles.fl}>Circles</Text>
        <Toggle title="Quiet presence" sub="Join as a reader. Hide your typing dots and read receipts." on={quiet} label="Quiet presence in Circles" set={(v) => persist("quietPresence", v, setQuiet)} />
        <Text style={styles.fl}>Hope Node</Text>
        <Toggle title="Take your time" sub="No countdown on the photo step. Take it when you’re ready." on={node} label="Take your time at the Hope Node" set={(v) => persist("nodeTakeYourTime", v, setNode)} />
        <Text style={styles.fl}>Voice check-in</Text>
        <Toggle title="Always offer typing instead" sub="Typing is always there next to voice." on={typing} label="Always offer typing instead" set={(v) => persist("offerTyping", v, setTyping)} />
        <Text style={styles.mt}>Voice results can misread different ways of speaking. Typing counts the same.</Text>
      </ScrollView>
    </Screen>
  );
}

function persist(key: "calmMode" | "plainLanguage" | "quietPresence" | "nodeTakeYourTime" | "offerTyping", next: boolean, set: (v: boolean) => void) {
  set(next);
  // AREA: voice-safety-a11y — the existing settings writer; this screen does not touch live.ts.
  void saveAccessibility({ [key]: next }).catch(() => undefined);
}

function Toggle({
  title,
  sub,
  on,
  label,
  set,
}: {
  title: string;
  sub: string;
  on: boolean;
  label: string;
  set: (v: boolean) => void;
}) {
  return (
    <View style={styles.list}>
      <View style={styles.it}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.label}>{title}</Text>
          <Text style={styles.small}>{sub}</Text>
        </View>
        <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: on }} onPress={() => set(!on)} style={[styles.tg, on && styles.tgOn]}>
          <View style={[styles.knob, on ? { marginLeft: 18, backgroundColor: C.burgundy } : null]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 8, paddingRight: 12 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  h1: { ...t(600, 17, 17), color: C.white },
  list: { borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { paddingVertical: 9, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  label: { ...t(600, 14.5, 18), color: C.white },
  small: { marginTop: 2, ...t(500, 11.5, 15), color: "rgba(255,255,255,0.7)" },
  mt: { marginTop: 6, marginHorizontal: 4, ...t(500, 12, 17), color: "rgba(255,255,255,0.7)" },
  fl: { marginTop: 16, marginBottom: 6, marginHorizontal: 2, ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  tg: { width: 44, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", paddingLeft: 3 },
  tgOn: { backgroundColor: C.white },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.white },
});
