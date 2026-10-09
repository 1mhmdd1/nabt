import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SignupScreen } from "../../src/components/Signup";
import { IconCheck, IconLock, IconPen } from "../../src/components/Icons";
import { GoldButton } from "../../src/components/Chrome";
import { C, t } from "../../src/theme";
import { emailFor, fieldEdited, useSignup } from "../../src/signup";
import { idYear, isUaId } from "../../src/local/ids";
import { FnError, requestCode } from "../../src/auth";

export default function Details() {
  const fullName = useSignup((s) => s.fullName);
  const studentId = useSignup((s) => s.studentId);
  const faculty = useSignup((s) => s.faculty);
  const scanned = useSignup((s) => s.scanned);
  const reading = useSignup((s) => s.reading);
  const setFullName = useSignup((s) => s.setFullName);
  const setStudentId = useSignup((s) => s.setStudentId);
  const failed = reading === "failed";
  const manual = reading === "manual";
  // When nothing could be read, open the name field for typing straight away.
  const [edit, setEdit] = useState<"name" | "id" | null>((failed || manual) && !fullName ? "name" : null);

  const nameOk = fullName.trim().length >= 3;
  const idOk = isUaId(studentId);
  const joined = idYear(studentId);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function next() {
    if (sending || !(nameOk && idOk)) return;
    setSending(true);
    setSendError(null);
    try {
      await requestCode("signup");
      router.push("/signup/email" as never);
    } catch (err) {
      setSendError(
        err instanceof FnError && err.status === 0
          ? "Can’t reach the campus server. Is npm run demo running?"
          : err instanceof Error
            ? err.message
            : "Could not send a code.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SignupScreen step="2 of 5" onBack={() => router.replace("/signup/scan" as never)}>
      <Text style={styles.h1}>Check your details</Text>
      <Text style={styles.lead}>
        {failed
          ? "We couldn’t read your card. Type your name and ID number as printed on it."
          : manual
            ? "Type your name and ID number as printed on your card."
            : "Read from your card. Fix anything that’s off."}
      </Text>
      <View style={{ marginTop: 22, gap: 10 }}>
        <Field
          k="Full name"
          value={fullName}
          placeholder="Your name as printed on the card"
          scanned={scanned.fullName}
          editing={edit === "name"}
          onEdit={() => setEdit(edit === "name" ? null : "name")}
          onDone={() => setEdit(null)}
          onChange={setFullName}
        />
        <Field
          k="ID number"
          value={studentId}
          placeholder="9 digits"
          numeric
          scanned={scanned.studentId}
          editing={edit === "id"}
          onEdit={() => setEdit(edit === "id" ? null : "id")}
          onDone={() => setEdit(null)}
          onChange={setStudentId}
          error={studentId && !idOk ? "Use a year from 2019 through this year, then 5 digits." : undefined}
        />
        <View style={styles.field}>
          <View style={{ flex: 1 }}>
            <Text style={styles.k}>Role</Text>
            <Text style={styles.v}>Student</Text>
            <Text style={styles.hint}>{faculty ? `${faculty} · ` : ""}{joined ? `Joined ${joined}. ` : ""}Only Student Affairs can change your role.</Text>
          </View>
          <IconLock size={16} color={C.w64} />
        </View>
        <View style={styles.field}>
          <View style={{ flex: 1 }}>
            <Text style={styles.k}>UA email</Text>
            <Text style={[styles.v, !idOk && { color: C.w64 }]}>{idOk ? emailFor(studentId) : "Follows your ID number"}</Text>
          </View>
          <IconLock size={16} color={C.w64} />
        </View>
      </View>
      <View style={styles.foot}>
        <View style={{ opacity: nameOk && idOk && !sending ? 1 : 0.45 }}>
          <GoldButton label={sending ? "Sending your code…" : "Looks right"} onPress={() => void next()} />
        </View>
        {sendError ? <Text style={[styles.need, { color: C.goldLight }]}>{sendError}</Text> : null}
        {!(nameOk && idOk) ? <Text style={styles.need}>Add your full name and a UA ID (year 2019 through this year, then 5 digits).</Text> : null}
      </View>
    </SignupScreen>
  );
}

function Field({
  k,
  value,
  placeholder,
  scanned,
  editing,
  numeric,
  error,
  onEdit,
  onDone,
  onChange,
}: {
  k: string;
  value: string;
  placeholder: string;
  scanned: string;
  editing: boolean;
  numeric?: boolean;
  error?: string;
  onEdit: () => void;
  onDone: () => void;
  onChange: (v: string) => void;
}) {
  const input = useRef<TextInput>(null);
  useEffect(() => {
    if (editing) {
      const id = setTimeout(() => input.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [editing]);
  const edited = Boolean(scanned) && fieldEdited(value, scanned);
  const typed = !scanned && value.trim().length > 0;
  return (
    <View style={[styles.field, editing && styles.fieldOn]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.k}>{k}</Text>
        {editing ? (
          <TextInput
            ref={input}
            value={value}
            onChangeText={onChange}
            onBlur={onDone}
            onSubmitEditing={onDone}
            returnKeyType="done"
            keyboardType={numeric ? "number-pad" : "default"}
            autoCapitalize={numeric ? "none" : "words"}
            autoCorrect={false}
            maxLength={numeric ? 9 : 60}
            placeholder={placeholder}
            placeholderTextColor={C.w40}
            style={styles.input}
            accessibilityLabel={k}
          />
        ) : (
          <Pressable onPress={onEdit} accessibilityLabel={`Edit ${k}`}>
            <Text style={[styles.v, !value && { color: C.w40 }]}>{value || placeholder}</Text>
          </Pressable>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!error && edited ? <Text style={styles.edited}>Edited, a reviewer will see this</Text> : null}
        {!error && !edited && typed ? <Text style={styles.hint}>Typed by you. A reviewer will check it.</Text> : null}
      </View>
      <Pressable accessibilityLabel={editing ? `Done editing ${k}` : `Edit ${k}`} onPress={editing ? onDone : onEdit} style={[styles.pen, editing && styles.penOn]}>
        {editing ? <IconCheck size={14} color={C.burgundy} /> : <IconPen />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...t(600, 26, 31), color: C.white, letterSpacing: -0.26 },
  lead: { marginTop: 8, ...t(400, 15, 22), color: C.w80 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 18,
    backgroundColor: C.raised,
    borderWidth: 1,
    borderColor: "transparent",
  },
  fieldOn: { borderColor: C.w40 },
  k: { ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  v: { marginTop: 5, ...t(600, 16, 21), color: C.white },
  input: { marginTop: 4, ...t(600, 16, 21), color: C.white, padding: 0, minHeight: 24 },
  hint: { marginTop: 4, ...t(500, 12, 16), color: C.w64 },
  edited: { marginTop: 6, ...t(500, 12, 14), color: C.white },
  error: { marginTop: 6, ...t(500, 12, 14), color: C.goldLight },
  pen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.w16,
  },
  penOn: { backgroundColor: C.white, borderColor: C.white },
  foot: { marginTop: "auto", paddingBottom: 40 },
  need: { marginTop: 12, textAlign: "center", ...t(500, 12.5, 16), color: C.w64 },
});
