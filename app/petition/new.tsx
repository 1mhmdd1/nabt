import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { createPetition } from "../../src/live/communities";

export default function NewPetition() {
  const [title, setTitle] = useState("");
  const [line, setLine] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <BackBar title="Start a petition" />
      <View style={{ paddingHorizontal: 20, gap: 10 }}>
        <TextInput value={title} onChangeText={setTitle} placeholder="What should change?" placeholderTextColor={C.w64} accessibilityLabel="Petition title" style={field} />
        <TextInput value={line} onChangeText={setLine} placeholder="One line, in your words" placeholderTextColor={C.w64} accessibilityLabel="Petition line" style={field} />
        {note ? <Text>{note}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send petition"
          disabled={busy}
          onPress={() => {
            setBusy(true);
            void createPetition({ title, line })
              .then(() => {
                setNote("Sent to Student Affairs.");
                setTimeout(() => router.back(), 500);
              })
              .catch((err: unknown) => {
                setNote(err instanceof Error ? err.message : "Could not send.");
                setBusy(false);
              });
          }}
          style={btn}
        >
          <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Send to Student Affairs</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const field = { minHeight: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 14, color: C.white };
const btn = { height: 48, borderRadius: 999, backgroundColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const };
