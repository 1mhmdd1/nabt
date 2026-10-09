import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../src/components/Chrome";
import { BackBar } from "../../../src/components/NodeChrome";
import { Muted } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { createEvent } from "../../../src/live/communities";
import { ChairOnly } from "../../../src/community/ChairOnly";
import { ScrollBody } from "../../../src/components/ScrollBody";

const NODES = [
  { id: "engineering", label: "Faculty of Engineering node" },
];
const VENUES = [
  { id: "engineering", label: "Faculty of Engineering node" },
  { id: "hall-c", label: "Hall C lab" },
];

export default function HostEvent() {
  return (
    <ChairOnly>
      <HostEventScreen />
    </ChairOnly>
  );
}

function HostEventScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = String(circleId || "");
  const [title, setTitle] = useState("");
  const [nodeId, setNodeId] = useState("engineering");
  const [venueId, setVenueId] = useState("engineering");
  const [windowSec, setWindowSec] = useState("3600");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setNote("");
    try {
      const seconds = Math.max(15, Number(windowSec) || 3600);
      const startsAt = Date.now() - 15_000;
      const endsAt = Date.now() + seconds * 1000;
      await createEvent({ circleId: id, title, nodeId, venueId, startsAt, endsAt, description: "Hosted from the Circle." });
      setNote("Sent to Student Affairs. The node schedule now includes this event.");
      setTimeout(() => router.replace(`/c/${id}/chair` as never), 600);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not send the request.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackBar title="Host an event" />
      <ScrollBody contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 24 }}>
        <Muted>Pick the Hope Node and the venue. Student Affairs approves the venue, and the Chair hears back in the Circle.</Muted>
        <TextInput value={title} onChangeText={setTitle} placeholder="Event title" placeholderTextColor={C.w64} accessibilityLabel="Event title" style={field} />
        <TextInput value={windowSec} onChangeText={setWindowSec} keyboardType="number-pad" placeholder="Window seconds" placeholderTextColor={C.w64} accessibilityLabel="Window seconds" style={field} />
        <Text style={t(600, 13, 16)}>Node</Text>
        {NODES.map((node) => (
          <Pressable key={node.id} accessibilityRole="button" accessibilityLabel={node.label} onPress={() => setNodeId(node.id)} style={[choice, nodeId === node.id && on]}>
            <Text style={{ color: nodeId === node.id ? C.burgundy : C.white }}>{node.label}</Text>
          </Pressable>
        ))}
        <Text style={t(600, 13, 16)}>Venue</Text>
        {VENUES.map((venue) => (
          <Pressable key={venue.id} accessibilityRole="button" accessibilityLabel={venue.label} onPress={() => setVenueId(venue.id)} style={[choice, venueId === venue.id && on]}>
            <Text style={{ color: venueId === venue.id ? C.burgundy : C.white }}>{venue.label}</Text>
          </Pressable>
        ))}
        {note ? <Text accessibilityLabel="Host notice">{note}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Send venue request" disabled={busy || title.trim().length < 2} onPress={() => void send()} style={sendBtn}>
          <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{busy ? "Sending…" : "Send venue request"}</Text>
        </Pressable>
      </ScrollBody>
    </Screen>
  );
}

const field = { height: 48, borderRadius: 14, backgroundColor: C.card, paddingHorizontal: 14, color: C.white };
const choice = { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", paddingHorizontal: 14, justifyContent: "center" as const };
const on = { backgroundColor: C.white, borderColor: C.white };
const sendBtn = { height: 48, borderRadius: 999, backgroundColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const };
