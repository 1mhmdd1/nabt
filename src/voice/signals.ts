/**
 * On-phone tone signals. These are loudness and pause measurements, not emotions.
 *
 * Samples are decibels (dBFS-style, negative, 0 = full scale), about one every
 * 100 ms. expo-av metering and the web AnalyserNode both land in this scale.
 *
 * Thresholds are the only place the cutoffs live. Tune them here.
 *
 * Silence: a sample at or below `silenceDb` is a pause.
 * Mean loudness: arithmetic mean of the speaking samples. If the clip never
 * rises above the silence line, the mean of every sample is used.
 * Variability (steadiness): population standard deviation of the speaking
 * samples, in dB. Lower is steadier.
 * Pause ratio: silent samples / all samples.
 * Longest pause: longest run of silent samples × sample interval.
 * Speech/silence ratio: speaking samples / silent samples. A clip with no
 * silence is Infinity (all speech).
 *
 * Labels:
 * - low: quiet speech broken by long pauses. This is the very-low band.
 * - tense: unsteady loudness, or loud speech with almost no pause and some sway.
 * - calm: the rest. Steady speech stays calm even when it is simply quiet
 *   and continuous.
 *
 * Confidence reaches 1 only at `minMs` (15 s) with a clear margin. Below
 * 0.45 the band stays "okay" and does not open the support card.
 */

export const TONE_COPY = "This reads tone signals on your phone. It does not detect emotion.";

export const VOICE_THRESHOLDS = {
  /** dB at or below this is silence. */
  silenceDb: -45,
  /** Nominal spacing when the caller does not pass one. */
  sampleMs: 100,
  /** A full reading. Shorter clips cannot open the support card. */
  minMs: 15_000,
  /** The recorder stops itself here. */
  maxMs: 30_000,
  /** Support-card confidence floor. */
  supportConfidence: 0.45,
  /** Quiet speech (mean dB of speaking frames) required for "low". */
  lowMeanDb: -32,
  /** Whisper-level speech (still above the silence line), with a high pause ratio, is also "low". */
  veryQuietMeanDb: -34,
  /** Longest pause that supports "low". */
  lowPauseMs: 2_000,
  /** Pause ratio that supports "low". */
  lowPauseRatio: 0.55,
  /** Pause ratio that, with a very quiet mean, supports "low". */
  quietPauseRatio: 0.45,
  /** Variability at or above this is unsteady → tense. */
  tenseStdDb: 8,
  /** Loud mean that can read as tense when the clip barely pauses. */
  tenseMeanDb: -16,
  /** Variability required before loud, nearly continuous speech is tense. */
  tenseLoudStdDb: 4,
  /** Pause ratio at or below this counts as "almost no pause". */
  tensePauseRatio: 0.15,
  /** Variability at or below this is steady enough for the lighter band. */
  calmStdDb: 5,
  /** Pause ratio at or below this, with a steady voice, is the lighter band. */
  lighterPauseRatio: 0.2,
  /** Floor and ceiling used to draw the live level ring. */
  levelFloorDb: -60,
  levelCeilDb: 0,
} as const;

export type ToneLabel = "calm" | "low" | "tense";

export type ToneMetrics = {
  meanDb: number;
  variabilityDb: number;
  pauseRatio: number;
  longestPauseMs: number;
  speechSilenceRatio: number;
  speechFrames: number;
  silenceFrames: number;
  sampleMs: number;
};

export type ToneReading = ToneMetrics & {
  label: ToneLabel;
  confidence: number;
  durationMs: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

/** Population standard deviation. One sample or none is 0 (no sway to measure). */
export function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const mid = mean(values);
  const variance = values.reduce((sum, n) => sum + (n - mid) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * RMS of a time-domain frame (−1..1) as dBFS. Digital silence is floored at
 * −100 dB so a quiet buffer stays a number.
 */
export function dbFromTimeDomain(frame: ArrayLike<number>) {
  let energy = 0;
  const n = frame.length;
  if (!n) return -100;
  for (let i = 0; i < n; i += 1) {
    const s = frame[i] || 0;
    energy += s * s;
  }
  const rms = Math.sqrt(energy / n);
  if (rms <= 1e-5) return -100;
  return clamp(20 * Math.log10(rms), -100, 0);
}

/** 0 at the silence floor, 1 at full scale. Used by the live level ring. */
export function levelFromDb(db: number, thresholds = VOICE_THRESHOLDS) {
  const span = thresholds.levelCeilDb - thresholds.levelFloorDb;
  return clamp((db - thresholds.levelFloorDb) / span, 0, 1);
}

export function metricsFromDb(samples: number[], sampleMs: number = VOICE_THRESHOLDS.sampleMs, thresholds = VOICE_THRESHOLDS): ToneMetrics {
  const clean = samples.filter((n) => Number.isFinite(n));
  const interval = sampleMs > 0 ? sampleMs : thresholds.sampleMs;
  if (!clean.length) {
    return {
      meanDb: -100,
      variabilityDb: 0,
      pauseRatio: 1,
      longestPauseMs: 0,
      speechSilenceRatio: 0,
      speechFrames: 0,
      silenceFrames: 0,
      sampleMs: interval,
    };
  }
  const speech: number[] = [];
  let silenceFrames = 0;
  let run = 0;
  let longest = 0;
  for (const db of clean) {
    if (db <= thresholds.silenceDb) {
      silenceFrames += 1;
      run += 1;
      if (run > longest) longest = run;
    } else {
      speech.push(db);
      run = 0;
    }
  }
  const speechFrames = speech.length;
  return {
    meanDb: speechFrames ? mean(speech) : mean(clean),
    variabilityDb: stdDev(speech),
    pauseRatio: silenceFrames / clean.length,
    longestPauseMs: longest * interval,
    speechSilenceRatio: silenceFrames === 0 ? Number.POSITIVE_INFINITY : speechFrames / silenceFrames,
    speechFrames,
    silenceFrames,
    sampleMs: interval,
  };
}

function clarityFor(label: ToneLabel, metrics: ToneMetrics, thresholds = VOICE_THRESHOLDS) {
  if (label === "low") {
    const pause = (metrics.pauseRatio - thresholds.lowPauseRatio) / (1 - thresholds.lowPauseRatio);
    const gap = (metrics.longestPauseMs - thresholds.lowPauseMs) / thresholds.lowPauseMs;
    const quiet = (thresholds.lowMeanDb - metrics.meanDb) / 12;
    return clamp(Math.max(pause, gap, quiet), 0, 1);
  }
  if (label === "tense") {
    return clamp((metrics.variabilityDb - thresholds.calmStdDb) / thresholds.tenseStdDb, 0, 1);
  }
  return clamp(1 - metrics.variabilityDb / thresholds.tenseStdDb, 0, 1);
}

export function isLow(metrics: ToneMetrics, thresholds = VOICE_THRESHOLDS) {
  const longAndQuiet =
    metrics.pauseRatio >= thresholds.lowPauseRatio &&
    metrics.longestPauseMs >= thresholds.lowPauseMs &&
    metrics.meanDb <= thresholds.lowMeanDb;
  const veryQuiet = metrics.meanDb <= thresholds.veryQuietMeanDb && metrics.pauseRatio >= thresholds.quietPauseRatio;
  return longAndQuiet || veryQuiet;
}

export function isTense(metrics: ToneMetrics, thresholds = VOICE_THRESHOLDS) {
  if (metrics.variabilityDb >= thresholds.tenseStdDb) return true;
  return (
    metrics.meanDb >= thresholds.tenseMeanDb &&
    metrics.pauseRatio <= thresholds.tensePauseRatio &&
    metrics.variabilityDb >= thresholds.tenseLoudStdDb
  );
}

export function mapTone(samples: number[], durationMs: number, sampleMs: number = VOICE_THRESHOLDS.sampleMs, thresholds = VOICE_THRESHOLDS): ToneReading {
  const metrics = metricsFromDb(samples, sampleMs, thresholds);
  const duration = durationMs > 0 ? durationMs : samples.length * metrics.sampleMs;
  const label: ToneLabel = isLow(metrics, thresholds) ? "low" : isTense(metrics, thresholds) ? "tense" : "calm";
  const covered = clamp(duration / thresholds.minMs, 0, 1);
  const confidence = clamp(covered * (0.45 + 0.55 * clarityFor(label, metrics, thresholds)), 0, 1);
  return { ...metrics, label, confidence, durationMs: duration };
}

export type VoiceBand = "lighter" | "okay" | "heavy" | "very_low";

/** very_low is the only band that opens the private support card first. */
export function bandForTone(reading: ToneReading, thresholds = VOICE_THRESHOLDS): VoiceBand {
  if (reading.confidence < thresholds.supportConfidence) return "okay";
  if (reading.label === "low") return "very_low";
  if (reading.label === "tense") return "heavy";
  if (reading.variabilityDb <= thresholds.calmStdDb && reading.pauseRatio <= thresholds.lighterPauseRatio) return "lighter";
  return "okay";
}
