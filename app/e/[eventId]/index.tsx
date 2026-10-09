import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { router, useLocalSearchParams } from "expo-router";
import { getFirebase } from "../../../src/firebase";
import { FeedbackSummary } from "../../../src/components/FeedbackSummary";
import { useFeedbackSummary } from "../../../src/live/records";
import { Screen } from "../../../src/components/Chrome";
import { LotusArt } from "../../../src/components/LotusArt";
import { IconBack, IconChevronRight } from "../../../src/components/Icons";
import { Gate, Gold, Sheet, useScreen, WhiteBtn } from "../../../src/components/voice/Kit";
import { createAccommodation, useVoiceSafety } from "../../../src/live/voiceSafety";
import { me, useCampus } from "../../../src/live";
import { eventReminder, toggleEventReminder } from "../../../src/notify";
import { C, t } from "../../../src/theme";
import { rsvpEvent, useCommunity } from "../../../src/live/communities";
import { saveScreenDescription, screenLine, useEventOrganizer } from "../../../src/live/eventCheckin";
import { ScreenDescription } from "../../../src/components/ScreenDescription";
import { toast } from "../../../src/toast";

type Need = { id: string; label: string };
type Acc = { title: string; body: string; needs: Need[]; selected: string[]; noteLabel: string; note: string; foot: string; send: string; going: string; ask: string };

export default function Event() {
  const { eventId, request } = useLocalSearchParams<{ eventId: string; request?: string }>();
  const id = String(eventId || "");
  const accessEvent = useVoiceSafety((s) => s.events[id]);
  // AREA: voice-safety-a11y — events with an access list use the accommodation screen.
  if (accessEvent?.access && accessEvent.access.length) {
    return (
      <Gate>
        <AccessEvent id={id} open={request === "1"} />
      </Gate>
    );
  }
  return <CommunityEvent id={id} />;
}

function CommunityEvent({ id }: { id: string }) {
  const events = useCommunity((s) => s.events);
  const listed = events.find((e) => e.id === id);
  const [extra, setExtra] = useState<typeof listed>(undefined);
  useEffect(() => {
    if (listed || !id) return;
    const { db } = getFirebase();
    void getDoc(doc(db, "events", id)).then((snap) => {
      const data = snap.data();
      if (!data) return;
      setExtra({
        id,
        title: String(data.title || ""),
        hostLabel: String(data.hostLabel || "Circle"),
        verified: data.verified !== false,
        kicker: String(data.kicker || ""),
        meta: String(data.meta || ""),
        day: "",
        mon: "",
        rsvpCount: 0,
        whenLine: data.whenLine ? String(data.whenLine) : undefined,
        placeLine: data.placeLine ? String(data.placeLine) : undefined,
        blurb: data.blurb ? String(data.blurb) : undefined,
        description: data.description ? String(data.description) : undefined,
        screenDescription: data.screenDescription ? String(data.screenDescription) : undefined,
        window: data.window ? String(data.window) : undefined,
        status: String(data.status || ""),
        hostType: String(data.hostType || ""),
        hostId: String(data.hostId || ""),
        order: 0,
      });
    });
  }, [id, listed]);
  const event = listed || extra;
  const going = useCommunity((s) => Boolean(s.myRsvps[id]));
  const faces = event?.goingFaces || [];
  // Only the organizer (the Chair, or Student Affairs for an OSA event) runs check-in.
  const organizer = useEventOrganizer(event);
  const feedback = useFeedbackSummary(organizer ? id : "");
  const [added, setAdded] = useState(false);
  const [reminded, setReminded] = useState(false);
  const [remindNote, setRemindNote] = useState("");
  const [screen, setScreen] = useState("");
  const [screenReady, setScreenReady] = useState(false);
  const [screenNotice, setScreenNotice] = useState("");
  const [here, setHere] = useState(false);
  useEffect(() => {
    const userId = me();
    if (!userId || !id) return;
    void getDoc(doc(getFirebase().db, "events", id, "attendance", userId)).then((snap) => {
      if (snap.exists()) setHere(true);
    });
  }, [id]);
  useEffect(() => {
    if (!id) return;
    void eventReminder(id).then((rid) => setReminded(Boolean(rid)));
  }, [id]);
  async function remind() {
    setRemindNote("");
    try {
      const on = await toggleEventReminder(id, event?.title || "Campus event", event?.whenLine || event?.meta);
      setReminded(on);
      toast(on ? "Reminder set" : "Reminder cancelled");
    } catch (err) {
      setRemindNote(err instanceof Error ? err.message : "Could not set a reminder on this phone.");
    }
  }
  async function answer(go: boolean) {
    try {
      await rsvpEvent(id, go);
      toast(go ? "You’re going. See you there." : "Got it. We won’t count you in.");
      if (router.canGoBack()) router.back();
    } catch (err) {
      setRemindNote(err instanceof Error ? err.message : "Could not save that.");
    }
  }
  const seeded = screenLine(event?.screenDescription, event?.description || event?.blurb);
  useEffect(() => {
    if (screenReady || !seeded) return;
    setScreen(seeded);
    setScreenReady(true);
  }, [screenReady, seeded]);

  return (
    <Screen bg={C.ground}>
      <View style={{ height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 8, paddingRight: 16, gap: 6 }}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <IconBack />
        </Pressable>
        <Text style={[t(600, 17, 22), { flex: 1 }]}>Event</Text>
        <View style={eventStyles.chip}><Text style={t(600, 11, 14)}>{event?.hostLabel || "Student Affairs"} ✓</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>
        <View style={[eventStyles.art, { alignItems: "center", justifyContent: "center" }]}>
          <LotusArt width={150} height={104} />
        </View>
        <Text style={[t(700, 26, 32), { marginTop: 14 }]}>{event?.title || "Campus event"}</Text>
        <View style={eventStyles.list}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              // Opens the phone's calendar (Google Calendar) with the event filled in.
              const q = new URLSearchParams({
                action: "TEMPLATE",
                text: event?.title || "Campus event",
                details: `${event?.whenLine || event?.meta || ""} · NABT`,
                location: event?.placeLine || "Antonine University",
              });
              void Linking.openURL(`https://calendar.google.com/calendar/render?${q.toString()}`)
                .then(() => setAdded(true))
                .catch(() => setAdded(false));
            }}
            style={[eventStyles.row, { borderTopWidth: 0 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>{event?.whenLine || event?.meta}</Text>
              <Text style={eventStyles.sub}>{added ? "Added to your calendar" : "Add to calendar"}</Text>
            </View>
            <IconChevronRight />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/discover?pill=Places" as never)} style={eventStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>{event?.placeLine || "Campus"}</Text>
              <Text style={eventStyles.sub}>Open in Places</Text>
            </View>
            <IconChevronRight />
          </Pressable>
        </View>
        {here ? <Text style={[t(600, 13, 18), { color: C.white, marginTop: 12 }]}>You’re checked in.</Text> : null}
        <Text style={[t(400, 13.5, 20), { color: C.w80, marginTop: 12 }]}>{event?.blurb || event?.description}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
          <View style={{ flexDirection: "row" }}>
            {faces.map((letter, i) => (
              <View key={letter} style={[eventStyles.face, i > 0 && { marginLeft: -8 }]}>
                <Text style={[t(600, 11, 12), { color: C.gold }]}>{letter}</Text>
              </View>
            ))}
          </View>
          <Text style={[t(500, 12.5, 16), { color: C.w70, flex: 1 }]}>{event?.goingLine}</Text>
        </View>
        {organizer ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/e/${id}/checkin` as never)} style={eventStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>Event check-in</Text>
              <Text style={eventStyles.sub}>QR, who is here, end event, certificates</Text>
            </View>
            <IconChevronRight />
          </Pressable>
        ) : null}
        {organizer ? (
          <View style={{ marginTop: 14 }}>
            <ScreenDescription value={screen} onChange={setScreen} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setScreenNotice("");
                void saveScreenDescription(id, screen)
                  .then(() => setScreenNotice("Saved for the tablet."))
                  .catch((err: unknown) => setScreenNotice(err instanceof Error ? err.message : "Could not save that line."));
              }}
              style={eventStyles.remind}
            >
              <Text style={t(600, 15, 18)}>Save screen description</Text>
            </Pressable>
            {screenNotice ? <Text style={[t(500, 13, 18), { color: C.w64 }]}>{screenNotice}</Text> : null}
          </View>
        ) : null}
        {feedback ? <FeedbackSummary row={feedback} /> : null}
        {going ? (
          <View style={[eventStyles.go, { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" }]}>
            <Text style={t(700, 16, 20)}>You’re going</Text>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => void answer(true)} style={eventStyles.go}>
            <Text style={[t(700, 16, 20), { color: C.burgundy }]}>I’ll go</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={() => void answer(false)} style={eventStyles.remind}>
          <Text style={[t(600, 15, 18), { color: C.w70 }]}>Can’t make it</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: reminded }} onPress={() => void remind()} style={eventStyles.remind}>
          <Text style={t(600, 15, 18)}>{reminded ? "Reminder set · tap to cancel" : "Remind me"}</Text>
        </Pressable>
        {remindNote ? <Text style={[t(500, 13, 18), { color: C.w64, textAlign: "center" }]}>{remindNote}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const eventStyles = {
  chip: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", justifyContent: "center" as const },
  art: { height: 150, borderRadius: 20, backgroundColor: C.deep, overflow: "hidden" as const },
  list: { marginTop: 12, backgroundColor: C.card, borderRadius: 18, overflow: "hidden" as const },
  row: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, minHeight: 56, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  face: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.deep, borderWidth: 2, borderColor: C.ground, alignItems: "center" as const, justifyContent: "center" as const },
  go: { marginTop: 16, height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const },
  remind: { marginTop: 8, height: 44, alignItems: "center" as const, justifyContent: "center" as const },
};

function AccessEvent({ id, open }: { id: string; open: boolean }) {
  const event = useVoiceSafety((s) => s.events[id]);
  const copy = useScreen<Acc>("accommodation");
  const nickname = useCampus((s) => s.nickname);
  const sent = useVoiceSafety((s) => s.sent);
  const [sheet, setSheet] = useState(open);
  const [needs, setNeeds] = useState<string[]>(copy?.selected || []);
  const [note, setNote] = useState(copy?.note || "");
  if (!event || !copy) return null;
  const toggle = (need: string) => setNeeds((cur) => (cur.includes(need) ? cur.filter((n) => n !== need) : [...cur, need]));
  return (
    <Screen bg={C.ground}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}>
          <IconBack />
        </Pressable>
        <Text style={[t(600, 17, 22), { flex: 1 }]}>{event.title}</Text>
        {event.chip ? (
          <View style={styles.chip}>
            <Text style={t(600, 11, 14)}>{event.chip}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.h}>{event.title}</Text>
        <Text style={styles.sub}>{event.hostLine}</Text>
        <View style={styles.list}>
          <View style={styles.it}>
            <Text style={t(600, 14.5, 18)}>{event.when}</Text>
            <Text style={styles.small}>{event.whenSub}</Text>
          </View>
          <View style={styles.it}>
            <Text style={t(600, 14.5, 18)}>{event.place}</Text>
            <Text style={styles.small}>{event.placeSub}</Text>
          </View>
        </View>
        <Text style={styles.fl}>Access</Text>
        <View style={styles.list}>
          {event.access?.map((row) => (
            <View key={row.title} style={styles.it}>
              <Text style={t(600, 14.5, 18)}>{row.title}</Text>
              <Text style={styles.small}>{row.body}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 14 }}>
          {sheet ? <WhiteBtn label={copy.going} onPress={() => setSheet(false)} /> : <Gold label={copy.going} onPress={() => setSheet(false)} />}
        </View>
        <Pressable style={styles.ask} onPress={() => setSheet(true)}>
          <Text style={t(600, 14, 18)}>{copy.ask}</Text>
        </Pressable>
      </View>
      {sheet ? (
        <>
          <View style={styles.scrim} />
          <Sheet title={copy.title}>
            <Text style={styles.sub}>{copy.body}</Text>
            <View style={styles.needs}>
              {copy.needs.map((n) => {
                const on = needs.includes(n.id);
                return (
                  <Pressable key={n.id} accessibilityState={{ selected: on }} onPress={() => toggle(n.id)} style={[styles.nd, on && styles.ndOn]}>
                    <Text style={[t(600, 13, 16), { color: on ? C.burgundy : C.white }]}>{on ? "✓ " : ""}{n.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.fl}>{copy.noteLabel}</Text>
            <TextInput value={note} onChangeText={(v) => setNote(v.slice(0, 140))} style={styles.note} accessibilityLabel="Short note, optional" />
            <Text style={styles.foot}>{copy.foot}</Text>
            {sent ? (
              <Text accessibilityLiveRegion="polite" style={styles.sent}>
                {sent}
              </Text>
            ) : null}
            <View style={{ marginTop: 12 }}>
              <WhiteBtn
                label={copy.send}
                onPress={() => {
                  if (!needs.length) return;
                  void createAccommodation(id, nickname || "A student", needs, note).catch(() => undefined);
                }}
              />
            </View>
          </Sheet>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 8, paddingRight: 12, gap: 6 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  h: { marginTop: 4, ...t(700, 24, 28), color: C.white },
  sub: { marginTop: 6, ...t(500, 13, 18), color: "rgba(255,255,255,0.7)" },
  chip: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", justifyContent: "center" },
  list: { marginTop: 12, borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { paddingVertical: 10, paddingHorizontal: 14 },
  small: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  fl: { marginTop: 14, marginBottom: 6, ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  ask: { marginTop: 8, height: 50, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,4,5,0.62)", zIndex: 20 },
  needs: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  nd: { height: 36, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", justifyContent: "center" },
  ndOn: { backgroundColor: C.white, borderColor: C.white },
  note: { minHeight: 44, borderRadius: 14, backgroundColor: C.ground, paddingHorizontal: 12, ...t(500, 14, 18), color: C.white },
  foot: { marginTop: 10, ...t(500, 12, 16), color: "rgba(255,255,255,0.75)" },
  sent: { marginTop: 8, ...t(600, 13, 18), color: C.white },
});
