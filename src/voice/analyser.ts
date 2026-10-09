import { classifyText } from "../moderation";
import { bandForTone, mapTone, type ToneLabel, type ToneMetrics, type VoiceBand } from "./signals";

export type { VoiceBand, ToneLabel, ToneMetrics };

/** A check-in clip. Call audio is not a sample and has no analyser path. */
export type VoiceSample = {
  kind: "check-in";
  pcm: Uint8Array | null;
  durationMs: number;
  transcript?: string;
  /** dB samples, about one every 100 ms. Memory only. Never uploaded. */
  meteringDb?: number[];
  sampleMs?: number;
  /** The recording file was deleted, or the web path never wrote one. */
  audioDeleted?: boolean;
};

export type VoiceAnalysis = {
  band: VoiceBand;
  tone: ToneLabel;
  confidence: number;
  metrics: ToneMetrics | null;
  speechRate: "slow" | "steady" | "quick";
  energy: "low" | "medium" | "high";
  keptAudio: false;
  audioDeleted: boolean;
};

export interface OnDeviceVoiceAnalyser {
  readonly name: "on-phone";
  analyse(sample: VoiceSample): Promise<VoiceAnalysis>;
  /** Drop any buffer the analyser still holds. */
  discard(): void;
}

let held: number[] | null = null;

function pace(metrics: ToneMetrics | null, band: VoiceBand): VoiceAnalysis["speechRate"] {
  if (!metrics) return "steady";
  if (metrics.pauseRatio >= 0.45 || metrics.longestPauseMs >= 2000) return "slow";
  if (band === "heavy") return "quick";
  return "steady";
}

function energy(metrics: ToneMetrics | null): VoiceAnalysis["energy"] {
  if (!metrics) return "medium";
  if (metrics.meanDb <= -32) return "low";
  if (metrics.meanDb >= -18) return "high";
  return "medium";
}

/**
 * Tone signals from metering, on the phone. Typed words still use the text
 * classifier, and a crisis line still wins. The analyser does not keep audio.
 */
export function createOnPhoneVoiceAnalyser(): OnDeviceVoiceAnalyser {
  return {
    name: "on-phone",
    async analyse(sample) {
      if (sample.kind !== "check-in") {
        throw new Error("Only a check-in can be analysed.");
      }
      held = sample.meteringDb ? sample.meteringDb.slice() : null;
      const text = (sample.transcript || "").trim();
      const cls = text ? classifyText(text) : null;
      const crisis = Boolean(cls && (cls.severity === "immediate_danger" || cls.severity === "serious"));
      const concerning = Boolean(cls && cls.severity === "concerning");

      if (held && held.length) {
        const reading = mapTone(held, sample.durationMs, sample.sampleMs);
        let band = bandForTone(reading);
        if (crisis) band = "very_low";
        else if (concerning && band === "lighter") band = "heavy";
        return {
          band,
          tone: crisis ? "low" : reading.label,
          confidence: reading.confidence,
          metrics: reading,
          speechRate: pace(reading, band),
          energy: energy(reading),
          keptAudio: false as const,
          audioDeleted: sample.audioDeleted !== false,
        };
      }

      let band: VoiceBand = "okay";
      let tone: ToneLabel = "calm";
      if (crisis) {
        band = "very_low";
        tone = "low";
      } else if (concerning) {
        band = "heavy";
        tone = "tense";
      } else if (text && /\b(good|lighter)\b/i.test(text)) {
        band = "lighter";
      } else if (text && /\b(fine|okay|better|tired)\b/i.test(text)) {
        band = "okay";
      }
      return {
        band,
        tone,
        confidence: text ? 1 : 0,
        metrics: null,
        speechRate: "steady",
        energy: band === "very_low" || band === "heavy" ? "low" : "medium",
        keptAudio: false as const,
        audioDeleted: sample.audioDeleted !== false && sample.pcm == null,
      };
    },
    discard() {
      if (held) held.length = 0;
      held = null;
    },
  };
}

/** @deprecated Use createOnPhoneVoiceAnalyser. Kept so older imports still run. */
export const createExpoGoVoiceAnalyser = createOnPhoneVoiceAnalyser;

/** Calls are never analysed, in any chat. There is no call-audio entry point. */
export function refuseCallAnalysis(): never {
  throw new Error("Calls are never analysed.");
}
