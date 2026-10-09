import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Redirect, useLocalSearchParams } from "expo-router";
import { demoLocal } from "../../src/local/mode";
import { LotusArt } from "../../src/components/LotusArt";
import { LinkQr } from "../../src/components/LinkQr";
import { BreathRing, useScreenReady } from "../../src/components/NodeChrome";
import { useWakeLock } from "../../src/components/useWakeLock";
import { C, t } from "../../src/theme";
import { ensureNode, fetchNodeToken, nodeCheckIn, nodeEventLive, useNodeRewards, watchNode } from "../../src/live/nodeRewards";
import { checkInUrl, nodeCheckInUrl, useEventCopy } from "../../src/live/eventCheckin";

const IDLE_MS = 3 * 60 * 1000;

type Mode = "idle" | "event" | "checkin" | "photo" | "breathing" | "phone" | "bloom" | "offline" | "already" | "unknown" | "empty";

const SCREEN_NAME: Record<Mode, string> = {
  idle: "kiosk-idle",
  event: "kiosk-event",
  checkin: "kiosk-checkin",
  photo: "kiosk-photo",
  breathing: "kiosk-breathing",
  phone: "kiosk-phone",
  bloom: "kiosk-bloom",
  offline: "kiosk-offline",
  already: "kiosk-already",
  unknown: "kiosk-unknown",
  empty: "kiosk-empty",
};

export default function Kiosk() {
  if (demoLocal()) return <Redirect href="/home" />;
  return <KioskLive />;
}

function KioskLive() {
  const { nodeId, screen, static: frozenFlag } = useLocalSearchParams<{ nodeId: string; screen?: string; static?: string }>();
  const id = nodeId || "engineering";
  const frozen = frozenFlag === "1";
  const rewards = useNodeRewards();
  const node = rewards.nodes[id];
  const notes = rewards.notes[id] || [];
  const { width, height } = useWindowDimensions();
  const narrow = width < 720;
  const scale = Math.min(width / 800, height / 480);
  const initial = (screen as Mode) || "idle";
  const [mode, setMode] = useState<Mode>(initial);
  const [idx, setIdx] = useState(2);
  const [backIn, setBackIn] = useState(3);
  const [photoLeft, setPhotoLeft] = useState(20);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const arrival = rewards.live[id];
  const eventCopy = useEventCopy(node?.mode === "event" ? node.eventId : "");
  const checkLink = nodeCheckInUrl(id);
  useWakeLock(!frozen);

  useEffect(() => {
    // First open on an empty campus: the node writes its own document, then listens to it.
    void ensureNode(id).finally(() => watchNode(id));
  }, [id]);

  useScreenReady(SCREEN_NAME[mode] || "kiosk-idle", rewards.ready);

  useEffect(() => {
    if (frozen || !screen) return;
    setMode(screen as Mode);
  }, [screen, frozen]);

  useEffect(() => {
    if (screen) return;
    const live = nodeEventLive(node);
    setMode((current) => {
      if (live) return current === "checkin" || current === "breathing" || current === "photo" ? current : "event";
      return current === "event" ? "idle" : current;
    });
  }, [node, screen]);

  useEffect(() => {
    let stop = false;
    const pull = () => {
      void fetchNodeToken(id).then((next) => {
        if (!stop && next) setToken(next);
      });
    };
    pull();
    const timer = setInterval(pull, 60000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    if (frozen || screen) return;
    if (arrival?.event !== "checkin" || !arrival.at) return;
    if (Date.now() - arrival.at > 20000) return;
    setMode("checkin");
  }, [arrival?.event, arrival?.at, frozen, screen]);

  const featured = node?.featuredOrder ?? 3;
  useEffect(() => {
    setIdx(Math.max(0, featured - 1));
  }, [featured]);

  useEffect(() => {
    if (frozen || mode !== "idle" || notes.length === 0) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % notes.length), 7000);
    return () => clearInterval(timer);
  }, [frozen, mode, notes.length]);

  useEffect(() => {
    if (frozen || mode === "idle" || mode === "event" || mode === "empty" || mode === "offline") return;
    const timer = setTimeout(() => setMode("idle"), IDLE_MS);
    return () => clearTimeout(timer);
  }, [mode, frozen]);

  useEffect(() => {
    if (mode !== "checkin") {
      setBackIn(3);
      return;
    }
    if (frozen) return;
    if (backIn <= 0) {
      setMode("idle");
      return;
    }
    const timer = setTimeout(() => setBackIn((b) => b - 1), 1000);
    return () => clearTimeout(timer);
  }, [mode, backIn, frozen]);

  useEffect(() => {
    if (mode !== "photo") {
      setPhotoLeft(node?.photoSeconds || 20);
      return;
    }
    if (frozen) return;
    if (photoLeft <= 0) {
      setMode("idle");
      return;
    }
    const timer = setTimeout(() => setPhotoLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [mode, photoLeft, frozen, node?.photoSeconds]);

  const tapIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await nodeCheckIn(id, { kiosk: true });
      setMode(res.already ? "already" : "checkin");
    } catch {
      setMode(rewards.checkedIn[id] ? "already" : "unknown");
    } finally {
      setBusy(false);
    }
  };

  const note = notes[idx] || notes[0];
  const clock = node?.clockLabel || "1:12 PM";
  const place = node?.name || "Faculty of Engineering";
  const nick = (mode === "checkin" && arrival?.nickname) || rewards.nickname || "A student";

  const stageStyle = narrow
    ? { width: "100%" as const, minHeight: height, backgroundColor: C.ground }
    : ({ width: 800, height: 480, backgroundColor: C.ground, transform: [{ scale }], transformOrigin: "top left" } as object);

  return (
    <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: C.ground, alignItems: narrow ? "stretch" : "center", justifyContent: narrow ? "flex-start" : "center" }}>
      <View style={narrow ? { flex: 1 } : { width: 800 * scale, height: 480 * scale, overflow: "hidden" }}>
        <ScrollView scrollEnabled={narrow} contentContainerStyle={narrow ? { paddingBottom: 28 } : undefined}>
        <View style={stageStyle}>
          <View style={{ minHeight: 56, paddingHorizontal: narrow ? 20 : 28, paddingTop: narrow ? 16 : 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LotusArt width={38} height={26} />
              <Text style={t(700, 15, 15)}>NABT</Text>
              <Text style={[t(500, 15, 15), { color: "rgba(255,255,255,0.64)", flex: 1 }]} numberOfLines={1}>· {place}</Text>
            </View>
            <Text
              accessibilityLabel={[mode === "event" ? "Event mode" : "Hope Node", token ? `Node code ${token}` : "", node?.scheduleLine || ""].filter(Boolean).join(". ")}
              style={t(600, narrow ? 16 : 22, narrow ? 20 : 22)}
            >
              {mode === "event" ? "Event mode" : "Hope Node"}
            </Text>
            <Text style={t(600, 16, 16)}>{clock}</Text>
          </View>
          {mode === "event" ? (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 48, paddingHorizontal: 40 }}>
              <View style={{ maxWidth: 420 }}>
                <Text style={[t(600, 13, 16), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>Event check-in</Text>
                <Text style={[t(700, 36, 42), { marginTop: 12 }]}>{eventCopy.title || node?.eventTitle || "Event"}</Text>
                <Text style={[t(500, 18, 24), { marginTop: 8, color: C.w80 }]}>{eventCopy.place || place}</Text>
                {eventCopy.screenDescription ? (
                  <Text style={[t(500, 16, 22), { marginTop: 12, color: C.w64 }]} numberOfLines={2}>
                    {eventCopy.screenDescription}
                  </Text>
                ) : null}
                {eventCopy.window ? <Text style={[t(600, 18, 24), { marginTop: 10 }]}>{eventCopy.window}</Text> : null}
              </View>
              <View style={{ alignItems: "center" }}>
                <View style={{ padding: 8, borderRadius: 22, borderWidth: 3, borderColor: C.gold, backgroundColor: C.white }}>
                  <LinkQr value={checkInUrl(node?.eventId || "")} size={180} />
                </View>
                <Text style={[t(600, 14, 18), { marginTop: 10 }]}>/e/{node?.eventId}/checkin</Text>
              </View>
            </View>
          ) : null}
          {mode === "idle" ? (
            <Idle
              note={note}
              index={note ? notes.indexOf(note) : idx}
              total={notes.length}
              dropTitle={rewards.drop?.title || "Slow breathing"}
              dropWhen={rewards.drop?.window || "Any time · 30 seconds"}
              onDrop={() => setMode("breathing")}
              onCheck={tapIn}
              onNote={() => setMode("phone")}
              checkLink={checkLink}
              narrow={narrow}
            />
          ) : null}
          {mode === "empty" ? (
            <Empty line={node?.emptyLine || ""} foot={node?.emptyFoot || ""} onCheck={tapIn} onNote={() => setMode("phone")} />
          ) : null}
          {mode === "checkin" ? (
            <Center>
              <View style={{ alignItems: "center" }}>
                <LotusArt width={160} height={110} />
                <View style={{ position: "absolute", right: -20, top: 0, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: C.white, justifyContent: "center" }}>
                  <Text style={[t(700, 18, 18), { color: C.burgundy }]}>+1 petal</Text>
                </View>
              </View>
              <Text style={[t(700, 40, 44), { marginTop: 26 }]}>Welcome, {nick}</Text>
              <Text style={[t(500, 18, 22), { marginTop: 12, color: C.w80 }]}>{node?.checkinLine || "Checked in at Faculty of Engineering · see your phone"}</Text>
              <View style={{ marginTop: 26, width: 200, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.14)" }}>
                <View style={{ width: "60%", height: 4, borderRadius: 2, backgroundColor: C.white }} />
              </View>
              <Text style={[t(500, 12, 14), { marginTop: 8, color: C.w64 }]}>Back to notes in {frozen ? 3 : backIn} s</Text>
            </Center>
          ) : null}
          {mode === "photo" ? (
            <View style={{ flex: 1 }}>
              <Center>
                <Text style={[t(600, 14, 16), { letterSpacing: 1.4, textTransform: "uppercase" }]}>Photo time!</Text>
                <Text style={[t(700, 42, 52), { marginTop: 20, textAlign: "center", maxWidth: 620 }]}>“{note?.text || ""}”</Text>
                <Text style={[t(600, 18, 22), { marginTop: 18, color: C.w80 }]}>— {note?.nickname || nick}</Text>
              </Center>
              <View style={{ position: "absolute", right: 26, bottom: 24, width: 96, height: 96, alignItems: "center", justifyContent: "center" }}>
                <Svg width={96} height={96} viewBox="0 0 96 96">
                  <Circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.35)" strokeWidth={4} fill="none" />
                </Svg>
                <Text style={[t(700, 28, 28), { position: "absolute" }]}>{frozen ? node?.photoSeconds || 20 : photoLeft}</Text>
              </View>
            </View>
          ) : null}
          {mode === "breathing" ? (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 56 }}>
              <BreathRing size={300} frozen={frozen} rings={1} />
              <View style={{ maxWidth: 280 }}>
                <Text style={[t(600, 12, 14), { letterSpacing: 1.4, textTransform: "uppercase", color: C.w64 }]}>
                  {rewards.drop?.title || "Breathing hour"} · {rewards.drop?.window || "1–2 PM"}
                </Text>
                <Text style={[t(700, 46, 50), { marginTop: 12 }]}>{rewards.drop?.durationLabel || "3:20"}</Text>
                <Text style={[t(500, 16, 22), { marginTop: 10, color: C.w80 }]}>{rewards.drop?.guide}</Text>
                <Text style={[t(500, 16, 22), { color: C.w80 }]}>{rewards.drop?.follow}</Text>
                <Pressable accessibilityRole="button" onPress={() => setMode("idle")} style={stopPill}>
                  <Text style={t(600, 18, 18)}>Stop</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          {mode === "phone" ? (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 48, paddingHorizontal: 40 }}>
              <View style={{ maxWidth: 380 }}>
                <Text style={t(700, 34, 40)}>Daily check-in and a note</Text>
                <Text style={[t(500, 17, 24), { marginTop: 14, color: C.w80 }]}>
                  Your account stays on your phone. The node only shows your nickname.
                </Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 22 }}>
                  <View style={pill}>
                    <Text style={t(600, 18, 18)}>Tap your phone</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => setMode("idle")} style={[pill, { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)" }]}>
                    <Text style={t(600, 18, 18)}>Back</Text>
                  </Pressable>
                </View>
              </View>
              <View style={{ alignItems: "center" }}>
                <View style={{ padding: 8, borderRadius: 22, borderWidth: 3, borderColor: C.gold, backgroundColor: C.white }}>
                  <LinkQr value={checkLink} size={180} />
                </View>
                <Text style={[t(600, 14, 18), { marginTop: 10 }]}>/n/{id}?checkin=1</Text>
                <Text style={[t(500, 13, 16), { marginTop: 4, color: C.w70 }]}>Daily check-in · leave a note</Text>
              </View>
            </View>
          ) : null}
          {mode === "bloom" ? (
            <Center>
              <LotusArt width={180} height={124} />
              <Text style={[t(700, 40, 46), { marginTop: 22 }]}>{node?.bloomsToday || 3} blooms on campus today</Text>
              <Text style={[t(500, 18, 24), { marginTop: 12, color: C.w80 }]}>{node?.bloomLine}</Text>
            </Center>
          ) : null}
          {mode === "offline" ? (
            <Center>
              <LotusArt width={160} height={110} faded />
              <Text style={[t(700, 36, 42), { marginTop: 18 }]}>Resting for a moment</Text>
              <Text style={[t(500, 18, 24), { marginTop: 12, color: C.w80, textAlign: "center", maxWidth: 560 }]}>{node?.offlineBody}</Text>
              <Text style={[t(500, 14, 18), { marginTop: 16, color: C.w64 }]}>Last update {node?.offlineAt} · reconnecting…</Text>
            </Center>
          ) : null}
          {mode === "already" ? (
            <Center>
              <Text style={[t(700, 36, 42), { textAlign: "center" }]}>You’re already here today, {nick}</Text>
              <Text style={[t(500, 18, 24), { marginTop: 14, color: C.w80, textAlign: "center", maxWidth: 560 }]}>
                One check-in per node per day. Come back tomorrow for a new petal.
              </Text>
            </Center>
          ) : null}
          {mode === "unknown" ? (
            <Center>
              <Text style={t(700, 36, 42)}>We couldn’t read that</Text>
              <Text style={[t(500, 18, 24), { marginTop: 14, color: C.w80, textAlign: "center" }]}>
                Hold your UA card or phone flat on the reader for a second.
              </Text>
              <Text style={[t(500, 16, 22), { marginTop: 10, color: C.w64 }]}>Not signed in yet? Open NABT on your phone first.</Text>
              <Pressable accessibilityRole="button" onPress={() => setMode("idle")} style={[pill, { marginTop: 22 }]}>
                <Text style={t(600, 18, 18)}>Try again</Text>
              </Pressable>
            </Center>
          ) : null}
        </View>
        </ScrollView>
      </View>
    </View>
  );
}

const pill = {
  minHeight: 64,
  paddingHorizontal: 26,
  borderRadius: 32,
  backgroundColor: "rgba(255,255,255,0.10)",
  alignItems: "center" as const,
  justifyContent: "center" as const,
  marginTop: 24,
};

const stopPill = {
  ...pill,
  alignSelf: "flex-start" as const,
};

function Center({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>{children}</View>;
}

function Idle({
  note,
  index,
  total,
  dropTitle,
  dropWhen,
  onDrop,
  onCheck,
  onNote,
  checkLink,
  narrow,
}: {
  note?: { text: string; nickname: string };
  index: number;
  total: number;
  dropTitle: string;
  dropWhen: string;
  onDrop: () => void;
  onCheck: () => void;
  onNote: () => void;
  checkLink: string;
  narrow?: boolean;
}) {
  const shown = Math.max(total, 1);
  const at = Math.min(index, shown - 1);
  return (
    <View style={{ flex: narrow ? undefined : 1, flexDirection: narrow ? "column" : "row", gap: 24, paddingHorizontal: narrow ? 20 : 28, paddingBottom: 24 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        {note?.text ? (
          <>
            <Text style={[t(600, 12, 14), { letterSpacing: 1.6, textTransform: "uppercase", color: C.w64 }]}>
              Notes from today · {at + 1} of {total || shown}
            </Text>
            <Text style={[t(600, 34, 44), { marginTop: 16 }]}>“{note.text}”</Text>
            <Text style={[t(500, 16, 20), { marginTop: 14, color: C.w70 }]}>— {note.nickname || "A student"}</Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 22 }}>
              {Array.from({ length: Math.min(6, shown) }).map((_, i) => (
                <View key={i} style={{ width: i === at % 6 ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i === at % 6 ? C.white : "rgba(255,255,255,0.3)" }} />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={[t(600, 12, 14), { letterSpacing: 1.6, textTransform: "uppercase", color: C.w64 }]}>Notes from today</Text>
            <Text style={[t(600, narrow ? 28 : 34, narrow ? 34 : 44), { marginTop: 16 }]}>No notes yet today.</Text>
            <Text style={[t(500, 16, 22), { marginTop: 14, color: C.w70 }]}>Be the first. Tap “Leave a note” and write one kind line for whoever comes next.</Text>
          </>
        )}
      </View>
      <View style={{ width: narrow ? "100%" : 280, justifyContent: "center", gap: 12 }}>
        <View style={{ alignItems: "center", padding: 10, borderRadius: 22, borderWidth: 3, borderColor: C.gold, backgroundColor: C.white }}>
          <LinkQr value={checkLink} size={156} />
        </View>
        <Text style={[t(600, 15, 18), { textAlign: "center" }]}>Scan to check in</Text>
        <Pressable accessibilityRole="button" onPress={onDrop} style={{ minHeight: 72, padding: 14, borderRadius: 20, backgroundColor: C.card, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <BreathRing size={56} label="" frozen />
          <View style={{ flex: 1 }}>
            <Text style={[t(600, 12, 14), { letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 }]}>Today’s drop</Text>
            <Text style={[t(600, 17, 20), { marginTop: 4 }]}>{dropTitle}</Text>
            <Text style={[t(500, 13, 16), { color: C.w70 }]}>{dropWhen}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCheck} style={{ minHeight: 64, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", flexDirection: "row", gap: 12, alignItems: "center" }}>
          <TapMark />
          <Text style={[t(600, 16, 20), { flex: 1 }]}>Or tap here</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onNote} style={[pill, { marginTop: 0, minHeight: 64 }]}>
          <Text style={t(600, 18, 18)}>Leave a note</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Empty({ line, foot, onCheck, onNote }: { line: string; foot: string; onCheck: () => void; onNote: () => void }) {
  return (
    <View style={{ flex: 1, flexDirection: "row", paddingHorizontal: 28, paddingBottom: 24, gap: 24 }}>
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={[t(600, 12, 14), { letterSpacing: 1.6, textTransform: "uppercase", color: C.w64 }]}>Notes from today</Text>
        <Text style={[t(600, 34, 42), { marginTop: 16 }]}>{line}</Text>
        <Text style={[t(600, 28, 34), { marginTop: 8 }]}>Be the first kind line.</Text>
        <Text style={[t(500, 16, 22), { marginTop: 16, color: C.w70 }]}>{foot}</Text>
      </View>
      <View style={{ width: 260, justifyContent: "center", gap: 12 }}>
        <Pressable onPress={onCheck} style={{ padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)" }}>
          <Text style={t(600, 17, 22)}>Tap your card or phone to check in</Text>
        </Pressable>
        <Pressable onPress={onNote} style={[pill, { marginTop: 0 }]}>
          <Text style={t(600, 18, 18)}>Leave a note</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TapMark() {
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Path d="M8.5 7.5a6.5 6.5 0 0 1 0 9M12 5a10 10 0 0 1 0 14M15.5 2.8a13 13 0 0 1 0 18.4" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="5" cy="12" r="1.4" fill="#fff" />
    </Svg>
  );
}
