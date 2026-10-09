import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { IconHeartChip, IconPlus, IconRootChip, IconSendUp, IconShield } from "../../../src/components/Icons";
import { Header, Seg } from "./index";
import { C, t } from "../../../src/theme";
import { useNabt } from "../../../src/state";
import { OutgoingHalt } from "../../../src/moderation/outgoing";
import { blockAuthor, closeKindness, me, reportMessage, sendCircleMessage, thankReply, useCampus, type ChatMsg } from "../../../src/live";
import { toast } from "../../../src/toast";
import { writeSafetySignal } from "../../../src/live/voiceSafety";

const KIND_CHIPS = ["Same here", "Want to start together?", "You've got this", "Reply"] as const;

export default function CircleChat() {
  const { id, joined, reply } = useLocalSearchParams<{ id: string; joined?: string; reply?: string }>();
  const circleId = String(id || "exam-week");
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState("");
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
        if (to) await closeKindness(circleId, to).catch(() => undefined);
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
              <Bubble msg={m} mine={m.authorUid === me()} members={members} highlight={highlight === m.id} onReport={() => reportMessage({ circleId, messageId: m.id })} onBlock={() => void blockAuthor(m.authorUid, { circleId, messageId: m.id })} onThanks={m.replyTo && m.authorUid !== me() ? () => void thankReply({ circleId, messageId: m.id }) : undefined} />
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
      <View style={styles.cbar}>
        <View style={styles.capsule}>
          <Pressable accessibilityRole="button" accessibilityLabel="Attach" onPress={() => setText((v) => (v.startsWith("Photo · ") ? v : `Photo · ${v}`))} style={styles.plus}>
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

function Bubble({ msg, mine, members, highlight, onReport, onBlock, onThanks }: { msg: ChatMsg; mine?: boolean; members: { id: string; initial: string }[]; highlight?: boolean; onReport?: () => void; onBlock?: () => void; onThanks?: () => void }) {
  const letter = msg.initial || members.find((m) => m.id === msg.authorUid)?.initial || "";
  const reacts = msg.reactions || [];
  return (
    <View style={[styles.grp, mine && { justifyContent: "flex-end" }]}>
      {mine ? null : (
        <View style={styles.av}>
          <Text style={[t(600, 13, 13), { color: C.gold }]}>{letter}</Text>
        </View>
      )}
      <View style={{ maxWidth: 262, alignItems: mine ? "flex-end" : "flex-start" }}>
        {mine ? null : (
          <Text style={styles.who}>
            {msg.authorNickname}
            {msg.timeLabel ? <Text style={{ fontWeight: "500" }}>  {msg.timeLabel}</Text> : null}
          </Text>
        )}
        <View style={[styles.b, mine && styles.mine, highlight && { borderWidth: 1.5, borderColor: C.gold }, reacts.length > 0 && { marginBottom: 16 }]}>
          <Text style={[t(400, 14.5, 20), { color: mine ? C.ground : C.white }]}>{msg.text}</Text>
          {reacts.length ? (
            <View style={styles.reacts}>
              {reacts.map((r) => (
                <View key={r.icon + r.label} style={[styles.chip, r.mine && styles.chipMine]}>
                  {r.icon === "root" ? <IconRootChip /> : <IconHeartChip />}
                  <Text style={t(600, 11, 11)}>{r.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {mine ? null : (
          <View style={styles.msgActs}>
            <Pressable accessibilityRole="button" accessibilityLabel="Report message" onPress={() => void Promise.resolve(onReport?.()).then(() => toast("Report sent")).catch((err: unknown) => toast(err instanceof Error ? err.message : "Report did not send."))}><Text style={styles.msgAct}>Report</Text></Pressable>
            <Text style={styles.msgAct} onPress={onBlock}>Block</Text>
            {onThanks ? <Text style={styles.msgAct} onPress={onThanks}>Thanks</Text> : null}
          </View>
        )}
      </View>
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
  msgActs: { flexDirection: "row", gap: 10, marginTop: 4 },
  msgAct: { ...t(600, 11, 14), color: C.w64 },
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
});
