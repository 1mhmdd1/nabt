import assert from "node:assert/strict";
import test from "node:test";
import { createOnPhoneVoiceAnalyser, refuseCallAnalysis } from "./analyser.ts";
import { assessCare } from "./care.ts";
import { accommodationDeleteAt } from "./retention.ts";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse("2026-10-08T12:00:00Z");
const days = (n: number) => now - n * DAY;

test("care level is a word, softer steps come first, only needs_care is sent", () => {
  const none = assessCare({ now, heavyAt: [days(1), days(2)], lowVoice: 0, declinedSupport: 0, stepsDone: [] });
  assert.equal(none.word, null);
  assert.equal(none.send, false);

  const watch = assessCare({ now, heavyAt: [days(1), days(2), days(3)], lowVoice: 0, declinedSupport: 0, stepsDone: [] });
  assert.equal(watch.word, "gentle_watch");
  assert.equal(watch.send, false);
  assert.equal(watch.nextStep, "extra_card");

  const notYet = assessCare({
    now,
    heavyAt: [days(1), days(2), days(3), days(4)],
    lowVoice: 2,
    declinedSupport: 1,
    stepsDone: ["extra_card"],
  });
  assert.equal(notYet.word, "gentle_watch");
  assert.equal(notYet.send, false);
  assert.equal(notYet.nextStep, "next_day_checkin");
  assert.equal(notYet.counts.heavyCheckins, "4 of 6");

  const care = assessCare({
    now,
    heavyAt: [days(1), days(2), days(3), days(4)],
    lowVoice: 0,
    declinedSupport: 2,
    stepsDone: ["extra_card", "next_day_checkin"],
  });
  assert.equal(care.word, "needs_care");
  assert.equal(care.send, true);
  assert.equal("score" in care, false);

  const danger = assessCare({ now, heavyAt: [], lowVoice: 0, declinedSupport: 0, stepsDone: [], immediateDanger: true });
  assert.equal(danger.word, "reach_out_now");
  assert.equal(danger.send, false);
  assert.equal(danger.nextStep, "support_now");
});

test("on-phone analyser uses metering, drops audio, and never accepts a call", async () => {
  const analyser = createOnPhoneVoiceAnalyser();
  const steady = Array.from({ length: 200 }, () => -24);
  const calm = await analyser.analyse({
    kind: "check-in",
    pcm: new Uint8Array([1, 2, 3, 4]),
    durationMs: 20000,
    meteringDb: steady,
    audioDeleted: true,
  });
  assert.equal(calm.band, "lighter");
  assert.equal(calm.tone, "calm");
  assert.equal(calm.keptAudio, false);
  assert.equal(calm.audioDeleted, true);
  analyser.discard();
  assert.equal(steady.length, 200);

  const gaps = [...Array.from({ length: 40 }, () => -36), ...Array.from({ length: 120 }, () => -55), ...Array.from({ length: 40 }, () => -36)];
  const lowVoice = await analyser.analyse({
    kind: "check-in",
    pcm: null,
    durationMs: 20000,
    meteringDb: gaps,
    audioDeleted: true,
  });
  assert.equal(lowVoice.band, "very_low");
  assert.equal(lowVoice.tone, "low");

  const typed = await analyser.analyse({ kind: "check-in", pcm: null, durationMs: 0, transcript: "I am okay" });
  assert.equal(typed.band, "okay");

  const crisis = await analyser.analyse({ kind: "check-in", pcm: null, durationMs: 4000, transcript: "I want to die" });
  assert.equal(crisis.band, "very_low");

  assert.throws(() => refuseCallAnalysis(), /never analysed/);
});

test("accommodation deleteAt is 30 days after the event", () => {
  const end = Date.parse("2026-10-16T15:00:00Z");
  assert.equal(accommodationDeleteAt(end) - end, 30 * DAY);
});
