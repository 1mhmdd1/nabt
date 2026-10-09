import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { getFirebase } from "../../src/firebase";
import { me, useCampus } from "../../src/live";
import { reviewOutgoing } from "../../src/moderation/outgoing";

const REASONS = [
  { id: "stress", label: "Stress or exams" },
  { id: "down", label: "Feeling down" },
  { id: "happened", label: "Something happened" },
  { id: "talk", label: "Just want to talk" },
] as const;

export default function SupportRequest() {
  const campus = useCampus();
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"] | "">("");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState<"anonymous" | "name">("anonymous");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const shownName = contact === "name" ? campus.fullName || campus.nickname : "";

  async function send() {
    if (!reason) return;
    const review = reviewOutgoing(note || "hello", "circle", "support-local");
    if (note && review.action === "block") {
      setError(review.reason);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { db } = getFirebase();
      await addDoc(collection(db, "supportRequests"), {
        uid: me(),
        reason: REASONS.find((item) => item.id === reason)?.label || reason,
        note: note.slice(0, 200),
        contact,
        nickname: campus.nickname || campus.greetingName || "A student",
        shownName,
        status: "open",
        at: serverTimestamp(),
      });
      setError("");
      router.replace("/home" as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackBar title="I'd like support" />
      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <Text style={t(500, 14, 20)}>This is a request, not a chat message. Student Affairs sees only what is on this card.</Text>
        {REASONS.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => setReason(item.id)} style={[row, reason === item.id && on]}>
            <Text style={{ color: reason === item.id ? C.burgundy : C.white }}>{item.label}</Text>
          </Pressable>
        ))}
        <TextInput value={note} onChangeText={(v) => { setError(""); setNote(v.slice(0, 200)); }} placeholder="Optional note, 200 characters" placeholderTextColor={C.w64} accessibilityLabel="Support note" style={field} />
        <Pressable accessibilityLabel="Anonymous chat" onPress={() => setContact("anonymous")} style={row}><Text>{contact === "anonymous" ? "● " : ""}Anonymous chat by nickname</Text></Pressable>
        <Pressable accessibilityLabel="Show my name" onPress={() => setContact("name")} style={row}><Text>{contact === "name" ? "● " : ""}Show my name</Text></Pressable>
        <Pressable accessibilityLabel="Preview request" onPress={() => setPreview(true)} style={row}><Text>Preview what Student Affairs sees</Text></Pressable>
        {preview ? (
          <View accessibilityLabel="Support preview">
            <Text>Reason: {REASONS.find((item) => item.id === reason)?.label || "—"}</Text>
            <Text>Note: {note || "—"}</Text>
            <Text>Reach me: {contact === "name" ? shownName || "my name" : campus.nickname || "nickname"}</Text>
          </View>
        ) : null}
        {error ? <Text>{error}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Send support request" disabled={!reason || busy} onPress={() => void send()} style={btn}>
          <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{busy ? "Sending…" : "Send"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const row = { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", paddingHorizontal: 12, justifyContent: "center" as const };
const on = { backgroundColor: C.white, borderColor: C.white };
const field = { minHeight: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 14, color: C.white };
const btn = { height: 48, borderRadius: 999, backgroundColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const, marginTop: 8 };
