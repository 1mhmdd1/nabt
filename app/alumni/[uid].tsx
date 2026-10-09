import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { useCampus } from "../../src/live";
import { OFFER_LABEL, requestMentor, useMentor, useMentorRequests } from "../../src/live/alumni";

export default function MentorProfile() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const mentor = useMentor(String(uid || ""));
  const { outgoing } = useMentorRequests();
  const fullName = useCampus((s) => s.fullName);
  const greetingName = useCampus((s) => s.greetingName);
  const nickname = useCampus((s) => s.nickname);
  const mine = outgoing.find((row) => row.toUid === uid);
  const [message, setMessage] = useState("");
  const [held, setHeld] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <Screen>
      <BackBar title="Mentor" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" }}>
          <Text style={[t(600, 24, 26), { color: C.gold }]}>{mentor?.initial || "A"}</Text>
        </View>
        <Text style={[t(700, 26, 32), { marginTop: 12 }]}>{mentor?.fullName || "Alumni"}</Text>
        <Text style={[t(500, 14, 20), { color: C.w64, marginTop: 4 }]}>{mentor?.field}{mentor?.classYear ? ` · Class of ${mentor.classYear}` : ""}</Text>
        <Text style={[t(400, 16, 22), { color: C.w80, marginTop: 10 }]}>{mentor?.line}</Text>
        <Text style={[t(500, 13, 18), { color: C.w64, marginTop: 8 }]}>{mentor?.offers.map((offer) => OFFER_LABEL[offer]).join(" · ")}</Text>
        {mine ? (
          <View style={{ marginTop: 18 }}>
            <Text style={t(600, 16, 22)}>{mine.status === "accepted" ? "Accepted" : mine.status === "declined" ? "Declined" : "Sent"}</Text>
            <Text style={[t(400, 14, 20), { color: C.w80, marginTop: 6 }]}>{mine.message}</Text>
            {mine.chatId ? (
              <Pressable onPress={() => router.push(`/dm/${mine.chatId}` as never)} style={{ marginTop: 16, height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}>
                <Text style={[t(700, 16, 20), { color: C.burgundy }]}>Open chat</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={{ marginTop: 18 }}>
            <TextInput
              value={message}
              onChangeText={(value) => {
                setHeld(false);
                setMessage(value.slice(0, 200));
              }}
              placeholder="A short note"
              placeholderTextColor={C.w64}
              style={{ minHeight: 72, borderRadius: 16, backgroundColor: C.card, padding: 12, ...t(500, 15, 20) }}
              accessibilityLabel="Message to the mentor"
            />
            {held ? <Text style={[t(500, 13, 18), { color: C.w80, marginTop: 8 }]}>That stays on your phone.</Text> : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!mentor) return;
                void requestMentor(mentor, fullName || greetingName || nickname || "UA student", message).then((result) => {
                  if (result.held) setHeld(true);
                  else setSent(true);
                });
              }}
              style={{ marginTop: 12, height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={[t(700, 16, 20), { color: C.burgundy }]}>{sent ? "Sent" : "Send request"}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
