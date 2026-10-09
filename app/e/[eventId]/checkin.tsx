import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Screen } from "../../../src/components/Chrome";
import { BackBar } from "../../../src/components/NodeChrome";
import { LinkQr } from "../../../src/components/LinkQr";
import { Muted } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { getFirebase } from "../../../src/firebase";
import { useCommunity } from "../../../src/live/communities";
import { checkInToEvent, checkInUrl, useEventRoster, useOrganizer } from "../../../src/live/eventCheckin";

const arrivals = new Map<string, ReturnType<typeof checkInToEvent>>();

function arriveOnce(eventId: string) {
  const existing = arrivals.get(eventId);
  if (existing) return existing;
  const job = checkInToEvent(eventId);
  arrivals.set(eventId, job);
  return job;
}

const EMPTY: { uid: string; nickname: string }[] = [];

/** Phone check-in. A scan of the Circle QR lands here and marks this account present. */
export default function EventCheckIn() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId || "";
  const [title, setTitle] = useState("Event");
  const [place, setPlace] = useState("");
  const [hostId, setHostId] = useState("");
  const [status, setStatus] = useState<"working" | "in" | "already" | "guest">("working");
  const { organizer, verified } = useOrganizer(hostId);
  const roster = useEventRoster(organizer ? id : "") || EMPTY;
  const contactMap = useCommunity((s) => s.contacts);
  const contacts = contactMap[hostId] || [];
  const link = checkInUrl(id);

  useEffect(() => {
    const { auth, db } = getFirebase();
    let cancel = false;
    const load = () => {
      void getDoc(doc(db, "events", id))
        .then((snap) => {
          if (cancel) return;
          const data = snap.data();
          if (!data) return;
          setTitle(String(data.title || "Event"));
          setPlace(String(data.place || data.meta || ""));
          setHostId(String(data.hostId || ""));
        })
        .catch(() => undefined);
    };
    if (auth.currentUser) load();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) load();
    });
    return () => {
      cancel = true;
      unsub();
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    const run = () => {
      void arriveOnce(id)
        .then((res) => {
          if (!cancel) setStatus(res.already ? "already" : "in");
        })
        .catch(() => {
          if (!cancel) setStatus("guest");
        });
    };
    const { auth } = getFirebase();
    if (auth.currentUser) run();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) run();
    });
    return () => {
      cancel = true;
      unsub();
    };
  }, [id]);

  const count = organizer ? roster.length : status === "guest" ? 0 : 1;
  const names = roster.map((row) => {
    const contact = contacts.find((c) => c.id === row.uid);
    const label = verified && contact?.realName ? contact.realName : row.nickname;
    return { uid: row.uid, label };
  });

  return (
    <Screen>
      <BackBar title="Event check-in" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        <Text style={[t(600, 12, 16), { letterSpacing: 1.1, textTransform: "uppercase", color: C.w64 }]}>
          {status === "guest" ? "Members only" : status === "already" ? "Already checked in" : "Checked in"}
        </Text>
        <Text style={[t(700, 28, 34), { marginTop: 8 }]}>{title}</Text>
        {place ? <Muted>{place}</Muted> : null}
        {organizer ? (
          <View style={{ alignItems: "center", marginTop: 18 }}>
            <View style={{ padding: 8, borderRadius: 22, borderWidth: 3, borderColor: C.gold, backgroundColor: C.white }}>
              <LinkQr value={link} size={196} />
            </View>
            <Text style={[t(500, 13, 18), { marginTop: 10, color: C.w70, textAlign: "center" }]}>/e/{id}/checkin</Text>
          </View>
        ) : null}
        <Text style={[t(700, 56, 60), { marginTop: 18, textAlign: organizer ? "center" : "left" }]}>{organizer ? count : status === "guest" ? "—" : "1"}</Text>
        <Muted>{organizer ? "here now" : status === "guest" ? "Join the Circle before checking in." : "You’re on the list for this event."}</Muted>
        {organizer ? (
          <View style={{ marginTop: 16, backgroundColor: C.card, borderRadius: 18, overflow: "hidden" }}>
            {names.length === 0 ? (
              <Text style={[t(500, 15, 20), { padding: 16 }]}>No one has checked in yet.</Text>
            ) : (
              names.map((row, index) => (
                <View key={row.uid} style={{ paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: "rgba(255,255,255,0.08)" }}>
                  <Text style={t(600, 16, 22)}>{row.label}</Text>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
