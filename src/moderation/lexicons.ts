import type { Category, Severity } from "./types";

export type LexiconRow = {
  phrase: string;
  severity: Severity;
  category: Category;
  /** ar is matched after Arabic normalisation. latin and arabizi are matched on the lower-cased line. */
  script: "ar" | "latin" | "arabizi";
};

/**
 * Small on-device lexicon. Arabic, French, English and Arabizi.
 * A model can sit behind the same classify() later; these rows work alone in Expo Go.
 */
export const LEXICON: LexiconRow[] = [
  { phrase: "kill myself", severity: "immediate_danger", category: "self-harm", script: "latin" },
  { phrase: "killing myself", severity: "immediate_danger", category: "self-harm", script: "latin" },
  { phrase: "end my life", severity: "immediate_danger", category: "self-harm", script: "latin" },
  { phrase: "suicide", severity: "immediate_danger", category: "self-harm", script: "latin" },
  { phrase: "kms", severity: "immediate_danger", category: "self-harm", script: "latin" },
  { phrase: "kys", severity: "serious", category: "threat", script: "latin" },
  { phrase: "want to die", severity: "serious", category: "self-harm", script: "latin" },
  { phrase: "je veux mourir", severity: "immediate_danger", category: "self-harm", script: "latin" },
  { phrase: "me suicider", severity: "immediate_danger", category: "self-harm", script: "latin" },
  { phrase: "envie de mourir", severity: "serious", category: "self-harm", script: "latin" },
  { phrase: "nothing i do is enough", severity: "concerning", category: "hopelessness", script: "latin" },
  { phrase: "can't keep doing this", severity: "concerning", category: "hopelessness", script: "latin" },
  { phrase: "cant keep doing this", severity: "concerning", category: "hopelessness", script: "latin" },
  { phrase: "hate you", severity: "needs_attention", category: "harassment", script: "latin" },
  { phrase: "shut up", severity: "needs_attention", category: "harassment", script: "latin" },
  { phrase: "idiot", severity: "needs_attention", category: "harassment", script: "latin" },
  { phrase: "stupid", severity: "needs_attention", category: "harassment", script: "latin" },
  { phrase: "ta gueule", severity: "needs_attention", category: "harassment", script: "latin" },
  { phrase: "tu es stupide", severity: "needs_attention", category: "harassment", script: "latin" },
  { phrase: "baddi moot", severity: "immediate_danger", category: "self-harm", script: "arabizi" },
  { phrase: "baddi amoot", severity: "immediate_danger", category: "self-harm", script: "arabizi" },
  { phrase: "2n7ar", severity: "immediate_danger", category: "self-harm", script: "arabizi" },
  { phrase: "اقتل نفسي", severity: "immediate_danger", category: "self-harm", script: "ar" },
  { phrase: "انتحار", severity: "immediate_danger", category: "self-harm", script: "ar" },
  { phrase: "بدي موت", severity: "immediate_danger", category: "self-harm", script: "ar" },
  { phrase: "بدي اموت", severity: "immediate_danger", category: "self-harm", script: "ar" },
  { phrase: "كرهتك", severity: "needs_attention", category: "harassment", script: "ar" },
  { phrase: "اكرهك", severity: "needs_attention", category: "harassment", script: "ar" },
  { phrase: "just do it anyway", severity: "needs_attention", category: "bad-advice", script: "latin" },
];
