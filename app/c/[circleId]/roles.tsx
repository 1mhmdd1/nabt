import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { Muted, SubHead } from "../../../src/community/ui";
import { IconLock } from "../../../src/components/Icons";
import { C, t } from "../../../src/theme";
import { me, useCampus } from "../../../src/live";
import { ROLE_LABEL, assignBoardRole } from "../../../src/live/communities";

const CHOICES = ["vice_chair", "events", "moderator", "logistics", "hr", "media", "treasurer"] as const;

const PRIVS: { label: string; sub: string; on?: boolean; lock?: boolean }[] = [
  { label: "Post & reply in threads", sub: "C B M", lock: true },
  { label: "Pin · lock · hide", sub: "Moderate", on: true },
  { label: "Event drafts & check-in", sub: "Events", on: true },
  { label: "Board channel & tasks", sub: "All board", on: true },
  { label: "Mentor pool & contact", sub: "Mentors", on: true },
  { label: "Member database", sub: "Counts only", on: false },
  { label: "Full HR access", sub: "HR", on: false },
  { label: "SA requests & thread", sub: "Chair only", lock: true },
  { label: "Assign board roles", sub: "Chair only", lock: true },
];

export default function BoardRoles() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "";
  const circle = useCampus((s) => s.circles[id]);
  const memberMap = useCampus((s) => s.members);
  const members = (memberMap[id] || []).filter((m) => m.id !== circle?.chairUid);
  const jad = members.find((m) => m.id === "jad") || members[0];
  const [target, setTarget] = useState(jad?.id || "");
  const selected = target || jad?.id || "";
  const current = members.find((m) => m.id === selected);
  const [roles, setRoles] = useState<string[] | null>(null);
  const shown = roles ?? (current?.roles || []).filter((r) => r !== "chair" && r !== "mentor");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const isChair = circle?.chairUid === me();
  const headline = `${current?.displayName || "Board member"} · ${ROLE_LABEL[shown[0]] || "Member"}`;

  function pick(role: string) {
    setRoles(() => {
      const cur = shown;
      if (cur.includes(role)) return cur.filter((r) => r !== role);
      if (cur.length >= 2) return cur;
      return [...cur, role];
    });
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    setNote("");
    try {
      await assignBoardRole(id, selected, shown);
      setNote("Saved. The board audit log has the change.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <SubHead title={headline} chip={isChair ? "CHAIR" : undefined} chipGold={false} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 10 }}>
        <Muted>Applies only inside {circle?.name || "this Circle"} (Verified). Regular Circles have no roles.</Muted>
        {!isChair ? <Muted>Only the Chair can assign roles.</Muted> : null}
        <Text style={styles.k}>Member</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {members.map((member) => (
            <Pressable key={member.id} accessibilityRole="button" accessibilityLabel={member.displayName || member.nickname} onPress={() => setTarget(member.id)} style={[styles.chip, selected === member.id && styles.on]}>
              <Text style={[t(600, 12.5, 16), { color: selected === member.id ? C.burgundy : C.white }]}>{member.displayName || member.nickname}</Text>
            </Pressable>
          ))}
        </View>
        {members.length === 0 ? <Muted>Invite someone to join before assigning a role.</Muted> : null}
        <Text style={styles.k}>Role · max 2 per person</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CHOICES.map((role) => {
            const on = shown.includes(role);
            return (
              <Pressable key={role} accessibilityRole="button" accessibilityLabel={ROLE_LABEL[role]} onPress={() => pick(role)} style={[styles.chip, on && styles.on]}>
                <Text style={[t(600, 12.5, 16), { color: on ? C.burgundy : C.white }]}>{ROLE_LABEL[role]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.k}>Privileges · preset, adjustable</Text>
        <View style={styles.list}>
          {PRIVS.map((row, index) => {
            const on = toggles[row.label] ?? row.on;
            return (
              <View key={row.label} style={[styles.row, index === 0 && { borderTopWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={t(600, 14, 18)}>{row.label}</Text>
                  <Muted>{row.sub}</Muted>
                </View>
                {row.lock ? <IconLock size={14} color={C.w80} /> : (
                  <Pressable onPress={() => setToggles((s) => ({ ...s, [row.label]: !on }))} style={[styles.tg, on && styles.tgOn]}>
                    <View style={[styles.knob, on && styles.knobOn]} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
        {note ? <Text style={t(500, 13, 18)}>{note}</Text> : null}
        {isChair ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel="Add as mentor" disabled={busy || !selected} onPress={() => void assignBoardRole(id, selected, Array.from(new Set([...shown, "mentor"]))).then(() => setNote("Mentor added.")).catch((err: unknown) => setNote(err instanceof Error ? err.message : "Could not add a mentor."))} style={styles.save}>
              <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Add as mentor</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Save roles" disabled={busy} onPress={() => void save()} style={styles.save}>
              <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{busy ? "Saving…" : "Save · logged for the board"}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = {
  k: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase" as const, color: C.w64 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", alignItems: "center" as const, justifyContent: "center" as const },
  on: { backgroundColor: C.white, borderColor: C.white },
  list: { backgroundColor: C.card, borderRadius: 18, overflow: "hidden" as const },
  row: { flexDirection: "row" as const, alignItems: "center" as const, gap: 12, minHeight: 52, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  tg: { width: 40, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center" as const, paddingHorizontal: 3 },
  tgOn: { backgroundColor: C.white },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: C.white },
  knobOn: { alignSelf: "flex-end" as const, backgroundColor: C.burgundy },
  save: { height: 48, borderRadius: 999, backgroundColor: C.white, alignItems: "center" as const, justifyContent: "center" as const, marginTop: 4 },
};
