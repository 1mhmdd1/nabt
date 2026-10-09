import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Notifications from "expo-notifications";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { demoLocal } from "../../src/local/mode";
import { Screen, GoldButton, Avatar } from "../../src/components/Chrome";
import { IconChevronRight } from "../../src/components/Icons";
import { LotusArt } from "../../src/components/LotusArt";
import { BackBar, BreathRing, GhostButton, Kicker, useScreenReady } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";
import { setDropGoing, useCampus } from "../../src/live";
import { joinSpotCircle, nodeCheckIn, postNodeNote, useNodeRewards, watchNode } from "../../src/live/nodeRewards";
import { openNodeSession, nodeSessionUntil } from "../../src/nodeSession";

export default function NodePhone() {
  if (demoLocal()) return <Redirect href="/home" />;
  return <NodePhoneLive />;
}

function NodePhoneLive() {
  const { nodeId, view, static: frozenFlag } = useLocalSearchParams<{ nodeId: string; view?: string; static?: string }>();
  const id = nodeId || "engineering";
  const frozen = frozenFlag === "1";
  const rewards = useNodeRewards();
  const node = rewards.nodes[id];
  const notes = rewards.notes[id] || [];
  const page = view || "home";
  const [open, setOpen] = useState(false);
  useEffect(() => {
    watchNode(id);
  }, [id]);
  useEffect(() => {
    void nodeSessionUntil(id).then((until) => {
      if (until > 0) setOpen(true);
    });
  }, [id]);
  useEffect(() => {
    if (rewards.checkedIn[id]) setOpen(true);
  }, [id, rewards.checkedIn]);
  const readyName = page === "drop" ? "phone-12b" : page === "note" ? "phone-12c" : page === "live" ? "phone-12d" : page === "offline" ? "phone-12e" : page === "tap" ? "phone-s54" : "phone-12a";
  useScreenReady(readyName, rewards.ready);
  if (!rewards.ready) return <Screen><Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text></Screen>;

  if (!open && page === "home") return <Scan nodeId={id} onDone={() => setOpen(true)} />;
  if (page === "drop") return <Drop nodeId={id} nodeName={node?.name || "Faculty of Engineering"} frozen={frozen} />;
  if (page === "note") return <Composer nodeId={id} place={node?.name || "Faculty of Engineering"} queue={node?.queueLine || ""} />;
  if (page === "live") return <Live place={node?.name || "Faculty of Engineering"} seconds={node?.phoneLiveSeconds || 14} frozen={frozen} />;
  if (page === "offline") return <Offline node={node} />;
  if (page === "tap") return <Tap node={node} />;
  return <Home nodeId={id} notes={notes.length} />;
}

function Scan({ nodeId, onDone }: { nodeId: string; onDone: () => void }) {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Screen>
      <BackBar title="Scan the node" />
      <View style={styles.pad}>
        <Text style={t(600, 22, 28)}>Scan the node</Text>
        <Text style={[t(400, 15, 22), { color: C.w80, marginTop: 8 }]}>Point your camera at the tablet code, or type the code it shows.</Text>
        <TextInput value={token} onChangeText={setToken} placeholder="Node code" placeholderTextColor={C.w64} accessibilityLabel="Node code" autoCapitalize="none" style={[t(500, 16, 22), { marginTop: 16, minHeight: 48, color: C.white, backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14 }]} />
        {err ? <Text style={{ marginTop: 8 }}>{err}</Text> : null}
        <View style={{ marginTop: 16 }}>
          <GoldButton
            label={busy ? "Checking in…" : "Check in"}
            disabled={busy || token.trim().length < 8}
            onPress={() => {
              setBusy(true);
              setErr("");
              void nodeCheckIn(nodeId, { token: token.trim() })
                .then(async () => {
                  await openNodeSession(nodeId);
                  onDone();
                })
                .catch((e: unknown) => {
                  setErr(e instanceof Error ? e.message : "That code did not work.");
                  setBusy(false);
                });
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

function Home({ nodeId, notes }: { nodeId: string; notes: number }) {
  const rewards = useNodeRewards();
  const node = rewards.nodes[nodeId];
  const drop = rewards.drop;
  const takeTime = useNabt((s) => s.nodeTakeYourTime);
  return (
    <Screen>
      <View style={{ flex: 1, marginTop: -24 }}>
      <BackBar title={`Checked in at ${node?.name || "Faculty of Engineering"}`} />
      <View style={styles.pad}>
        <View style={{ alignItems: "center", paddingTop: 18 }}>
          <View>
            <LotusArt width={120} height={83} />
            <View style={styles.plus}>
              <Text style={[t(700, 13, 16), { color: C.burgundy }]}>+1 petal</Text>
            </View>
          </View>
          <Text style={[t(700, 24, 30), { marginTop: 18, textAlign: "center" }]}>Checked in at {node?.name || "Faculty of Engineering"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <View style={styles.dot} />
            <Text style={[t(500, 13, 16), { color: C.w64 }]}>Node awake · {node?.clockLabel || "1:12 PM"}</Text>
          </View>
        </View>
        {takeTime ? (
          <Pressable accessibilityRole="link" onPress={() => router.push("/a11y/node" as never)} style={styles.time}>
            <Text style={styles.timeText}>Take your time. No countdown.</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.drop} onPress={() => router.push(`/n/${nodeId}?view=drop&static=1` as never)}>
          <View style={styles.dropIcon}>
            <BreathRing size={52} label="" frozen />
          </View>
          <View style={{ flex: 1 }}>
            <Kicker>Today’s drop</Kicker>
            <Text style={[t(600, 16, 20), { marginTop: 4 }]}>{drop?.title} · {drop?.window}</Text>
            <Text style={[t(400, 13, 18), { marginTop: 4, color: "rgba(255,255,255,0.75)" }]}>{drop?.short}</Text>
          </View>
        </Pressable>
        <View style={{ gap: 8, marginTop: 12 }}>
          <Row n={String(notes)} title="Fresh notes on the screen" sub="Cleared every night" onPress={() => router.push("/notes" as never)} />
          <Row title="Leave a note" sub="Shows under your nickname" onPress={() => router.push(`/n/${nodeId}?view=note` as never)} />
          <Row title="Join this spot’s Circle" sub={`${node?.circleName || "This spot’s Circle"} · ${node?.memberCount ?? 0} members`} onPress={() => router.push(`/n/${nodeId}?view=tap` as never)} />
        </View>
      </View>
      </View>
    </Screen>
  );
}

async function setDropReminder(on: boolean, title: string) {
  if (!on) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  const perm = await Notifications.requestPermissionsAsync();
  if (perm.status !== "granted") return;
  await Notifications.scheduleNotificationAsync({
    content: { title: "Today’s drop", body: title || "A short pause is coming up." },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 30 * 60, repeats: false },
  });
}

function Drop({ nodeId, nodeName, frozen }: { nodeId: string; nodeName: string; frozen: boolean }) {
  const drop = useNodeRewards((s) => s.drop);
  const going = useCampus((s) => s.dropGoing);
  const [there, setThere] = useState(going);
  const [reminded, setReminded] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    setThere(going);
  }, [going]);
  return (
    <Screen>
      <BackBar title="Today’s drop" />
      <View style={[styles.pad, { alignItems: "center", paddingTop: 8 }]}>
        <Kicker>{`${nodeName} node`}</Kicker>
        <Text style={[t(700, 28, 34), { marginTop: 8 }]}>{drop?.title}</Text>
        <Text style={[t(500, 15, 20), { marginTop: 4, color: C.w64 }]}>Today · {drop?.window}</Text>
        <View style={{ marginTop: 18 }}>
          <BreathRing size={220} frozen={frozen} />
        </View>
        <Text style={[t(400, 15, 22), { marginTop: 16, textAlign: "center", color: C.w80 }]}>{drop?.body}</Text>
        {note ? <Text accessibilityLabel="Drop confirmation" style={{ marginTop: 12 }}>{note}</Text> : null}
        <View style={{ width: "100%", marginTop: 22, gap: 10 }}>
          <GoldButton
            label={there ? "Can’t make it" : "I’ll be there"}
            onPress={() => {
              if (there) {
                setThere(false);
                setNote("");
                void setDropGoing(false);
                return;
              }
              setThere(true);
              setNote("You’re going. See you there.");
              void setDropGoing(true).then(() => setTimeout(() => router.back(), 500));
            }}
          />
          <GhostButton
            label={reminded ? "Cancel reminder" : drop?.remind || "Remind me"}
            onPress={() => {
              const next = !reminded;
              setReminded(next);
              setNote(next ? "Reminder set." : "Reminder cancelled.");
              void setDropReminder(next, drop?.title || "").then(() => {
                if (next) setTimeout(() => router.back(), 500);
              });
            }}
          />
        </View>
        <Text style={[t(500, 12, 16), { marginTop: 14, color: C.w64 }]}>Drops change daily at 8 AM</Text>
      </View>
    </Screen>
  );
}

function Composer({ nodeId, place, queue }: { nodeId: string; place: string; queue: string }) {
  const rewards = useNodeRewards();
  const [text, setText] = useState(rewards.draftText);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (rewards.draftText && !text) setText(rewards.draftText);
  }, [rewards.draftText, text]);
  const send = async () => {
    try {
      await postNodeNote(nodeId, text);
      router.push(`/n/${nodeId}?view=live` as never);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Try again in a moment.");
    }
  };
  return (
    <Screen>
      <BackBar title="Leave a note" />
      <View style={styles.pad}>
        <Text style={[t(400, 15, 22), { color: C.w80 }]}>One line for everyone who passes {place} today.</Text>
        <View style={styles.noteBox}>
          <TextInput
            value={text}
            onChangeText={(v) => setText(v.slice(0, 80))}
            maxLength={80}
            multiline
            style={[t(500, 18, 24), { minHeight: 76, color: C.white }]}
            accessibilityLabel="Node note, up to 80 characters"
          />
        </View>
        <View style={styles.noteFoot}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Avatar letter={rewards.initial || "C"} size={28} font={13} />
            <Text style={t(600, 13, 16)}>{rewards.nickname || "A student"}</Text>
          </View>
          <Text style={[t(600, 12.5, 16), { color: C.w70 }]}>{text.length} / 80</Text>
        </View>
        <Text style={[t(500, 12, 16), { marginTop: 10, color: C.w64 }]}>Notes are checked on your phone before they show</Text>
        <View style={styles.mini}>
          <Text style={[t(600, 11, 13), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>On the node</Text>
          <Text style={[t(600, 16, 22), { marginTop: 8, textAlign: "center" }]}>“{text}”</Text>
          <Text style={[t(500, 11, 14), { marginTop: 8, color: C.w64 }]}>{rewards.nickname}</Text>
        </View>
        <Text style={[t(500, 12, 16), { marginTop: 12, color: C.w64 }]}>{queue}</Text>
        {err ? <Text style={[t(500, 12, 16), { color: C.w80, marginTop: 8 }]}>{err}</Text> : null}
        <View style={{ marginTop: 16 }}>
          <GoldButton label="Send to the node" onPress={send} />
        </View>
      </View>
    </Screen>
  );
}

function Live({ place, seconds, frozen }: { place: string; seconds: number; frozen: boolean }) {
  const rewards = useNodeRewards();
  const [left, setLeft] = useState(seconds);
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (frozen) return;
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, frozen]);
  const line = rewards.draftText;
  return (
    <Screen>
      <BackBar title={`${place} node`} />
      <View style={[styles.pad, { alignItems: "center" }]}>
        <Text style={[t(700, 24, 30), { textAlign: "center" }]}>Your note is on the screen now</Text>
        <Text style={[t(600, 16, 20), { marginTop: 14 }]}>Take a photo!</Text>
        <Text style={[t(700, 42, 46), { marginTop: 6 }]}>{frozen ? seconds : left}</Text>
        <Text style={[t(500, 13, 16), { color: C.w64 }]}>seconds</Text>
        <View style={styles.mini}>
          <Text style={[t(600, 16, 22), { textAlign: "center" }]}>“{line}”</Text>
          <Text style={[t(500, 11, 14), { marginTop: 8, color: C.w64 }]}>{rewards.nickname}</Text>
        </View>
        <Text style={[t(500, 13, 18), { marginTop: 14, color: C.w64, textAlign: "center" }]}>After 20 s the node goes back to its note rotation.</Text>
        <View style={{ width: "100%", marginTop: 18 }}>
          <GhostButton label="Share story card" onPress={() => router.push("/story" as never)} />
        </View>
      </View>
    </Screen>
  );
}

function Offline({ node }: { node?: { name: string; phoneOffline: string } }) {
  const drop = useNodeRewards((s) => s.drop);
  return (
    <Screen>
      <BackBar title={`${node?.name || "Faculty of Engineering"} node`} />
      <View style={[styles.pad, { alignItems: "center", paddingTop: 12 }]}>
        <LotusArt width={120} height={83} faded />
        <Text style={[t(700, 26, 32), { marginTop: 16 }]}>This node is resting</Text>
        <Text style={[t(400, 15, 22), { marginTop: 8, textAlign: "center", color: C.w80 }]}>{node?.phoneOffline}</Text>
        <View style={{ width: "100%", marginTop: 18, gap: 8 }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14.5, 18)}>Check-in saved</Text>
              <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 3 }]}>+1 petal · syncs later</Text>
            </View>
            <Text style={[t(600, 12, 14), { color: C.w64 }]}>Queued</Text>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Kicker>Today’s drop</Kicker>
              <Text style={[t(600, 14.5, 18), { marginTop: 4 }]}>{drop?.phoneLine}</Text>
            </View>
          </View>
        </View>
        <View style={{ width: "100%", marginTop: 18 }}>
          <GoldButton label="Breathe on my phone" onPress={() => router.push("/n/engineering?view=drop" as never)} />
        </View>
      </View>
    </Screen>
  );
}

function Tap({ node }: { node?: { name: string; circleId: string; circleName: string; memberCount: number } }) {
  const nick = useNodeRewards((s) => s.nickname);
  const [joined, setJoined] = useState(false);
  return (
    <Screen>
      <BackBar title={`${node?.name || "Faculty of Engineering"} node`} />
      <View style={styles.pad}>
        <Text style={[t(500, 15, 20), { color: C.w80 }]}>You tapped the Circle tag.</Text>
        <Text style={[t(700, 26, 32), { marginTop: 10 }]}>Join {node?.circleName || "Engineering quiet hour"}?</Text>
        <Text style={[t(500, 14, 20), { marginTop: 6, color: C.w64 }]}>Place Circle · {node?.memberCount ?? 0} members · nicknames only</Text>
        <View style={{ marginTop: 22, gap: 10 }}>
          <GoldButton
            label={joined ? "You’re in this Circle" : "Join this spot’s Circle"}
            onPress={async () => {
              if (node?.circleId) await joinSpotCircle(node.circleId, nick || "A student");
              setJoined(true);
            }}
          />
          <GhostButton label="Just check in" onPress={() => router.push("/n/engineering" as never)} />
        </View>
        <Text style={[styles.k, { marginTop: 22 }]}>Other tag results</Text>
        {["Check-in tag → +1 petal", "Phone tap → node page", "Not signed in → sign in first", "Invalid tag"].map((line) => (
          <Text key={line} style={[t(500, 14, 22), { color: C.w80, marginTop: 6 }]}>{line}</Text>
        ))}
      </View>
    </Screen>
  );
}

function Row({ title, sub, n, onPress }: { title: string; sub: string; n?: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {n ? <Text style={t(700, 18, 18)}>{n}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={t(600, 14.5, 18)}>{title}</Text>
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 3 }]}>{sub}</Text>
      </View>
      <IconChevronRight />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 24 },
  time: { marginTop: 14, alignSelf: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" },
  timeText: { ...t(600, 13, 16), color: C.white },
  plus: { position: "absolute", right: -36, top: -6, height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: C.white, justifyContent: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.white },
  drop: { marginTop: 22, borderRadius: 18, backgroundColor: C.card, padding: 14, flexDirection: "row", gap: 14, alignItems: "center" },
  dropIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: C.card },
  noteBox: { marginTop: 14, padding: 16, borderRadius: 18, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.white },
  noteFoot: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  mini: { marginTop: 18, borderRadius: 14, backgroundColor: C.ground, padding: 18, alignItems: "center", borderWidth: 1, borderColor: C.w16 },
  k: { ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
});
