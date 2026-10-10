import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Chrome";
import { Gate, Top, useScreen } from "../../src/components/voice/Kit";
import { declineAndMaybeSignal } from "../../src/voice/session";
import { C, t } from "../../src/theme";
import { ScrollBody } from "../../src/components/ScrollBody";

type Copy = { note: string; bubble: string; sys: string; reply: string; mine: string; saved: string; savedBody: string; composer: string };

export default function Declined() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("declined");
  useEffect(() => {
    void declineAndMaybeSignal();
  }, []);
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Top title="Student Affairs (counselor)" />
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={styles.note}>
          <Text style={styles.noteText}>{copy.note}</Text>
        </View>
        <Bubble letter="SA">{copy.bubble}</Bubble>
        <Text style={styles.sys}>{copy.sys}</Text>
        <Bubble letter="SA">{copy.reply}</Bubble>
        <View style={[styles.bub, styles.mine]}>
          <Text style={[t(400, 14.5, 20), { color: C.burgundy }]}>{copy.mine}</Text>
        </View>
        <View style={styles.card}>
          <Text style={t(600, 13.5, 18)}>{copy.saved}</Text>
          <Text style={styles.saved}>{copy.savedBody}</Text>
        </View>
      </ScrollBody>
      <View style={styles.cmp}>
        <Text style={styles.ph}>{copy.composer}</Text>
      </View>
    </Screen>
  );
}

function Bubble({ letter, children }: { letter: string; children: string }) {
  return (
    <View style={styles.msg}>
      <View style={styles.av}>
        <Text style={[t(600, 11, 14), { color: C.gold }]}>{letter}</Text>
      </View>
      <View style={styles.bub}>
        <Text style={t(400, 14.5, 20)}>{children}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: C.card },
  noteText: { ...t(500, 13, 18), color: "rgba(255,255,255,0.8)" },
  msg: { marginTop: 14, flexDirection: "row", gap: 8 },
  av: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  bub: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: C.card },
  mine: { flex: 0, alignSelf: "flex-end", marginTop: 12, maxWidth: 220, backgroundColor: C.white },
  sys: { marginTop: 14, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
  card: { marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  saved: { marginTop: 4, ...t(400, 12.5, 18), color: "rgba(255,255,255,0.72)" },
  cmp: { marginTop: "auto", marginHorizontal: 16, marginBottom: 28, height: 48, borderRadius: 24, backgroundColor: C.card, justifyContent: "center", paddingHorizontal: 16 },
  ph: { ...t(500, 14, 18), color: C.w64 },
});
