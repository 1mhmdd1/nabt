import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { FloatingNav } from "../../../src/components/Nav";
import { Card, Eyebrow, Muted, ui } from "../../../src/community/ui";
import { IconChevronRight } from "../../../src/components/Icons";
import { C, t } from "../../../src/theme";
import { getFirebase } from "../../../src/firebase";
import { me, useCampus } from "../../../src/live";
import { askVerification, decideJoin, eventIsLive, useCommunity } from "../../../src/live/communities";
import { useEventRoster } from "../../../src/live/eventCheckin";
import { issueCircleCertificates } from "../../../src/live/records";
import { demoLocal } from "../../../src/local/mode";
import { ChairOnly } from "../../../src/community/ChairOnly";

const SHORT: Record<string, string> = {
  events: "Events",
  logistics: "Tech",
  media: "Media",
  treasurer: "Treasurer",
  moderator: "Mod",
  hr: "HR",
  vice_chair: "Vice",
};

export default function ChairDashboard() {
  return (
    <ChairOnly>
      <ChairDashboardScreen />
    </ChairOnly>
  );
}

function ChairDashboardScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "";
  const [open, setOpen] = useState(false);
  const [issued, setIssued] = useState(false);
  const [askNote, setAskNote] = useState("");
  const [requests, setRequests] = useState<{ uid: string; nickname: string }[]>([]);
  useEffect(() => {
    if (!id) return;
    const { db } = getFirebase();
    return onSnapshot(query(collection(db, "circles", id, "joinRequests"), where("status", "==", "pending")), (snap) => {
      setRequests(snap.docs.map((row) => ({ uid: row.id, nickname: String(row.data().nickname || "A student") })));
    }, () => setRequests([]));
  }, [id]);
  const circle = useCampus((s) => s.circles[id]);
  const self = useCampus();
  const memberMap = useCampus((s) => s.members);
  const members = memberMap[id] || [];
  const events = useCommunity((s) => s.events);
  const venueRequests = useCommunity((s) => s.venueRequests);
  const hosted = events.filter((event) => event.hostId === id);
  const liveEvent = hosted.find((event) => eventIsLive(event));
  const upcoming = hosted
    .filter((event) => event.id !== liveEvent?.id && (!event.startsAt || event.startsAt > Date.now()))
    .sort((a, b) => (a.startsAt || Number.MAX_SAFE_INTEGER) - (b.startsAt || Number.MAX_SAFE_INTEGER) || a.order - b.order)[0];
  const upcomingRequest = venueRequests.find((request) => request.circleId === id && request.id === upcoming?.id);
  const isChair = circle?.chairUid === me();
  const nodeBoard = ["chair", "vice_chair", "events", "logistics", "media", "treasurer", "moderator", "hr"];
  const canHostNode = isChair || (members.find((m) => m.id === me())?.roles || []).some((role) => nodeBoard.includes(role));
  const boardOrder = ["events", "logistics", "media", "treasurer"];
  const board = boardOrder
    .map((role) => members.find((m) => (m.roles || []).includes(role)))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const roster = useEventRoster(liveEvent?.id || "");
  const here = roster?.length ?? 0;
  const bars = [...(circle?.attendance || [10, 14, 8, 18, 22])];
  if (liveEvent && here > 0) bars[bars.length - 1] = here;
  const needs = circle?.needs || [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={[ui.pad, { paddingTop: 8 }]}>
        {!isChair ? (
          <Card>
            <Text style={t(600, 16, 22)}>Chair only</Text>
            <Muted>This dashboard is for the Chair of {circle?.name || "this Circle"}.</Muted>
          </Card>
        ) : null}
        <View style={ui.between}>
          <View style={{ flex: 1 }}>
            <Muted>{circle?.officialLine || circle?.name}{circle?.verified && !circle?.officialLine ? " · Verified" : ""}</Muted>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Text style={t(700, 24, 30)}>Hi {self.greetingName || "there"}</Text>
              <Text style={styles.chair}>CHAIR</Text>
            </View>
          </View>
          <View style={styles.me}>
            <Text style={[t(600, 14, 16), { color: C.gold }]}>{(self.greetingName || "C").slice(0, 1)}</Text>
          </View>
        </View>
        {isChair ? (
          <View style={{ gap: 8, marginTop: 12 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Host an event" onPress={() => router.push(`/c/${id}/host` as never)} style={styles.main}>
              <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Host an event</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Ask to be verified" onPress={() => void askVerification(id).then(() => setAskNote("Verification request sent.")).catch((err: unknown) => setAskNote(err instanceof Error ? err.message : "Could not ask."))} style={styles.ghost}>
              <Text style={t(600, 14, 18)}>Ask Student Affairs to verify</Text>
            </Pressable>
            {demoLocal() ? null : (
              <Pressable accessibilityRole="button" accessibilityLabel="Node controls" onPress={() => router.push(`/c/${id}/node` as never)} style={styles.ghost}>
                <Text style={t(600, 14, 18)}>Node controls</Text>
              </Pressable>
            )}
            {venueRequests.filter((request) => request.circleId === id).map((request) => (
              <Text key={request.id} accessibilityLabel={`Venue ${request.status}`}>
                Venue request · {request.status}{request.reply ? ` · ${request.reply}` : ""}
              </Text>
            ))}
            {requests.map((request) => (
              <View key={request.uid} style={{ gap: 6 }}>
                <Text accessibilityLabel={`Join request ${request.nickname}`}>{request.nickname} asked to join</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Approve ${request.nickname}`} onPress={() => void decideJoin(id, request.uid, "approved").then(() => setAskNote(`${request.nickname} joined.`)).catch((err: unknown) => setAskNote(err instanceof Error ? err.message : "Could not approve."))} style={styles.main}>
                  <Text style={[t(700, 14, 18), { color: C.burgundy }]}>Approve {request.nickname}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Decline ${request.nickname}`} onPress={() => void decideJoin(id, request.uid, "declined")} style={styles.ghost}>
                  <Text style={t(600, 14, 18)}>Decline</Text>
                </Pressable>
              </View>
            ))}
            {askNote ? <Text>{askNote}</Text> : null}
          </View>
        ) : null}
        <View style={styles.bento}>
          <View style={styles.tile}>
            <Eyebrow>Active</Eyebrow>
            <Text style={t(700, 24, 28)}>{circle?.activeCount ?? 0}<Text style={t(500, 13, 16)}> / {circle?.memberCount ?? members.length}</Text></Text>
            <Svg width={70} height={30} viewBox="0 0 60 30" style={{ marginTop: 6 }}>
              <Rect x="0" y="20" width="11" height="10" rx="2" fill="#fff" fillOpacity={0.45} />
              <Rect x="16" y="16" width="11" height="14" rx="2" fill="#fff" fillOpacity={0.45} />
              <Rect x="32" y="11" width="11" height="19" rx="2" fill="#fff" fillOpacity={0.45} />
              <Rect x="48" y="4" width="11" height="26" rx="2" fill="#fff" />
            </Svg>
          </View>
          <Pressable
            style={styles.tile}
            onPress={() => router.push((liveEvent ? `/e/${liveEvent.id}/checkin` : upcoming ? `/e/${upcoming.id}` : `/c/${id}/venue`) as never)}
          >
            {liveEvent ? (
              <>
                <Eyebrow>Live now</Eyebrow>
                <Text style={[t(700, 16, 20), { marginTop: 4 }]}>{liveEvent.title}</Text>
                <Muted>{here} checked in</Muted>
              </>
            ) : (
              <>
                <Eyebrow>Next event · {whenLabel(upcoming?.startsAt, circle?.nextEventIn)}</Eyebrow>
                <Text style={[t(700, 16, 20), { marginTop: 4 }]}>{upcoming?.title || circle?.nextEventTitle || "Next event"}</Text>
                <Muted>{venueLine(upcomingRequest?.status) || upcoming?.meta || "Venue request"}</Muted>
              </>
            )}
          </Pressable>
          <Pressable style={styles.tile} onPress={() => router.push(`/c/${id}/members` as never)}>
            <Eyebrow>Mentors · workshop</Eyebrow>
            <Text style={t(700, 24, 28)}>{circle?.mentorCount ?? 0}<Text style={t(500, 12, 16)}> / {circle?.mentorNeeded ?? 0} needed</Text></Text>
            <View style={styles.invite}><Text style={[t(600, 12, 14), { color: C.white }]}>Invite</Text></View>
          </Pressable>
          <View style={styles.tile}>
            <Eyebrow>Attendance · last 5</Eyebrow>
            <Svg width="100%" height={40} viewBox="0 0 100 36" style={{ marginTop: 6 }}>
              {bars.map((value, i) => {
                const x = i * 22;
                const solid = Math.max(4, Math.round((value / 30) * 16));
                const light = Math.max(2, Math.round((value / 30) * 6));
                const y = 36 - light - solid;
                return (
                  <Rect key={i} x={x} y={y} width={14} height={solid} rx={2} fill="#fff" />
                );
              })}
              {bars.map((value, i) => {
                const x = i * 22;
                const light = Math.max(2, Math.round((value / 30) * 6));
                const y = 36 - light;
                return (
                  <Rect key={`n${i}`} x={x} y={y} width={14} height={light} rx={2} fill="#fff" fillOpacity={0.4} />
                );
              })}
            </Svg>
            <Muted>Solid returning · light new</Muted>
            {liveEvent ? (
              <Pressable onPress={() => router.push(`/e/${liveEvent.id}/checkin` as never)}>
                <Muted>
                  {liveEvent.title} · {here} checked in
                </Muted>
              </Pressable>
            ) : null}
          </View>
        </View>
        <Text style={styles.k}>Needs you · {needs.length || 3}</Text>
        <View style={styles.list}>
          {needs.map((row, index) => (
            <Pressable key={row.title} onPress={() => router.push(`/c/${id}/venue` as never)} style={[styles.need, index === 0 && { borderTopWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 14, 18)}>{row.title}</Text>
                <Muted>{row.sub}</Muted>
              </View>
              <IconChevronRight />
            </Pressable>
          ))}
        </View>
        <Text style={styles.k}>Board</Text>
        <View style={{ flexDirection: "row", gap: 14 }}>
          {board.map((m) => {
            const role = (m.roles || []).find((r) => r !== "chair" && r !== "mentor") || "";
            return (
              <View key={m.id} style={{ alignItems: "center", width: 64 }}>
                <View>
                  <View style={styles.ring}><Text style={[t(600, 14, 16), { color: C.gold }]}>{m.initial}</Text></View>
                  {m.alert ? <View style={styles.dot} /> : null}
                </View>
                <Muted>{SHORT[role] || role}</Muted>
              </View>
            );
          })}
        </View>
        {isChair ? (
          <Pressable onPress={() => void issueCircleCertificates(id).then(() => setIssued(true))} style={[styles.need, { marginTop: 12, borderTopWidth: 0, backgroundColor: C.card, borderRadius: 18 }]}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>{issued ? "Certificates issued" : "Issue certificates"}</Text>
              <Muted>For past events in this Circle</Muted>
            </View>
            <IconChevronRight />
          </Pressable>
        ) : null}
        {canHostNode && !demoLocal() ? (
          <Pressable onPress={() => router.push(`/c/${id}/node` as never)} style={[styles.need, { marginTop: 12, borderTopWidth: 0, backgroundColor: C.card, borderRadius: 18 }]}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>Hope Node</Text>
              <Muted>Show a Circle event on the Faculty of Engineering node</Muted>
            </View>
            <IconChevronRight />
          </Pressable>
        ) : null}
        <Pressable onPress={() => router.push(`/c/${id}/report` as never)} style={[styles.need, { marginTop: 12, borderTopWidth: 0, backgroundColor: C.card, borderRadius: 18 }]}>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 14, 18)}>Semester report</Text>
            <Muted>Events, attendance, board</Muted>
          </View>
          <IconChevronRight />
        </Pressable>
        <Pressable onPress={() => router.push(`/c/${id}/announce` as never)} style={[styles.need, { marginTop: 8, borderTopWidth: 0, backgroundColor: C.card, borderRadius: 18 }]}>
          <View style={{ flex: 1 }}>
            <Text style={t(600, 14, 18)}>Announce</Text>
            <Muted>A note for this Circle only</Muted>
          </View>
          <IconChevronRight />
        </Pressable>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Pressable onPress={() => router.push(`/c/${id}/venue` as never)} style={styles.pillOn}>
            <Text style={[t(600, 13, 16), { color: C.burgundy }]}>New SA request</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/c/${id}/roles` as never)} style={styles.pill}>
            <Text style={t(600, 13, 16)}>Assign role</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/c/${id}/members` as never)} style={styles.pill}>
            <Text style={t(600, 13, 16)}>Mentor pool</Text>
          </Pressable>
        </View>
      </ScrollView>
      <FloatingNav active="me" open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

function whenLabel(at: number | undefined, fallback?: string) {
  if (!at) return fallback || "soon";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(at);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "in 1 day";
  return `in ${days} days`;
}

function venueLine(status?: string) {
  const labels: Record<string, string> = {
    in_discussion: "In discussion",
    discussion: "In discussion",
    approved: "Approved",
    pending: "Pending",
    sent: "Sent",
    needs_changes: "Needs changes",
  };
  const label = status ? labels[status] : "";
  return label ? `Venue request: ${label}` : "";
}

const styles = {
  me: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.deep, borderWidth: 2, borderColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const },
  chair: { ...t(700, 10, 12), letterSpacing: 0.8, color: C.white, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: "hidden" as const },
  bento: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  tile: { width: "48%" as const, backgroundColor: "#5A2222", borderRadius: 18, padding: 12, gap: 2 },
  main: { height: 48, borderRadius: 999, backgroundColor: C.white, alignItems: "center" as const, justifyContent: "center" as const },
  ghost: { height: 44, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", alignItems: "center" as const, justifyContent: "center" as const },
  invite: { marginTop: 8, alignSelf: "flex-start" as const, height: 28, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)", alignItems: "center" as const, justifyContent: "center" as const },
  k: { marginTop: 14, ...t(600, 11, 14), letterSpacing: 1.1, textTransform: "uppercase" as const, color: C.w64 },
  list: { backgroundColor: C.card, borderRadius: 18, overflow: "hidden" as const },
  need: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, minHeight: 52, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  ring: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: C.white, alignItems: "center" as const, justifyContent: "center" as const },
  dot: { position: "absolute" as const, top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  pillOn: { flex: 1, height: 36, borderRadius: 999, backgroundColor: C.white, alignItems: "center" as const, justifyContent: "center" as const },
  pill: { flex: 1, height: 36, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", alignItems: "center" as const, justifyContent: "center" as const },
};
