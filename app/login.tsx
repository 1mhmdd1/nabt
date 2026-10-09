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
import { findAccount, resetDemo } from "../src/local/store";
import { signInDemo } from "../src/local/session";

/** Three ways in. Each signs in with the UA ID; the @ua.edu.lb part is fixed. */
const TYPES = [
  { id: "student", label: "Student" },
  { id: "alumni", label: "Alumni" },
  { id: "staff", label: "Staff" },
] as const;
type LoginType = (typeof TYPES)[number]["id"];

function loginOk(value: string, type: LoginType) {
  const raw = value.trim().toLowerCase();
  if (!raw) return false;
  if (type === "staff" && raw === "admin") return true;
  return isUaId(raw);
}

function typeOf(claims: Record<string, unknown>): LoginType {
  if (claims.sa === true || claims.admin === true || claims.role === "staff" || claims.role === "admin") return "staff";
  if (claims.alumni === true || claims.role === "alumni") return "alumni";
  return "student";
}

export default function Login() {
  const [type, setType] = useState<LoginType>("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const digits = id.replace(/\D/g, "");
  const yearError = digits.length === 9 && !isUaId(digits) ? `A UA ID uses a year from 2019 through ${new Date().getFullYear()}, then 5 digits.` : null;
  const ok = loginOk(id, type) && password.length > 0;
  const email = `${id.trim().toLowerCase()}@ua.edu.lb`;

  async function send() {
    if (busy || !ok) return;
    setBusy(true);
    setError(null);
    try {
      const account = findAccount(email);
      if (account && typeOf(account.claims) !== type) {
        const label = TYPES.find((item) => item.id === typeOf(account.claims))?.label || "another";
        throw new FnError(403, "wrong_type", `That ID is a ${label} account. Pick ${label} above.`);
      }
      const result = await signInDemo(email, password);
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
      <Text style={[styles.lead, { textAlign: "center" }]}>Sign in with your UA ID.</Text>
      <View style={styles.types} accessibilityRole="tablist">
        {TYPES.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: type === item.id }}
            onPress={() => {
              setType(item.id);
              setError(null);
            }}
            style={[styles.type, type === item.id && styles.typeOn]}
          >
            <Text style={[t(600, 14, 16), { color: type === item.id ? C.burgundy : C.white }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.k, { marginTop: 22 }]}>UA email</Text>
      <View style={[styles.emf, (error || yearError) && { borderColor: C.goldLight }]}>
        <TextInput
          value={id}
          onChangeText={(v) => {
            setError(null);
            // Only the ID part is typed; the domain is fixed.
            const local = v.split("@")[0] || "";
            setId((type === "staff" ? local.replace(/[^a-zA-Z0-9]/g, "") : local.replace(/\D/g, "")).slice(0, 12));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={type === "staff" ? "default" : "number-pad"}
          placeholder={type === "staff" ? "Staff ID" : "UA ID"}
          placeholderTextColor={C.w40}
          style={styles.input}
          accessibilityLabel="UA ID"
          onSubmitEditing={() => void send()}
          returnKeyType="next"
        />
        <Text style={styles.domain} accessibilityLabel="at ua.edu.lb, fixed">
          @ua.edu.lb
        </Text>
      </View>
      {yearError ? <Text style={styles.error}>{yearError}</Text> : null}
      {id && isUaId(digits) ? <Text style={styles.note}>Joined {idYear(id)}</Text> : null}
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
  input: { flex: 1, minWidth: 0, ...t(600, 17, 20), color: C.white, letterSpacing: 0.3, padding: 0 },
  domain: { flexShrink: 0, ...t(600, 17, 20), color: C.w64 },
  types: { marginTop: 24, flexDirection: "row", gap: 8, padding: 4, borderRadius: 999, backgroundColor: C.raised },
  type: { flex: 1, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  typeOn: { backgroundColor: C.white },
  error: { marginTop: 10, ...t(500, 13, 18), color: C.goldLight },
  foot: { marginTop: "auto", paddingBottom: 40 },
  note: { marginTop: 14, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
  newHere: { marginTop: 18, textAlign: "center", ...t(500, 13.5, 18), color: C.w80 },
  link: { color: C.white, fontWeight: "600", textDecorationLine: "underline" },
});
