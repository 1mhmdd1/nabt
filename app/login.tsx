import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SvgXml } from "react-native-svg";
import { loginBrandSvg } from "../src/art/svgs";
import { SignupScreen } from "../src/components/Signup";
import { GoldButton } from "../src/components/Chrome";
import { C, t } from "../src/theme";
import { useSignup } from "../src/signup";
import { FnError } from "../src/auth";
import { markIntroSeen } from "../src/intro";
import { idYear, isUaId } from "../src/local/ids";
import { DEMO_PASSWORD } from "../src/local/mode";
import { resetDemo } from "../src/local/store";
import { signInDemo } from "../src/local/session";

function loginOk(value: string) {
  const raw = value.trim().toLowerCase();
  if (!raw) return false;
  if (raw.includes("@")) {
    if (raw === "admin@ua.edu.lb") return true;
    const local = raw.split("@")[0] || "";
    return isUaId(local);
  }
  return isUaId(raw);
}

export default function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const digits = id.replace(/\D/g, "");
  const yearError = digits.length === 9 && !id.includes("@") && !isUaId(digits) ? `A UA ID uses a year from 2019 through ${new Date().getFullYear()}, then 5 digits.` : null;
  const ok = loginOk(id) && password.length > 0;

  async function send() {
    if (busy || !ok) return;
    setBusy(true);
    setError(null);
    try {
      const result = await signInDemo(id, password);
      await markIntroSeen();
      if (result.claims.sa === true) {
        router.replace("/staff/overview" as never);
        return;
      }
      if (result.claims.admin === true || result.role === "admin") {
        router.replace("/admin/log" as never);
        return;
      }
      if (!result.nickname && result.role === "student") {
        useSignup.getState().reset();
        useSignup.getState().setStudentId(result.studentId);
        router.replace("/signup/nickname" as never);
        return;
      }
      router.replace("/home" as never);
    } catch (err) {
      setError(err instanceof FnError ? err.message : err instanceof Error ? err.message : "Could not sign in.");
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
            setPassword("");
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
            setId(v.slice(0, 40));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="ID or UA email"
          placeholderTextColor={C.w40}
          style={styles.input}
          accessibilityLabel="UA email"
          onSubmitEditing={() => void send()}
          returnKeyType="next"
        />
      </View>
      {yearError ? <Text style={styles.error}>{yearError}</Text> : null}
      {id && isUaId(id.replace(/\D/g, "")) && !id.includes("@") ? <Text style={styles.note}>{idYear(id)} · {id.replace(/\D/g, "")}@ua.edu.lb</Text> : null}
      <Text style={[styles.k, { marginTop: 16 }]}>Password</Text>
      <View style={[styles.emf, error && { borderColor: C.goldLight }]}>
        <TextInput
          value={password}
          onChangeText={(v) => {
            setError(null);
            setPassword(v);
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Password"
          placeholderTextColor={C.w40}
          style={styles.input}
          accessibilityLabel="Password"
          onSubmitEditing={() => void send()}
          returnKeyType="go"
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.foot}>
        <View style={{ opacity: ok && !busy ? 1 : 0.55 }}>
          <GoldButton label={busy ? "Signing in…" : "Sign in"} disabled={!ok || busy} onPress={() => void send()} />
        </View>
        <Text style={styles.note}>Demo password {DEMO_PASSWORD}. Hold the logo to reset.</Text>
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
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: C.raised,
    borderWidth: 1.5,
    borderColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: { flex: 1, ...t(600, 17, 20), color: C.white, letterSpacing: 0.3, padding: 0 },
  error: { marginTop: 10, ...t(500, 13, 18), color: C.goldLight },
  foot: { marginTop: "auto", paddingBottom: 40 },
  note: { marginTop: 14, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
  newHere: { marginTop: 18, textAlign: "center", ...t(500, 13.5, 18), color: C.w80 },
  link: { color: C.white, fontWeight: "600", textDecorationLine: "underline" },
});
