import assert from "node:assert/strict";
import test from "node:test";
import {
  TONE_COPY,
  VOICE_THRESHOLDS,
  bandForTone,
  dbFromTimeDomain,
  isLow,
  isTense,
  levelFromDb,
  mapTone,
  metricsFromDb,
  stdDev,
} from "./signals.ts";

function fill(n: number, db: number) {
  return Array.from({ length: n }, () => db);
}

test("copy names tone signals and refuses emotion detection", () => {
  assert.match(TONE_COPY, /reads tone signals on your phone/);
  assert.match(TONE_COPY, /does not detect emotion/);
});

test("time-domain RMS becomes dBFS", () => {
  const quiet = dbFromTimeDomain(new Float32Array(128));
  assert.equal(quiet, -100);
  const frame = new Float32Array(256).fill(0.1);
  const db = dbFromTimeDomain(frame);
  const expected = 20 * Math.log10(0.1);
  assert.ok(Math.abs(db - expected) < 0.01, `${db} vs ${expected}`);
  assert.equal(levelFromDb(0), 1);
  assert.equal(levelFromDb(-60), 0);
  assert.ok(levelFromDb(-30) > 0.4 && levelFromDb(-30) < 0.6);
});

test("pause ratio, longest pause, and speech/silence ratio", () => {
  const samples = [...fill(10, -50), ...fill(5, -20), ...fill(30, -50), ...fill(5, -20)];
  const metrics = metricsFromDb(samples, 100);
  assert.equal(metrics.speechFrames, 10);
  assert.equal(metrics.silenceFrames, 40);
  assert.equal(metrics.pauseRatio, 0.8);
  assert.equal(metrics.longestPauseMs, 3000);
  assert.equal(metrics.speechSilenceRatio, 10 / 40);
  assert.equal(metrics.meanDb, -20);
  assert.equal(stdDev([-20, -20]), 0);

  const allSpeech = metricsFromDb(fill(8, -18), 100);
  assert.equal(allSpeech.pauseRatio, 0);
  assert.equal(allSpeech.longestPauseMs, 0);
  assert.equal(allSpeech.speechSilenceRatio, Number.POSITIVE_INFINITY);
});

test("steady speech maps to calm, and a full clip can read lighter", () => {
  const samples = fill(200, -24);
  const reading = mapTone(samples, 20_000, 100);
  assert.equal(reading.label, "calm");
  assert.equal(reading.variabilityDb, 0);
  assert.ok(reading.confidence >= VOICE_THRESHOLDS.supportConfidence);
  assert.equal(bandForTone(reading), "lighter");
  assert.equal(isTense(reading), false);
  assert.equal(isLow(reading), false);
});

test("quiet speech with a long pause maps to low and opens support", () => {
  const samples = [...fill(40, -36), ...fill(120, -55), ...fill(40, -36)];
  const reading = mapTone(samples, 20_000, 100);
  assert.equal(reading.label, "low");
  assert.ok(reading.longestPauseMs >= VOICE_THRESHOLDS.lowPauseMs);
  assert.ok(reading.pauseRatio >= VOICE_THRESHOLDS.lowPauseRatio);
  assert.ok(reading.confidence >= VOICE_THRESHOLDS.supportConfidence);
  assert.equal(bandForTone(reading), "very_low");
});

test("unsteady loudness maps to tense", () => {
  const samples: number[] = [];
  for (let i = 0; i < 200; i += 1) samples.push(i % 2 === 0 ? -8 : -28);
  const reading = mapTone(samples, 20_000, 100);
  assert.equal(reading.label, "tense");
  assert.ok(reading.variabilityDb >= VOICE_THRESHOLDS.tenseStdDb);
  assert.equal(bandForTone(reading), "heavy");
});

test("a clip under 15 seconds stays unsure and does not open support", () => {
  const samples = [...fill(4, -36), ...fill(12, -55), ...fill(4, -36)];
  const reading = mapTone(samples, 2_000, 100);
  assert.equal(reading.label, "low");
  assert.ok(reading.confidence < VOICE_THRESHOLDS.supportConfidence);
  assert.equal(bandForTone(reading), "okay");
});

test("thresholds are tunable", () => {
  const samples = [...fill(10, -20), ...fill(10, -50)];
  const loose = metricsFromDb(samples, 100, { ...VOICE_THRESHOLDS, silenceDb: -60 });
  const strict = metricsFromDb(samples, 100, { ...VOICE_THRESHOLDS, silenceDb: -10 });
  assert.equal(loose.silenceFrames, 0);
  assert.equal(strict.speechFrames, 0);
  assert.equal(strict.pauseRatio, 1);
});
