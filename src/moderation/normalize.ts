/**
 * On-device text normalisation for moderation.
 * Arabic letters, diacritics, tatweel, elongation, and the Arabizi digit map.
 * Nothing here leaves the phone.
 */

const ARABIZI_DIGITS: Record<string, string> = {
  "2": "ء",
  "3": "ع",
  "5": "خ",
  "6": "ط",
  "7": "ح",
  "8": "غ",
  "9": "ق",
};

/** Lower-case, NFKC, collapse spaces and stretched letters. Digits stay, for Arabizi lexicon hits. */
export function normalizeLatin(input: string): string {
  let s = input.normalize("NFKC").toLowerCase();
  s = s.replace(/(.)\1{2,}/gu, "$1$1");
  return s.replace(/\s+/g, " ").trim();
}

/** Arabic-oriented form: strip tashkeel and tatweel, fold letters, then map Arabizi digits. */
export function normalizeArabic(input: string): string {
  let s = normalizeLatin(input);
  s = s.replace(/[\u064B-\u0652\u0670\u0640]/g, "");
  s = s.replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  s = s.replace(/[2356789]/g, (d) => ARABIZI_DIGITS[d] ?? d);
  return s;
}
