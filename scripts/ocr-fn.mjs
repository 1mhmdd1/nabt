/**
 * Reads the printed text on a UA ID card photo with tesseract.js (offline, no API key).
 * The image stays in memory for the one recognition and is dropped right after.
 *
 * Served by scripts/dev-fn.mjs as POST /ocr-id { image: <base64 jpeg> }
 *   → { ok, fullName, studentId, faculty }   (empty strings when a field was not found)
 *
 * The English language file is cached in .tess-cache/ after the first run.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { createWorker, PSM } from "tesseract.js";

const cacheDir = path.resolve(process.cwd(), ".tess-cache");
let workerPromise = null;

function worker() {
  if (!workerPromise) {
    mkdirSync(cacheDir, { recursive: true });
    let failed = null;
    const loading = createWorker("eng", 1, {
      cachePath: cacheDir,
      logger: () => undefined,
      // A failed language download must not take the whole server down.
      errorHandler: (err) => {
        failed = err;
        console.warn("card reader:", String(err?.message || err));
      },
    });
    // tesseract.js never settles when the language file can't be downloaded, so give up after a while.
    const limit = new Promise((_, reject) => {
      const started = Date.now();
      const tick = setInterval(() => {
        if (failed || Date.now() - started > 60000) {
          clearInterval(tick);
          reject(new Error("The card reader could not load its English language file. Connect the laptop to the internet once."));
        }
      }, 250);
      loading.finally(() => clearInterval(tick)).catch(() => undefined);
    });
    workerPromise = Promise.race([loading, limit]).catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/** Loads the reader ahead of the first scan so the student does not wait for it. */
export function warmReader() {
  worker().catch((err) => console.warn("card reader not ready:", String(err.message || err)));
}

// Lines on the card that are never part of the name.
const STOP =
  /universit|antonine|alumni|student|[ée]tudiant|class of|valid|thru|expir|carte|card|identit|facult|lebanon|liban|baabda|hadat|email|www|http|ua\.edu|date|birth|naissance|signature|matricule|number|num[ée]ro|\bid\b|academic|semester|campus/i;

const small = new Set(["of", "and", "the", "de", "des", "du", "et", "la", "le", "les"]);
function titleCase(s) {
  return s
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w, i) =>
      i > 0 && small.has(w)
        ? w
        : w
            .split("-")
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join("-"),
    )
    .join(" ");
}

/** A 9-digit UA ID: the year joined (2019 through this year), then 5 digits. */
function findStudentId(lines, thisYear) {
  const ok = (id) => {
    const year = Number(id.slice(0, 4));
    return id.length === 9 && year >= 2019 && year <= thisYear;
  };
  for (const line of lines) {
    // OCR often reads O as 0, I or l as 1, S as 5, B as 8 inside a number.
    const fixed = line.replace(/(?<=[0-9])[Oo]|[Oo](?=[0-9])/g, "0").replace(/(?<=[0-9])[Il|]|[Il|](?=[0-9])/g, "1").replace(/(?<=[0-9])S|S(?=[0-9])/g, "5").replace(/(?<=[0-9])B|B(?=[0-9])/g, "8");
    for (const run of fixed.replace(/(?<=\d)[ .-](?=\d)/g, "").match(/\d{9,}/g) || []) {
      if (run.length === 9 && ok(run)) return run;
    }
  }
  return "";
}

/** A line of the name: capitals only, one to three words, no digits. */
function isNameLine(line) {
  if (/\d/.test(line) || STOP.test(line)) return false;
  const clean = line.replace(/[^A-Za-zÀ-ÿ'’ -]/g, "").replace(/\s+/g, " ").trim();
  if (clean.length < 2 || clean.length > 30) return false;
  if (clean !== clean.toUpperCase()) return false;
  const words = clean.split(" ");
  return words.length >= 1 && words.length <= 3 && words.every((w) => /^[A-ZÀ-Þ][A-ZÀ-Þ'’-]*$/.test(w)) && clean.replace(/[^A-ZÀ-Þ]/g, "").length >= 2;
}

/**
 * Pulls name, 9-digit student ID and faculty out of the OCR text of a Université Antonine card.
 * The name is printed as two lines of capitals, first name then family name. The role line is
 * Student (with "Valid thru") or Alumni (with "Class of"). The cards print no faculty, so faculty
 * stays empty unless a faculty line is actually there.
 */
export function parseCardText(text, thisYear = new Date().getFullYear()) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const studentId = findStudentId(lines, thisYear);

  const facLine = lines.find((l) => /facult/i.test(l));
  let faculty = "";
  if (facLine) {
    const m = facLine.replace(/[^A-Za-zÀ-ÿ&' -]/g, " ").replace(/\s+/g, " ").trim().match(/facult(?:y|é|e)\s*(?:of|de|des|d')?\s*(.+)$/i);
    if (m && m[1]) faculty = `Faculty of ${titleCase(m[1])}`;
  }

  // First name and family name sit on two lines in a row. Join them; one line alone also counts.
  let fullName = "";
  for (let i = 0; i < lines.length; i++) {
    if (!isNameLine(lines[i])) continue;
    const first = lines[i].replace(/[^A-Za-zÀ-ÿ'’ -]/g, "").trim();
    const next = i + 1 < lines.length && isNameLine(lines[i + 1]) ? lines[i + 1].replace(/[^A-Za-zÀ-ÿ'’ -]/g, "").trim() : "";
    fullName = titleCase(next ? `${first} ${next}` : first);
    if (next || first.includes(" ")) break;
  }

  return { fullName, studentId, faculty };
}

function merge(a, b) {
  return { fullName: a.fullName || b.fullName, studentId: a.studentId || b.studentId, faculty: a.faculty || b.faculty };
}

/** Recognises the card. `base64` may carry a data: prefix. Returns parsed fields only. */
export async function readIdCard(base64) {
  let image = Buffer.from(String(base64).replace(/^data:image\/\w+;base64,/, ""), "base64");
  if (image.length < 1000) throw new Error("image too small");
  const w = await worker();
  try {
    await w.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    let parsed = parseCardText((await w.recognize(image)).data.text);
    if (!parsed.studentId || !parsed.fullName) {
      await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      parsed = merge(parsed, parseCardText((await w.recognize(image)).data.text));
    }
    return parsed;
  } finally {
    image = null; // nothing of the photo is kept
  }
}
