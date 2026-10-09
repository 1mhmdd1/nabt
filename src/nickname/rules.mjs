/**
 * Nickname rules, shared by the app (import from TS) and the function server (Node).
 * Plain JavaScript on purpose so both can load it without a build step.
 *
 * A nickname is 3-20 letters and spaces. It is rejected when it contains the student's
 * first or last name (accent-insensitive, with common spelling variants and Arabizi),
 * their student ID or UA email, phone-like digits, links or @handles, or an offensive word.
 * Uniqueness is checked separately against the `nicknames` collection.
 */

export const NICK_MIN = 3;
export const NICK_MAX = 20;

/** Common spellings that should all count as the same name. */
const VARIANTS = [
  ["mohamad", "mohammad", "mohammed", "muhammad", "mohamed", "muhammed", "mhmd", "mhd", "hamoudi", "moh", "hamoud"],
  ["ahmad", "ahmed", "ahmd"],
  ["ali", "aly", "3ali", "3li"],
  ["hussein", "hussain", "husein", "hussen", "hsein", "hsen"],
  ["hassan", "hasan", "hsn"],
  ["omar", "umar", "3omar", "3mr"],
  ["youssef", "yousef", "yusuf", "youssouf", "joseph"],
  ["ibrahim", "ibraheem", "brahim", "abraham"],
  ["khalil", "khaleel"],
  ["mahmoud", "mahmud", "mahmood"],
  ["mustafa", "mostafa", "moustafa"],
  ["abdallah", "abdullah", "abdulla", "abdalla"],
  ["sara", "sarah", "sarra"],
  ["maria", "mariam", "maryam", "meriem", "mariem"],
  ["fatima", "fatme", "fatmeh", "fatimah"],
  ["zeinab", "zainab", "zaynab", "zeynab"],
  ["nour", "noor", "nur"],
  ["lea", "leah", "lia"],
  ["rami", "ramy"],
  ["elie", "eli", "elias", "ilyas"],
  ["georges", "george", "jorj", "giorgio"],
  ["charbel", "sharbel"],
  ["jad", "jad", "jaad"],
  ["karim", "kareem"],
  ["rana", "ranah"],
  ["hadi", "hady"],
  ["aya", "ayah"],
  ["lara", "larah"],
  ["nadine", "nadin"],
  ["yara", "yarah"],
  ["jana", "janna", "janah"],
  ["mira", "mirah"],
  ["joe", "joseph", "jo"],
  ["tony", "antoine", "anthony", "antonio"],
  ["michel", "michael", "mikhael", "mikhail", "mike"],
  ["peter", "boutros", "pierre", "petros"],
  ["john", "jean", "youhanna", "yahya", "hanna"],
];

/** A short, local list. Matching is on normalised letters, so leetspeak is caught too. */
const OFFENSIVE = [
  "fuck", "fuk", "shit", "bitch", "slut", "whore", "cunt", "dick", "cock", "pussy", "nigg", "fag", "rape", "nazi", "hitler",
  "kys", "porn", "sexy", "boob", "penis", "vagina", "retard",
  // Arabic / Lebanese Arabizi
  "sharmouta", "sharmota", "charmouta", "kess", "ayre", "ayri", "airi", "3ayre", "3ayri", "zebi", "zebbi", "manyak",
  "manyouk", "manyuk", "kol khara", "khara", "khra", "tozz", "tezz", "ahbal", "hmar", "7mar", "kalb", "ya kalb", "wled", "ibn el",
  "neek", "nayek", "koss", "tabbit", "hayawan", "7ayawan", "zbale", "zbeleh",
  // staff impersonation
  "admin", "nabt", "staff", "counselor", "counsellor", "student affairs", "antonine", "university", "ua official",
];

/** Lower-cases, strips accents, maps leetspeak digits to letters, collapses spaces. */
export function normalise(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[0@]/g, (c) => (c === "0" ? "o" : "a"))
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Variant groups that match a name token, plus the token itself. */
function expand(token) {
  const out = new Set([token]);
  for (const group of VARIANTS) {
    if (group.includes(token)) group.forEach((g) => out.add(g));
  }
  return [...out].filter((v) => v.length >= 3);
}

/**
 * Validates a nickname. Returns null when it is fine, otherwise a short reason to show
 * under the field. `identity` carries what the nickname must not reveal.
 *
 * @param {string} nickname
 * @param {{ fullName?: string, studentId?: string, email?: string }} identity
 */
export function nicknameProblem(nickname, identity = {}) {
  const raw = String(nickname || "").trim();
  if (!raw) return "Pick a nickname.";
  if (raw.length < NICK_MIN) return `At least ${NICK_MIN} letters.`;
  if (raw.length > NICK_MAX) return `At most ${NICK_MAX} letters.`;
  if (!/^[A-Za-z\u00C0-\u024F][A-Za-z\u00C0-\u024F ]*$/.test(raw)) return "Letters and spaces only.";
  if (/\d/.test(raw)) return "Letters and spaces only.";
  if (/(^|\s)@|https?:|www\.|\.com|\.lb|\.net|\.org/i.test(raw)) return "Links and @handles are not allowed.";

  const norm = normalise(raw);
  const padded = ` ${norm} `;
  const squashed = norm.replace(/ /g, "");

  const id = String(identity.studentId || "").replace(/\D/g, "");
  const email = String(identity.email || "").toLowerCase();
  const rawLower = raw.toLowerCase().replace(/\s+/g, "");
  if (id && rawLower.includes(id)) return "Your student ID can’t be in it.";
  if (email && rawLower.includes(email.split("@")[0])) return "Your UA email can’t be in it.";
  if (/\d{6,}/.test(raw.replace(/\s+/g, ""))) return "That looks like a phone number.";

  const nameTokens = normalise(identity.fullName || "")
    .split(" ")
    .filter((tkn) => tkn.length >= 3);
  for (const token of nameTokens) {
    for (const variant of expand(token)) {
      if (squashed.includes(variant)) return "Can’t be your real name.";
    }
  }

  for (const word of OFFENSIVE) {
    const w = normalise(word);
    if (!w) continue;
    if (w.includes(" ") ? padded.includes(` ${w} `) : squashed.includes(w.replace(/ /g, ""))) return "Pick something kinder.";
  }
  return null;
}

/** Key used for uniqueness: letters only, lower case, no accents. "Quiet  Cedar" → "quietcedar". */
export function nicknameKey(nickname) {
  return normalise(nickname).replace(/ /g, "");
}

const ADJECTIVES = ["Quiet", "Gentle", "Bright", "Soft", "Keen", "Calm", "Still", "Warm", "Kind", "Steady", "Clear", "Mild", "Light", "Brave", "Patient"];
const NOUNS = ["Cedar", "Fig", "Pine", "Olive", "Maple", "Ash", "Laurel", "Reed", "Birch", "Willow", "Jasmine", "Sage", "Fern", "Moss", "Lotus", "Thyme"];

/** A safe two-word nickname. Never contains a real name because the word lists are fixed. */
export function rollNickname(random = Math.random) {
  const a = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(random() * NOUNS.length)];
  return `${a} ${n}`;
}

/** Up to two initials from a nickname, e.g. "Quiet Cedar" → "QC". */
export function initialsOf(nickname) {
  return String(nickname || "")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
