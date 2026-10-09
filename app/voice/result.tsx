import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { Gate, Gold, LockLine, Outline, PlantLotus, Top, useScreen } from "../../src/components/voice/Kit";
import { IconChevronRight } from "../../src/components/Icons";
import { declineAndMaybeSignal, useVoiceSession } from "../../src/voice/session";
import { voiceCopy } from "../../src/voice/copy";
import { TONE_COPY, VOICE_THRESHOLDS } from "../../src/voice/signals";
import { C, t } from "../../src/theme";

type Suggestion = { title: string; sub: string; href: string };
type Copy = {
  title: string;
  petal: string;
  heavyTitle: string;
  okayTitle: string;
  lighterTitle: string;
  veryLowTitle: string;
  heavyBody: string;
  okayBody: string;
  lighterBody: string;
  suggestions: Suggestion[];
  primary: string;
  skip: string;
  footer: string;
};

export default function VoiceResult() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function toneLine(label: string | null, band: string) {
  if (label === "tense" || band === "heavy") return "The tone signals read tense.";
  if (label === "low" || band === "very_low") return "The tone signals read low.";
  return "The tone signals read calm.";
}

function metricLine(metrics: { meanDb: number; variabilityDb: number; pauseRatio: number; longestPauseMs: number } | null) {
  if (!metrics) return "Typing counts the same. Nothing from a recording was kept.";
  const pauses = Math.round(metrics.pauseRatio * 100);
  const gap = (metrics.longestPauseMs / 1000).toFixed(1);
  return `Mean loudness ${metrics.meanDb.toFixed(0)} dB. Steadiness ${metrics.variabilityDb.toFixed(1)} dB. Pauses ${pauses}%, longest ${gap}s.`;
}

function Body() {
  const seeded = useScreen<Copy>("result");
  const copy = seeded ?? {
    ...voiceCopy.result,
    heavyTitle: "",
    okayTitle: "",
    lighterTitle: "",
    veryLowTitle: "",
    heavyBody: "",
    okayBody: "",
    lighterBody: "",
  };
  const band = useVoiceSession((s) => s.band);
  const tone = useVoiceSession((s) => s.tone);
  const confidence = useVoiceSession((s) => s.confidence);
  const metrics = useVoiceSession((s) => s.metrics);
  const audioDeleted = useVoiceSession((s) => s.audioDeleted);
  const title = toneLine(tone, band);
  const unsure = confidence > 0 && confidence < VOICE_THRESHOLDS.supportConfidence;
  return (
    <Screen bg={C.ground}>
      <Top title={copy.title} />
      <View style={styles.pad}>
        <View style={{ alignItems: "center", marginTop: 8 }}>
          <PlantLotus width={120} height={84} />
          <View style={styles.petal}>
            <Text style={[t(600, 12, 16), { color: C.white }]}>{copy.petal}</Text>
          </View>
        </View>
        <Text style={styles.q}>{title}</Text>
        <View style={styles.refl}>
          <Text style={styles.body}>{TONE_COPY}</Text>
          <Text style={[styles.body, { marginTop: 8 }]}>{metricLine(metrics)}</Text>
          {unsure ? <Text style={[styles.body, { marginTop: 8 }]}>This clip is under 15 seconds, so the reading stays unsure.</Text> : null}
          {metrics ? (
            <Text style={[styles.body, { marginTop: 8 }]}>
              {audioDeleted ? "The recording is already deleted." : "The recording could not be deleted. It was not uploaded."}
            </Text>
          ) : null}
        </View>
        {copy.suggestions.map((s) => (
          <Pressable key={s.title} style={styles.row} onPress={() => router.push(s.href as never)}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>{s.title}</Text>
              <Text style={styles.sub}>{s.sub}</Text>
            </View>
            <IconChevronRight />
          </Pressable>
        ))}
        <View style={{ marginTop: 14 }}>
          <Gold label={copy.primary} onPress={() => router.push("/n/engineering" as never)} />
        </View>
        <View style={{ marginTop: 8 }}>
          <Outline
            label={copy.skip}
            onPress={() => {
              void declineAndMaybeSignal();
              router.replace("/home" as never);
            }}
          />
        </View>
        <LockLine>{copy.footer}</LockLine>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: 20, paddingTop: 12 },
  petal: { marginTop: 8, paddingHorizontal: 12, height: 26, borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  q: { marginTop: 14, ...t(600, 22, 28), color: C.white, textAlign: "center" },
  refl: { marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: C.card },
  body: { ...t(400, 14, 20), color: "rgba(255,255,255,0.88)" },
  row: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, backgroundColor: C.card, flexDirection: "row", alignItems: "center", gap: 8 },
  sub: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
});
