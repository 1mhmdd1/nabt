import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { useCampus } from "../../src/live";
import { OFFER_LABEL, saveMentorProfile, type MentorOffer } from "../../src/live/alumni";

const OFFERS: MentorOffer[] = ["chat", "cv", "advice"];

export default function OfferMentoring() {
  const campus = useCampus();
  const [field, setField] = useState("Engineering");
  const [line, setLine] = useState("");
  const [offers, setOffers] = useState<MentorOffer[]>(["chat"]);
  const [saved, setSaved] = useState(false);
  const toggle = (offer: MentorOffer) => {
    setOffers((cur) => (cur.includes(offer) ? cur.filter((item) => item !== offer) : [...cur, offer].slice(0, 3)));
  };
  return (
    <Screen>
      <BackBar title="Offer mentoring" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}>
        {campus.alumni ? (
          <Text style={[t(500, 14, 20), { color: C.w64 }]}>Students will see your name.</Text>
        ) : (
          <Text style={[t(500, 14, 20), { color: C.w80 }]}>Student Affairs confirms graduation before you can offer mentoring.</Text>
        )}
        <TextInput value={field} onChangeText={(value) => setField(value.slice(0, 40))} style={input} accessibilityLabel="Field" />
        <TextInput value={line} onChangeText={(value) => setLine(value.slice(0, 140))} placeholder="A short line" placeholderTextColor={C.w64} style={[input, { marginTop: 8 }]} accessibilityLabel="Short line" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {OFFERS.map((offer) => {
            const on = offers.includes(offer);
            return (
              <Pressable key={offer} onPress={() => toggle(offer)} style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: on ? C.white : "transparent", borderWidth: 1, borderColor: on ? C.white : "rgba(255,255,255,0.4)", justifyContent: "center" }}>
                <Text style={[t(600, 13, 16), { color: on ? C.burgundy : C.white }]}>{OFFER_LABEL[offer]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!campus.alumni}
          onPress={() => {
            if (!campus.alumni || !offers.length) return;
            void saveMentorProfile({
              fullName: campus.fullName || campus.greetingName || "Alumni",
              field,
              line,
              offers,
              initial: campus.initial || "A",
              classYear: campus.classYear || 2024,
            }).then(() => setSaved(true));
          }}
          style={{ marginTop: 18, height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", opacity: campus.alumni ? 1 : 0.45 }}
        >
          <Text style={[t(700, 16, 20), { color: C.burgundy }]}>{saved ? "Saved" : "Save"}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const input = { height: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 12, marginTop: 12, ...t(500, 15, 20) };
