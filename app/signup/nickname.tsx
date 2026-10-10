import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SignupScreen } from "../../src/components/Signup";
import { GoldButton } from "../../src/components/Chrome";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";
import { emailFor, useSignup } from "../../src/signup";
import { claimNickname, FnError, localNicknameProblem } from "../../src/auth";
import { initialsOf, rollNickname } from "../../src/nickname/rules.mjs";

export default function Nickname() {
  const fullName = useSignup((s) => s.fullName);
  const studentId = useSignup((s) => s.studentId);
  const setNickname = useNabt((s) => s.setNickname);
  const identity = { fullName, studentId, email: emailFor(studentId) };
  // Nicknames are random only. A roll that breaks the rules (e.g. close to the real name) is rolled again.
  const roll = (avoid = "") => {
    for (let i = 0; i < 30; i += 1) {
      const next = rollNickname();
      if (next !== avoid && !localNicknameProblem(next, identity)) return next;
    }
    return rollNickname();
  };
  const [rolled, setRolled] = useState(() => roll());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const shown = rolled;
  const ready = !saving;

  async function use() {
    if (!ready) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await claimNickname(shown);
      setNickname(res.nickname);
      router.replace((res.status === "approved" ? "/home" : "/signup/pending") as never);
    } catch (err) {
      if (err instanceof FnError && err.code === "has_nickname") {
        router.replace("/signup/pending" as never);
        return;
      }
      setSaveError(err instanceof FnError && err.status === 0 ? "Can’t reach the campus server. Is npm run demo running?" : err instanceof Error ? err.message : "Could not save that name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SignupScreen step="4 of 5" onBack={() => router.replace("/signup/email" as never)}>
      <Text style={[styles.h1, { textAlign: "center" }]}>Your nickname</Text>
      <Text style={[styles.lead, { textAlign: "center" }]}>This is how people know you on NABT.</Text>
      <View style={styles.nick}>
        <View style={styles.av}>
          <Text style={[t(600, 36, 36), { color: C.gold, letterSpacing: 0.7 }]}>{initialsOf(shown) || "?"}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit accessibilityLabel={`Nickname ${shown}`}>
          {shown}
        </Text>
        <Pressable
          accessibilityLabel="Reroll"
          onPress={() => {
            setRolled(roll(rolled));
            setSaveError(null);
          }}
          style={styles.reroll}
        >
          <Text style={[t(600, 13, 13), { color: C.white }]}>Reroll</Text>
        </Pressable>
      </View>
      <Text style={[styles.rule, { marginTop: 28, textAlign: "center" }]}>
        Nicknames are picked at random so nobody can be recognised. Tap Reroll for another.
      </Text>
      <Text style={styles.explain}>
        Circles, threads and notes always show your nickname. You choose when to share your name in 1:1s.
      </Text>
      <View style={styles.foot}>
        {saveError ? <Text style={styles.bad}>{saveError}</Text> : null}
        <View style={{ opacity: ready ? 1 : 0.45 }}>
          {saving ? (
            <View style={styles.wait}>
              <ActivityIndicator color={C.burgundy} />
            </View>
          ) : (
            <GoldButton label="Use this name" onPress={() => void use()} />
          )}
        </View>
      </View>
    </SignupScreen>
  );
}

const styles = StyleSheet.create({
  h1: { ...t(600, 26, 31), color: C.white, letterSpacing: -0.26 },
  lead: { marginTop: 8, ...t(400, 15, 22), color: C.w80 },
  nick: { marginTop: 26, alignItems: "center" },
  av: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: C.deep,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.w16,
  },
  name: { marginTop: 16, ...t(600, 30, 33), color: C.white, letterSpacing: -0.3, maxWidth: 330 },
  reroll: {
    marginTop: 12,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.w40,
    alignItems: "center",
    justifyContent: "center",
  },
  k: { ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  input: {
    marginTop: 8,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: C.raised,
    borderWidth: 1,
    borderColor: C.w10,
    ...t(500, 15, 18),
    color: C.white,
  },
  inputBad: { borderColor: C.goldLight },
  rule: { marginTop: 8, ...t(500, 12, 16), color: C.w64 },
  bad: { marginTop: 8, ...t(500, 12.5, 16), color: C.goldLight },
  ok: { marginTop: 8, ...t(500, 12, 16), color: C.w80 },
  explain: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: C.deep,
    ...t(400, 13, 19),
    color: C.w80,
  },
  foot: { marginTop: "auto", paddingBottom: 40, gap: 10 },
  wait: { height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
});
