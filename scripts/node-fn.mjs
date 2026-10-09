/**
 * Hope Node + rewards stand-in for Cloud Functions.
 * The only writer of users.plant for a node check-in. Mood text is never stored.
 * Routes are served by scripts/dev-fn.mjs on port 5055.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/dev-fn.mjs
 */
import http from "node:http";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { Timestamp } from "firebase-admin/firestore";
import { callerUid } from "./auth-fn.mjs";

const NODE_SECRET = process.env.NABT_NODE_SECRET || "nabt-dev-node-secret";

export function signNodeToken(nodeId, exp = Date.now() + 90_000) {
  const body = `${nodeId}.${exp}`;
  const sig = crypto.createHmac("sha256", NODE_SECRET).update(body).digest("base64url").slice(0, 18);
  return `${body}.${sig}`;
}

export function verifyNodeToken(token, nodeId) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return false;
  const [id, exp, sig] = parts;
  if (id !== nodeId) return false;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = crypto.createHmac("sha256", NODE_SECRET).update(`${id}.${exp}`).digest("base64url").slice(0, 18);
  return expected === sig;
}

let db;
const uid = "cedar";

function stageFor(petals) {
  if (petals >= 7) return "Bloom";
  if (petals >= 2) return "Second petal";
  if (petals === 1) return "First petal";
  return "Seed";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function send(res, body) {
  const code = typeof body.http === "number" ? body.http : 200;
  const rest = { ...body };
  delete rest.http;
  res.statusCode = code;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(rest));
}

async function nodeCheckIn(uid, body) {
  const nodeId = String(body?.nodeId || "engineering");
  const token = String(body?.token || "");
  if (body?.kiosk !== true && !verifyNodeToken(token, nodeId)) {
    return { error: "Scan the code on the node. It changes every minute.", http: 403 };
  }
  const id = `${uid}_${nodeId}_${today()}`;
  const ref = db.doc(`checkins/${id}`);
  const userRef = db.doc(`users/${uid}`);
  let already = false;
  let petals = 0;
  await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    const user = await tx.get(userRef);
    const plant = user.data()?.plant || { petals: 0, roots: 0, stage: "Seed" };
    if (existing.exists) {
      already = true;
      petals = Number(plant.petals || 0);
      return;
    }
    petals = Math.min(7, Number(plant.petals || 0) + 1);
    const stage = stageFor(petals);
    tx.set(ref, { uid: uid, nodeId, date: today(), nickname: user.data()?.nickname || "A student", place: nodeId, at: Timestamp.now() });
    tx.update(userRef, { plant: { ...plant, petals, stage } });
    tx.set(db.collection("growthEvents").doc(), { uid: uid, kind: "petal", source: "node", nodeId, counted: true, at: Timestamp.now() });
  });
  const user = await db.doc(`users/${uid}`).get();
  const nickname = user.data()?.nickname || "A student";
  await db.doc(`nodes/${nodeId}/live/current`).set({
    event: "checkin",
    nickname,
    text: already ? "Already checked in" : "Checked in",
    at: Timestamp.now(),
  });
  return { ok: true, already, petals, nickname };
}

async function nodeNote(uid, body) {
  const text = String(body.text || "").slice(0, 80);
  const nodeId = String(body.nodeId || "engineering");
  if (!text) return { error: "Write one line first.", http: 400 };
  const passed = body.passedFilter === true && text.length <= 80;
  const status = passed ? "approved" : "held";
  const user = await db.doc(`users/${uid}`).get();
  const nickname = user.data()?.nickname || "A student";
  const note = db.collection("nodes").doc(nodeId).collection("notes").doc();
  await note.set({
    authorUid: uid,
    nickname,
    text,
    status,
    order: Date.now(),
    createdAt: Timestamp.now(),
  });
  await db.collection("users").doc(uid).collection("nodeNotes").doc(note.id).set({
    state: status === "approved" ? "On screen" : "Held by filter",
    place: "Faculty of Engineering · today",
    text,
    order: 0,
    createdAt: Timestamp.now(),
  });
  if (status === "approved") {
    await db.doc(`nodes/${nodeId}/live/current`).set({ event: "photo", text, nickname, seconds: 20 });
  }
  return { ok: true, status, id: note.id };
}

async function dedicate(uid, body) {
  const lotusId = String(body.lotusId || "l3");
  const to = String(body.toNickname || "").slice(0, 40);
  const note = String(body.note || "").slice(0, 80);
  const lotusRef = db.doc(`users/${uid}/garden/${lotusId}`);
  const fromNick = String((await db.doc(`users/${uid}`).get()).data()?.nickname || "A student");
  await lotusRef.set({ dedicatedTo: to, dedicationNote: note }, { merge: true });
  await db.collection("dedications").add({
    from: "Quiet Cedar",
    initial: "C",
    to,
    ago: "Just now",
    order: 0,
    status: "approved",
    lotusId,
    at: Timestamp.now(),
  });
  return { ok: true };
}

async function redeem(uid, body) {
  const perkId = String(body.perkId || "coffee");
  const ref = db.doc(`redemptions/${uid}-${perkId}`);
  await ref.set(
    {
      uid: uid,
      perkId,
      status: "valid",
      code,
      at: Timestamp.now(),
    },
    { merge: true },
  );
  return { ok: true, code };
}

async function vendorScan(uid, body) {
  const code = String(body.code || "");
  const snap = await db.collection("redemptions").where("code", "==", code).limit(1).get();
  if (snap.empty) return { error: "Unknown code.", http: 404 };
  const ref = snap.docs[0].ref;
  let result = "used";
  await db.runTransaction(async (tx) => {
    const cur = await tx.get(ref);
    const data = cur.data() || {};
    if (data.status === "valid") {
      result = "valid";
      tx.update(ref, { status: "used", usedAt: Timestamp.now() });
    } else {
      result = "used";
    }
  });
  const data = (await ref.get()).data() || {};
  return {
    ok: true,
    result,
    headline: result === "valid" ? data.validHeadline || "Valid ✓" : data.usedHeadline || "Already used",
    body: result === "valid" ? data.itemLine || "" : data.usedBody || "",
    perk: data.perkShort || "",
    code: data.code || code,
    status: result === "valid" ? data.validStatus || "Marked used now" : data.usedStatus || "Used · not valid again",
    partnerName: data.partnerName || "",
  };
}

async function pinBadge(uid, body) {
  const badgeId = String(body.badgeId || "");
  const pinned = Boolean(body.pinned);
  const ref = db.doc(`users/${uid}/earned/${badgeId}`);
  const cur = await ref.get();
  if (!cur.exists) return { error: "No such badge.", http: 404 };
  if (cur.data()?.locked) return { error: "That badge is still locked.", http: 400 };
  if (pinned) {
    const all = await db.collection("users").doc(uid).collection("earned").where("pinned", "==", true).get();
    const already = all.docs.some((d) => d.id === badgeId);
    if (!already && all.size >= 3) return { error: "Pin up to 3 badges.", http: 400 };
  }
  await ref.set({ pinned }, { merge: true });
  return { ok: true };
}

async function nameBloom(uid, body) {
  const lotusId = String(body.lotusId || "");
  const name = String(body.name || "").slice(0, 40);
  if (!name) return { error: "Add a name.", http: 400 };
  await db.doc(`users/${uid}/garden/${lotusId}`).set({ name }, { merge: true });
  return { ok: true };
}

/** A Hope Node tablet creates its own node document the first time it opens. */
async function ensureNode(nodeId) {
  const ref = db.doc(`nodes/${nodeId}`);
  const snap = await ref.get();
  if (snap.exists) return { ok: true, created: false };
  const title = nodeId
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const faculty = nodeId === "engineering" ? "Faculty of Engineering" : title;
  await ref.set({
    name: faculty,
    title: nodeId === "engineering" ? "Faculty of Engineering node is awake" : `Hope Node · ${title} is awake`,
    place: faculty,
    hours: "Awake now",
    awake: true,
    inboxOrder: Date.now(),
    mode: "normal",
    createdAt: Timestamp.now(),
  });
  await db.doc(`nodes/${nodeId}/live/current`).set({ event: "idle", text: "", nickname: "", at: Timestamp.now() });
  return { ok: true, created: true };
}

const routes = {
  "/node-token": (_uid, body) => ({ ok: true, token: signNodeToken(String(body.nodeId || "engineering")) }),
  "/node-check-in": (uid, body) => nodeCheckIn(uid, body),
  "/node-note": (uid, body) => nodeNote(uid, body),
  "/dedicate": (uid, body) => dedicate(uid, body),
  "/redeem": (uid, body) => redeem(uid, body),
  "/vendor-scan": (uid, body) => vendorScan(uid, body),
  "/pin-badge": (uid, body) => pinBadge(uid, body),
  "/name-bloom": (uid, body) => nameBloom(uid, body),
  "/node-ensure": (uid, body) => ensureNode(String(body.nodeId || "engineering")),
};

export function isNodeRoute(url) {
  return Object.prototype.hasOwnProperty.call(routes, url || "");
}

export async function handleNodeRequest(req, res, database) {
  db = database;
  const handler = routes[req.url || ""];
  if (!handler) {
    send(res, { error: "not found", http: 404 });
    return;
  }
  try {
    const body = await readBody(req);
    // Who is tapping: the signed-in user's ID token. Vendor scanners and tablets send none.
    const uid = (await callerUid(req)) || "";
    if (!uid && req.url !== "/vendor-scan" && req.url !== "/node-ensure" && req.url !== "/node-token") {
      send(res, { error: "Sign in first.", http: 401 });
      return;
    }
    send(res, await handler(uid, body));
  } catch (err) {
    send(res, { error: String(err), http: 500 });
  }
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invoked) {
  const { initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
  const database = getFirestore();
  const port = Number(process.env.NABT_FN_PORT || 5055);
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method === "POST" && isNodeRoute(req.url)) {
      await handleNodeRequest(req, res, database);
      return;
    }
    send(res, { error: "not found", http: 404 });
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`node rewards function listening on ${port} (prefer scripts/dev-fn.mjs, which includes these routes)`);
  });
}
