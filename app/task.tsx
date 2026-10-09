import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { GoldButton, Screen } from "../src/components/Chrome";
import { IconBack } from "../src/components/Icons";
import { C, t } from "../src/theme";
import { postFn } from "../src/fn";

const TOTAL = 3 * 60;

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** The Home task card. Three minutes, pause or stop, Done grows one petal. */
export default function Task() {
  const [left, setLeft] = useState(TOTAL);
  const [running, setRunning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!running || left <= 0) return;
    const timer = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(timer);
  }, [running, left]);

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    setRunning(false);
    try {
      await postFn("/task-done", {});
      setNote("Done. +1 petal");
      setTimeout(() => router.replace("/home" as never), 700);
    } catch (err) {
      setBusy(false);
      setNote(err instanceof Error ? err.message : "The petal could not be saved.");
    }
  };

  return (
    <Screen bg={C.ground}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}>
          <IconBack />
        </Pressable>
        <Text style={styles.h}>Today’s step</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.time}>{clock(left)}</Text>
        <Text style={styles.sub}>{left === 0 ? "Time’s up. Mark it done." : running ? "Three quiet minutes." : "Paused."}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => setRunning((on) => !on)} style={styles.ghost} disabled={left === 0 || busy}>
            <Text style={t(600, 16, 18)}>{running ? "Pause" : "Resume"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setRunning(false);
              router.replace("/home" as never);
            }}
            style={styles.ghost}
          >
            <Text style={t(600, 16, 18)}>Stop</Text>
          </Pressable>
        </View>
        <GoldButton block label={busy ? "Saving…" : "Done"} disabled={busy} onPress={() => void finish()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 8, gap: 6 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  h: { ...t(600, 17, 17), color: C.white },
  body: { paddingHorizontal: 24, paddingTop: 48, alignItems: "center" },
  time: { ...t(700, 64, 72), color: C.white },
  sub: { marginTop: 8, ...t(500, 16, 22), color: C.w80 },
  note: { marginTop: 16, ...t(600, 16, 22), color: C.gold },
  row: { flexDirection: "row", gap: 12, marginTop: 28, marginBottom: 16, alignSelf: "stretch" },
  ghost: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
