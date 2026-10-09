import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { FloatingNav } from "../../../src/components/Nav";
import { IconBack, IconCheck, IconChevronDown, IconClock, IconMore, IconRootGold, IconSendUp, IconShield, IconShieldCheck } from "../../../src/components/Icons";
import { C, t } from "../../../src/theme";
import { useNabt } from "../../../src/state";
import { OutgoingHalt } from "../../../src/moderation/outgoing";
import { me, postPromptAnswer, postThreadReply, proposeMeetup, thankReply, useCampus, type Member } from "../../../src/live";
import { writeSafetySignal } from "../../../src/live/voiceSafety";
import { joinCommunity, leaveCommunity } from "../../../src/live/communities";

export default function CircleSpace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState("");
  const [reply, setReply] = useState("");
  const [kind, setKind] = useState("Quiet sit");
  const [sending, setSending] = useState(false);
  const setCaution = useNabt((s) => s.setCaution);
  const caution = useNabt((s) => s.caution);
  const campus = useCampus();
  const proposed = Boolean(campus.meetup?.proposedBy) && campus.meetup?.proposedBy === me();
  const circle = campus.circles[String(id)] || campus.circles["exam-week"];
  const members = campus.members[String(id)] || campus.members["exam-week"] || [];
  const title = circle?.name || "";
  const wall = campus.answers;
  const mine = members.some((m) => m.id === me());

  if (!campus.ready) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title={title} sub={`Circle · ${circle?.memberCount ?? members.length} members`} members={members} circleId={String(id || "")} />
      <View style={styles.modRow}>
        <IconShield size={12} color={C.w64} />
        <Text style={styles.mod}>{circle?.modLine}</Text>
      </View>
      <Seg active="space" id={String(id)} />
      {!mine ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Join Circle"
          onPress={() => void joinCommunity(String(id || ""), {
            nickname: campus.nickname || campus.greetingName,
            realName: campus.fullName,
            uaEmail: campus.email,
            phone: "",
          }).then((result) => {
            if (result === "joined") router.replace(`/circle/${id}/chat?joined=1` as never);
          })}
          style={{ marginHorizontal: 20, marginTop: 12, height: 48, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Join Circle</Text>
        </Pressable>
      ) : null}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 8 }}>
        <View style={styles.card}>
          <Text style={styles.eye}>{circle?.promptMeta}</Text>
          <Text style={styles.q}>{circle?.prompt}</Text>
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
            <Pressable
              accessibilityLabel="Post your line"
              onPress={() => {
                void (async () => {
                  try {
                    if (line.trim()) await postPromptAnswer(String(id), line.trim());
                    setLine("");
                    setCaution(null);
                  } catch (err) {
                    if (err instanceof OutgoingHalt && err.action === "support") {
                      setCaution(null);
                      if (err.signal) void writeSafetySignal(err.signal).catch(() => undefined);
                      router.push("/support" as never);
                      return;
                    }
                    setCaution(err instanceof Error ? err.message : "That line stayed here.");
                  }
                })();
              }}
              style={styles.post}
            >
              <IconSendUp color={C.white} />
            </Pressable>
          </View>
          {caution ? <Text style={styles.warn}>{caution}</Text> : null}
          <View style={{ marginTop: 10, gap: 6 }}>
            {wall.map((a) => (
              <View key={a.id} style={styles.note}>
                <Mini letter={a.initial} />
                <Text style={styles.noteText} numberOfLines={1}>
                  <Text style={{ color: C.white, fontWeight: "600" }}>{a.displayName} </Text>
                  {a.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.eye}>Hope Thread</Text>
          {campus.thread ? (
            <>
              <View style={styles.postHead}>
                <Mini letter={campus.thread.initial} size={32} font={13} />
                <View style={styles.who}>
                  <Text style={t(600, 14, 17)}>{campus.thread.nickname}</Text>
                  {campus.thread.mode ? (
                    <View style={styles.mode}>
                      <Text style={styles.modeT}>{campus.thread.mode}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.when}>{campus.thread.when}</Text>
                </View>
                <IconMore />
              </View>
              <Text style={styles.postText}>{campus.thread.text}</Text>
              <View style={styles.replies}>
                {campus.replies.map((r) => (
                  <Reply key={r.id} letter={r.initial} name={r.nickname} when={r.when} text={r.text} done={r.done || "+1 root"} action={r.authorUid && r.authorUid !== me() ? "Thanks" : undefined} onAction={r.authorUid && r.authorUid !== me() ? () => void thankReply({ circleId: String(id), threadId: "hope", replyId: r.id }) : undefined} />
                ))}
              </View>
              <TextInput value={reply} onChangeText={setReply} placeholder="Add your reply" placeholderTextColor={C.w64} style={styles.input} accessibilityLabel="Add your reply" />
              <Pressable accessibilityRole="button" accessibilityLabel="Post reply" onPress={() => void postThreadReply(String(id), "hope", reply).then(() => setReply("")).catch((err: unknown) => setCaution(err instanceof Error ? err.message : "Reply stayed here."))}>
                <Text style={t(600, 13, 16)}>Post reply</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.meetHead}>
            <Text style={t(600, 15, 20)}>{campus.meetup?.title}</Text>
            <View style={styles.time}>
              <IconClock />
              <Text style={t(600, 12.5, 13)}>{campus.meetup?.whenLabel}</Text>
              <IconChevronDown />
            </View>
          </View>
          <View style={styles.pills}>
            {(campus.meetup?.kinds || []).map((p) => (
              <Pressable key={p} onPress={() => setKind(p)} style={[styles.pill, (kind || campus.meetup?.selected) === p && styles.pillOn]}>
                <Text style={[t(600, 12.5, 13), { color: (kind || campus.meetup?.selected) === p ? C.burgundy : C.w80 }]}>{p}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.meetRow}>
            <IconShield size={16} color={C.w64} />
            <Text style={styles.muted}>{campus.meetup?.note}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={proposed || sending}
            onPress={() => {
              setSending(true);
              void proposeMeetup(String(id), kind).finally(() => setSending(false));
            }}
            style={styles.propose}
          >
            <Text style={[t(700, 15, 15), { color: C.burgundy, letterSpacing: 0.15 }]}>{proposed ? "Sent to Student Affairs" : "Propose meetup"}</Text>
          </Pressable>
          <View style={styles.approvedRow}>
            <IconCheck size={16} />
            <Text style={styles.approved}>{campus.meetup?.approvedLine}</Text>
          </View>
        </View>
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
}: {
  title: string;
  sub: string;
  here?: string;
  members?: Member[];
  circleId?: string;
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
          <Pressable accessibilityRole="button" onPress={() => { setReported(true); setSafety(false); }}>
            <Text style={t(600, 13, 16)}>{reported ? "Report sent" : "Report this Circle"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Leave" onPress={() => void leaveCommunity(circleId).then(() => router.replace("/chats" as never))}>
            <Text style={t(600, 13, 16)}>Leave</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function Seg({ active, id }: { active: "space" | "chat"; id: string }) {
  return (
    <View style={styles.seg}>
      <View style={[styles.segPill, active === "chat" && { marginLeft: "50%" }]} />
      <Pressable style={styles.segBtn} onPress={() => router.replace(`/circle/${id}` as never)}>
        <Text style={[t(600, 13.5, 14), { color: active === "space" ? C.burgundy : C.w80 }]}>Space</Text>
      </Pressable>
      <Pressable style={styles.segBtn} onPress={() => router.replace(`/circle/${id}/chat` as never)}>
        <Text style={[t(600, 13.5, 14), { color: active === "chat" ? C.burgundy : C.w80 }]}>Chat</Text>
        <View style={[styles.count, active === "chat" && { backgroundColor: C.burgundy }]}>
          <Text style={[t(700, 10.5, 11), { color: active === "chat" ? C.white : C.burgundy }]}>3</Text>
        </View>
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
  approvedRow: { marginTop: 22, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.hair, flexDirection: "row", alignItems: "center", gap: 10 },
  approved: { ...t(500, 12.5, 16), color: C.white },
});
