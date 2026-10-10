import { NavSpacer } from "../../../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { Avatar, OutlineButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { sendOutreach, useStaff } from "../../../src/live/staff";

const TEMPLATES = ["Check in", "Offer a room", "Suggest 1564"];
const EMPTY_THREAD: { id: string; from: string; text: string; initial?: string }[] = [];

export default function Outreach() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const id = caseId || "";
  const item = useStaff((s) => s.cases.find((c) => c.id === id));
  const thread = useStaff((s) => (id ? s.threads[id] : undefined)) ?? EMPTY_THREAD;
  const [text, setText] = useState("");
  const name = item?.nickname || "A student";
  return (
    <StaffFrame title={name} chip="Identity hidden" back={`/staff/safety/${id}`}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={styles.note}>
          <Svg width={13} height={13} viewBox="0 0 20 20" fill="none">
            <Path d="M10 2.2 3.6 4.6v5c0 3.9 2.7 6.9 6.4 8.2 3.7-1.3 6.4-4.3 6.4-8.2v-5L10 2.2Z" stroke="#fff" strokeWidth={1.7} />
          </Svg>
          <Text style={[t(500, 12, 16), { color: C.w80, flex: 1 }]}>
            You’re writing as Student Affairs (counselor). {name} sees a verified staff badge, not your name.
          </Text>
        </View>
        {thread.map((m) => (
          <View key={m.id} style={[styles.msg, m.from === "counselor" && styles.mine]}>
            {m.from !== "counselor" ? <Avatar letter={m.initial || "F"} size={32} /> : null}
            <View style={[styles.bub, m.from === "counselor" && styles.bubMe]}>
              <Text style={t(400, 14, 19)}>{m.text}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.fl, { marginTop: 14 }]}>Templates</Text>
        <View style={styles.cos}>
          {TEMPLATES.map((label) => (
            <Pressable key={label} style={styles.co} onPress={() =>
                setText(
                  label === "Suggest 1564"
                    ? "Embrace 1564 is there day and night if you want a person on the phone."
                    : label === "Offer a room"
                      ? `If a quiet room on campus would help, ${name}, I can book one for you. Just tell me when.`
                      : `Just checking in, ${name}. No need to reply unless you want to.`,
                )
              }>
              <Text style={t(600, 12.5, 16)}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 12 }}>
          <OutlineButton label="Suggest Embrace 1564" onPress={() => sendOutreach(id, "If it feels like too much, Embrace 1564 is Lebanon’s 24/7 lifeline. You can stay anonymous with me here.")} />
        </View>
        <NavSpacer />
      </ScrollView>
      <View style={styles.cmp}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={`Reply to ${name}…`}
          placeholderTextColor="rgba(255,255,255,0.64)"
          style={[t(500, 14, 18), { flex: 1, color: C.white }]}
          onSubmitEditing={() => {
            if (!text.trim()) return;
            void sendOutreach(id, text.trim());
            setText("");
          }}
        />
      </View>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  note: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginTop: 4 },
  msg: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "flex-end" },
  mine: { justifyContent: "flex-end" },
  bub: { maxWidth: "82%", backgroundColor: C.deep, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  bubMe: { backgroundColor: C.card },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  cos: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  co: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  cmp: { position: "absolute", left: 16, right: 16, bottom: 28, height: 48, borderRadius: 24, backgroundColor: C.card, paddingHorizontal: 16, justifyContent: "center" },
});
