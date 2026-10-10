import * as Clipboard from "expo-clipboard";
import { MessageBubble } from "../../../src/components/chat/MessageBubble";
import { useEffect, useState, type ReactNode } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { ResizeMode, Video } from "expo-av";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "../../../src/firebase";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { IconHeartChip, IconPlus, IconRootChip, IconSendUp, IconShield } from "../../../src/components/Icons";
import { Header, Seg } from "./index";
import { C, t } from "../../../src/theme";
import { useNabt } from "../../../src/state";
import { OutgoingHalt } from "../../../src/moderation/outgoing";
import { answerKindness, blockAuthor, closeKindness, deleteCircleMessage, me, reportMessage, sendCircleAttachment, sendCircleMessage, sendCirclePoll, thankReply, useCampus, votePoll, type ChatAttachment, type ChatMsg } from "../../../src/live";
import { toast } from "../../../src/toast";
import { writeSafetySignal } from "../../../src/live/voiceSafety";

const KIND_CHIPS = ["Same here", "Want to start together?", "You've got this", "Reply"] as const;

export default function CircleChat() {
  const { id, joined, reply } = useLocalSearchParams<{ id: string; joined?: string; reply?: string }>();
  const circleId = String(id || "exam-week");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [attach, setAttach] = useState<"" | "menu" | "poll">("");
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", ""]);
  const support = useNabt((s) => s.supportCard);
  const setSupport = useNabt((s) => s.setSupport);
  const caution = useNabt((s) => s.caution);
  const setCaution = useNabt((s) => s.setCaution);
  const campus = useCampus();
  const circle = campus.circles[circleId];
  const members = campus.members[circleId] || [];
  const messages = (campus.messages[circleId] || []).filter((m) => !campus.blocked.includes(m.authorUid));
  const highlight = String(reply || "");

  const send = (body = text, to = replyTo) => {
    const line = body.trim();
    if (!line) return;
    void sendCircleMessage(circleId, line, to ? { replyTo: to } : undefined)
      .then(async () => {
        if (to) {
          await closeKindness(circleId, to).catch(() => undefined);
          if (messages.some((m) => m.id === to && m.kindness)) await answerKindness(circleId, to).catch(() => undefined);
        }
        setText("");
        setReplyTo("");
        setSupport(null);
        setCaution(null);
      })
      .catch((err: unknown) => {
        if (err instanceof OutgoingHalt && err.action === "support") {
          setCaution(null);
          setSupport(err.message);
          if (err.signal) void writeSafetySignal(err.signal).catch(() => undefined);
          router.push("/support" as never);
          return;
        }
        setCaution(err instanceof Error ? err.message : "Message did not send.");
      });
  };

  const halt = (err: unknown, fallback: string) => {
    if (err instanceof OutgoingHalt && err.action === "support") {
      setCaution(null);
      setSupport(err.message);
      if (err.signal) void writeSafetySignal(err.signal).catch(() => undefined);
      router.push("/support" as never);
      return;
    }
    setCaution(err instanceof Error ? err.message : fallback);
  };

  async function pickMedia() {
    setAttach("");
    try {
      const allowed = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!allowed.granted) {
        setCaution("Allow photo access in Settings to share a photo.");
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images", "videos"], quality: 0.6 });
      const asset = picked.canceled ? null : picked.assets[0];
      if (!asset) return;
      const type = asset.type === "video" ? "video" : "photo";
      await sendCircleAttachment(circleId, { type, uri: asset.uri, name: asset.fileName || (type === "video" ? "Video" : "Photo"), width: asset.width, height: asset.height, mimeType: asset.mimeType }, text);
      setText("");
      setCaution(null);
    } catch (err) {
      halt(err, "That didn’t send.");
    }
  }

  async function pickDocument() {
    setAttach("");
    try {
      const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
      const file = picked.canceled ? null : picked.assets[0];
      if (!file) return;
      await sendCircleAttachment(circleId, { type: "document", uri: file.uri, name: file.name, size: file.size, mimeType: file.mimeType }, text);
      setText("");
      setCaution(null);
    } catch (err) {
      halt(err, "That didn’t send.");
    }
  }

  async function sendPoll() {
    try {
      await sendCirclePoll(circleId, question, choices);
      setQuestion("");
      setChoices(["", ""]);
      setAttach("");
      setCaution(null);
    } catch (err) {
      halt(err, "The poll didn’t send.");
    }
  }

  if (!campus.ready) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={circle?.name || ""}
        sub={`${circle?.memberCount ?? members.length} members · `}
        here={circle?.hereCount != null ? `${circle.hereCount} here now` : undefined}
        members={members}
        circleId={circleId}
        joined={members.some((m) => m.id === me())}
      />
      <View style={styles.modRow}>
        <IconShield size={12} color={C.w64} />
        <Text style={styles.mod}>{circle?.modLine}</Text>
      </View>
      <Seg active="chat" id={circleId} />
      {joined ? <Text style={styles.joined}>Joined</Text> : null}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={styles.pin}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pinK}>Today’s prompt</Text>
            <Text style={t(600, 14, 19)}>{circle?.prompt}</Text>
          </View>
          <Text style={styles.pinLink} onPress={() => router.replace(`/circle/${circleId}` as never)}>
            Answer in Space
          </Text>
        </View>
        {messages.map((m) =>
          m.kind === "system" || m.kind === "day" ? (
            <Rule key={m.id}>
              {m.text}
              {m.link ? <Text style={styles.join}> · {m.link}</Text> : null}
            </Rule>
          ) : (
            <View key={m.id}>
              <Bubble circleId={circleId} msg={m} mine={m.authorUid === me()} members={members} highlight={highlight === m.id || replyTo === m.id} onReply={() => setReplyTo(m.id)} />
              {m.kindness && !m.kindnessClosed && m.authorUid !== me() && !messages.some((other) => other.replyTo === m.id) ? (
                <View style={styles.nudge}>
                  <Text style={styles.nudgeTitle}>Someone here could use a hand with this</Text>
                  <Text style={styles.nudgeSub}>Say something kind</Text>
                  <View style={styles.chips}>
                    {KIND_CHIPS.map((chip) => (
                      <Pressable
                        key={chip}
                        accessibilityRole="button"
                        accessibilityLabel={chip}
                        onPress={() => {
                          if (chip === "Reply") {
                            setReplyTo(m.id);
                            return;
                          }
                          send(chip, m.id);
                        }}
                        style={styles.kindChip}
                      >
                        <Text style={styles.kindChipText}>{chip}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ),
        )}
        {support ? (
          <View style={styles.support}>
            <Text style={t(600, 14, 19)}>A private note, only for you</Text>
            <Text style={[t(400, 13, 18), { color: C.w80, marginTop: 4 }]}>{support}</Text>
          </View>
        ) : null}
        {circle?.typing ? (
          <View style={styles.typing}>
            <View style={styles.dots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <Text style={[t(500, 12, 12), { color: C.w64 }]}>{circle.typing} is typing…</Text>
          </View>
        ) : null}
      </ScrollView>
      {caution ? <Text style={styles.caution}>{caution}</Text> : null}
      {attach === "menu" ? (
        <View style={styles.sheet} accessibilityRole="menu" accessibilityLabel="Attach">
          <Pressable accessibilityRole="menuitem" accessibilityLabel="Photo or video" onPress={() => void pickMedia()} style={styles.sheetRow}>
            <Text style={t(600, 15, 18)}>Photo or video</Text>
            <Text style={styles.sheetSub}>From this phone. Your text goes with it as a caption.</Text>
          </Pressable>
          <Pressable accessibilityRole="menuitem" accessibilityLabel="Poll" onPress={() => setAttach("poll")} style={[styles.sheetRow, styles.sheetLine]}>
            <Text style={t(600, 15, 18)}>Poll</Text>
            <Text style={styles.sheetSub}>One question, two to four choices</Text>
          </Pressable>
          <Pressable accessibilityRole="menuitem" accessibilityLabel="Document" onPress={() => void pickDocument()} style={[styles.sheetRow, styles.sheetLine]}>
            <Text style={t(600, 15, 18)}>Document</Text>
            <Text style={styles.sheetSub}>A PDF, notes or slides</Text>
          </Pressable>
        </View>
      ) : null}
      {attach === "poll" ? (
        <View style={styles.sheet}>
          <Text style={styles.pinK}>New poll</Text>
          <TextInput value={question} onChangeText={(v) => setQuestion(v.slice(0, 200))} placeholder="Ask the Circle…" placeholderTextColor={C.w64} style={styles.pollInput} accessibilityLabel="Poll question" />
          {choices.map((c, i) => (
            <TextInput
              key={i}
              value={c}
              onChangeText={(v) => setChoices((cur) => cur.map((x, j) => (j === i ? v.slice(0, 60) : x)))}
              placeholder={`Choice ${i + 1}`}
              placeholderTextColor={C.w64}
              style={styles.pollInput}
              accessibilityLabel={`Choice ${i + 1}`}
            />
          ))}
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 8 }}>
            {choices.length < 4 ? (
              <Text style={styles.pinLink} onPress={() => setChoices((cur) => [...cur, ""])}>Add a choice</Text>
            ) : null}
            <View style={{ flex: 1 }} />
            <Text style={styles.pinLink} onPress={() => setAttach("")}>Cancel</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Send poll" onPress={() => void sendPoll()} style={styles.pollSend}>
              <Text style={[t(700, 13, 16), { color: C.burgundy }]}>Send poll</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={styles.cbar}>
        <View style={styles.capsule}>
          <Pressable accessibilityRole="button" accessibilityLabel="Attach" accessibilityState={{ expanded: attach !== "" }} onPress={() => setAttach((v) => (v ? "" : "menu"))} style={styles.plus}>
            <IconPlus />
          </Pressable>
          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);
              if (caution) setCaution(null);
            }}
            placeholder={replyTo ? "Reply kindly…" : "Share with your circle…"}
            placeholderTextColor={C.w64}
            style={styles.input}
            accessibilityLabel="Share with your circle"
          />
          {text.trim() ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={() => send()} style={styles.send}>
              <IconSendUp />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function Rule({ children }: { children: ReactNode }) {
  return (
    <View style={styles.rule}>
      <View style={styles.ruleLine} />
      <Text style={styles.ruleText}>{children}</Text>
      <View style={styles.ruleLine} />
    </View>
  );
}

function Bubble({ circleId, msg, mine, members, highlight, onReply }: { circleId: string; msg: ChatMsg; mine: boolean; members: { id: string; initial: string }[]; highlight?: boolean; onReply: () => void }) {
  const letter = msg.initial || members.find((m) => m.id === msg.authorUid)?.initial || "";
  const reacts = msg.reactions || [];
  const thanked = (msg.thankedBy || []).includes(me());
  const content = msg.attachment || msg.poll ? (
    <>
      {msg.attachment ? <Attachment item={msg.attachment} mine={mine} /> : null}
      {msg.poll ? <Poll circleId={circleId} messageId={msg.id} question={msg.poll.question} options={msg.poll.options} mine={mine} /> : null}
    </>
  ) : undefined;
  const fail = (what: string) => (err: unknown) => toast(err instanceof Error ? err.message : what);
  return (
    <MessageBubble
      name={msg.authorNickname}
      initial={letter}
      time={msg.timeLabel}
      mine={mine}
      text={msg.text || msg.poll?.question || msg.attachment?.name || ""}
      highlight={highlight}
      thanked={thanked}
      footer={
        reacts.length ? (
          <View style={styles.reactsRow}>
            {reacts.map((r) => (
              <View key={r.icon + r.label} style={[styles.chip, r.mine && styles.chipMine]}>
                {r.icon === "root" ? <IconRootChip /> : <IconHeartChip />}
                <Text style={t(600, 11, 11)}>{r.label}</Text>
              </View>
            ))}
          </View>
        ) : null
      }
      onThanks={() => thankReply({ circleId, messageId: msg.id }).then(() => toast("Thanks sent. A root grew for you both.")).catch(fail("Thanks did not send."))}
      onReply={onReply}
      onReport={() => reportMessage({ circleId, messageId: msg.id }).then(() => toast("Report sent")).catch(fail("Report did not send."))}
      onBlock={() => blockAuthor(msg.authorUid, { circleId, messageId: msg.id }).then(() => toast("Blocked")).catch(fail("Could not block."))}
      onCopy={() => Clipboard.setStringAsync(msg.text || "").then(() => toast("Copied"))}
      onDelete={() => deleteCircleMessage(circleId, msg.id).then(() => toast("Deleted")).catch(fail("Could not delete."))}
    >
      {content}
    </MessageBubble>
  );
}

function Attachment({ item, mine }: { item: ChatAttachment; mine?: boolean }) {
  const ink = mine ? C.ground : C.white;
  if (item.type === "photo") {
    return <Image source={{ uri: item.uri }} accessibilityLabel={item.name} style={[styles.media, item.width && item.height ? { aspectRatio: item.width / item.height } : null]} resizeMode="cover" />;
  }
  if (item.type === "video") {
    return <Video source={{ uri: item.uri }} style={styles.media} useNativeControls resizeMode={ResizeMode.CONTAIN} accessibilityLabel={item.name} />;
  }
  const size = item.size ? (item.size > 1048576 ? `${(item.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(item.size / 1024))} KB`) : "";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
      onPress={() => void Linking.openURL(item.uri).catch(() => toast("This file opens on the phone that shared it."))}
      style={styles.doc}
    >
      <Text style={[t(600, 14, 18), { color: ink }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[t(500, 12, 16), { color: mine ? C.ground : C.w64 }]}>{[item.mimeType?.split("/").pop()?.toUpperCase(), size].filter(Boolean).join(" · ") || "Document"}</Text>
    </Pressable>
  );
}

function Poll({ circleId, messageId, question, options, mine }: { circleId: string; messageId: string; question: string; options: string[]; mine?: boolean }) {
  const [votes, setVotes] = useState<Record<string, number>>({});
  useEffect(() => {
    const { db } = getFirebase();
    return onSnapshot(
      collection(db, "circles", circleId, "messages", messageId, "votes"),
      (snap) => {
        const next: Record<string, number> = {};
        snap.docs.forEach((d) => {
          next[d.id] = Number(d.data().option);
        });
        setVotes(next);
      },
      () => undefined,
    );
  }, [circleId, messageId]);
  const ink = mine ? C.ground : C.white;
  const total = Object.keys(votes).length;
  const myVote = votes[me()];
  return (
    <View style={{ minWidth: 220 }}>
      <Text style={[t(600, 14.5, 20), { color: ink }]}>{question}</Text>
      {options.map((option, i) => {
        const count = Object.values(votes).filter((v) => v === i).length;
        const on = myVote === i;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={`Vote ${option}`}
            accessibilityState={{ selected: on }}
            onPress={() => void votePoll(circleId, messageId, i).catch((err: unknown) => toast(err instanceof Error ? err.message : "Vote didn’t save."))}
            style={[styles.opt, { borderColor: mine ? "rgba(0,0,0,0.2)" : C.w40 }, on && { borderColor: ink, borderWidth: 1.5 }]}
          >
            <View style={[styles.optBar, { width: `${total ? Math.round((count / total) * 100) : 0}%`, backgroundColor: mine ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)" }]} />
            <Text style={[t(600, 13, 16), { color: ink, flex: 1 }]}>{on ? "✓ " : ""}{option}</Text>
            <Text style={[t(600, 12, 16), { color: ink }]}>{count}</Text>
          </Pressable>
        );
      })}
      <Text style={[t(500, 11.5, 14), { color: mine ? C.ground : C.w64, marginTop: 6 }]}>{total} vote{total === 1 ? "" : "s"} · tap to vote</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modRow: { marginTop: -6, paddingLeft: 56, paddingRight: 12, flexDirection: "row", alignItems: "center", gap: 5 },
  mod: { ...t(500, 11, 13), color: C.w64 },
  rule: { marginTop: 18, marginBottom: 6, flexDirection: "row", alignItems: "center", gap: 10 },
  ruleLine: { flex: 1, height: 1, backgroundColor: C.hair },
  ruleText: { ...t(500, 12, 16), color: C.w64, textAlign: "center" },
  pin: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.bubble, borderLeftWidth: 3, borderLeftColor: C.gold },
  pinK: { ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  pinLink: { ...t(600, 12, 12), color: C.white, textDecorationLine: "underline" },
  day: { marginTop: 18, marginBottom: 6, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
  sys: { marginTop: 18, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
  join: { color: C.white, fontWeight: "600", textDecorationLine: "underline" },
  joined: { ...t(600, 14, 18), color: C.gold, textAlign: "center", marginTop: 8 },
  nudge: { marginTop: 8, marginLeft: 40, padding: 12, borderRadius: 14, backgroundColor: C.card },
  nudgeTitle: { ...t(600, 13, 18), color: C.w80 },
  nudgeSub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  kindChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: C.deep },
  kindChipText: { ...t(600, 12, 16), color: C.white },
  reactsRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  grp: { flexDirection: "row", gap: 8, marginTop: 18, alignItems: "flex-start" },
  av: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  who: { ...t(600, 12, 14), color: C.w64, marginBottom: 4 },
  b: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: C.bubble },
  mine: { backgroundColor: C.white, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  reacts: { position: "absolute", left: 10, bottom: -18, flexDirection: "row", gap: 4 },
  chip: { height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: C.ground, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", flexDirection: "row", alignItems: "center", gap: 4 },
  chipMine: { borderColor: C.gold },
  typing: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  dots: { height: 26, paddingHorizontal: 11, borderRadius: 13, backgroundColor: C.bubble, flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.white, opacity: 0.4 },
  support: { marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: C.w16, backgroundColor: C.deep },
  caution: { textAlign: "center", ...t(500, 12, 16), color: C.goldLight, marginBottom: 4 },
  cbar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 28, backgroundColor: C.burgundy },
  capsule: { height: 52, borderRadius: 24, backgroundColor: C.bubble, flexDirection: "row", alignItems: "center", paddingLeft: 6, paddingRight: 8, gap: 6 },
  plus: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, ...t(400, 15, 18), color: C.white, padding: 0 },
  send: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  sheet: { marginHorizontal: 12, marginBottom: 6, padding: 12, borderRadius: 18, backgroundColor: C.card },
  sheetRow: { paddingVertical: 10 },
  sheetLine: { borderTopWidth: 1, borderTopColor: C.hair },
  sheetSub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  pollInput: { marginTop: 8, height: 40, borderRadius: 12, backgroundColor: C.deep, paddingHorizontal: 12, ...t(500, 14, 18), color: C.white },
  pollSend: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  media: { width: 236, height: 180, borderRadius: 12, marginBottom: 6, backgroundColor: C.deep },
  doc: { minWidth: 200, paddingVertical: 4, marginBottom: 4 },
  opt: { marginTop: 8, height: 36, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8, overflow: "hidden" },
  optBar: { position: "absolute", left: 0, top: 0, bottom: 0 },
});
