import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Screen } from "../../src/components/Chrome";
import { BackBar } from "../../src/components/NodeChrome";
import { PerkQr } from "../../src/components/LotusArt";
import { Muted } from "../../src/community/ui";
import { C, t } from "../../src/theme";
import { getFirebase } from "../../src/firebase";
import { nodeEventLive, useNodeRewards, watchNode } from "../../src/live/nodeRewards";

/** Phone event check-in. Members arrive here from the node QR. The mode switch stays on the Chair screen. */
export default function EventCheckIn() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const id = eventId || "";
  const [title, setTitle] = useState("Event");
  const [place, setPlace] = useState("Faculty of Engineering");
  const [when, setWhen] = useState("");
  const node = useNodeRewards((s) => s.nodes.engineering);
  const live = nodeEventLive(node) && node?.eventId === id;

  useEffect(() => {
    watchNode("engineering");
    const { auth, db } = getFirebase();
    let cancel = false;
    const load = () => {
      void getDoc(doc(db, "events", id))
        .then((snap) => {
          if (cancel) return;
          const data = snap.data();
          if (!data) return;
          setTitle(String(data.title || "Event"));
          setPlace(String(data.place || "Faculty of Engineering"));
          setWhen(String(data.when || ""));
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

  return (
    <Screen>
      <BackBar title={title} />
      <View style={{ paddingHorizontal: 22, alignItems: "center" }}>
        <Text style={[t(600, 12, 16), { letterSpacing: 1.1, textTransform: "uppercase", color: C.w64 }]}>
          {live ? "Check-in is open" : "Check-in is closed"}
        </Text>
        <Muted>
          {place}
          {when ? ` · ${when}` : ""}
        </Muted>
        <View style={{ marginTop: 16, width: 180, height: 180, borderRadius: 16, backgroundColor: C.white, alignItems: "center", justifyContent: "center" }}>
          <PerkQr size={150} />
        </View>
        <Text style={[t(600, 14, 18), { marginTop: 10 }]}>event:{id}</Text>
        <Text style={[t(700, 40, 44), { marginTop: 18 }]}>{live ? node?.presentCount || 0 : "—"}</Text>
        <Muted>{live ? "Checked in · one per account" : "The node is back on daily check-in."}</Muted>
        <Text style={[t(500, 15, 22), { marginTop: 16, textAlign: "center" }]}>
          {live ? "You’re on the list for this event." : "Ask the Chair if the event should be on the node."}
        </Text>
      </View>
    </Screen>
  );
}
