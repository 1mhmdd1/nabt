export type Severity = "none" | "needs_attention" | "concerning" | "serious" | "immediate_danger";

export type Category =
  | "none"
  | "self-harm"
  | "hopelessness"
  | "harassment"
  | "abuse"
  | "threat"
  | "bad-advice";

export type Classification = { severity: Severity; category: Category };

/** What the phone may upload. No text, no uid, no nickname. */
export type SafetySignal = {
  severity: Exclude<Severity, "none" | "needs_attention">;
  category: Exclude<Category, "none">;
  context: "circle" | "buddy" | "thread" | "alumni";
  anonId: string;
  campus: "UA";
};
