export type Severity = "ok" | "caution" | "high";
export type Category = "none" | "self-harm" | "abuse" | "harassment";

export type Classification = { severity: Severity; category: Category };

const HIGH: { phrase: string; category: Category }[] = [
  { phrase: "kill myself", category: "self-harm" },
  { phrase: "killing myself", category: "self-harm" },
  { phrase: "want to die", category: "self-harm" },
  { phrase: "end my life", category: "self-harm" },
  { phrase: "suicide", category: "self-harm" },
  { phrase: "kms", category: "self-harm" },
  { phrase: "kys", category: "self-harm" },
  { phrase: "je veux mourir", category: "self-harm" },
  { phrase: "me suicider", category: "self-harm" },
  { phrase: "انتحار", category: "self-harm" },
  { phrase: "اقتل نفسي", category: "self-harm" },
  { phrase: "بدي موت", category: "self-harm" },
];

const CAUTION: { phrase: string; category: Category }[] = [
  { phrase: "hate you", category: "harassment" },
  { phrase: "shut up", category: "harassment" },
  { phrase: "idiot", category: "harassment" },
  { phrase: "stupid", category: "harassment" },
  { phrase: "ta gueule", category: "harassment" },
  { phrase: "كرهتك", category: "harassment" },
  { phrase: "اكرهك", category: "harassment" },
];

/** On-device only. Raw text never leaves the phone. */
export function normalize(input: string): string {
  let s = input.normalize("NFKC");
  s = s.replace(/[\u064B-\u0652\u0670\u0640]/g, "");
  s = s.replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  s = s.replace(/(.)\1{2,}/gu, "$1$1");
  const arabizi: Record<string, string> = { "2": "ء", "3": "ع", "5": "خ", "7": "ح", "9": "ق" };
  s = s.replace(/[23579]/g, (d) => arabizi[d] ?? d);
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function classify(text: string): Classification {
  const n = normalize(text);
  if (!n) return { severity: "ok", category: "none" };
  for (const row of HIGH) {
    if (n.includes(normalize(row.phrase))) return { severity: "high", category: row.category };
  }
  for (const row of CAUTION) {
    if (n.includes(normalize(row.phrase))) return { severity: "caution", category: row.category };
  }
  return { severity: "ok", category: "none" };
}
