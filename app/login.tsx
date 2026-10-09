import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SvgXml } from "react-native-svg";
import { loginBrandSvg } from "../src/art/svgs";
import { SignupScreen } from "../src/components/Signup";
import { GoldButton } from "../src/components/Chrome";
import { C, t } from "../src/theme";
import { useSignup } from "../src/signup";
import { FnError, requestCode } from "../src/auth";
import { markIntroSeen } from "../src/intro";
import { isUaId } from "../src/local/ids";
import { resetDemo } from "../src/local/store";

/** A UA ID, or the campus admin's "admin". The @ua.edu.lb part is fixed. */
function idOk(value: string) {
  const raw = value.trim().toLowerCase();
  return raw === "admin" || isUaId(raw);
}

export default function Login() {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const digits = id.replace(/\D/g, "");
  const yearError = digits.length === 9 && !isUaId(digits) ? `A UA ID uses a year from 2019 through ${new Date().getFullYear()}, then 5 digits.` : null;
  const ok = idOk(id);

  // No password: the server sends a 6-digit code to <ID>@ua.edu.lb, and the next screen checks it.
  async function send() {
    if (busy || !ok) return;
    setBusy(true);
    setError(null);
    try {
      useSignup.getState().reset();
      useSignup.getState().setStudentId(id.trim().toLowerCase());
      await requestCode("login");
      await markIntroSeen();
      router.push("/signup/email?mode=login" as never);
    } catch (err) {
      setError(err instanceof FnError && err.status === 0 ? "Can’t reach the campus server." : err instanceof Error ? err.message : "Could not send a code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SignupScreen hideMark>
      <View style={{ alignItems: "center", marginTop: 18 }}>
        <Pressable
          accessibilityLabel="NABT logo"
          delayLongPress={500}
          onLongPress={() => {
            void resetDemo();
            setError("Demo data reset.");
            setId("");
          }}
        >
          <SvgXml xml={loginBrandSvg} width={88} height={62} />
          <Text style={styles.nabt}>NABT</Text>
        </Pressable>
      </View>
      <Text style={[styles.h1, { marginTop: 36, textAlign: "center" }]}>Welcome back</Text>
      <Text style={[styles.lead, { textAlign: "center" }]}>Sign in with your UA email.</Text>
      <Text style={[styles.k, { marginTop: 28 }]}>UA email</Text>
      <View style={[styles.emf, (error || yearError) && { borderColor: C.goldLight }]}>
        <TextInput
          value={id}
          onChangeText={(v) => {
            setError(null);
            // Only the ID part is typed; the domain is fixed.
            const local = v.split("@")[0] || "";
            setId(local.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          placeholder="Your ID number"
          placeholderTextColor={C.w40}
          style={styles.input}
          accessibilityLabel="UA ID"
          onSubmitEditing={() => void send()}
          returnKeyType="send"
        />
        <View style={styles.domainChip}>
          <Text style={styles.domain} accessibilityLabel="at ua.edu.lb, fixed">
            @ua.edu.lb
          </Text>
        </View>
      </View>
      {yearError ? <Text style={styles.error}>{yearError}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.foot}>
        <View style={{ opacity: ok && !busy ? 1 : 0.55 }}>
          <GoldButton label={busy ? "Sending your code…" : "Send me a sign-in code"} disabled={!ok || busy} onPress={() => void send()} />
        </View>
        <Text style={styles.note}>No password. We email you a 6-digit code.</Text>
        <Text style={styles.newHere}>
          New here?{" "}
          <Text style={styles.link} onPress={() => router.push("/signup/scan" as never)}>
            Scan your ID card
          </Text>
        </Text>
      </View>
    </SignupScreen>
  );
}

const styles = StyleSheet.create({
  nabt: { marginTop: 8, ...t(700, 24, 24), color: C.white, letterSpacing: 0.5, textAlign: "center" },
  h1: { ...t(600, 26, 31), color: C.white, letterSpacing: -0.26 },
  lead: { marginTop: 8, ...t(400, 15, 22), color: C.w80 },
  k: { ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  emf: {
    marginTop: 8,
    height: 54,
    paddingLeft: 18,
    paddingRight: 6,
    borderRadius: 18,
    backgroundColor: C.raised,
    borderWidth: 1.5,
    borderColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: { flex: 1, minWidth: 0, ...t(600, 17, 20), color: C.white, letterSpacing: 0.3, padding: 0 },
  domainChip: { flexShrink: 0, height: 40, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.deep, justifyContent: "center" },
  domain: { ...t(600, 15, 18), color: C.w80 },
  error: { marginTop: 10, ...t(500, 13, 18), color: C.goldLight },
  foot: { marginTop: "auto", paddingBottom: 40 },
  note: { marginTop: 14, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
  newHere: { marginTop: 18, textAlign: "center", ...t(500, 13.5, 18), color: C.w80 },
  link: { color: C.white, fontWeight: "600", textDecorationLine: "underline" },
});
