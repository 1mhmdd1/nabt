/**
 * Sign-up and sign-in for real accounts, run through the Admin SDK on the local function server.
 *
 *   POST /auth/send-code   { studentId, mode?: "signup" | "login", fullName?, faculty?, scanned? }
 *                          → { ok, demoCode, expiresIn }     (demoCode is shown in the app because no email is sent locally)
 *   POST /auth/verify      { studentId, code }
 *                          → { ok, customToken, uid, isNew, status, nickname }
 *   POST /auth/nickname-check  (Bearer id token)  { nickname } → { ok, problem }
 *   POST /auth/nickname        (Bearer id token)  { nickname } → { ok, nickname }
 *
 * Codes live in loginCodes/{studentId}; clients can never read or write that collection.
 */
import { randomInt } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import { initialsOf, nicknameKey, nicknameProblem } from "../src/nickname/rules.mjs";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SHOW_DEMO_CODE = process.env.NABT_HIDE_DEMO_CODE !== "1";

function json(res, code, body) {
  res.statusCode = code;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

const emailFor = (id) => `${id}@ua.edu.lb`;
const validId = (id) => /^\d{9}$/.test(id);

async function userByEmail(email) {
  try {
    return await getAuth().getUserByEmail(email);
  } catch (err) {
    if (err?.code === "auth/user-not-found") return null;
    throw err;
  }
}

/** Who is calling, from the Bearer ID token. Null when there is none. */
export async function callerUid(req) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export function isAuthRoute(url) {
  return typeof url === "string" && url.startsWith("/auth/");
}

export async function handleAuthRequest(req, res, db) {
  const body = await readBody(req);
  const url = req.url || "";
  try {
    if (url === "/auth/send-code") {
      const studentId = String(body.studentId || "").replace(/\D/g, "");
      if (!validId(studentId)) return json(res, 400, { code: "bad_id", message: "A UA ID has 9 digits." });
      const mode = body.mode === "login" ? "login" : "signup";
      const existing = await userByEmail(emailFor(studentId));
      if (mode === "login" && !existing) {
        return json(res, 404, { code: "unknown_id", message: "No account for that ID. Scan your card." });
      }
      const code = String(randomInt(0, 1000000)).padStart(6, "0");
      const draft = {
        fullName: String(body.fullName || "").trim().slice(0, 80),
        faculty: String(body.faculty || "").trim().slice(0, 80),
        scanned: body.scanned && typeof body.scanned === "object"
          ? {
              fullName: String(body.scanned.fullName || "").slice(0, 80),
              studentId: String(body.scanned.studentId || "").slice(0, 12),
              faculty: String(body.scanned.faculty || "").slice(0, 80),
            }
          : null,
      };
      await db.doc(`loginCodes/${studentId}`).set({
        code,
        attempts: 0,
        sentAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_MS),
        mode,
        draft,
      });
      // A real deployment emails the code. Locally nothing is sent, so the app shows it.
      console.log(`sign-in code issued for ${emailFor(studentId)}`);
      return json(res, 200, { ok: true, demoCode: SHOW_DEMO_CODE ? code : null, expiresIn: CODE_TTL_MS / 1000 });
    }

    if (url === "/auth/verify") {
      const studentId = String(body.studentId || "").replace(/\D/g, "");
      const code = String(body.code || "").replace(/\D/g, "");
      if (!validId(studentId) || code.length !== 6) return json(res, 400, { code: "bad_code", message: "Enter the 6-digit code." });
      const ref = db.doc(`loginCodes/${studentId}`);
      const snap = await ref.get();
      const data = snap.data();
      if (!data) return json(res, 400, { code: "no_code", message: "Ask for a new code." });
      if (data.expiresAt.toMillis() < Date.now()) {
        await ref.delete();
        return json(res, 400, { code: "expired", message: "That code expired. Ask for a new one." });
      }
      if (data.attempts >= MAX_ATTEMPTS) {
        await ref.delete();
        return json(res, 429, { code: "too_many", message: "Too many tries. Ask for a new code." });
      }
      if (data.code !== code) {
        await ref.set({ attempts: (data.attempts || 0) + 1 }, { merge: true });
        return json(res, 400, { code: "wrong_code", message: "That code doesn’t match. Check the email and try again." });
      }
      await ref.delete();

      const email = emailFor(studentId);
      let user = await userByEmail(email);
      const isNewAuth = !user;
      if (!user) user = await getAuth().createUser({ email, emailVerified: true });
      const uid = user.uid;

      const priv = db.doc(`users_private/${uid}`);
      const privSnap = await priv.get();
      const draft = data.draft || {};
      if (!privSnap.exists) {
        await priv.set({
          fullName: draft.fullName || "",
          studentId,
          email,
          faculty: draft.faculty || "",
          scanned: draft.scanned || null,
          submittedAt: Timestamp.now(),
        });
      } else if (draft.fullName && !privSnap.data()?.fullName) {
        await priv.set({ fullName: draft.fullName, faculty: draft.faculty || "" }, { merge: true });
      }

      const profile = (await db.doc(`users/${uid}`).get()).data() || null;
      const status = profile?.status || "pending";
      const claims = user.customClaims || {};
      if (claims.status !== status) await getAuth().setCustomUserClaims(uid, { ...claims, status });
      const customToken = await getAuth().createCustomToken(uid, { status });
      console.log(`sign-in ok for ${email}${isNewAuth ? " (new account)" : ""}`);
      return json(res, 200, { ok: true, customToken, uid, isNew: !profile, status, nickname: profile?.nickname || "" });
    }

    if (url === "/auth/nickname-check" || url === "/auth/nickname") {
      const uid = await callerUid(req);
      if (!uid) return json(res, 401, { code: "sign_in", message: "Sign in first." });
      const nickname = String(body.nickname || "").trim().replace(/\s+/g, " ");
      const priv = (await db.doc(`users_private/${uid}`).get()).data() || {};
      let problem = nicknameProblem(nickname, { fullName: priv.fullName, studentId: priv.studentId, email: priv.email });
      const key = nicknameKey(nickname);
      if (!problem && key) {
        const taken = await db.doc(`nicknames/${key}`).get();
        if (taken.exists && taken.data()?.uid !== uid) problem = "Someone already has that name.";
      }
      if (url === "/auth/nickname-check") return json(res, 200, { ok: !problem, problem });
      if (problem) return json(res, 400, { code: "bad_nickname", message: problem });

      const existing = (await db.doc(`users/${uid}`).get()).data();
      if (existing?.nickname) return json(res, 409, { code: "has_nickname", message: "Your nickname is already set." });

      const now = Timestamp.now();
      const batch = db.batch();
      batch.set(db.doc(`nicknames/${key}`), { uid, nickname, at: now });
      batch.set(db.doc(`users/${uid}`), {
        nickname,
        greetingName: nickname.split(" ").pop(),
        initial: initialsOf(nickname).slice(0, 1),
        status: "pending",
        campus: "UA",
        plant: { petals: 0, roots: 0, stage: "Seed" },
        gardenCount: 0,
        createdAt: now,
      });
      batch.set(db.doc(`users/${uid}/settings/main`), { accessibility: { calmMode: "off" } }, { merge: true });
      // Student Affairs sees the request in Reviews. Scanned vs submitted, never the photo.
      const scanned = priv.scanned || {};
      const fields = [
        { label: "Full name", scanned: scanned.fullName || "", submitted: priv.fullName || "", edited: Boolean(scanned.fullName) && scanned.fullName !== priv.fullName },
        { label: "ID number", scanned: scanned.studentId || "", submitted: priv.studentId || "", edited: Boolean(scanned.studentId) && scanned.studentId !== priv.studentId },
        { label: "Role", scanned: "Student", submitted: "Student", locked: true },
      ];
      batch.set(db.doc(`accountQueue/${uid}`), {
        uid,
        initial: initialsOf(nickname).slice(0, 1),
        name: nickname,
        role: "Student",
        edited: fields.filter((f) => f.edited).length,
        when: "Just now",
        status: "pending",
        chip: "Pending",
        chipOn: true,
        order: Date.now(),
        filter: "pending",
        email: priv.email || "",
        submitted: "Just now",
        fields,
        createdAt: now,
      });
      await batch.commit();
      const user = await getAuth().getUser(uid);
      await getAuth().setCustomUserClaims(uid, { ...(user.customClaims || {}), status: "pending" });
      console.log(`nickname set for ${uid}`);
      return json(res, 200, { ok: true, nickname });
    }

    return json(res, 404, { code: "not_found", message: "Unknown route." });
  } catch (err) {
    console.error("auth route failed:", err);
    return json(res, 500, { code: "server", message: String(err?.message || err) });
  }
}
