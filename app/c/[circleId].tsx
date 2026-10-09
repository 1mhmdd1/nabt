import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Avatar, Card, Eyebrow, Muted, SubHead, ui } from "../../src/community/ui";
import { IconChevronRight } from "../../src/components/Icons";
import { C, t } from "../../src/theme";
import { me, useCampus } from "../../src/live";
import { leaveCommunity, roleChip, useCommunity } from "../../src/live/communities";

const BOARD_CHIP: Record<string, string> = { chair: "CHAIR", events: "EVENTS", logistics: "TECH" };

export default function CommunityPage() {
  const { circleId, joined } = useLocalSearchParams<{ circleId: string; joined?: string }>();
  const id = circleId || "";
  const circle = useCampus((s) => s.circles[id]);
  const memberMap = useCampus((s) => s.members);
  const messageMap = useCampus((s) => s.messages);
  const members = memberMap[id] || [];
  const threadLines = (messageMap[id] || []).filter((m) => m.kind !== "system" && m.text);
  const allEvents = useCommunity((s) => s.events);
  const events = allEvents.filter((e) => e.hostId === id);
  const uid = me();
  const mine = members.find((m) => m.id === uid);
  const isChair = circle?.chairUid === uid;

  if (!circle) {
    return (
      <Screen>
        <SubHead title="Circle" />
        <View style={{ padding: 20 }}><Muted>This Circle is still loading from campus.</Muted></View>
      </Screen>
    );
  }
  if (circle.kind !== "community") return <Redirect href={`/circle/${id}` as never} />;

  return (
    <Screen>
      <SubHead title={circle.name} chip={circle.verified ? "Verified" : undefined} />
      <ScrollView contentContainerStyle={ui.pad}>
        <Muted>{circle.officialLine || "Official UA club · aligned with Student Affairs"}</Muted>
        <Text style={[t(400, 15, 22), { marginTop: 4 }]}>{circle.charter}</Text>

        <Text style={styles.k}>Chair & board</Text>
        <View style={styles.list}>
          {["chair", "events", "logistics"].map((role) => members.find((m) => (m.roles || []).includes(role))).filter((m): m is NonNullable<typeof m> => Boolean(m)).map((m, index) => (
              <Pressable key={m.id} onPress={() => router.push(`/c/${id}/member/${m.id}` as never)} style={[styles.person, index === 0 && styles.first]}>
                <Avatar letter={m.initial || m.displayName.slice(0, 1)} small />
                <Text style={[t(600, 14, 18), { flex: 1 }]}>{m.displayName}</Text>
                <Text style={styles.role}>{BOARD_CHIP[(m.roles || []).find((r) => r === "chair" || r === "events" || r === "logistics") || ""] || roleChip(m.roles)}</Text>
              </Pressable>
            ))}
        </View>

        <Text style={styles.k}>Threads</Text>
        {threadLines.length === 0 ? <Muted>No threads yet.</Muted> : (
          <View style={styles.list}>
            {threadLines.slice(0, 4).map((m, index) => (
              <View key={m.id} style={[styles.person, index === 0 && styles.first]}>
                <View style={{ flex: 1 }}>
                  <Text style={t(600, 14, 18)}>{m.authorNickname}</Text>
                  <Muted>{m.text}</Muted>
                </View>
              </View>
            ))}
          </View>
        )}
        {mine ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Circle chat" style={[styles.main, { marginTop: 10 }]} onPress={() => router.push(`/circle/${id}/chat` as never)}>
            <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Chat</Text>
          </Pressable>
        ) : null}

        <Text style={styles.k}>Upcoming</Text>
        {events.length === 0 ? <Muted>No published events yet.</Muted> : (
          <View style={styles.list}>
            {events.map((e, index) => (
              <Pressable key={e.id} onPress={() => router.push(`/e/${e.id}` as never)} style={[styles.person, index === 0 && styles.first]}>
                <View style={{ flex: 1 }}>
                  <Text style={t(600, 15, 20)}>{e.title}</Text>
                  <Muted>{e.meta}</Muted>
                </View>
                {index === 0 ? <IconChevronRight /> : null}
              </Pressable>
            ))}
          </View>
        )}

        {circle.semesterGoal ? (
          <Card>
            <Eyebrow>Semester goal</Eyebrow>
            <Text style={[t(600, 16, 22), { marginTop: 6 }]}>{circle.semesterGoal}</Text>
            <View style={{ marginTop: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
              <View style={{ width: `${Math.round(((circle.goalDone ?? 0) / Math.max(circle.goalTotal || 1, 1)) * 100)}%`, height: 8, backgroundColor: C.white }} />
            </View>
            <Muted>{circle.goalDone ?? 0} of {circle.goalTotal ?? 0} milestones</Muted>
          </Card>
        ) : null}

        {(circle.perks || []).length > 0 ? (
          <Card>
            <Eyebrow>Club perks</Eyebrow>
            <View style={styles.perks}>
              {circle.perks!.map((p) => (
                <Text key={p} style={styles.perk}>{p}</Text>
              ))}
            </View>
          </Card>
        ) : null}

        {joined ? <Text accessibilityLabel="Joined">Joined</Text> : null}
        {isChair ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Chair dashboard" style={styles.main} onPress={() => router.push(`/c/${id}/chair` as never)}>
            <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Chair dashboard</Text>
          </Pressable>
        ) : mine ? (
          <>
            <Text accessibilityLabel="Joined">Joined</Text>
            <Muted>You’re in this Circle. The board sees the name and UA email you shared when you joined.</Muted>
            <Pressable accessibilityRole="button" accessibilityLabel="Leave" style={styles.main} onPress={() => void leaveCommunity(id).then(() => router.replace("/chats" as never))}>
              <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Leave</Text>
            </Pressable>
          </>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="Join Circle" style={styles.main} onPress={() => router.push(`/c/${id}/join` as never)}>
            <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Join Circle</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  k: { marginTop: 16, ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  list: { backgroundColor: C.card, borderRadius: 18, overflow: "hidden" },
  person: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.07)" },
  first: { borderTopWidth: 0 },
  role: { ...t(700, 10, 12), letterSpacing: 0.8, color: C.burgundy, backgroundColor: C.white, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: "hidden" },
  roleChair: { backgroundColor: C.gold },
  perks: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  perk: { ...t(600, 12.5, 16), color: C.white, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  main: { marginTop: 8, height: 48, borderRadius: 999, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
});
