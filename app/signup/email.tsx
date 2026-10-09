import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SvgXml } from "react-native-svg";
import { emailArtSvg } from "../../src/art/svgs";
import { SignupScreen } from "../../src/components/Signup";
import { GoldButton } from "../../src/components/Chrome";
import { C, t } from "../../src/theme";
import { emailFor, useSignup } from "../../src/signup";
import { FnError, requestCode, verifyCode } from "../../src/auth";
import { currentClaims } from "../../src/firebase";

const RESEND_SEC = 42;

export default function EmailCode() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const login = mode === "login";
  const id = useSignup((s) => s.studentId);
  const demoCode = useSignup((s) => s.demoCode);
  const sentAt = useSignup((s) => s.codeSentAt);
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(RESEND_SEC);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const input = useRef<TextInput>(null);

  // Countdown restarts every time a code is sent.
  useEffect(() => {
    setLeft(RESEND_SEC);
    const tmr = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(tmr);
  }, [sentAt]);

  // Arriving here without a code (deep link, reload): ask for one.
  useEffect(() => {
    if (!sentAt && id) void resend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resend() {
    if (busy) return;
    setBusy("send");
    setError(null);
    setCode("");
    try {
      await requestCode(login ? "login" : "signup");
    } catch (err) {
      setError(err instanceof FnError && err.status === 0 ? "Can’t reach the campus server. Is npm run demo running?" : err instanceof Error ? err.message : "Could not send a code.");
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    if (busy) return;
    if (code.length < 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setBusy("verify");
    setError(null);
    try {
      const result = await verifyCode(code);
      const claims = await currentClaims(true);
      if (claims.sa === true) router.replace("/staff/overview" as never);
      else if (claims.role === "admin") router.replace("/admin/log" as never);
      else if (result.isNew || (!result.nickname && claims.role !== "alumni")) router.replace("/signup/nickname" as never);
      else if (result.status === "approved") router.replace("/home" as never);
      else router.replace("/signup/pending" as never);
    } catch (err) {
      setCode("");
      setError(err instanceof FnError && err.status === 0 ? "Can’t reach the campus server. Is npm run demo running?" : err instanceof Error ? err.message : "That code didn’t work.");
      setTimeout(() => input.current?.focus(), 50);
    } finally {
      setBusy(null);
    }
  }

  const digits = Array.from({ length: 6 }, (_, i) => code[i] || "");
  const cursor = Math.min(code.length, 5);

  return (
    <SignupScreen step={login ? undefined : "3 of 5"} onBack={() => router.replace((login ? "/login" : "/signup/details") as never)}>
      <View style={{ alignItems: "center" }}>
        <SvgXml xml={emailArtSvg} width={72} height={72} />
        <Text style={[styles.h1, { marginTop: 22, textAlign: "center" }]}>Check your UA inbox</Text>
        <Text style={[styles.lead, { textAlign: "center" }]}>
          We sent a 6-digit code to{"\n"}
          <Text style={{ color: C.white, fontWeight: "600" }}>{emailFor(id)}</Text>
        </Text>
        <Pressable style={styles.code} accessibilityLabel="6-digit code" onPress={() => input.current?.focus()}>
          {digits.map((d, i) => (
            <View key={i} style={[styles.box, i === cursor && code.length < 6 && styles.cur, error && styles.boxErr]}>
              <Text style={[t(600, 22, 22), { color: C.white }]}>{d}</Text>
            </View>
          ))}
        </Pressable>
        <TextInput
          ref={input}
          value={code}
          onChangeText={(v) => {
            setError(null);
            setCode(v.replace(/\D/g, "").slice(0, 6));
          }}
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={6}
          style={styles.hidden}
          accessibilityLabel="Enter the 6-digit code"
          autoFocus
          caretHidden
        />
        {demoCode ? (
          <Text style={styles.demo}>
            Demo code: <Text style={{ color: C.w80, fontVariant: ["tabular-nums"] }}>{demoCode}</Text>
          </Text>
        ) : (
          <Text style={styles.or}>or open the link in the email</Text>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {left > 0 ? (
          <Text style={styles.resend}>Resend in 0:{String(left).padStart(2, "0")}</Text>
        ) : (
          <Pressable onPress={() => void resend()} disabled={busy !== null} accessibilityRole="button">
            <Text style={[styles.resend, { color: C.white, textDecorationLine: "underline" }]}>{busy === "send" ? "Sending…" : "Resend code"}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.foot}>
        {busy === "verify" ? (
          <View style={styles.wait}>
            <ActivityIndicator color={C.burgundy} />
          </View>
        ) : (
          <View style={{ opacity: code.length === 6 ? 1 : 0.55 }}>
            <GoldButton label="Verify" onPress={() => void verify()} />
          </View>
        )}
        <Text style={styles.note}>
          Wrong email?{" "}
          <Text style={styles.link} onPress={() => router.replace((login ? "/login" : "/signup/details") as never)}>
            {login ? "Change ID" : "Edit details"}
          </Text>
        </Text>
      </View>
    </SignupScreen>
  );
}

const styles = StyleSheet.create({
  h1: { ...t(600, 26, 31), color: C.white, letterSpacing: -0.26 },
  lead: { marginTop: 8, ...t(400, 15, 22), color: C.w80 },
  code: { marginTop: 26, flexDirection: "row", gap: 8 },
  box: {
    width: 44,
    height: 54,
    borderRadius: 14,
    backgroundColor: C.raised,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.w10,
  },
  cur: { borderColor: C.white, borderWidth: 1.5 },
  boxErr: { borderColor: C.goldLight },
  hidden: { position: "absolute", opacity: 0.01, height: 1, width: 1, top: 0, left: 0 },
  demo: { marginTop: 16, ...t(500, 13, 16), color: C.w64 },
  or: { marginTop: 16, ...t(500, 13, 13), color: C.w64 },
  error: { marginTop: 10, textAlign: "center", ...t(500, 13, 18), color: C.goldLight, paddingHorizontal: 12 },
  resend: { marginTop: 10, ...t(600, 13, 13), color: C.w80 },
  foot: { marginTop: "auto", paddingBottom: 40 },
  wait: { height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  note: { marginTop: 14, textAlign: "center", ...t(500, 12.5, 16), color: C.w64 },
  link: { color: C.white, textDecorationLine: "underline", fontWeight: "600" },
});
