import { NavSpacer } from "../../../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { GoldButton, Seg, Sheet, SmallButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { declinePetition, publishPetition, respondPetition, useStaff } from "../../../src/live/staff";

export default function Petitions() {
  const { respond } = useLocalSearchParams<{ respond?: string }>();
  const petitions = useStaff((s) => s.petitions);
  const accounts = useStaff((s) => s.accounts);
  const meetups = useStaff((s) => s.meetups);
  const goal = (respond ? petitions.find((p) => p.id === respond) : undefined) || petitions.find((p) => p.bucket === "goal");
  const [open, setOpen] = useState(Boolean(respond));
  const [status, setStatus] = useState("Approved");
  const [response, setResponse] = useState(goal?.response || "");
  const pending = petitions.filter((p) => p.bucket === "pending" && p.status === "pending");
  return (
    <StaffFrame title="Reviews" tab="reviews" goldQuiet>
      <Seg
        items={[
          { label: "Accounts", count: accounts.length, href: "/staff/reviews" },
          { label: "Petitions", count: petitions.length, on: true, href: "/staff/reviews/petitions" },
          { label: "Meetups", count: meetups.filter((m) => m.status === "proposed").length, href: "/staff/reviews/meetups" },
        ]}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Text style={styles.fl}>Pending go-live · {pending.length}</Text>
        {pending.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64 }]}>No petitions waiting.</Text> : null}
        {pending.map((p) => (
          <View key={p.id} style={styles.case}>
            <Text style={t(600, 14.5, 18)}>{p.title}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>by {p.by} · {p.topic} · goal {p.goal}</Text>
            <View style={styles.row}>
              <SmallButton label="Publish" on onPress={() => publishPetition(p.id)} />
              <SmallButton label="Decline" onPress={() => declinePetition(p.id)} />
            </View>
          </View>
        ))}
        <Text style={[styles.fl, { marginTop: 14 }]}>Open · {petitions.filter((p) => p.status === "published").length}</Text>
        {petitions.filter((p) => p.status === "published").map((p) => (
          <View key={p.id} style={styles.case}>
            <Text style={t(600, 14.5, 18)}>{p.title}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{p.signCount} signatures</Text>
          </View>
        ))}
        <Text style={[styles.fl, { marginTop: 14 }]}>At goal · awaiting response · {petitions.filter((p) => p.bucket === "goal").length}</Text>
        {petitions.filter((p) => p.bucket === "goal").map((p) => (
          <Pressable key={p.id} style={[styles.case, styles.sel]} onPress={() => { setResponse(p.response || ""); setOpen(true); }}>
            <Text style={t(600, 14.5, 18)}>{p.title}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>by {p.by} · {p.signCount} / {p.goal} signatures</Text>
            <View style={styles.prog}><View style={[styles.bar, { width: "100%" }]} /></View>
          </Pressable>
        ))}
        <NavSpacer />
      </ScrollView>
      {open && goal ? (
        <Sheet title={`Respond: ${goal.short || "Library hours"}`}>
          <Text style={[styles.fl, { marginTop: 12 }]}>Status</Text>
          <View style={[styles.row, { marginTop: 6 }]}>
            {["Approved", "In progress", "Not possible"].map((s) => (
              <SmallButton key={s} label={s} on={status === s} onPress={() => setStatus(s)} />
            ))}
          </View>
          <Text style={[styles.fl, { marginTop: 12 }]}>Response</Text>
          <TextInput multiline value={response} onChangeText={setResponse} style={styles.in} />
          <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 8 }]}>Posted as Student Affairs · verified. Signers get notified.</Text>
          <View style={{ marginTop: 12 }}>
            <GoldButton
              label="Send response"
              onPress={() => {
                const mapped = status === "Not possible" ? "closed" : status === "In progress" ? "answered" : "answered";
                void respondPetition(goal.id, mapped, response);
                setOpen(false);
              }}
            />
          </View>
        </Sheet>
      ) : null}
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 8, marginBottom: 8 },
  case: { backgroundColor: C.card, borderRadius: 18, padding: 13, marginBottom: 8 },
  sel: { borderWidth: 1.5, borderColor: C.white },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  prog: { marginTop: 8, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  bar: { height: "100%", backgroundColor: C.white },
  in: { marginTop: 6, minHeight: 72, borderRadius: 14, backgroundColor: C.ground, color: C.white, padding: 12, ...t(500, 14, 18) },
});
