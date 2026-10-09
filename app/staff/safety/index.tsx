import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Chip, Pills, Sev, SmallButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { openSupportChat, replySupport, useStaff } from "../../../src/live/staff";
import { postFn } from "../../../src/fn";
const FILTERS = ["All", "Shared by student", "Signals", "Care", "Resolved"];

export default function SafetyInbox() {
  const cases = useStaff((s) => s.cases);
  const support = useStaff((s) => s.supportRequests);
  const reports = useStaff((s) => s.reports);
  const [reply, setReply] = useState("");
  const notice = useStaff((s) => s.notice);
  const ready = useStaff((s) => s.ready);
  const [filter, setFilter] = useState("All");
  const [assignId, setAssignId] = useState("");
  const [counselors, setCounselors] = useState<{ uid: string; name: string }[]>([]);
  const [assignNote, setAssignNote] = useState("");
  const open = cases.filter((c) => c.open !== false);
  const shown = open.filter((c) => {
    if (filter === "All") return true;
    if (filter.startsWith("Shared")) return c.filter === "shared";
    if (filter === "Signals") return c.filter === "signal";
    if (filter === "Care") return c.filter === "care";
    return c.open === false;
  });
  return (
    <StaffFrame title="Safety" chip={ready ? `${open.length} open` : ""} tab="safety">
      <Pills items={FILTERS} value={filter} onChange={setFilter} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 8 }}>
        {shown.length === 0 ? <Text style={[t(500, 14, 20), { color: C.w64 }]}>No open cases.</Text> : null}
        {shown.map((c, i) => {
          const href = c.kind === "care" ? `/staff/safety/care?id=${c.id}` : `/staff/safety/${c.id}`;
          return (
            <Pressable key={c.id} onPress={() => router.push(href as never)} style={[styles.case, i === 0 && filter === "All" && styles.sel]}>
              <View style={styles.r1}>
                {c.kind === "care" ? <Chip label={c.careLabel || "Care level"} on /> : <Sev level={c.severity} />}
                <Chip label={c.kindLabel} />
                <Text style={[t(500, 11.5, 14), { marginLeft: "auto", color: C.w64 }]}>{c.time}</Text>
              </View>
              <Text style={[t(600, 14.5, 18), { marginTop: 9 }]}>{c.title || `${c.nickname} · ${c.where}`}</Text>
              <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{c.topic}</Text>
              {c.excerpt ? <Text style={styles.ex}>{c.excerpt}</Text> : null}
              {c.assignedName ? <Text style={[t(500, 12, 16), { color: C.gold, marginTop: 6 }]}>Assigned to {c.assignedName}</Text> : null}
              {assignId === c.id ? (
                <View style={{ marginTop: 8, gap: 6 }}>
                  {counselors.map((person) => (
                    <SmallButton
                      key={person.uid}
                      label={person.name}
                      on
                      onPress={() => {
                        void postFn("/staff/assign", { caseId: c.id, counselorUid: person.uid }).then(() => {
                          setAssignNote(`Assigned to ${person.name}`);
                          setAssignId("");
                        }).catch((err) => setAssignNote(err instanceof Error ? err.message : "Could not assign."));
                      }}
                    />
                  ))}
                  {assignNote ? <Text style={[t(500, 12, 16), { color: C.w80 }]}>{assignNote}</Text> : null}
                </View>
              ) : null}
              {i === 0 && c.kind === "shared" ? (
                <View style={styles.row}>
                  <SmallButton label="Open case" on onPress={() => router.push(href as never)} />
                  <SmallButton
                    label="Assign"
                    onPress={() => {
                      setAssignId(c.id);
                      setAssignNote("");
                      void postFn("/staff/counselors", {}).then((res) => {
                        const list = (res as { counselors?: { uid: string; name: string }[] }).counselors || [];
                        setCounselors(list);
                        if (!list.length) setAssignNote("No staff accounts yet. Approve one with make-role first.");
                      }).catch((err) => setAssignNote(err instanceof Error ? err.message : "Could not load staff."));
                    }}
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
        {notice ? <Text accessibilityLabel="Safety notice">{notice}</Text> : null}
        <Text style={[t(600, 13, 18), { marginTop: 8 }]}>Support requests</Text>
        {support.length === 0 ? <Text style={[t(500, 12, 16), { color: C.w64 }]}>No support requests yet.</Text> : null}
        {support.map((row) => (
          <View key={row.id} style={styles.case} accessibilityLabel={`Support ${row.reason}`}>
            <Text style={t(600, 14, 18)}>{row.nickname} · {row.reason}</Text>
            <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 4 }]}>{row.note || "No note"} · {row.status}</Text>
            {!row.chatId ? (
              <SmallButton label="Open chat" on onPress={() => void openSupportChat(row.id)} />
            ) : (
              <View style={{ marginTop: 8, gap: 8 }}>
                <TextInput value={reply} onChangeText={setReply} accessibilityLabel="Support reply" placeholder="Reply" placeholderTextColor={C.w64} style={{ color: C.white, minHeight: 40 }} />
                <SmallButton label="Send reply" on onPress={() => void replySupport(row.chatId, reply).then(() => setReply(""))} />
              </View>
            )}
          </View>
        ))}
        <Text style={[t(600, 13, 18), { marginTop: 8 }]}>Reports</Text>
        {reports.length === 0 ? <Text style={[t(500, 12, 16), { color: C.w64 }]}>No reports yet.</Text> : null}
        {reports.map((row) => (
          <Text key={row.id} accessibilityLabel="Report">{row.circleId ? `Report in ${row.circleId}` : "Report"}</Text>
        ))}
        <Pressable onPress={() => router.push("/staff/safety/held" as never)}>
          <Text style={[t(600, 13, 18), { color: C.white, textAlign: "center", marginTop: 6 }]}>Held content</Text>
        </Pressable>
      </ScrollView>
    </StaffFrame>
  );
}

const styles = StyleSheet.create({
  case: { backgroundColor: C.card, borderRadius: 18, padding: 13 },
  sel: { borderWidth: 1.5, borderColor: C.white },
  r1: { flexDirection: "row", alignItems: "center", gap: 8 },
  ex: { marginTop: 10, backgroundColor: C.ground, borderRadius: 12, padding: 10, ...t(400, 13, 18), color: "rgba(255,255,255,0.88)" },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
});
