import { useState } from "react";
import { FloatingNav } from "../../../src/components/Nav";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { Card, Eyebrow, Muted, SubHead } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { me, useCampus } from "../../../src/live";
import { requestVenue, useCommunity } from "../../../src/live/communities";
import { ChairOnly } from "../../../src/community/ChairOnly";

/** The next three weekdays from tomorrow, labelled like "Thu 16 Oct". */
function nextWeekdays(count: number) {
  const out: string[] = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    out.push(`${d.toLocaleDateString("en-GB", { weekday: "short" })} ${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}`);
  }
  return out;
}

export default function VenueRequestScreen() {
  return (
    <ChairOnly>
      <VenueRequest />
    </ChairOnly>
  );
}

function VenueRequest() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "";
  const circle = useCampus((s) => s.circles[id]);
  const greeting = useCampus((s) => s.greetingName);
  const venues = useCommunity((s) => s.venues);
  const allRequests = useCommunity((s) => s.venueRequests);
  const requests = allRequests.filter((r) => r.circleId === id);
  const [venueId, setVenueId] = useState(venues[0]?.id || "");
  const [dates, setDates] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(false);
  const [nav, setNav] = useState(false);
  const isChair = circle?.chairUid === me();
  const [options] = useState(() => nextWeekdays(3));

  function toggle(day: string) {
    setDates((cur) => {
      if (cur.includes(day)) return cur.filter((d) => d !== day);
      if (cur.length >= 3) return cur;
      return [...cur, day];
    });
  }

  async function send() {
    if (!venueId || dates.length < 1) {
      setNote("Pick a venue and one to three dates.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      await requestVenue({
        circleId: id,
        venueId,
        dateOptions: dates,
        memberCount: circle?.memberCount || 0,
      });
      setNote("Sent. Student Affairs sees the venue and the dates, nothing else.");
      setDates([]);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <SubHead title={circle?.name || "Circle"} chip="Space · Chat" chipGold={false} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.chair}>CHAIR</Text>
            <Text style={styles.k}>only you see this</Text>
          </View>
          <Text style={[t(700, 16, 22), { marginTop: 8 }]}>Request a venue from Student Affairs</Text>
          <Muted>Just the venue and date. Budget, tech and logistics stay with your board.</Muted>
          {isChair ? (
            <Pressable onPress={() => setForm((v) => !v)} style={styles.link}>
              <Text style={t(600, 13, 16)}>New venue request</Text>
            </Pressable>
          ) : <Muted>Only the Chair of this Circle can send a request.</Muted>}
        </Card>
        <Card>
          <Eyebrow>Plan with your board</Eyebrow>
          <Text style={[t(700, 16, 22), { marginTop: 6 }]}>{[circle?.nextEventTitle || "Your next event", requests[0]?.dateOptions[0]].filter(Boolean).join(" · ")}</Text>
          <Muted>Budget, kit and logistics live in the private board channel.</Muted>
          <Pressable onPress={() => router.push(`/c/${id}/audit` as never)} style={styles.link}>
            <Text style={t(600, 13, 16)}>Open board channel</Text>
          </Pressable>
        </Card>
        <Muted>{circle?.name || "This Circle"} · {circle?.memberCount ?? 0} members · Chair: {greeting || "A student"}</Muted>
        {form && isChair ? (
          <>
            <Text style={styles.k}>Venue</Text>
            {venues.map((v) => (
              <Pressable key={v.id} onPress={() => setVenueId(v.id)} style={[styles.choice, venueId === v.id && styles.on]}>
                <Text style={[t(600, 15, 20), { color: venueId === v.id ? C.burgundy : C.white }]}>{v.name}</Text>
                {v.building ? <Text style={[t(500, 12, 16), { color: venueId === v.id ? C.burgundy : C.w64 }]}>{v.building}</Text> : null}
              </Pressable>
            ))}
            <Text style={styles.k}>Dates · 1 to 3</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {options.map((day) => {
                const on = dates.includes(day);
                return (
                  <Pressable key={day} onPress={() => toggle(day)} style={[styles.chip, on && styles.on]}>
                    <Text style={[t(600, 13, 16), { color: on ? C.burgundy : C.white }]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
            {note ? <Text style={t(500, 13, 18)}>{note}</Text> : null}
            <Pressable disabled={busy} onPress={() => void send()} style={styles.send}>
              <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{busy ? "Sending…" : "New venue request"}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
      <FloatingNav active="discover" open={nav} onToggle={() => setNav((v) => !v)} />
    </Screen>
  );
}

const styles = {
  k: { ...t(700, 10, 12), letterSpacing: 1.1, textTransform: "uppercase" as const, color: C.w64 },
  chair: { ...t(700, 10, 12), letterSpacing: 0.6, color: C.white, borderWidth: 1, borderColor: "rgba(255,255,255,0.55)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: "hidden" as const },
  link: { marginTop: 10, alignSelf: "flex-start" as const, height: 34, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)", alignItems: "center" as const, justifyContent: "center" as const },
  choice: { padding: 14, borderRadius: 16, backgroundColor: C.raised },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.w40 },
  on: { backgroundColor: C.white, borderColor: C.white },
  send: { height: 48, borderRadius: 999, backgroundColor: C.white, alignItems: "center" as const, justifyContent: "center" as const },
};
