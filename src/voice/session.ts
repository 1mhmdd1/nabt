import { create } from "zustand";
import { createOnPhoneVoiceAnalyser, type ToneLabel, type ToneMetrics, type VoiceBand, type VoiceSample } from "./analyser";
import { noteCareStep, noteDeclinedSupport, noteHeavyCheckIn, noteLowVoice, readCareAssessment } from "./journal";
import { recordCheckIn } from "../live";
import { writeCareSignal } from "../live/voiceSafety";

type Session = {
  band: VoiceBand;
  tone: ToneLabel | null;
  confidence: number;
  metrics: ToneMetrics | null;
  audioDeleted: boolean;
};

export const useVoiceSession = create<Session>(() => ({
  band: "okay",
  tone: null,
  confidence: 0,
  metrics: null,
  audioDeleted: true,
}));

/** Analyse on the phone, drop the buffer, then route the band. Audio is not stored. */
export async function analyseCheckIn(sample: VoiceSample): Promise<VoiceBand> {
  const analyser = createOnPhoneVoiceAnalyser();
  const result = await analyser.analyse(sample);
  analyser.discard();
  sample.pcm = null;
  if (sample.meteringDb) sample.meteringDb.length = 0;
  useVoiceSession.setState({
    band: result.band,
    tone: result.tone,
    confidence: result.confidence,
    metrics: result.metrics,
    audioDeleted: result.audioDeleted,
  });
  void recordCheckIn("voice").catch(() => undefined);
  if (result.band === "very_low") {
    const assessment = await noteLowVoice();
    await noteCareStep("extra_card");
    if (assessment.send) await writeCareSignal(assessment).catch(() => undefined);
  } else if (result.band === "heavy") {
    const assessment = await noteHeavyCheckIn();
    if (assessment.send) await writeCareSignal(assessment).catch(() => undefined);
  }
  return result.band;
}

export async function declineAndMaybeSignal() {
  const assessment = await noteDeclinedSupport();
  if (assessment.send) await writeCareSignal(assessment).catch(() => undefined);
  return assessment;
}

export async function markSofterStep(step: "extra_card" | "next_day_checkin") {
  const assessment = await noteCareStep(step);
  if (assessment.send) await writeCareSignal(assessment).catch(() => undefined);
}

export async function careNow() {
  return readCareAssessment();
}
