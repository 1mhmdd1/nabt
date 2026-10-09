import { classify } from "../ml/moderation";
import { classifyText, toSafetySignal } from "./classify";
import { normalizeArabic, normalizeLatin } from "./normalize";
import type { SafetySignal } from "./types";

export type OutgoingReview =
  | { action: "send"; kindness: boolean }
  | { action: "block"; reason: string }
  | { action: "support"; reason: string; signal: SafetySignal | null };

const PHONE = /(?:\+?\d[\d\s().-]{6,}\d)/;
const LINK = /(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|lb|org|net|io)\b/i;
const HANDLE = /(^|\s)@[\w.]{2,}/;

/** Non-crisis “stuck” lines. Crisis phrases are decided by classify / classifyText first. */
const STUCK = [
  "i'm stuck",
  "im stuck",
  "i am stuck",
  "stuck on",
  "can't start",
  "cant start",
  "cannot start",
  "i don't get",
  "i dont get",
  "don't get",
  "dont get",
  "so tired",
  "je suis bloqué",
  "je suis bloque",
  "je bloque",
  "j'y arrive pas",
  "je n'arrive pas",
  "je comprends pas",
  "trop fatigué",
  "trop fatigue",
  "ma 3am efham",
  "ta3ban kteer",
  "ma ba3ref ballesh",
  "ما عم فهم",
  "تعبان كتير",
  "ما بعرف بلش",
];

const PUT_DOWN = "That could land as a put-down. Edit it before it sends.";
const PHONE_REASON = "Phone numbers stay off NABT. Edit the message to send it.";
const LINK_REASON = "Links and @handles stay off NABT. Edit the message to send it.";
const SUPPORT_REASON = "This stays on your phone. If you want to talk, the private support card is here for you.";

export class OutgoingHalt extends Error {
  readonly action: "block" | "support";
  readonly signal: SafetySignal | null;
  constructor(action: "block" | "support", message: string, signal: SafetySignal | null = null) {
    super(message);
    this.name = "OutgoingHalt";
    this.action = action;
    this.signal = signal;
  }
}

function stuck(text: string): boolean {
  const latin = normalizeLatin(text);
  const arabic = normalizeArabic(text);
  return STUCK.some((phrase) => {
    const hit = normalizeLatin(phrase);
    const ar = normalizeArabic(phrase);
    return latin.includes(hit) || arabic.includes(ar) || arabic.includes(hit);
  });
}

/**
 * One check before any message leaves the phone.
 * Reuses classify() and classifyText() — no second lexicon for harm.
 * Distress never becomes a kindness flag and is never sent.
 */
export function reviewOutgoing(text: string, context: SafetySignal["context"], anonId: string): OutgoingReview {
  const body = text.trim();
  const legacy = classify(body);
  const onDevice = classifyText(body);
  const signal = toSafetySignal(onDevice, context, anonId);

  const distress =
    onDevice.category === "self-harm" ||
    onDevice.category === "hopelessness" ||
    (legacy.severity === "high" && legacy.category === "self-harm" && onDevice.category !== "threat");
  if (distress) {
    return { action: "support", reason: SUPPORT_REASON, signal };
  }

  if (PHONE.test(body)) return { action: "block", reason: PHONE_REASON };
  if (LINK.test(body) || HANDLE.test(body)) return { action: "block", reason: LINK_REASON };

  const harsh =
    onDevice.category === "harassment" ||
    onDevice.category === "abuse" ||
    onDevice.category === "threat" ||
    legacy.severity === "caution" ||
    (legacy.severity === "high" && legacy.category !== "self-harm");
  if (harsh) return { action: "block", reason: PUT_DOWN };

  return { action: "send", kindness: stuck(body) };
}

/** Throws OutgoingHalt unless the text may be stored. */
export function assertSendable(text: string, context: SafetySignal["context"], anonId: string): { kindness: boolean } {
  const review = reviewOutgoing(text, context, anonId);
  if (review.action === "send") return { kindness: review.kindness };
  throw new OutgoingHalt(review.action, review.reason, review.action === "support" ? review.signal : null);
}
