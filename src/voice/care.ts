/** Care level is a word, computed on the phone. The numeric thresholds never leave this file. */

export type CareWord = "gentle_watch" | "needs_care" | "reach_out_now";

export type CareCounts = {
  heavyCheckins: string;
  declinedSupport: number;
  lowVoice: number;
};

export type CareNext = "extra_card" | "next_day_checkin" | "signal" | "support_now" | null;

export type CareAssessment = {
  word: CareWord | null;
  /** Only needs_care, after the softer steps, is uploaded. */
  send: boolean;
  counts: CareCounts;
  stepsDone: string[];
  nextStep: CareNext;
};

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 6;

export function assessCare(input: {
  now: number;
  heavyAt: number[];
  lowVoice: number;
  declinedSupport: number;
  stepsDone: string[];
  immediateDanger?: boolean;
}): CareAssessment {
  const heavy = input.heavyAt.filter((t) => t <= input.now && input.now - t <= WINDOW_DAYS * DAY).length;
  const counts: CareCounts = {
    heavyCheckins: `${heavy} of ${WINDOW_DAYS}`,
    declinedSupport: input.declinedSupport,
    lowVoice: input.lowVoice,
  };
  const steps = [...input.stepsDone];
  if (input.immediateDanger) {
    return { word: "reach_out_now", send: false, counts, stepsDone: steps, nextStep: "support_now" };
  }
  const watched = heavy >= 3;
  const hard = heavy >= 4 && (input.declinedSupport >= 2 || input.lowVoice >= 2);
  if (!watched && !hard) {
    return { word: null, send: false, counts, stepsDone: steps, nextStep: null };
  }
  const didCard = steps.includes("extra_card");
  const didNext = steps.includes("next_day_checkin");
  if (hard && didCard && didNext) {
    return {
      word: "needs_care",
      send: true,
      counts,
      stepsDone: ["extra_card", "next_day_checkin"],
      nextStep: "signal",
    };
  }
  return {
    word: "gentle_watch",
    send: false,
    counts,
    stepsDone: steps,
    nextStep: didCard ? "next_day_checkin" : "extra_card",
  };
}
