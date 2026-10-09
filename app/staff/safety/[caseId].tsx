import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { Avatar, Chip, GoldButton, OutlineButton, Sev, Sheet, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { advanceCase, fileReveal, useStaff } from "../../../src/live/staff";

const REASONS = [
  { id: "danger_to_self", label: "Immediate danger to self" },
  { id: "danger_to_others", label: "Danger to others" },
  { id: "legal_requirement", label: "Legal requirement" },
  { id: "other", label: "Other" },
];

export default function CaseDetail() {
  const { caseId, reveal } = useLocalSearchParams<{ caseId: string; reveal?: string }>();
  const item = useStaff((s) => s.cases.find((c) => c.id === caseId));
  const revealName = useStaff((s) => s.revealName);
  const notice = useStaff((s) => s.notice);
  const [open, setOpen] = useState(reveal === "1");
  const [reason, setReason] = useState("danger_to_self");
  const [note, setNote] = useState("No reply to outreach or share request for 2 h; message mentions not sleeping and giving up.");
  const [confirm, setConfirm] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!item) {
    return (
      <StaffFrame title="Case" back="/staff/safety">
        <Text style={[t(500, 15), { color: C.white, padding: 20 }]}>Opening the case…</Text>
      </StaffFrame>
    );
  }
  const step = item.ladderStep || 2;
  async function onReveal() {
    if (!confirm || note.trim().length < 30) {
      setErr("A serious reason and a note of at least 30 characters are required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await fileReveal(item!.id, reason, note.trim());
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not log the reveal.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <StaffFrame title="Case" chip={item.stepLabel || `Step ${step} of 4`} back="/staff/safety" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={styles.who}>
          <Avatar letter={item.initial || "F"} size={44} />
          <View>
            <Text style={t(700, 19, 22)}>{item.nickname}</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              <Sev level={item.severity || "high"} />
              <Chip label={item.context || item.where} />
            </View>
          </View>
        </View>
        <View accessibilityLabel="Escalation ladder" style={styles.lad}>
          {(item.ladder || []).map((row) => {
            const now = row.state === "now";
            const done = row.state === "done";
            return (
              <View key={row.n} style={[styles.ladCard, now && styles.ladNow]}>
                <View style={[styles.n, done && styles.nDone, now && styles.nNow]}>
                  <Text style={[t(700, 10.5, 12), { color: C.white }]}>{done ? "✓" : row.n}</Text>
                </View>
                <Text style={[styles.ladTitle, { color: now ? C.burgundy : C.white }]}>{row.title}</Text>
                <Text style={[styles.ladSub, { color: now ? "rgba(65,21,21,0.7)" : C.w64 }]}>{row.sub}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.fl, { marginTop: 12 }]}>Shared by the student · {item.time}</Text>
        <View style={styles.quote}>
          <Text style={t(400, 13.5, 19)}>{item.fullExcerpt || item.excerpt}</Text>
          <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 6 }]}>{item.shareNote}</Text>
        </View>
        {revealName ? <Text style={[t(600, 14, 18), { marginTop: 10 }]}>Identity: {revealName}</Text> : null}
        {notice ? <Text style={[t(500, 12, 16), { color: C.w80, marginTop: 8 }]}>{notice}</Text> : null}
        <View style={{ marginTop: 12 }}>
          <GoldButton label="Reach out anonymously" onPress={() => router.push(`/staff/safety/outreach?caseId=${item.id}` as never)} />
        </View>
        <Text style={[t(500, 11.5, 15), { color: C.w64, textAlign: "center", marginTop: 6 }]}>
          Messages {item.nickname} as “Student Affairs (counselor)”
        </Text>
        <View style={styles.row}>
          <OutlineButton compact label="Send extra support" onPress={() => advanceCase(item.id, 1)} />
          <OutlineButton compact label="Ask to share identity" onPress={() => advanceCase(item.id, 3)} />
        </View>
        <View style={styles.row}>
          <OutlineButton compact label="Assign" />
          <OutlineButton compact label="Resolve" onPress={() => advanceCase(item.id, 5)} />
        </View>
        <Pressable style={styles.lr} onPress={() => setOpen(true)}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Rect x="5" y="10.5" width="14" height="9.5" rx="2.5" stroke="#fff" strokeWidth={1.6} />
            <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="#fff" strokeWidth={1.6} />
          </Svg>
          <Text style={[t(600, 12.5, 16), { color: C.w64, textDecorationLine: "underline" }]}>Last resort: reveal identity</Text>
        </Pressable>
      </ScrollView>
      {open ? (
        <Sheet title="Last resort: reveal identity">
          <Text style={[t(400, 13, 18), { color: C.w80, marginTop: 6 }]}>
            Only after support, anonymous outreach and a share request. You’ll see the real name and ID.
          </Text>
          <Text style={[styles.fl, { marginTop: 12 }]}>Serious reason · required</Text>
          <Animated.View entering={FadeIn.duration(240)}>
            {REASONS.map((r) => (
              <Pressable key={r.id} style={styles.ro} onPress={() => setReason(r.id)}>
                <View style={[styles.rd, reason === r.id && styles.rdOn]} />
                <Text style={t(600, 14, 18)}>{r.label}</Text>
              </Pressable>
            ))}
          </Animated.View>
          <Text style={[styles.fl, { marginTop: 12 }]}>Note · required, min 30 characters</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            style={styles.note}
          />
          <Text style={[t(500, 11, 14), { color: note.trim().length >= 30 ? C.w64 : C.w80, textAlign: "right" }]}>
            {note.trim().length} / 30 min {note.trim().length >= 30 ? "✓" : ""}
          </Text>
          <Pressable style={styles.cb} onPress={() => setConfirm((v) => !v)}>
            <View style={[styles.box, confirm && styles.boxOn]}>
              <Text style={[t(700, 12, 14), { color: confirm ? C.burgundy : C.white }]}>{confirm ? "✓" : ""}</Text>
            </View>
            <Text style={[t(500, 13, 18), { flex: 1 }]}>I understand this is logged and the student will see it.</Text>
          </Pressable>
          {err ? <Text style={[t(500, 12, 16), { color: C.white, marginTop: 8 }]}>{err}</Text> : null}
          <View style={{ marginTop: 12 }}>
            <GoldButton label={busy ? "Logging…" : "Reveal"} onPress={onReveal} />
          </View>
          <Pressable onPress={() => setOpen(false)} style={{ marginTop: 8, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Text style={t(600, 14, 16)}>Cancel</Text>
          </Pressable>
        </Sheet>
      ) : null}
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 2 },
  lad: { marginTop: 14, flexDirection: "row", gap: 6 },
  ladCard: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  ladTitle: { ...t(600, 10, 13), ...({ wordBreak: "normal", overflowWrap: "normal" } as object) },
  ladSub: { ...t(500, 9, 12), marginTop: 3, ...({ wordBreak: "normal", overflowWrap: "normal" } as object) },
  ladNow: { backgroundColor: C.white, borderColor: "transparent" },
  n: { width: 20, height: 20, borderRadius: 10, marginBottom: 6, borderWidth: 1.2, borderColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center" },
  nDone: { backgroundColor: "rgba(255,255,255,0.25)", borderWidth: 0 },
  nNow: { backgroundColor: C.burgundy, borderWidth: 0 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  quote: { marginTop: 6, backgroundColor: C.deep, borderRadius: 18, padding: 12 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  lr: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  ro: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  rd: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)" },
  rdOn: { backgroundColor: C.white, borderColor: C.white },
  note: { marginTop: 6, minHeight: 72, borderRadius: 14, backgroundColor: C.ground, padding: 12, color: C.white, ...t(500, 14, 18) },
  cb: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 10 },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: C.white, alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: C.white },
});
