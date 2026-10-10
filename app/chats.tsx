import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Screen } from "../src/components/Chrome";
import { FloatingNav } from "../src/components/Nav";
import { IconLock, IconPlus } from "../src/components/Icons";
import { C, t } from "../src/theme";
import { useNabt } from "../src/state";
import { answerChatRequest, useCampus } from "../src/live";
import { ScrollBody } from "../src/components/ScrollBody";

export default function Chats() {
  const [open, setOpen] = useState(false);
  const filter = useNabt((s) => s.chatFilter);
  const setFilter = useNabt((s) => s.setFilter);
  const inbox = useCampus((s) => s.inbox);
  const ready = useCampus((s) => s.ready);
  const error = useCampus((s) => s.error);
  const signedOut = useCampus((s) => s.signedOut);
  const status = useCampus((s) => s.status);
  const rows = inbox.filter((r) => {
    if (filter === "Circles") return r.kind === "circle";
    if (filter === "1:1") return r.kind !== "circle";
    return true;
  });

  if (!ready) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  if (signedOut) return <Redirect href="/login" />;
  if (error) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>{error}</Text>
      </Screen>
    );
  }
  const pending = status !== "approved";

  return (
    <Screen>
      <View style={styles.head}>
        <View style={styles.lrow}>
          <Text style={styles.h1}>Chats</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="New chat" onPress={() => router.push("/discover" as never)} style={styles.icon}>
            <IconPlus color={C.white} />
          </Pressable>
        </View>
        <View style={styles.pills} accessibilityRole="tablist">
          {(["All", "Circles", "1:1"] as const).map((p) => (
            <Pressable key={p} onPress={() => setFilter(p)} style={[styles.pill, filter === p && styles.pillOn]} accessibilityState={{ selected: filter === p }}>
              <Text style={[t(600, 12.5, 13), { color: filter === p ? C.ground : C.white }]}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollBody nav contentContainerStyle={styles.list}>
        {rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={t(600, 16, 21)}>{pending ? "Circles open after approval." : filter === "1:1" ? "No 1:1 chats yet." : "No Circles yet. Start one."}</Text>
            <Text style={[t(400, 13.5, 19), { color: C.w64, marginTop: 4 }]}>
              {pending
                ? "Student Affairs is checking your card. Discover is open while you wait."
                : filter === "1:1"
                  ? "Ask someone in a Circle for a 1:1, or accept a request when it arrives."
                  : "Find a Circle in Discover, or open one around something you share."}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Start a Circle" onPress={() => router.push("/circle/new" as never)} style={styles.emptyBtn}>
              <Text style={[t(600, 13.5, 14), { color: C.white }]}>Start a Circle</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Start a petition" onPress={() => router.push("/petition/new" as never)} style={styles.emptyBtn}>
              <Text style={[t(600, 13.5, 14), { color: C.white }]}>Start a petition</Text>
            </Pressable>
          </View>
        ) : null}
        {rows.map((r) => (
          <View key={r.id} style={r.kind === "request" ? styles.req : undefined}>
            <Pressable
              style={styles.row}
              onPress={() => r.href && router.push(r.href as never)}
            >
              {r.kind === "circle" ? <Group letters={r.letters} /> : <Bubble letter={r.letters[0]} />}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={t(600, 15, 19)}>{r.name}</Text>
                  {r.tag ? (
                    <View style={[styles.tag, r.tagOk && { borderColor: C.w40 }]}>
                      <IconLock size={10} color={C.w80} />
                      <Text style={[t(600, 10.5, 11), { color: C.w80 }]}>{r.tag}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.prev} numberOfLines={1}>
                  {r.you ? <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>You: </Text> : r.prefix ? <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>{r.prefix}: </Text> : null}
                  {r.preview}
                </Text>
              </View>
              <View style={styles.side}>
                <Text style={[t(500, 12, 12), { color: C.w64 }]}>{r.time}</Text>
                {r.badge ? (
                  <View style={styles.badge}>
                    <Text style={[t(700, 11, 11), { color: C.ground }]}>{r.badge}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
            {r.kind === "request" ? (
              <View style={styles.acts}>
                <Pressable accessibilityRole="button" onPress={() => void answerChatRequest(r.id, "accepted")} style={styles.accept}><Text style={[t(700, 13, 13), { color: C.ground }]}>Accept</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => void answerChatRequest(r.id, "declined")} style={styles.decline}><Text style={[t(600, 13, 13), { color: C.white }]}>Decline</Text></Pressable>
              </View>
            ) : null}
          </View>
        ))}
        <View style={styles.foot}>
          <IconLock size={12} color={C.w64} />
          <Text style={[t(500, 12, 16), { color: C.w64 }]}>Nicknames by default. You choose when to share your name.</Text>
        </View>
      </ScrollBody>
      <FloatingNav active="chats" open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

function Bubble({ letter }: { letter: string }) {
  return (
    <View style={styles.av48}>
      <Text style={[t(600, 17, 17), { color: C.gold }]}>{letter}</Text>
    </View>
  );
}

function Group({ letters }: { letters: string[] }) {
  const pos = [
    { left: 10, top: 0 },
    { left: 0, top: 19 },
    { left: 20, top: 19 },
  ];
  return (
    <View style={{ width: 48, height: 48 }}>
      {letters.map((l, i) => (
        <View key={l} style={[styles.g, pos[i]]}>
          <Text style={[t(600, 11, 11), { color: C.gold }]}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 20 },
  lrow: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { ...t(600, 26, 26), color: C.white, letterSpacing: -0.26 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  pills: { flexDirection: "row", gap: 8, marginTop: 2, marginBottom: 8 },
  pill: { height: 32, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.w40, alignItems: "center", justifyContent: "center" },
  pillOn: { backgroundColor: C.white, borderColor: C.white },
  list: { paddingHorizontal: 20, paddingBottom: 16 },
  row: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.hair },
  req: { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.hair },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  prev: { marginTop: 3, ...t(400, 13, 17), color: C.w64 },
  side: { alignItems: "flex-end", gap: 6 },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  av48: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  g: { position: "absolute", width: 28, height: 28, borderRadius: 14, backgroundColor: C.deep, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.burgundy },
  tag: { height: 20, paddingHorizontal: 7, borderRadius: 10, borderWidth: 1, borderColor: C.w16, flexDirection: "row", alignItems: "center", gap: 4 },
  acts: { marginLeft: 60, marginBottom: 10, flexDirection: "row", gap: 8 },
  accept: { height: 34, paddingHorizontal: 16, borderRadius: 999, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  decline: { height: 34, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: C.w64, alignItems: "center", justifyContent: "center" },
  foot: { marginTop: 16, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  empty: { marginTop: 8, padding: 16, borderRadius: 18, backgroundColor: C.card },
  emptyBtn: { marginTop: 12, alignSelf: "flex-start", height: 36, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.w40, alignItems: "center", justifyContent: "center" },
});
