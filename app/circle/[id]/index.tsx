import { NavSpacer } from "../../../src/components/navSpace";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { FloatingNav } from "../../../src/components/Nav";
import { IconBack, IconCheck, IconChevronDown, IconClock, IconRootGold, IconSendUp, IconShield, IconShieldCheck } from "../../../src/components/Icons";
import { C, t } from "../../../src/theme";
import { useNabt } from "../../../src/state";
import { OutgoingHalt } from "../../../src/moderation/outgoing";
import { me, postThreadReply, reportMessage, thankReply, useCampus, type Member } from "../../../src/live";
import { toast } from "../../../src/toast";
import { meetupSlots, postSpaceLine, requestMeetup, useSpace } from "../../../src/live/space";
import { writeSafetySignal } from "../../../src/live/voiceSafety";
import { joinCommunity, leaveCommunity } from "../../../src/live/communities";

export default function CircleSpace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = String(id || "");
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState("");
  const [reply, setReply] = useState("");
  const [kind, setKind] = useState("");
  const [slotAt, setSlotAt] = useState(0);
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const setCaution = useNabt((s) => s.setCaution);
  const caution = useNabt((s) => s.caution);
  const campus = useCampus();
  const space = useSpace(circleId);
  const circle = campus.circles[circleId];
  const members = campus.members[circleId] || [];
  const mine = members.some((m) => m.id === me());
  const slots = meetupSlots();
  const slot = slots[slotAt % slots.length];
  const meetup = space.meetup;
  const chosen = kind || meetup?.selected || "Quiet sit";
  const request = space.request;

  // Reading is open to everyone. Posting, thanking and proposing are for members.
  const asMember = (run: () => Promise<void>) => {
    if (!mine) {
      setCaution("Join the Circle to post here.");
      return;
    }
    void (async () => {
      try {
        await run();
        setCaution(null);
      } catch (err) {
        if (err instanceof OutgoingHalt && err.action === "support") {
          setCaution(null);
          if (err.signal) void writeSafetySignal(err.signal).catch(() => undefined);
          router.push("/support" as never);
          return;
        }
        setCaution(err instanceof Error ? err.message : "That stayed here.");
      }
    })();
  };

  if (!campus.ready) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={circle?.name || "Circle"} sub={`Circle · ${circle?.memberCount ?? members.length} members`} members={members} circleId={circleId} joined={mine} />
      <View style={styles.modRow}>
        <IconShield size={12} color={C.w64} />
        <Text style={styles.mod}>{circle?.modLine || "Moderated by a campus counselor · nicknames only"}</Text>
      </View>
      <Seg active="space" id={circleId} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eye}>{circle?.promptMeta || "Today’s prompt · clears tomorrow"}</Text>
          <Text style={styles.q}>{circle?.prompt || "What would make today lighter?"}</Text>
          <View style={styles.one}>
            <TextInput
              value={line}
              onChangeText={(v) => setLine(v.slice(0, 80))}
              placeholder="Your one line…"
              placeholderTextColor={C.w64}
              style={styles.input}
              maxLength={80}
              accessibilityLabel="Your one line"
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Post your line" onPress={() => asMember(async () => {
              await postSpaceLine(circleId, line);
              setLine("");
            })} style={styles.post}>
              <IconSendUp color={C.white} />
            </Pressable>
          </View>
          {caution ? <Text style={styles.warn}>{caution}</Text> : null}
          <View style={{ marginTop: 10, gap: 6 }}>
            {space.lines.length === 0 ? <Text style={styles.noteText}>No lines yet today.</Text> : null}
            {space.lines.map((a) => (
              <View key={a.id} style={styles.note}>
                <Mini letter={a.initial} />
                <Text style={styles.noteText}>
                  <Text style={{ color: C.white, fontWeight: "600" }}>{a.mine ? "You" : a.displayName} </Text>
                  {a.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {space.thread ? (
          <View style={styles.card}>
            <Text style={styles.eye}>Hope thread</Text>
            <View style={styles.postHead}>
              <Mini letter={space.thread.initial} size={32} font={13} />
              <View style={styles.who}>
                <Text style={t(600, 14, 17)}>{space.thread.nickname}</Text>
                {space.thread.mode ? (
                  <View style={styles.mode}>
                    <Text style={styles.modeT}>{space.thread.mode}</Text>
                  </View>
                ) : null}
                <Text style={styles.when}>{space.thread.when}</Text>
              </View>
            </View>
            <Text style={styles.postText}>{space.thread.text}</Text>
            <View style={styles.replies}>
              {space.replies.map((r) => {
                const thankedByMe = r.thankedBy.includes(me());
                const canThank = Boolean(r.authorUid) && r.authorUid !== me() && !thankedByMe;
                return (
                  <Reply
                    key={r.id}
                    letter={r.initial}
                    name={r.authorUid === me() ? "You" : r.nickname}
                    when={r.when}
                    text={r.text}
                    done={r.thankedBy.length ? (thankedByMe ? "You thanked them · +1 root for both" : "Thanked · +1 root for both") : undefined}
                    action={canThank ? "Thanks" : undefined}
                    onAction={canThank ? () => asMember(() => thankReply({ circleId, threadId: "hope", replyId: r.id })) : undefined}
                  />
                );
              })}
            </View>
            <View style={[styles.one, { marginTop: 12 }]}>
              <TextInput value={reply} onChangeText={setReply} placeholder="Add your reply" placeholderTextColor={C.w64} style={styles.input} accessibilityLabel="Add your reply" />
              <Pressable accessibilityRole="button" accessibilityLabel="Post reply" onPress={() => asMember(async () => {
                await postThreadReply(circleId, "hope", reply);
                setReply("");
              })} style={styles.post}>
                <IconSendUp color={C.white} />
              </Pressable>
            </View>
          </View>
        ) : null}

        {meetup ? (
          <View style={styles.card}>
            <View style={styles.meetHead}>
              <Text style={[t(600, 15, 20), { flexShrink: 1 }]}>{meetup.title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Meetup time ${request ? request.whenLabel : slot.label}. Tap for another time`}
                disabled={Boolean(request)}
                onPress={() => setSlotAt((v) => v + 1)}
                style={styles.time}
              >
                <IconClock />
                <Text style={t(600, 12.5, 13)}>{request ? request.whenLabel : slot.label}</Text>
                {request ? null : <IconChevronDown />}
              </Pressable>
            </View>
            <View style={styles.pills}>
              {meetup.kinds.map((p) => {
                const on = (request ? request.kind : chosen) === p;
                return (
                  <Pressable key={p} accessibilityRole="button" accessibilityState={{ selected: on }} disabled={Boolean(request)} onPress={() => setKind(p)} style={[styles.pill, on && styles.pillOn]}>
                    <Text style={[t(600, 12.5, 13), { color: on ? C.burgundy : C.w80 }]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.meetRow}>
              <IconShield size={16} color={C.w64} />
              <Text style={styles.muted}>{meetup.note}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={request ? "Meetup sent to Student Affairs" : "Propose a meetup"}
              disabled={Boolean(request) || sending}
              onPress={() => {
                setSending(true);
                asMember(() => requestMeetup(circleId, chosen, slot).finally(() => setSending(false)));
                if (!mine) setSending(false);
              }}
              style={[styles.propose, request && styles.proposeSent]}
            >
              <Text style={[t(700, 15, 15), { color: request ? C.white : C.burgundy, letterSpacing: 0.15 }]}>
                {request ? (request.status === "approved" ? "Approved by Student Affairs" : request.status === "declined" ? "Student Affairs declined" : "Sent to Student Affairs") : "Propose a meetup"}
              </Text>
            </Pressable>
            {meetup.approvedLine ? (
              <View style={styles.approvedRow}>
                <IconCheck size={16} />
                <Text style={styles.approved}>{meetup.approvedLine}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {!mine ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Join Circle"
            disabled={joining}
            onPress={() => {
              setJoining(true);
              void joinCommunity(circleId, {
                nickname: campus.nickname || campus.greetingName,
                realName: campus.fullName,
                uaEmail: campus.email,
                phone: "",
              })
                .then(() => setCaution(null))
                .catch((err: unknown) => setCaution(err instanceof Error ? err.message : "Could not join."))
                .finally(() => setJoining(false));
            }}
            style={styles.joinBtn}
          >
            <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{joining ? "Joining…" : "Join Circle"}</Text>
          </Pressable>
        ) : null}
        <NavSpacer />
      </ScrollView>
      <FloatingNav active="discover" quiet open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

export function Header({
  title,
  sub,
  here,
  members = [],
  circleId = "",
  joined = true,
}: {
  title: string;
  sub: string;
  here?: string;
  members?: Member[];
  circleId?: string;
  joined?: boolean;
}) {
  const [safety, setSafety] = useState(false);
  const [reported, setReported] = useState(false);
  return (
    <View style={styles.top}>
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}>
        <IconBack />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={t(600, 18, 22)}>{title}</Text>
        <View style={styles.subRow}>
          <Text style={styles.sub}>{sub}</Text>
          {here ? <View style={styles.hereDot} /> : null}
          {here ? <Text style={styles.sub}>{here}</Text> : null}
        </View>
      </View>
      <View style={styles.members}>
        {members.map((m) => (
          <View key={m.id} style={styles.av}>
            <Text style={[t(600, 10, 10), { color: C.gold }]}>{m.initial}</Text>
          </View>
        ))}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Safety: report, block or leave" onPress={() => setSafety((v) => !v)} style={styles.icon}>
        <IconShieldCheck size={20} />
      </Pressable>
      {safety ? (
        <View style={styles.safety}>
          <Pressable
            accessibilityRole="button"
            disabled={reported}
            onPress={() => {
              // A report goes to Student Affairs as a count with the Circle. Nobody reads the chat.
              void reportMessage({ circleId, messageId: "" })
                .then(() => {
                  setReported(true);
                  toast("Report sent to Student Affairs");
                })
                .catch((err: unknown) => toast(err instanceof Error ? err.message : "Report did not send."))
                .finally(() => setSafety(false));
            }}
          >
            <Text style={t(600, 13, 16)}>{reported ? "Report sent" : "Report this Circle"}</Text>
          </Pressable>
          {joined ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Leave" onPress={() => void leaveCommunity(circleId).then(() => router.replace("/chats" as never))}>
              <Text style={t(600, 13, 16)}>Leave</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function Seg({ active, id }: { active: "space" | "chat"; id: string }) {
  const unread = useCampus((s) => Number(s.circles[id]?.unread || 0));
  return (
    <View style={styles.seg}>
      <View style={[styles.segPill, active === "chat" && { marginLeft: "50%" }]} />
      <Pressable style={styles.segBtn} onPress={() => router.replace(`/circle/${id}` as never)}>
        <Text style={[t(600, 13.5, 14), { color: active === "space" ? C.burgundy : C.w80 }]}>Space</Text>
      </Pressable>
      <Pressable style={styles.segBtn} onPress={() => router.replace(`/circle/${id}/chat` as never)}>
        <Text style={[t(600, 13.5, 14), { color: active === "chat" ? C.burgundy : C.w80 }]}>Chat</Text>
        {unread ? (
          <View style={[styles.count, active === "chat" && { backgroundColor: C.burgundy }]}>
            <Text style={[t(700, 10.5, 11), { color: active === "chat" ? C.white : C.burgundy }]}>{unread}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function Mini({ letter, size = 22, font = 10 }: { letter: string; size?: number; font?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16, alignItems: "center", justifyContent: "center" }}>
      <Text style={[t(600, font, font), { color: C.gold }]}>{letter}</Text>
    </View>
  );
}

function Reply({ letter, name, when, text, done, action, onAction }: { letter: string; name: string; when: string; text: string; done?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.reply}>
      <Mini letter={letter} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Text style={t(600, 13, 16)}>{name}</Text>
          <Text style={styles.when}>{when}</Text>
        </View>
        <Text style={styles.replyText}>{text}</Text>
        {done ? (
          <View style={styles.rootLine}>
            <IconRootGold />
            <Text style={styles.done}>{done}</Text>
          </View>
        ) : null}
        {action ? (
          <Pressable onPress={onAction} style={styles.rootLine}>
            <IconRootGold />
            <Text style={styles.action}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 8, paddingRight: 14, position: "relative" },
  safety: { position: "absolute", right: 12, top: 46, zIndex: 5, backgroundColor: C.card, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, gap: 8 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  subRow: { marginTop: 2, flexDirection: "row", alignItems: "center" },
  sub: { ...t(500, 12, 14), color: C.w64 },
  hereDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.white, marginRight: 5, marginLeft: 1 },
  modRow: { marginTop: -6, paddingLeft: 56, paddingRight: 12, flexDirection: "row", alignItems: "center", gap: 5 },
  members: { flexDirection: "row", paddingLeft: 8 },
  av: { width: 22, height: 22, borderRadius: 11, marginLeft: -5, backgroundColor: C.deep, borderWidth: 2, borderColor: C.burgundy, alignItems: "center", justifyContent: "center" },
  mod: { ...t(500, 11, 13), color: C.w64 },
  seg: { marginHorizontal: 20, marginVertical: 10, height: 38, borderRadius: 999, backgroundColor: C.deep, borderWidth: 1, borderColor: C.w10, flexDirection: "row", padding: 3 },
  segPill: { position: "absolute", top: 3, bottom: 3, left: 3, width: "48%", borderRadius: 999, backgroundColor: C.white },
  segBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  count: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: C.raised, borderRadius: 22, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 14 },
  eye: { ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  q: { marginTop: 6, ...t(600, 15, 20), color: C.white, letterSpacing: -0.07 },
  one: { marginTop: 10, height: 40, borderRadius: 999, backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16, flexDirection: "row", alignItems: "center", paddingLeft: 14, paddingRight: 6, gap: 8 },
  input: { flex: 1, ...t(400, 14, 16), color: C.white, padding: 0 },
  post: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: C.w40, alignItems: "center", justifyContent: "center" },
  warn: { marginTop: 8, ...t(500, 12, 16), color: C.goldLight },
  note: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteText: { flex: 1, ...t(400, 13, 17), color: C.w80 },
  postHead: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  who: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  mode: { height: 18, paddingHorizontal: 7, borderRadius: 999, borderWidth: 1, borderColor: C.w40, justifyContent: "center" },
  modeT: { ...t(600, 9.5, 10), color: C.w80 },
  when: { ...t(500, 11.5, 12), color: C.w64 },
  postText: { marginTop: 8, ...t(500, 14.5, 20), color: C.white },
  replies: { marginTop: 10, marginLeft: 16, paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: C.w16, gap: 10 },
  reply: { flexDirection: "row", gap: 10 },
  replyText: { marginTop: 2, ...t(400, 13.5, 19), color: C.w80 },
  rootLine: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 6 },
  done: { ...t(500, 12, 12), color: C.w64 },
  action: { ...t(600, 12, 12), color: C.white, textDecorationLine: "underline" },
  meetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  time: { height: 30, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: C.w40, flexDirection: "row", alignItems: "center", gap: 6 },
  pills: { marginTop: 10, flexDirection: "row", gap: 8 },
  pill: { height: 30, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, borderColor: C.w40, justifyContent: "center" },
  pillOn: { backgroundColor: C.white, borderColor: C.white },
  meetRow: { marginTop: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  muted: { ...t(500, 12, 16), color: C.w64 },
  propose: { marginTop: 10, height: 44, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  proposeSent: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.w40 },
  joinBtn: { marginTop: 4, height: 48, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  approvedRow: { marginTop: 22, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.hair, flexDirection: "row", alignItems: "center", gap: 10 },
  approved: { ...t(500, 12.5, 16), color: C.white },
});
