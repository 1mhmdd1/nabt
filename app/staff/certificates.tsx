import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Avatar, GoldButton, Pills, StaffFrame } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { issueCerts, toggleCert, useStaff } from "../../src/live/staff";

const PILLS = ["All 18", "Circle host", "Buddy", "Node volunteer"];

export default function Certificates() {
  const certs = useStaff((s) => s.certs);
  const [pill, setPill] = useState(PILLS[0]);
  const shown = certs.filter((c) => (pill === "All 18" ? true : c.sub.includes(pill)));
  const pending = certs.filter((c) => c.verified && !c.issued);
  const issued = certs.filter((c) => c.issued).length;
  return (
    <StaffFrame title="Semester certificates" back="/staff/me" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={[t(400, 13.5, 20), { color: C.w80, marginBottom: 10 }]}>Verify roles for Fall 2026. Only verified roles appear on a student’s certificate.</Text>
        <Pills items={PILLS} value={pill} onChange={setPill} />
        <View style={styles.list}>
          {shown.map((c, i) => (
            <Pressable key={c.id} style={[styles.it, i > 0 && styles.line]} onPress={() => toggleCert(c.id, !c.verified)}>
              <Avatar letter={c.initial} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{c.name}</Text>
                <Text style={styles.sub}>{c.sub}</Text>
              </View>
              <View style={[styles.ck, c.verified && styles.ckOn]}>
                {c.verified ? <Text style={[t(700, 14, 16), { color: C.burgundy }]}>✓</Text> : null}
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>Hours and activity come from the app. You confirm the role.</Text>
        <View style={{ marginTop: 12 }}>
          <GoldButton
            label={pending.length ? `Issue ${pending.length} certificates` : `Issued ${issued} certificates`}
            onPress={() => {
              if (pending.length) void issueCerts(pending.map((c) => c.id));
            }}
          />
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 8, borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  line: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  ck: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.white, alignItems: "center", justifyContent: "center" },
  ckOn: { backgroundColor: C.white },
});
