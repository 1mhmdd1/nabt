import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Redirect, router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Screen } from "../src/components/Chrome";
import { FloatingNav } from "../src/components/Nav";
import { PlantArt } from "../src/components/Plant";
import {
  IconArrow,
  IconChevron,
  IconCircles,
  IconPin,
  IconRoot,
  IconWordLotus,
} from "../src/components/Icons";
import { C, t } from "../src/theme";
import { me, setCampusMode, useCampus } from "../src/live";
import { hideAnnouncement, useImpact } from "../src/live/impact";
import { useNabt } from "../src/state";
import { feedbackWasSkipped, sendFeedback, skipFeedback, useMyRecord } from "../src/live/records";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [modes, setModes] = useState(false);
  const campus = useCampus();
  const focused = useIsFocused();
  const calm = useNabt((s) => s.calmMode);
  const announcements = useImpact((s) => s.announcements);
  const hides = useImpact((s) => s.hides);
  const now = Date.now();
  const pinned = announcements.find((item) => item.verified && item.pinUntil != null && item.pinUntil > now && !hides.includes(item.id));
  if (!campus.ready) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  if (campus.signedOut) return <Redirect href="/login" />;
  if (campus.error) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>{campus.error}</Text>
      </Screen>
    );
  }
  const initial = campus.initial || (campus.nickname ? campus.nickname.slice(0, 1).toUpperCase() : "·");
  const pending = campus.status !== "approved";
  const petalWord = campus.plant.petals === 1 ? "petal" : "petals";
  const rootWord = campus.plant.roots === 1 ? "root" : "roots";
  const hour = new Date().getHours();
  const daypart = hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening";
  return (
    <Screen>
      <ScrollView style={styles.main} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <IconWordLotus />
          {calm ? (
            <Pressable accessibilityLabel="Calm mode" onPress={() => router.push("/settings/accessibility" as never)} style={styles.calm}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Path d="M9 6v12M15 6v12" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
              </Svg>
              <Text style={styles.calmText}>Calm mode</Text>
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }} />
          <Pressable accessibilityLabel={`Your profile, ${campus.nickname || "you"}`} onPress={() => router.push("/me" as never)} style={styles.avatar}>
            <Text style={[t(600, 17, 17), { color: C.gold }]}>{initial}</Text>
          </Pressable>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.greet}>
              {campus.greetingWhen || daypart},{"\n"}
              {campus.greetingName || campus.nickname || "there"}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${campus.modeLabel || "Campus mode"}, open the mode list`}
              onPress={() => setModes(true)}
              style={styles.pill}
            >
              <Text style={[t(600, 13, 13), { color: C.white, flexShrink: 1 }]} numberOfLines={1}>
                {campus.modeLabel || "Pick a mode"}
              </Text>
              <IconChevron />
            </Pressable>
          </View>
          <View style={styles.plantCol}>
            <PlantArt
              badge={campus.rootNote?.badge || null}
              petals={campus.plant.petals}
              roots={campus.plant.roots}
              owner={me() || "me"}
              active={focused}
            />
            <Text style={styles.caption}>
              <Text style={{ color: C.white, fontWeight: "600" }}>{campus.plant.stage || "Seed"}</Text>
              <Text>
                {" "}
                · {campus.plant.petals} {petalWord} · {campus.plant.roots} {rootWord}
              </Text>
            </Text>
          </View>
        </View>

        {pending ? (
          <View style={styles.pendingCard}>
            <Text style={t(600, 15, 20)}>Student Affairs is checking your card.</Text>
            <Text style={styles.entrySub}>You can read Discover and grow your lotus now. Circles, 1:1 chats and node notes open after approval.</Text>
          </View>
        ) : null}

        <View style={styles.today}>
          <Text style={styles.goal}>{campus.today?.title || "One small step today"}</Text>
          <Text style={styles.action}>{campus.today?.body || "Check in with how you feel. A petal grows each time you do."}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Start today’s step" onPress={() => router.push("/task" as never)} style={styles.start}>
            <Text style={[t(700, 16, 16), { color: C.burgundy, letterSpacing: 0.16 }]}>Start</Text>
            <IconArrow />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mood check-in" onPress={() => router.push("/check-in" as never)}>
            <Text style={styles.link}>Check in</Text>
          </Pressable>
        </View>

        {pinned ? (
          <View style={styles.saCard}>
            <View style={styles.saTop}>
              <Text style={styles.saLabel}>From Student Affairs</Text>
              <Text style={styles.verified}>Verified</Text>
              <View style={{ flex: 1 }} />
              <Pressable accessibilityLabel="Hide announcement" onPress={() => void hideAnnouncement(pinned.id)}>
                <Text style={styles.hide}>Hide</Text>
              </Pressable>
            </View>
            <Pressable accessibilityLabel="From Student Affairs" onPress={() => router.push("/announcements" as never)}>
              <Text style={t(600, 16, 21)}>{pinned.title}</Text>
              <Text style={styles.entrySub} numberOfLines={3}>{pinned.body}</Text>
            </Pressable>
          </View>
        ) : null}

        {campus.dropGoing ? (
          <View style={styles.going} accessibilityLabel="You're going">
            <Text style={t(600, 15, 20)}>You’re going</Text>
            <Text style={styles.entrySub}>Today’s drop on campus.</Text>
          </View>
        ) : null}

        {campus.rootNote ? (
          <View style={styles.note} accessibilityLabel="New root on your plant">
            <View style={styles.rootIcon}>
              <IconRoot />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 15, 20)}>{campus.rootNote.title}</Text>
              <Text style={styles.sub}>{campus.rootNote.body}</Text>
              {campus.rootNote.action ? (
                <Text style={styles.link} onPress={() => router.push("/chats" as never)}>
                  {campus.rootNote.action}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.entries}>
          {/* AREA: node-rewards — awake Hope Nodes arrive from Firestore (title + hours). */}
          <Text style={styles.entriesH}>Today on campus</Text>
          {campus.campus.length === 0 ? (
            <View style={styles.entry}>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 15, 20)}>Quiet for now.</Text>
                <Text style={styles.entrySub}>Open Circles show up here.</Text>
              </View>
            </View>
          ) : null}
          {campus.campus.map((item, i) => (
            <Pressable key={item.title} style={[styles.entry, i > 0 && styles.entryLine]} onPress={() => router.push(item.href as never)}>
              <View style={styles.entryIcon}>{item.icon === "pin" ? <IconPin /> : <IconCircles />}</View>
              <View style={{ flex: 1 }}>
                <Text style={t(600, 15, 20)}>{item.title}</Text>
                <Text style={styles.entrySub}>{item.body}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <FeedbackPrompt />
      {modes ? (
        <Pressable accessibilityLabel="Close modes" style={styles.scrim} onPress={() => setModes(false)}>
          <View style={styles.sheet}>
            <Text style={t(600, 16, 20)}>Campus mode</Text>
            {["Exam mode", "Quiet mode", "Study mode"].map((label) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                onPress={() => {
                  void setCampusMode(label);
                  setModes(false);
                }}
                style={styles.modeRow}
              >
                <Text style={t(600, 16, 20)}>{label}</Text>
                {campus.modeLabel === label ? <Text style={t(600, 13, 16)}>On</Text> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      ) : null}
      <FloatingNav active="home" quiet open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

function FeedbackPrompt() {
  const ask = useMyRecord()?.ask;
  const [skipped, setSkipped] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [held, setHeld] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!ask) return;
    void feedbackWasSkipped(ask.eventId).then(setSkipped);
  }, [ask]);
  if (!ask || skipped || done) return null;
  return (
    <View style={styles.ask}>
      <Text style={t(600, 15, 20)}>How was {ask.title}?</Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} accessibilityLabel={`${n} of 5`} onPress={() => setRating(n)} style={[styles.rate, rating === n && styles.rateOn]}>
            <Text style={[t(700, 14, 16), { color: rating === n ? C.burgundy : C.white }]}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={comment}
        onChangeText={(value) => {
          setHeld(false);
          setComment(value.slice(0, 200));
        }}
        placeholder="A short note, if you like"
        placeholderTextColor={C.w64}
        style={styles.askInput}
        accessibilityLabel="Optional comment"
      />
      {held ? <Text style={[t(500, 12, 16), { color: C.w80, marginTop: 6 }]}>That stays on your phone.</Text> : null}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Pressable onPress={() => void skipFeedback(ask.eventId).then(() => setSkipped(true))}><Text style={t(600, 14, 18)}>Skip</Text></Pressable>
        <Pressable
          onPress={() => {
            if (!rating) return;
            void sendFeedback(ask.eventId, rating, comment).then((result) => {
              if (result.held) setHeld(true);
              else setDone(true);
            });
          }}
        >
          <Text style={t(700, 14, 18)}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1, paddingHorizontal: 20 },
  top: { height: 54, paddingTop: 4, paddingLeft: 4, flexDirection: "row", alignItems: "center", gap: 8 },
  calm: { marginLeft: 12, height: 26, paddingHorizontal: 11, borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)", flexDirection: "row", alignItems: "center", gap: 6 },
  calmText: { ...t(600, 11.5, 14), color: C.white },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.deep,
    borderWidth: 1,
    borderColor: C.w16,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginRight: -6, overflow: "visible" },
  heroText: { flex: 1, paddingBottom: 22, paddingLeft: 4, paddingRight: 8 },
  plantCol: { width: 148, flexShrink: 0, alignItems: "center" },
  greet: { ...t(600, 25, 30), color: C.white, letterSpacing: -0.12 },
  pill: {
    marginTop: 14,
    alignSelf: "flex-start",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 32,
    paddingLeft: 15,
    paddingRight: 13,
    borderWidth: 1,
    borderColor: C.w64,
    borderRadius: 999,
  },
  caption: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  today: { marginTop: 16, backgroundColor: C.raised, borderRadius: 22, padding: 20 },
  goal: { ...t(600, 19, 25), color: C.white },
  action: { marginTop: 4, ...t(400, 15, 22), color: C.w80 },
  start: {
    marginTop: 16,
    height: 50,
    borderRadius: 999,
    backgroundColor: C.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  note: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingRight: 18,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: C.w16,
    borderRadius: 22,
  },
  rootIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  sub: { marginTop: 2, ...t(400, 13, 18), color: C.w64 },
  link: { marginTop: 8, ...t(600, 13, 13), color: C.white, textDecorationLine: "underline" },
  saCard: { marginTop: 12, backgroundColor: C.raised, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12 },
  pendingCard: { marginTop: 14, borderRadius: 22, borderWidth: 1, borderColor: C.w16, paddingHorizontal: 16, paddingVertical: 12 },
  saTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  saLabel: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  verified: { ...t(700, 10, 12), color: C.burgundy, backgroundColor: C.gold, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, overflow: "hidden" },
  hide: { ...t(600, 12, 14), color: C.w70 },
  entries: { marginTop: 10, backgroundColor: C.raised, borderRadius: 22, paddingVertical: 4 },
  entriesH: { paddingHorizontal: 16, paddingTop: 8, ...t(600, 11, 14), letterSpacing: 1.5, textTransform: "uppercase", color: C.w64 },
  entry: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8, paddingHorizontal: 14 },
  entryLine: { borderTopWidth: 1, borderTopColor: C.hair },
  entryIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.w16, alignItems: "center", justifyContent: "center" },
  entrySub: { marginTop: 1, ...t(400, 13, 18), color: C.w64, letterSpacing: -0.06 },
  ask: { position: "absolute", left: 16, right: 16, bottom: 100, zIndex: 25, backgroundColor: C.card, borderRadius: 22, padding: 14 },
  rate: { flex: 1, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  rateOn: { backgroundColor: C.white, borderColor: C.white },
  askInput: { marginTop: 8, height: 40, borderRadius: 12, backgroundColor: C.ground, paddingHorizontal: 10, ...t(500, 14, 18) },
  going: { marginTop: 12, backgroundColor: C.raised, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14 },
  scrim: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(36,9,10,0.55)", justifyContent: "flex-end", zIndex: 30 },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 36, gap: 4 },
  modeRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
