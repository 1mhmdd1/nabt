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
    workerPromise = createWorker("eng", 1, { cachePath: cacheDir, logger: () => undefined }).catch((err) => {
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

const STOP =
  /universit|antonine|student|étudiant|etudiant|carte|card|identit|faculty|facult|lebanon|liban|baabda|hadat|valid|expir|email|www|http|ua\.edu|date|birth|naissance|signature|matricule|number|numéro|numero|\bid\b|\bno\b|academic|year|semester|campus/i;
const FIELDS =
  /engineering|business|science|arts|medicine|health|law|music|education|sport|nursing|tourism|design|economics|pharmacy|dentistry|architecture|humanities|theology|information|computer|management|letters|communication|technology|ingénierie|gestion|sciences/i;

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
const isCaps = (s) => (s === s.toUpperCase() && /[A-Z]/.test(s) ? 1 : 0);

/** Pulls name, 9-digit student ID and faculty out of raw OCR text. */
export function parseCardText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let studentId = "";
  for (const line of lines) {
    for (const tok of line.split(/[^A-Za-z0-9]+/)) {
      if (tok.length < 9 || tok.length > 11) continue;
      const fixed = tok.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/[^0-9]/g, "");
      const m = fixed.match(/(19|20)\d{7}/);
      if (m) {
        studentId = m[0];
        break;
      }
    }
    if (studentId) break;
  }

  const facLine = lines.find((l) => /facult/i.test(l)) || lines.find((l) => FIELDS.test(l) && !/\d/.test(l));
  let faculty = "";
  if (facLine) {
    const clean = facLine.replace(/[^A-Za-zÀ-ÿ&' -]/g, " ").replace(/\s+/g, " ").trim();
    const m = clean.match(/facult(?:y|é|e)?\s*(?:of|de|des)?\s*(.+)$/i);
    faculty = m && m[1] ? `Faculty of ${titleCase(m[1])}` : titleCase(clean);
  }

  const candidates = lines.filter((l) => {
    if (/\d/.test(l) || STOP.test(l)) return false;
    const words = l.split(" ");
    if (words.length < 2 || words.length > 4 || l.length < 5 || l.length > 40) return false;
    return words.every((w) => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’.-]*$/.test(w) && w.length >= 1);
  });
  candidates.sort((a, b) => isCaps(b) - isCaps(a) || b.length - a.length);
  const fullName = candidates[0] ? titleCase(candidates[0]) : "";

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
