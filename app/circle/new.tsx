import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { createCircle } from "../../src/live/communities";

export default function NewCircle() {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"support" | "community">("community");
  const [approval, setApproval] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setNote("");
    try {
      const created = await createCircle({ name, kind, joinApproval: kind === "community" && approval });
      const href = kind === "community" ? `/c/${created.id}?joined=1` : `/circle/${created.id}/chat?joined=1`;
      router.replace(href as never);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not start that Circle.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackBar title="Start a Circle" />
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        <TextInput value={name} onChangeText={setName} placeholder="Circle name" placeholderTextColor={C.w64} accessibilityLabel="Circle name" style={field} />
        <Pressable accessibilityRole="button" accessibilityLabel="Community" onPress={() => setKind("community")} style={[choice, kind === "community" && on]}>
          <Text style={{ color: kind === "community" ? C.burgundy : C.white }}>Community</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Circle" onPress={() => setKind("support")} style={[choice, kind === "support" && on]}>
          <Text style={{ color: kind === "support" ? C.burgundy : C.white }}>Circle</Text>
        </Pressable>
        {kind === "community" ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Require approval" onPress={() => setApproval((v) => !v)} style={choice}>
            <Text>{approval ? "Join requests need the Chair" : "Anyone approved can join"}</Text>
          </Pressable>
        ) : null}
        {note ? <Text>{note}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Create Circle" disabled={busy || name.trim().length < 2} onPress={() => void create()} style={btn}>
          <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{busy ? "Creating…" : "Create"}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const field = { height: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 14, color: C.white };
const choice = { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", paddingHorizontal: 14, justifyContent: "center" as const };
const on = { backgroundColor: C.white, borderColor: C.white };
const btn = { height: 48, borderRadius: 999, backgroundColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const };
