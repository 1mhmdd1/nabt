import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebase } from "../../../../src/firebase";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SvgXml } from "react-native-svg";
import { GoldButton, StaffFrame } from "../../../../src/components/staff/StaffChrome";
import { hallPlanSvg } from "../../../../src/art/hallPlanSvg";
import { C, t } from "../../../../src/theme";
import { bookSpace, useStaff } from "../../../../src/live/staff";

export default function Room() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const space = useStaff((s) => s.spaces.find((x) => x.id === id) || s.spaces.find((x) => x.id === "hall-b"));
  const [booked, setBooked] = useState(false);
  const roomId = space?.id || String(id || "");
  useEffect(() => {
    if (!roomId) return;
    return onSnapshot(doc(getFirebase().db, "staffBookings", `${roomId}-1300`), (snap) => setBooked(snap.exists()));
  }, [roomId]);
  if (!space) {
    return (
      <StaffFrame title="Hall" back="/staff/events/spaces">
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening the room…</Text>
      </StaffFrame>
    );
  }
  return (
    <StaffFrame title={space.name} chip={space.state === "free" ? "Free now" : space.stateLabel} back="/staff/events/spaces" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <View style={styles.plan}>
          <SvgXml xml={hallPlanSvg} width="100%" height={92} />
        </View>
        <View style={styles.facts}>
          <Fact n={space.seats || space.cap} label="seats" />
          <Fact n={space.place || "Campus"} label={space.floor || "floor"} />
          <Fact n={space.access || "Open"} label={space.accessSub || "access"} />
        </View>
        <View style={styles.eq}>
          {(space.gear || space.eq || []).map((g) => (
            <View key={g} style={styles.tag}><Text style={t(600, 12, 14)}>{g}</Text></View>
          ))}
        </View>
        <Text style={styles.fl}>Thursday · Dec 4</Text>
        {(space.slots || []).map((sl) => (
          <View key={sl.t} style={[styles.sl, sl.tone === "sel" && styles.sel, sl.tone === "p" && styles.pending]}>
            <Text style={[t(600, 13, 16), { width: 52, color: sl.tone === "sel" ? C.burgundy : C.white }]}>{sl.t}</Text>
            <Text style={[t(500, 14, 18), { color: sl.tone === "sel" ? C.burgundy : C.white }]}>{sl.label}</Text>
          </View>
        ))}
        <View style={{ marginTop: 12 }}>
          <GoldButton label={booked ? "Booked 1:00–2:00 PM" : "Book 1:00–2:00 PM"} onPress={() => {
              if (!booked) void bookSpace(roomId, "1300");
            }}
          />
        </View>
        <Text style={styles.ph}>{space.name} is on today’s campus list.</Text>
      </ScrollView>
    </StaffFrame>
  );
}

function Fact({ n, label }: { n: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={t(700, 16, 18)}>{n}</Text>
      <Text style={[t(500, 12, 16), { color: C.w64 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plan: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  facts: { flexDirection: "row", marginTop: 12, gap: 8 },
  eq: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: { height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 14, marginBottom: 8 },
  sl: { flexDirection: "row", alignItems: "center", minHeight: 40, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.card, marginBottom: 6 },
  sel: { backgroundColor: C.white },
  pending: { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", backgroundColor: "transparent" },
  ph: { ...t(500, 10.5, 14), color: C.w64, textAlign: "center", marginTop: 10 },
});
