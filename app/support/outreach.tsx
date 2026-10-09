import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Outline, Top, useScreen, WhiteBtn } from "../../src/components/voice/Kit";
import { replyToCounselor } from "../../src/live/voiceSafety";
import { C, t } from "../../src/theme";
import { ScrollBody } from "../../src/components/ScrollBody";

type Copy = {
  title: string;
  chip: string;
  note: string;
  day: string;
  who: string;
  messages: string[];
  ask: string;
  askBody: string;
  share: string;
  skip: string;
  reply: string;
};

export default function Outreach() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("outreach");
  const [text, setText] = useState("");
  if (!copy) return null;
  return (
    <Screen bg={C.ground}>
      <Top
        title={copy.title}
        right={
          <View style={styles.chip}>
            <Text style={t(600, 11, 14)}>{copy.chip}</Text>
          </View>
        }
      />
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={styles.note}>
          <Text style={styles.noteText}>{copy.note}</Text>
        </View>
        <Text style={styles.day}>{copy.day}</Text>
        {copy.messages.map((m, i) => (
          <View key={m} style={styles.msg}>
            <View style={styles.av}>
              <Text style={[t(600, 12, 14), { color: C.gold }]}>SA</Text>
            </View>
            <View style={{ flex: 1 }}>
              {i === 0 ? <Text style={styles.who}>{copy.who}</Text> : null}
              <View style={styles.bub}>
                <Text style={t(400, 14.5, 20)}>{m}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={styles.req}>
          <Text style={t(600, 14.5, 20)}>{copy.ask}</Text>
          <Text style={styles.ask}>{copy.askBody}</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <WhiteBtn label={copy.share} onPress={() => router.push("/support/identity" as never)} />
            </View>
            <View style={{ flex: 1 }}>
              <Outline label={copy.skip} onPress={() => router.push("/support/declined" as never)} />
            </View>
          </View>
        </View>
      </ScrollBody>
      <View style={styles.cmp}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={copy.reply}
          placeholderTextColor={C.w64}
          style={styles.input}
          accessibilityLabel={copy.reply}
          onSubmitEditing={() => {
            if (text.trim()) void replyToCounselor(text.trim());
            setText("");
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  note: { marginTop: 8, padding: 12, borderRadius: 14, backgroundColor: C.card },
  noteText: { ...t(500, 13, 18), color: "rgba(255,255,255,0.8)" },
  day: { marginTop: 16, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
  msg: { marginTop: 12, flexDirection: "row", gap: 8 },
  av: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  who: { ...t(600, 12, 16), color: C.w64, marginBottom: 4 },
  bub: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: C.card },
  req: { marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: C.card },
  ask: { marginTop: 4, ...t(400, 12.5, 18), color: "rgba(255,255,255,0.75)" },
  row: { marginTop: 12, flexDirection: "row", gap: 8 },
  cmp: { marginTop: "auto", paddingHorizontal: 16, paddingBottom: 28 },
  input: { height: 48, borderRadius: 24, backgroundColor: C.card, paddingHorizontal: 16, ...t(500, 14, 18), color: C.white },
});
