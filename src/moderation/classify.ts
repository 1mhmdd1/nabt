import { LEXICON } from "./lexicons";
import { normalizeArabic, normalizeLatin } from "./normalize";
import type { Classification, SafetySignal, Severity } from "./types";

const RANK: Record<Severity, number> = {
  none: 0,
  needs_attention: 1,
  concerning: 2,
  serious: 3,
  immediate_danger: 4,
};

const NONE: Classification = { severity: "none", category: "none" };

/** On-device only. Raw text never leaves the phone. */
export function classifyText(text: string): Classification {
  const latin = normalizeLatin(text);
  const arabic = normalizeArabic(text);
  if (!latin && !arabic) return NONE;
  let best: Classification = NONE;
  for (const row of LEXICON) {
    const hit =
      row.script === "ar"
        ? arabic.includes(normalizeArabic(row.phrase))
        : latin.includes(row.phrase.toLowerCase());
    if (!hit) continue;
    if (RANK[row.severity] > RANK[best.severity]) {
      best = { severity: row.severity, category: row.category };
    }
  }
  return best;
}

/**
 * Anonymous safety signal. needs_attention stays on the phone (support card only).
 * concerning and above may be counted. The message itself is not included.
 */
export function toSafetySignal(
  result: Classification,
  context: SafetySignal["context"],
  anonId: string,
): SafetySignal | null {
  if (result.severity === "none" || result.severity === "needs_attention") return null;
  if (result.category === "none") return null;
  if (!anonId || anonId.length < 8) return null;
  return {
    severity: result.severity,
    category: result.category,
    context,
    anonId,
    campus: "UA",
  };
}
