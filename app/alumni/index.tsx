import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { FloatingNav } from "../../src/components/Nav";
import { C, t } from "../../src/theme";
import { OFFER_LABEL, useMentors } from "../../src/live/alumni";

export default function AlumniMentors() {
  const [open, setOpen] = useState(false);
  const mentors = useMentors();
  return (
    <Screen>
      <BackBar title="Alumni mentors" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 120 }}>
        <Text style={[t(500, 14, 20), { color: C.w64 }]}>A short chat, a CV, or advice. Real names.</Text>
        {mentors.length === 0 ? (
          <View style={{ marginTop: 12, backgroundColor: C.card, borderRadius: 18, padding: 16 }}>
            <Text style={t(600, 15, 20)}>No mentors yet.</Text>
            <Text style={[t(400, 13.5, 19), { color: C.w64, marginTop: 4 }]}>
              Graduates who confirm their record and open a mentoring offer appear here.
            </Text>
          </View>
        ) : null}
        <View style={{ marginTop: 12, backgroundColor: C.card, borderRadius: 18, overflow: "hidden" }}>
          {mentors.map((mentor, index) => (
            <Pressable
              key={mentor.id}
              onPress={() => router.push(`/alumni/${mentor.id}` as never)}
              style={{ paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.08)", flexDirection: "row", gap: 12 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" }}>
                <Text style={[t(600, 16, 18), { color: C.gold }]}>{mentor.initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 16, 20)}>{mentor.fullName}</Text>
                <Text style={[t(500, 13, 18), { color: C.w64, marginTop: 2 }]}>{mentor.field} · Class of {mentor.classYear}</Text>
                <Text style={[t(400, 14, 20), { color: C.w80, marginTop: 4 }]}>{mentor.line}</Text>
                <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{mentor.offers.map((offer) => OFFER_LABEL[offer]).join(" · ")}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <FloatingNav active="discover" open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}
