import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { IconLock } from "../../../src/components/Icons";
import { Avatar, Muted, SubHead } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { me, useCampus } from "../../../src/live";
import { useCommunity } from "../../../src/live/communities";
import { useEventRoster } from "../../../src/live/eventCheckin";

const FILTERS = ["Active", "Mentors", "Board", "Attended"] as const;

export default function MembersDb() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "";
  const circle = useCampus((s) => s.circles[id]);
  const memberMap = useCampus((s) => s.members);
  const members = memberMap[id] || [];
  const contactMap = useCommunity((s) => s.contacts);
  const contacts = contactMap[id] || [];
  const isChair = circle?.chairUid === me();
  const byId = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const events = useCommunity((s) => s.events);
  const liveEvent = events.find((event) => event.hostId === id && event.checkIn);
  const roster = useEventRoster(liveEvent?.id || "");
  const present = new Set((roster || []).map((row) => row.uid));
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Mentors");
  const boardCount = members.filter((m) => (m.roles || []).some((r) => r !== "mentor" && r !== "chair")).length;
  const shown = members.filter((m) => {
    const roles = m.roles || [];
    if (filter === "Board") return roles.some((r) => r !== "mentor" && r !== "chair");
    if (filter === "Mentors") return true;
    if (filter === "Active") return true;
    if (filter === "Attended") return present.has(m.id) || (byId[m.id]?.trainingAttendance || "").startsWith("Present");
    return true;
  });

  return (
    <Screen>
      <SubHead title={`Members · ${circle?.memberCount ?? members.length}`} chip={isChair ? "CHAIR" : undefined} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {!isChair ? <Muted>The member database is for the Chair and the board member who holds the members privilege.</Muted> : null}
        <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
          {FILTERS.map((name) => {
            const label = name === "Active" ? `Active ${circle?.activeCount ?? 0}`
              : name === "Mentors" ? `Mentors · workshop ${circle?.mentorCount ?? 0}`
              : name === "Board" ? `Board ${boardCount}`
              : "Attended 3+";
            const on = filter === name;
            return (
              <Pressable key={name} onPress={() => setFilter(name)} style={[styles.pill, on && styles.pillOn]}>
                <Text style={[t(600, 11, 14), { color: on ? C.burgundy : C.white }]} numberOfLines={1}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.list}>
          {shown.map((m, index) => {
            const contact = byId[m.id];
            const name = contact?.realName || m.displayName;
            const line = contact ? `${contact.uaEmail}${contact.trainingAttendance ? ` · ${contact.trainingAttendance}` : ""}` : m.line || m.nickname;
            const roles = m.roles || [];
            const chip = roles.includes("chair") ? "CHAIR" : roles.includes("events") ? "EVENTS" : roles.includes("mentor") && roles.every((r) => r === "mentor") ? "MENTOR" : "";
            const mentor = chip === "MENTOR";
            const chair = chip === "CHAIR";
            return (
              <Pressable key={m.id} onPress={() => router.push(`/c/${id}/member/${m.id}` as never)} style={[styles.row, index === 0 && { borderTopWidth: 0 }]}>
                <Avatar letter={(name || "?").slice(0, 1)} />
                <View style={{ flex: 1 }}>
                  <Text style={t(600, 15, 20)}>{name}</Text>
                  <Muted>{line}</Muted>
                </View>
                {chip ? <Text style={[styles.chip, mentor && styles.chipLine, chair && styles.chipGold]}>{chip}</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <Muted>Mentor is earned: attend 2+ prep trainings for an event. No self sign-up.</Muted>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
          <IconLock size={14} color={C.w64} />
          <Muted>Names and contact shared on joining. Never their plant, mood, Hope Node, DMs or other Circles.</Muted>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = {
  pill: { height: 28, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 10 },
  pillOn: { backgroundColor: C.white, borderColor: C.white },
  list: { marginTop: 10, backgroundColor: C.card, borderRadius: 18, overflow: "hidden" as const },
  row: { flexDirection: "row" as const, gap: 12, alignItems: "center" as const, minHeight: 56, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  chip: { ...t(700, 10, 12), letterSpacing: 0.6, color: C.burgundy, backgroundColor: C.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: "hidden" as const },
  chipLine: { backgroundColor: "transparent", color: C.white, borderWidth: 1, borderColor: C.white },
  chipGold: { backgroundColor: C.gold },
};
