import { useEffect, useState } from "react";
import { router } from "expo-router";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebase } from "../../src/firebase";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, Outline, useScreen } from "../../src/components/voice/Kit";
import { StaffBar } from "../care/case";
import { C, t } from "../../src/theme";
import { ScrollBody } from "../../src/components/ScrollBody";

type Row = { initial: string; nickname: string; when: string; title: string; needs: string[]; note: string; status: string };
type Copy = {
  brand: string;
  heading: string;
  chip: string;
  foot: string;
  arranged: string;
  mark: string;
  message: string;
  requested: string;
  noteLabel: string;
  hint: string;
  rows: Row[];
};

export default function SaAccommodations() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("saAccommodation");
  const [arranged, setArranged] = useState(false);
  const firstNick = copy?.rows[0]?.nickname || "";
  // Arranged is kept on a small status doc, so it stays marked after leaving the screen.
  useEffect(() => {
    if (!firstNick) return;
    return onSnapshot(doc(getFirebase().db, "accommodationStatus", firstNick), (snap) => setArranged(snap.data()?.status === "arranged"));
  }, [firstNick]);
  if (!copy) return null;
  const [first, ...rest] = copy.rows;
  const markArranged = () => {
    setArranged(true);
    void setDoc(doc(getFirebase().db, "accommodationStatus", first.nickname), { status: "arranged", at: Date.now() }).catch(() => undefined);
  };
  return (
    <Screen bg={C.ground}>
      <Text style={styles.brand}>NABT · {copy.brand}</Text>
      <View style={styles.hd}>
        <Text style={styles.h}>{copy.heading}</Text>
        <View style={styles.chip}>
          <Text style={t(600, 12, 16)}>{copy.chip}</Text>
        </View>
      </View>
      <ScrollBody nav contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={[styles.case, styles.sel]}>
          <View style={styles.r1}>
            <View style={styles.av}>
              <Text style={[t(600, 12, 14), { color: C.gold }]}>{first.initial}</Text>
            </View>
            <Text style={t(600, 13, 16)}>{first.nickname}</Text>
            <Text style={styles.when}>{first.when}</Text>
          </View>
          <Text style={styles.title}>{first.title}</Text>
          <Text style={styles.fl}>{arranged ? copy.arranged : copy.requested}</Text>
          <View style={styles.needs}>
            {first.needs.map((n) => (
              <View key={n} style={styles.need}>
                <Text style={[t(600, 12, 16), { color: C.burgundy }]}>{n}</Text>
              </View>
            ))}
          </View>
          {first.note ? (
            <>
              <Text style={styles.fl}>{copy.noteLabel}</Text>
              <View style={styles.ex}>
                <Text style={t(400, 13, 18)}>“{first.note}”</Text>
              </View>
            </>
          ) : null}
          <Text style={styles.hint}>{copy.hint}</Text>
          {arranged ? null : (
            <View style={{ marginTop: 12 }}>
              <Gold label={copy.mark} onPress={markArranged} />
            </View>
          )}
          <View style={{ marginTop: 8 }}>
            <Outline label={copy.message} onPress={() => router.push("/staff/safety/outreach?caseId=fig-shared" as never)} />
          </View>
        </View>
        {rest.map((row) => (
          <View key={row.nickname} style={styles.case}>
            <View style={styles.r1}>
              <View style={styles.av}>
                <Text style={[t(600, 12, 14), { color: C.gold }]}>{row.initial}</Text>
              </View>
              <Text style={t(600, 13, 16)}>{row.nickname}</Text>
              <Text style={styles.when}>{row.when}</Text>
            </View>
            <Text style={styles.title}>{row.title}</Text>
            <Text style={styles.hint}>{row.status === "arranged" ? copy.arranged : row.needs.join(" · ")}</Text>
          </View>
        ))}
        <Text style={styles.foot}>{copy.foot}</Text>
      </ScrollBody>
      <StaffBar active="Events" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { paddingHorizontal: 20, paddingTop: 8, ...t(600, 12, 16), color: "rgba(255,255,255,0.7)" },
  hd: { paddingHorizontal: 20, paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { ...t(700, 28, 32), color: C.white },
  chip: { height: 26, paddingHorizontal: 10, borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", justifyContent: "center" },
  case: { marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: C.card },
  sel: { borderWidth: 1.5, borderColor: C.white },
  r1: { flexDirection: "row", alignItems: "center", gap: 8 },
  av: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  when: { marginLeft: "auto", ...t(500, 11.5, 14), color: C.w64 },
  title: { marginTop: 9, ...t(600, 14.5, 20) },
  fl: { marginTop: 12, ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  needs: { marginTop: 6, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  need: { height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: C.white, justifyContent: "center" },
  ex: { marginTop: 6, padding: 10, borderRadius: 12, backgroundColor: C.ground },
  hint: { marginTop: 10, ...t(500, 13, 18), color: "rgba(255,255,255,0.8)" },
  foot: { marginTop: 10, ...t(500, 12, 16), color: "rgba(255,255,255,0.7)" },
});
