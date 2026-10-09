import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Screen } from "../../../src/components/Chrome";
import { BackBar } from "../../../src/components/NodeChrome";
import { Muted } from "../../../src/community/ui";
import { C, t } from "../../../src/theme";
import { me, useCampus } from "../../../src/live";
import { getFirebase } from "../../../src/firebase";
import { endNodeEvent, nodeEventLive, startNodeEvent, useNodeRewards, watchNode } from "../../../src/live/nodeRewards";
import { saveScreenDescription, screenLine } from "../../../src/live/eventCheckin";
import { ScreenDescription } from "../../../src/components/ScreenDescription";

const BOARD = ["chair", "vice_chair", "events", "logistics", "media", "treasurer", "moderator", "hr"];

type Row = { id: string; title: string; place: string; when: string; line: string };

export default function NodeEventMode() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const id = circleId || "robotics";
  const circle = useCampus((s) => s.circles[id]);
  const memberMap = useCampus((s) => s.members);
  const members = memberMap[id] || [];
  const node = useNodeRewards((s) => s.nodes.engineering);
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = members.find((m) => m.id === me());
  const organizer = circle?.chairUid === me() || (mine?.roles || []).some((role) => BOARD.includes(role));
  const live = nodeEventLive(node);

  useEffect(() => {
    watchNode("engineering");
  }, []);

  useEffect(() => {
    const { auth, db } = getFirebase();
    let cancel = false;
    const load = () => {
      void getDocs(query(collection(db, "events"), where("hostId", "==", id)))
        .then((snap) => {
          if (cancel) return;
          setRows(
            snap.docs
              .filter((d) => d.data().venueStatus === "approved" && d.data().nodeId === "engineering")
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  title: String(data.title || d.id),
                  place: String(data.place || "Faculty of Engineering"),
                  when: String(data.when || "Today"),
                  line: screenLine(data.screenDescription ? String(data.screenDescription) : "", data.description ? String(data.description) : ""),
                };
              }),
          );
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
    setDrafts((cur) => {
      const next = { ...cur };
      for (const row of rows) {
        if (next[row.id] == null) next[row.id] = row.line;
      }
      return next;
    });
  }, [rows]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "The node could not switch.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackBar title="Hope Node" />
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {!organizer ? (
          <Text style={t(500, 16, 22)}>Only the Chair and board of this Circle can change the node.</Text>
        ) : (
          <>
            <Text style={t(600, 22, 28)}>Faculty of Engineering</Text>
            <Muted>
              {live
                ? `${node?.eventTitle} is on the node.`
                : "Daily check-in is on the node. Choose an approved event to switch it."}
            </Muted>
            {rows.map((row) => (
              <View key={row.id} style={{ backgroundColor: C.card, borderRadius: 18, padding: 14, gap: 8 }}>
                <Text style={t(700, 16, 22)}>{row.title}</Text>
                <Muted>
                  {row.place} · {row.when}
                </Muted>
                <Muted>Student Affairs approved this venue. Members scan the event QR to be marked present.</Muted>
                <ScreenDescription
                  value={drafts[row.id] ?? row.line}
                  onChange={(value) => setDrafts((cur) => ({ ...cur, [row.id]: value }))}
                />
                <Text style={[t(500, 12, 16), { color: C.w64 }]}>Checked on this phone before it shows on the tablet.</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={() => void run(() => saveScreenDescription(row.id, drafts[row.id] ?? row.line))}
                  style={styles.ghost}
                >
                  <Text style={t(600, 15, 18)}>Save description</Text>
                </Pressable>
                {live && node?.eventId === row.id ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    accessibilityLabel="End event mode"
                    onPress={() => void run(() => endNodeEvent("engineering", row.id))}
                    style={styles.ghost}
                  >
                    <Text style={t(600, 15, 18)}>End event mode</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy || live}
                    accessibilityLabel="Show on the node"
                    onPress={() => void run(() => startNodeEvent("engineering", row.id))}
                    style={styles.gold}
                  >
                    <Text style={[t(700, 15, 18), { color: C.burgundy }]}>Show on the node</Text>
                  </Pressable>
                )}
              </View>
            ))}
            {rows.length === 0 ? <Muted>No approved event at this node yet.</Muted> : null}
          </>
        )}
        {notice ? <Text style={t(500, 14, 20)}>{notice}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = {
  gold: { height: 48, borderRadius: 999, backgroundColor: C.gold, alignItems: "center" as const, justifyContent: "center" as const },
  ghost: { height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", alignItems: "center" as const, justifyContent: "center" as const },
};
