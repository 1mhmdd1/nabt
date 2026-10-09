import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { Screen } from "../../src/components/Chrome";
import { GoldButton, StaffMark } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { useSignup } from "../../src/signup";
import { FnError, requestCode } from "../../src/auth";

/**
 * Staff sign in like everyone else: UA ID, then the emailed code. The Student Affairs
 * area opens only when the account carries the `sa` claim (node scripts/make-role.mjs).
 */
export default function StaffSignIn() {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ok = /^\d{9}$/.test(id);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.dataset.nabt = "ready";
    }
  }, []);

  async function send() {
    if (busy || !ok) return;
    setBusy(true);
    setError(null);
    try {
      useSignup.getState().reset();
      useSignup.getState().setStudentId(id);
      await requestCode("login");
      router.push("/signup/email?mode=login" as never);
    } catch (err) {
      if (err instanceof FnError && err.code === "unknown_id") setError("No account for that ID. Ask the Admin to create your staff account.");
      else if (err instanceof FnError && err.status === 0) setError("Can’t reach the campus server. Is npm run demo running?");
      else setError(err instanceof Error ? err.message : "Could not send a code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen bg={C.ground}>
      <View style={styles.wrap}>
        <StaffMark width={120} height={82} />
        <Text style={[t(700, 15, 18), { letterSpacing: 2.4, marginTop: 14 }]}>NABT</Text>
        <Text style={[t(500, 13, 16), { color: C.w70, marginTop: 6 }]}>Student Affairs</Text>
        <Text style={[t(700, 26, 32), { marginTop: 34 }]}>Staff sign-in</Text>
        <View style={{ alignSelf: "stretch", marginTop: 18 }}>
          <Text style={styles.fl}>UA staff email</Text>
          <View style={[styles.in, error && { borderColor: C.goldLight }]}>
            <TextInput
              value={id}
              onChangeText={(v) => {
                setError(null);
                setId(v.replace(/\D/g, "").slice(0, 9));
              }}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder="Your 9-digit ID"
              placeholderTextColor={C.w40}
              style={styles.input}
              accessibilityLabel="UA staff ID"
              onSubmitEditing={() => void send()}
              returnKeyType="go"
            />
            <Text style={[t(500, 15, 18), { color: C.w64 }]}>@ua.edu.lb</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        <View style={{ alignSelf: "stretch", marginTop: 14, opacity: ok && !busy ? 1 : 0.55 }}>
          <GoldButton label={busy ? "Sending…" : "Send me a sign-in code"} onPress={() => void send()} />
        </View>
        <Text style={styles.note}>Staff accounts are created by the Admin. The code goes to your UA inbox.</Text>
        <View style={styles.lock}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Rect x={5} y={10.5} width={14} height={9.5} rx={2.5} stroke="#fff" strokeWidth={1.6} />
            <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
          <Text style={[t(500, 11.5, 15), { color: C.w64 }]}>Signs out after 30 min idle</Text>
        </View>
        <Text style={[styles.note, { marginTop: 22 }]} onPress={() => router.replace("/login" as never)}>
          Not staff? <Text style={{ color: C.white, textDecorationLine: "underline" }}>Student sign-in</Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", paddingTop: 90, paddingHorizontal: 24 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  in: {
    marginTop: 6,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: { flex: 1, ...t(600, 15, 18), color: C.white, padding: 0 },
  error: { marginTop: 8, ...t(500, 12.5, 16), color: C.goldLight },
  note: { ...t(400, 12.5, 18), color: C.w64, textAlign: "center", marginTop: 14 },
  lock: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
});
