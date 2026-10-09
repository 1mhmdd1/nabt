import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { Screen } from "../../src/components/Chrome";
import { Gate, LockLine, PlantLotus, Top, WhiteBtn, useScreen } from "../../src/components/voice/Kit";
import { analyseCheckIn } from "../../src/voice/session";
import { CaptureHandle, startVoiceCapture, VoiceCaptureError } from "../../src/voice/capture";
import { voiceCopy } from "../../src/voice/copy";
import { levelFromDb, TONE_COPY, VOICE_THRESHOLDS } from "../../src/voice/signals";
import { C, t } from "../../src/theme";

type Copy = { title: string; eyebrow: string; question: string; hint: string; done: string; footer: string };

const MIN_S = VOICE_THRESHOLDS.minMs / 1000;
const MAX_S = VOICE_THRESHOLDS.maxMs / 1000;

export default function Recording() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function LevelRing({ level }: { level: number }) {
  const size = 220;
  const r = 96;
  const mid = size / 2;
  const circ = 2 * Math.PI * r;
  const shown = Math.max(0.04, Math.min(1, level));
  return (
    <View
      accessibilityLabel="Live level"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      style={styles.ring}
    >
      <Svg width={size} height={size}>
        <Circle cx={mid} cy={mid} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={8} fill="none" />
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={C.gold}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ * shown} ${circ}`}
          rotation={-90}
          originX={mid}
          originY={mid}
        />
      </Svg>
    </View>
  );
}

function Body() {
  const seeded = useScreen<Copy>("recording");
  const copy = seeded ?? voiceCopy.recording;
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const handleRef = useRef<CaptureHandle | null>(null);
  const finished = useRef(false);
  const started = useRef(Date.now());

  const finish = async () => {
    if (finished.current) return;
    const sec = Math.floor((Date.now() - started.current) / 1000);
    if (sec < MIN_S) return;
    const handle = handleRef.current;
    if (!handle) return;
    finished.current = true;
    setBusy(true);
    try {
      const captured = await handle.stop();
      const band = await analyseCheckIn({
        kind: "check-in",
        pcm: null,
        durationMs: captured.durationMs,
        meteringDb: captured.samples,
        sampleMs: VOICE_THRESHOLDS.sampleMs,
        audioDeleted: captured.deleted,
      });
      captured.samples.length = 0;
      router.replace((band === "very_low" ? "/voice/support" : "/voice/result") as never);
    } catch (e) {
      finished.current = false;
      setBusy(false);
      setErr(e instanceof Error ? e.message : "The check-in didn't finish.");
    }
  };

  useEffect(() => {
    let alive = true;
    void startVoiceCapture((db) => {
      if (alive) setLevel(levelFromDb(db));
    })
      .then((handle) => {
        if (!alive) {
          void handle.cancel();
          return;
        }
        handleRef.current = handle;
        started.current = Date.now();
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setErr(e instanceof VoiceCaptureError ? e.message : "The microphone didn't start. You can type instead.");
      });
    const clock = setInterval(() => {
      const sec = Math.min(MAX_S, Math.floor((Date.now() - started.current) / 1000));
      setElapsed(sec);
      if (sec >= MAX_S) void finish();
    }, 200);
    return () => {
      alive = false;
      clearInterval(clock);
      if (!finished.current) void handleRef.current?.cancel();
    };
    // finish is stable enough for the 30s cutoff; the ref guards re-entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = `0:${String(elapsed).padStart(2, "0")}`;
  const ready = elapsed >= MIN_S && !err;
  return (
    <Screen bg={C.ground}>
      <Top title={copy.title} />
      <View style={styles.main}>
        <Text style={styles.ey}>{copy.eyebrow}</Text>
        <Text style={styles.q}>{copy.question}</Text>
        <View style={styles.stage}>
          <LevelRing level={level} />
          <View style={styles.lotus}>
            <PlantLotus width={86} height={60} />
          </View>
        </View>
        <Text style={styles.tm}>
          {mm} <Text style={{ color: C.w64 }}>/ 0:{String(MAX_S).padStart(2, "0")}</Text>
        </Text>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${Math.min(100, (elapsed / MAX_S) * 100)}%` }]} />
        </View>
        <Text style={styles.hint}>{err || copy.hint}</Text>
        <View style={{ marginTop: 18, alignSelf: "stretch" }}>
          {err ? (
            <WhiteBtn label="Type instead" onPress={() => router.replace("/voice/type" as never)} />
          ) : (
            <WhiteBtn label={busy ? "Reading…" : copy.done} disabled={!ready || busy} onPress={() => void finish()} />
          )}
        </View>
        {!err && !ready ? <Text style={styles.wait}>Available at 0:{String(MIN_S).padStart(2, "0")}</Text> : null}
        <LockLine>{`${TONE_COPY} The recording is deleted right after.`}</LockLine>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  main: { paddingHorizontal: 20, paddingTop: 10, alignItems: "center" },
  ey: { ...t(600, 11, 14), letterSpacing: 1.6, textTransform: "uppercase", color: C.w64 },
  q: { marginTop: 10, ...t(600, 22, 28), color: C.white, textAlign: "center" },
  stage: { width: 300, height: 260, marginTop: 8, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  lotus: { width: 132, height: 132, borderRadius: 66, backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16, alignItems: "center", justifyContent: "center" },
  tm: { marginTop: 8, ...t(600, 15, 18), color: C.white, letterSpacing: 0.6 },
  bar: { width: 180, height: 3, marginTop: 12, borderRadius: 2, backgroundColor: C.w16, overflow: "hidden" },
  fill: { height: 3, backgroundColor: C.white },
  hint: { marginTop: 14, ...t(400, 13, 18), color: "rgba(255,255,255,0.78)", textAlign: "center" },
  wait: { marginTop: 8, ...t(500, 12, 16), color: C.w64 },
});
