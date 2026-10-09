import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, LockLine, Outline, Top, useScreen } from "../../src/components/voice/Kit";
import { replyToCounselor, useVoiceSafety } from "../../src/live/voiceSafety";
import { C, t } from "../../src/theme";
import { ScrollBody } from "../../src/components/ScrollBody";

type Copy = { title: string; sub: string; chip: string; sawLabel: string; saw: string; reply: string; skip: string; foot: string };

export default function CareMessage() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("careMessage");
  const note = useVoiceSafety((s) => s.careNote);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  if (!copy || !note) return null;
  return (
    <Screen bg={C.ground}>
      <Top title={copy.title} />
      <Text style={styles.sub}>{copy.sub}</Text>
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <View style={styles.chipWrap}>
          <View style={styles.chip}>
            <Text style={[t(600, 12, 16), { color: C.burgundy }]}>{copy.chip}</Text>
          </View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.ey}>{note.eyebrow}</Text>
          <Text style={styles.lead}>{note.text}</Text>
          <Text style={styles.quote}>“{note.quote}”</Text>
          <Text style={styles.time}>{note.timeLabel}</Text>
        </View>
        <View style={styles.panel}>
          <Text style={styles.ey}>{copy.sawLabel}</Text>
          <Text style={styles.saw}>{copy.saw}</Text>
        </View>
        {open ? (
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Reply as your nickname"
            placeholderTextColor={C.w64}
            style={styles.input}
            accessibilityLabel="Reply to the counselor"
          />
        ) : null}
        <View style={{ marginTop: 18 }}>
          <Gold
            label={copy.reply}
            onPress={() => {
              if (!open) {
                setOpen(true);
                return;
              }
              if (text.trim()) void replyToCounselor(text.trim()).catch(() => undefined);
              setText("");
              setOpen(false);
            }}
          />
        </View>
        <View style={{ marginTop: 8 }}>
          <Outline label={copy.skip} onPress={() => router.back()} />
        </View>
        <LockLine>{copy.foot}</LockLine>
      </ScrollBody>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginLeft: 56, marginTop: -6, ...t(500, 11.5, 16), color: C.w64 },
  chipWrap: { alignItems: "center", marginTop: 8 },
  chip: { height: 28, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  panel: { marginTop: 16, padding: 20, borderRadius: 18, backgroundColor: C.card },
  ey: { ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  lead: { marginTop: 10, ...t(500, 16, 24), color: C.white },
  quote: { marginTop: 10, ...t(400, 14, 22), color: "rgba(255,255,255,0.8)" },
  time: { marginTop: 12, ...t(500, 11.5, 16), color: C.w64 },
  saw: { marginTop: 8, ...t(500, 13, 20), color: "rgba(255,255,255,0.85)" },
  input: { marginTop: 12, minHeight: 48, borderRadius: 16, backgroundColor: C.card, paddingHorizontal: 14, ...t(500, 15, 20), color: C.white },
});
