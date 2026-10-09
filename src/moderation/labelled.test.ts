/**
 * Labelled multilingual moderation set (AR / FR / EN / Arabizi, including code-switch).
 * Run: node --experimental-strip-types --test src/moderation/labelled.test.ts
 */
import assert from "node:assert/strict";
import test from "node:test";
import { classifyText } from "./classify.ts";
import { normalizeArabic, normalizeLatin } from "./normalize.ts";

const CASES: { text: string; severity: string; category: string; note: string }[] = [
  { text: "Anyone else stuck on Signals ch. 7?", severity: "none", category: "none", note: "benign EN, digit 7 is not a crisis term" },
  { text: "Bonjour, ça va?", severity: "none", category: "none", note: "benign FR" },
  { text: "خلص خلصنا الفصل", severity: "none", category: "none", note: "benign AR" },
  { text: "ya zalameh, see you at 3", severity: "none", category: "none", note: "benign Arabizi digit 3" },
  { text: "I want to die", severity: "serious", category: "self-harm", note: "EN self-harm" },
  { text: "I want to kill myself", severity: "immediate_danger", category: "self-harm", note: "EN immediate" },
  { text: "heeelp, I want to die", severity: "serious", category: "self-harm", note: "elongation still matches" },
  { text: "je veux mourir", severity: "immediate_danger", category: "self-harm", note: "FR" },
  { text: "بدي موت", severity: "immediate_danger", category: "self-harm", note: "AR" },
  { text: "أَقْتُل نَفْسِي", severity: "immediate_danger", category: "self-harm", note: "AR with tashkeel" },
  { text: "baddi moot tonight", severity: "immediate_danger", category: "self-harm", note: "Arabizi lexicon" },
  { text: "2n7ar", severity: "immediate_danger", category: "self-harm", note: "Arabizi digits 2 and 7" },
  { text: "khalas I want to die", severity: "serious", category: "self-harm", note: "code-switch AR/EN" },
  { text: "I can't keep doing this, nothing I do is enough anymore.", severity: "concerning", category: "hopelessness", note: "support-card phrase" },
  { text: "you are an idiot", severity: "needs_attention", category: "harassment", note: "EN harassment" },
  { text: "ta gueule", severity: "needs_attention", category: "harassment", note: "FR harassment" },
  { text: "اكرهك", severity: "needs_attention", category: "harassment", note: "AR harassment" },
  { text: "", severity: "none", category: "none", note: "empty" },
];

test("arabic normalisation and arabizi digits 2/3/5/7/9", () => {
  assert.equal(normalizeArabic("أَنا"), "انا");
  assert.equal(normalizeArabic("لااااا"), "لاا");
  assert.equal(normalizeLatin("sooooo"), "soo");
  assert.equal(normalizeArabic("2"), "ء");
  assert.equal(normalizeArabic("3"), "ع");
  assert.equal(normalizeArabic("5"), "خ");
  assert.equal(normalizeArabic("7"), "ح");
  assert.equal(normalizeArabic("9"), "ق");
});

test("labelled multilingual set", () => {
  for (const row of CASES) {
    const got = classifyText(row.text);
    assert.equal(got.severity, row.severity, row.note);
    assert.equal(got.category, row.category, row.note);
  }
});
