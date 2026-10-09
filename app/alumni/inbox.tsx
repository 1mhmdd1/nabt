import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { answerMentorRequest, useMentorRequests } from "../../src/live/alumni";

export default function MentorInbox() {
  const { incoming } = useMentorRequests();
  return (
    <Screen>
      <BackBar title="Mentor requests" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
        {incoming.length === 0 ? <Text style={[t(500, 15, 22), { color: C.w80 }]}>No requests yet.</Text> : null}
        {incoming.map((row) => (
          <View key={row.id} style={{ marginTop: 10, backgroundColor: C.card, borderRadius: 18, padding: 14 }}>
            <Text style={t(600, 16, 20)}>{row.fromName}</Text>
            <Text style={[t(400, 14, 20), { color: C.w80, marginTop: 6 }]}>{row.message}</Text>
            {row.status === "pending" ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Accept ${row.fromName}`} onPress={() => void answerMentorRequest(row.id, "accepted").then((chatId) => chatId && router.push(`/dm/${chatId}` as never))} style={{ flex: 1, height: 40, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}>
                  <Text style={[t(700, 14, 16), { color: C.burgundy }]}>Accept</Text>
                </Pressable>
                <Pressable onPress={() => void answerMentorRequest(row.id, "declined")} style={{ flex: 1, height: 40, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", alignItems: "center", justifyContent: "center" }}>
                  <Text style={t(600, 14, 16)}>Decline</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[t(500, 13, 18), { color: C.w64, marginTop: 8 }]}>{row.status === "accepted" ? "Accepted" : "Declined"}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
