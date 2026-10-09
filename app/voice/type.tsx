import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, LockLine, Top } from "../../src/components/voice/Kit";
import { analyseCheckIn } from "../../src/voice/session";
import { C, t } from "../../src/theme";
import { ScrollBody } from "../../src/components/ScrollBody";

/** Typing counts the same as voice. The words stay on the phone except a safety signal. */
export default function TypeInstead() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const [text, setText] = useState("");
  return (
    <Screen bg={C.ground}>
      <Top title="Type instead" />
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 }}>
        <Text style={styles.q}>How does right now feel, in your own words?</Text>
        <Text style={styles.note}>Voice results can misread different ways of speaking. Typing counts the same.</Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="A sentence or two"
          placeholderTextColor={C.w64}
          style={styles.input}
          multiline
          accessibilityLabel="Type how you feel"
        />
        <Gold
          label="Save"
          onPress={() => {
            void analyseCheckIn({ kind: "check-in", pcm: null, durationMs: 0, transcript: text }).then((band) => {
              router.replace((band === "very_low" ? "/voice/support" : "/voice/result") as never);
            });
          }}
        />
        <LockLine>Analysed on your phone. Nothing is uploaded except a safety signal when one is needed.</LockLine>
      </ScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  q: { ...t(600, 22, 28), color: C.white },
  note: { marginTop: 8, ...t(500, 13, 18), color: C.w64 },
  input: { marginTop: 16, marginBottom: 16, minHeight: 96, borderRadius: 16, backgroundColor: C.card, padding: 14, ...t(500, 15, 22), color: C.white, textAlignVertical: "top" },
});
