import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCardText } from "./ocr-fn.mjs";

const student = `UNIVERSITE ANTONINE
RAMI
KHOURY
Student
202212826
Valid thru 06/2027`;

const alumni = `Université Antonine
NOUR
SAAB
Alumni
Class of 2024
202211930`;

test("student card: two caps lines become one name, 9-digit ID, no faculty", () => {
  assert.deepEqual(parseCardText(student, 2026), { fullName: "Rami Khoury", studentId: "202212826", faculty: "" });
});

test("alumni card: Class of line is not part of the name", () => {
  assert.deepEqual(parseCardText(alumni, 2026), { fullName: "Nour Saab", studentId: "202211930", faculty: "" });
});

test("ID with OCR slips and spaces, and a year out of range is refused", () => {
  assert.equal(parseCardText("MAYA\nHADDAD\n2O22 128 26", 2026).studentId, "202212826");
  assert.equal(parseCardText("201812345", 2026).studentId, "");
  assert.equal(parseCardText("202712345", 2026).studentId, "");
});

test("a printed faculty line is kept; nothing is guessed", () => {
  assert.equal(parseCardText(`${student}\nFaculty of Engineering`, 2026).faculty, "Faculty of Engineering");
  assert.equal(parseCardText("Engineering\nRAMI\nKHOURY", 2026).faculty, "");
});

test("nothing readable gives empty fields", () => {
  assert.deepEqual(parseCardText("~~ ## 12", 2026), { fullName: "", studentId: "", faculty: "" });
});
