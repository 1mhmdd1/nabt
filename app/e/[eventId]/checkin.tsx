import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { GoldButton, Screen } from "../../../src/components/Chrome";
import { BackBar } from "../../../src/components/NodeChrome";
import { LinkQr } from "../../../src/components/LinkQr";
import { Muted } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { getFirebase } from "../../../src/firebase";
import { useCommunity } from "../../../src/live/communities";
import { checkInToEvent, checkInUrl, endEvent, eventCode, useEventOrganizer, useEventRoster, useOrganizer } from "../../../src/live/eventCheckin";
import { issueEventCertificates } from "../../../src/live/records";

const arrivals = new Map<string, ReturnType<typeof checkInToEvent>>();

function arriveOnce(eventId: string, code: string) {
  const key = `${eventId}:${code}`;
  const existing = arrivals.get(key);
  if (existing) return existing;
  const job = checkInToEvent(eventId, code);
  arrivals.set(key, job);
  job.catch(() => arrivals.delete(key));
  return job;
}

const EMPTY: { uid: string; nickname: string }[] = [];

/**
 * Two views of one screen. The organizer (the Chair, or Student Affairs for an OSA event)
 * shows the QR, sees who is here, ends the event and issues certificates. A student lands
 * here by scanning that QR, which carries the code, and is marked present by the server.
 */
export default function EventCheckIn() {
  const { eventId, code: scanned } = useLocalSearchParams<{ eventId: string; code?: string }>();
  const id = eventId || "";
  const [title, setTitle] = useState("Event");
  const [place, setPlace] = useState("");
  const [host, setHost] = useState<{ hostType: string; hostId: string } | null>(null);
  const [ended, setEnded] = useState(false);
  const [status, setStatus] = useState<"idle" | "working" | "in" | "already" | "refused">("idle");
  const [refusal, setRefusal] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const organizer = useEventOrganizer(host);
  const { verified } = useOrganizer(host?.hostType === "circle" ? host.hostId : "");
  const roster = useEventRoster(organizer ? id : "") || EMPTY;
  const contactMap = useCommunity((s) => s.contacts);
  const contacts = contactMap[host?.hostId || ""] || [];

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
          setPlace(String(data.placeLine || data.place || data.meta || ""));
          setHost({ hostType: String(data.hostType || ""), hostId: String(data.hostId || "") });
          setEnded(data.ended === true);
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

  // Organizer: fetch the code for the QR.
  useEffect(() => {
    if (!organizer || !id) return;
    void eventCode(id)
      .then(setCode)
      .catch(() => setNotice("Could not open the check-in code."));
  }, [organizer, id]);

  // Student: a scan carries the code. Without it there is nothing to do here.
  useEffect(() => {
    if (!host || organizer || !id || !scanned) return;
    let cancel = false;
    setStatus("working");
    void arriveOnce(id, String(scanned))
      .then((res) => {
        if (!cancel) setStatus(res.already ? "already" : "in");
      })
      .catch((err: unknown) => {
        if (cancel) return;
        setStatus("refused");
        setRefusal(err instanceof Error ? err.message : "That code didn’t work.");
      });
    return () => {
      cancel = true;
    };
  }, [host, organizer, id, scanned]);

  async function finish() {
    setNotice("");
    try {
      const res = await endEvent(id);
      setEnded(true);
      setNotice(`Event ended. ${Number(res.issued || 0)} certificate${Number(res.issued || 0) === 1 ? "" : "s"} saved to My record.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not end the event.");
    }
  }

  async function issue() {
    setNotice("");
    try {
      const res = (await issueEventCertificates(id)) as { issued?: number };
      setNotice(`${Number(res.issued || 0)} new certificate${Number(res.issued || 0) === 1 ? "" : "s"} issued.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not issue certificates.");
    }
  }

  const names = roster.map((row) => {
    const contact = contacts.find((c) => c.id === row.uid);
    const label = verified && contact?.realName ? contact.realName : row.nickname;
    return { uid: row.uid, label };
  });
  const link = checkInUrl(id, code);
  const studentLine =
    status === "in" || status === "already"
      ? "You’re on the list for this event."
      : status === "working"
        ? "Checking you in…"
        : status === "refused"
          ? refusal
          : "Scan the organizer’s QR at the event to check in.";

  return (
    <Screen>
      <BackBar title="Event check-in" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        <Text style={[t(600, 12, 16), { letterSpacing: 1.1, textTransform: "uppercase", color: C.w64 }]}>
          {organizer ? (ended ? "Ended" : "Show this QR at the door") : status === "in" ? "Checked in" : status === "already" ? "Already checked in" : "Check in"}
        </Text>
        <Text style={[t(700, 28, 34), { marginTop: 8 }]}>{title}</Text>
        {place ? <Muted>{place}</Muted> : null}
        {organizer ? (
          <>
            {!ended && code ? (
              <View style={{ alignItems: "center", marginTop: 18 }}>
                <View style={{ padding: 8, borderRadius: 22, borderWidth: 3, borderColor: C.white, backgroundColor: C.white }}>
                  <LinkQr value={link} size={196} />
                </View>
                <Text style={[t(500, 13, 18), { marginTop: 10, color: C.w70, textAlign: "center" }]}>Members scan this to check in · code {code}</Text>
              </View>
            ) : null}
            <Text style={[t(700, 56, 60), { marginTop: 18, textAlign: "center" }]}>{roster.length}</Text>
            <Muted>{ended ? "checked in" : "here now"}</Muted>
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
            <View style={{ marginTop: 16, gap: 10 }}>
              {!ended ? <GoldButton label="End event" onPress={() => void finish()} /> : null}
              <Pressable accessibilityRole="button" onPress={() => void issue()} style={{ height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" }}>
                <Text style={t(600, 15, 18)}>Issue certificates</Text>
              </Pressable>
            </View>
            {notice ? <Text style={[t(500, 13, 18), { color: C.w80, marginTop: 10, textAlign: "center" }]}>{notice}</Text> : null}
          </>
        ) : (
          <View style={{ marginTop: 18 }}>
            <Text style={t(700, 56, 60)}>{status === "in" || status === "already" ? "✓" : "—"}</Text>
            <Muted>{studentLine}</Muted>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
