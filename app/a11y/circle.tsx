import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, useScreen } from "../../src/components/voice/Kit";
import { Header, Seg } from "../circle/[id]/index";
import { IconHeartChip, IconPlus, IconRootChip, IconSendUp, IconShield } from "../../src/components/Icons";
import { me, useCampus } from "../../src/live";
import { C, t } from "../../src/theme";

type Copy = { banner: string; bannerSub: string; starters: string[]; placeholder: string };

export default function QuietCircle() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("quiet");
  const campus = useCampus();
  const circle = campus.circles["exam-week"];
  const members = campus.members["exam-week"] || [];
  const messages = campus.messages["exam-week"] || [];
  const day = messages.find((m) => m.kind === "day");
  const texts = messages.filter((m) => m.kind === "text").slice(0, 2);
  const [draft, setDraft] = useState("");
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Header title={circle?.name || "Exam Week"} sub={`${circle?.memberCount ?? 5} members`} members={members} />
      <View style={styles.modRow}>
        <IconShield size={12} color={C.w64} />
        <Text style={styles.mod}>{circle?.modLine}</Text>
      </View>
      <Seg active="chat" id="exam-week" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={styles.pin}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pinK}>Today’s prompt</Text>
            <Text style={t(600, 14, 18)}>{circle?.prompt}</Text>
          </View>
          <Text style={styles.pinLink} onPress={() => router.replace("/circle/exam-week" as never)}>
            Answer in Space
          </Text>
        </View>
        <View style={styles.quiet}>
          <Text style={t(700, 14, 18)}>{copy.banner}</Text>
          <Text style={styles.quietSub}>{copy.bannerSub}</Text>
        </View>
        {day ? (
          <View style={styles.rule}>
            <View style={styles.ruleLine} />
            <Text style={styles.ruleText}>{day.text}</Text>
            <View style={styles.ruleLine} />
          </View>
        ) : null}
        {texts.map((m) => {
          const reacts = m.reactions || [];
          return (
            <View key={m.id} style={styles.grp}>
              <View style={styles.av}>
                <Text style={[t(600, 13, 16), { color: C.gold }]}>{m.initial || "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.who}>
                  {m.authorNickname}
                  {m.timeLabel ? <Text style={{ fontWeight: "500" }}>  {m.timeLabel}</Text> : null}
                </Text>
                <View style={[styles.b, m.authorUid === me() && styles.mine]}>
                  <Text style={[t(400, 14.5, 20), { color: m.authorUid === me() ? C.burgundy : C.white }]}>{m.text}</Text>
                </View>
                {reacts.length ? (
                  <View style={styles.reacts}>
                    {reacts.map((r) => (
                      <View key={r.icon + r.label} style={[styles.chip, r.mine && styles.chipMine]}>
                        {r.icon === "root" ? <IconRootChip /> : <IconHeartChip />}
                        <Text style={t(600, 11, 11)}>{r.label}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.starters}>
        {copy.starters.map((s) => (
          <Pressable key={s} onPress={() => setDraft(s)} style={styles.starter}>
            <Text style={t(600, 13, 16)}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.cbar}>
        <View style={styles.capsule}>
          <Pressable accessibilityRole="button" accessibilityLabel="Attach" onPress={() => setDraft((v) => (v.startsWith("Photo · ") ? v : `Photo · ${v}`))} style={styles.plus}>
            <IconPlus />
          </Pressable>
          <TextInput value={draft} onChangeText={setDraft} placeholder={copy.placeholder} placeholderTextColor={C.w64} style={styles.input} accessibilityLabel={copy.placeholder} />
          {draft.trim() ? (
            <Pressable accessibilityLabel="Send" onPress={() => router.push("/circle/exam-week/chat" as never)} style={styles.send}>
              <IconSendUp />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modRow: { marginTop: -6, paddingLeft: 56, flexDirection: "row", alignItems: "center", gap: 5 },
  mod: { ...t(500, 11, 14), color: C.w64 },
  pin: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.bubble, borderLeftWidth: 3, borderLeftColor: C.gold, flexDirection: "row", alignItems: "center", gap: 10 },
  pinK: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  pinLink: { ...t(600, 12, 16), color: C.white, textDecorationLine: "underline" },
  quiet: { marginTop: 12, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)" },
  quietSub: { marginTop: 3, ...t(500, 12.5, 18), color: "rgba(255,255,255,0.8)" },
  rule: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  ruleLine: { flex: 1, height: 1, backgroundColor: C.hair },
  ruleText: { ...t(500, 12, 16), color: C.w64 },
  reacts: { marginTop: 8, flexDirection: "row", gap: 4, alignSelf: "flex-start" },
  chip: { height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: C.ground, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", flexDirection: "row", alignItems: "center", gap: 4 },
  chipMine: { borderColor: C.gold },
  grp: { marginTop: 22, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  av: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  who: { ...t(600, 12, 16), color: C.w64, marginBottom: 4 },
  b: { alignSelf: "flex-start", maxWidth: 300, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: C.bubble },
  mine: { backgroundColor: C.white },
  starters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  starter: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center", backgroundColor: C.ground },
  cbar: { paddingHorizontal: 12, paddingBottom: 28 },
  capsule: { height: 52, borderRadius: 24, backgroundColor: C.bubble, flexDirection: "row", alignItems: "center", paddingLeft: 6, paddingRight: 8 },
  plus: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, ...t(400, 15, 18), color: C.white, padding: 0 },
  send: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
});
