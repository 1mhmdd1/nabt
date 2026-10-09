import {
  childDocs,
  currentAccount,
  patchDoc,
  readDoc,
  removeDoc,
  subscribe,
  whenReady,
  writeDoc,
} from "../store";
import { Timestamp } from "../time";

export { Timestamp };

type Constraint =
  | { type: "where"; field: string; op: string; value: unknown }
  | { type: "orderBy"; field: string; dir: "asc" | "desc" };

type Ref =
  | { kind: "db" }
  | { kind: "collection"; path: string }
  | { kind: "doc"; path: string; id: string }
  | { kind: "query"; path: string; constraints: Constraint[] };

let seq = 0;
function autoId() {
  seq += 1;
  return `d${Date.now().toString(36)}${seq}`;
}

const db: Ref = { kind: "db" };

export function getFirestore() {
  return db;
}

export function connectFirestoreEmulator() {
  /* phone demo has no emulator */
}

export function collection(_db: unknown, ...parts: string[]): Ref {
  return { kind: "collection", path: parts.join("/") };
}

export function doc(parent: Ref | unknown, ...parts: string[]): Ref {
  const base = parent as Ref;
  if (base && base.kind === "collection") {
    const id = parts[0] || autoId();
    const extra = parts.length ? parts.join("/") : id;
    const path = `${base.path}/${extra}`;
    return { kind: "doc", path, id: path.split("/").pop() || id };
  }
  const path = parts.join("/");
  return { kind: "doc", path, id: parts[parts.length - 1] || path };
}

export function query(col: Ref, ...constraints: Constraint[]): Ref {
  const base = col.kind === "query" ? col : { kind: "query" as const, path: col.kind === "collection" ? col.path : "", constraints: [] as Constraint[] };
  return { kind: "query", path: base.path, constraints: [...(col.kind === "query" ? col.constraints : []), ...constraints] };
}

export function where(field: string, op: string, value: unknown): Constraint {
  return { type: "where", field, op, value };
}

export function orderBy(field: string, dir: "asc" | "desc" = "asc"): Constraint {
  return { type: "orderBy", field, dir };
}

export function serverTimestamp() {
  return { __op: "serverTimestamp" as const };
}

export function increment(n: number) {
  return { __op: "increment" as const, n };
}

function sortKey(v: unknown) {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "number") return v;
  if (typeof v === "string") return v;
  return 0;
}

function matches(data: Record<string, unknown>, constraints: Constraint[]) {
  for (const rule of constraints) {
    if (rule.type !== "where") continue;
    const val = data[rule.field];
    if (rule.op === "==") {
      if (val !== rule.value) return false;
    } else if (rule.op === "array-contains") {
      if (!Array.isArray(val) || !val.includes(rule.value)) return false;
    } else if (rule.op === "in") {
      if (!Array.isArray(rule.value) || !rule.value.includes(val)) return false;
    } else return false;
  }
  return true;
}

function denied(path: string) {
  // The check-in code lives only with the organizer's QR, never in a client read.
  if (path === "eventCodes" || path.startsWith("eventCodes/")) return true;
  if (path !== "auditLogs" && !path.startsWith("auditLogs/")) return false;
  return currentAccount()?.claims.admin !== true;
}

/** Fields only Student Affairs (or the phone's function handlers) may change on a profile. */
const LOCKED_USER_KEYS = ["role", "roleLabel", "staffRole", "status", "alumni", "classYear", "plant", "gardenCount", "communityRoles"];
/** Collections written only by Student Affairs. */
const SA_ONLY = ["accountQueue", "accountDecisions", "staffCertificates", "staffBookings", "staffCommunities", "communityReviews", "chairChanges", "revealRequests", "heldItems", "accommodationStatus", "staffProfile", "staffOverview"];
/** Written only by the function handlers, never straight from a screen. */
const HANDLER_ONLY = ["certificates", "certificatePublic", "records", "eventCodes", "auditLogs", "growthEvents"];

function forbid(): never {
  const err = new Error("Missing or insufficient permissions.") as Error & { code: string };
  err.code = "permission-denied";
  throw err;
}

/**
 * The phone demo's stand-in for firestore.rules on writes. The screens hide what a role
 * can't do; this makes sure the store refuses it too.
 */
function guardWrite(path: string, data: Record<string, unknown> | null) {
  const account = currentAccount();
  if (!account) forbid();
  const claims = account.claims || {};
  const staff = claims.sa === true || claims.counselor === true || claims.admin === true;
  const parts = path.split("/");
  const top = parts[0];
  const keys = data ? Object.keys(data) : [];
  if (HANDLER_ONLY.includes(top)) forbid();
  if (SA_ONLY.includes(top) && !staff) forbid();
  if (top === "users" && parts.length === 2) {
    if (parts[1] !== account.uid && !staff) forbid();
    if (!staff && keys.some((k) => LOCKED_USER_KEYS.includes(k))) forbid();
  }
  if (top === "users" && parts.length > 2 && parts[1] !== account.uid && !staff) forbid();
  if (top === "events") {
    // Attendance is written only after the organizer's QR code checks out.
    if (parts[2] === "attendance") forbid();
    if (parts.length === 2 && !staff) {
      const event = readDoc(path);
      const chair = event && event.hostType === "circle" && String(readDoc(`circles/${String(event.hostId || "")}`)?.chairUid || "") === account.uid;
      if (!chair || keys.some((k) => k !== "screenDescription")) forbid();
    }
  }
  if (top === "circles" && parts.length === 2 && !staff) {
    // Verified, the Chair and the official line are Student Affairs decisions.
    if (keys.some((k) => ["verified", "chairUid", "chairName", "officialLine", "kind"].includes(k))) forbid();
  }
  const chairOf = (circleId: unknown) => String(readDoc(`circles/${String(circleId || "")}`)?.chairUid || "") === account.uid;
  if (top === "announcements" && !staff) {
    // A Chair posts to their own Circle only, never as verified Student Affairs news.
    if (data?.audience !== "circle" || data?.verified === true || !chairOf(data?.circleId)) forbid();
  }
  if (top === "activityReports" && parts.length === 2 && !staff) {
    const circleId = data?.circleId ?? readDoc(path)?.circleId;
    if (!chairOf(circleId)) forbid();
  }
  if (top === "venueRequests" && parts.length === 2 && !staff) {
    if (!chairOf(data?.circleId ?? readDoc(path)?.circleId) || (data?.status != null && data.status !== "sent")) forbid();
  }
  if ((top === "petitions" || top === "staffMeetups") && parts.length === 2 && !staff && readDoc(path)) {
    // Students sign or propose. Only Student Affairs answers.
    if (keys.some((k) => k !== "signCount")) forbid();
  }
  // Your own line, your own meetup request.
  if (top === "circles" && (parts[2] === "meetupRequests" || parts[4] === "answers" || parts[4] === "votes") && parts[parts.length - 1] !== account.uid && !staff) forbid();
  if (top === "staffMeetups" && !staff && !readDoc(path) && data?.uid !== account.uid) forbid();
  // Only an account Student Affairs graduated to alumni can offer mentoring.
  if (top === "alumniMentors" && claims.alumni !== true) forbid();
  if (top === "circles" && parts[2] === "members" && !staff) {
    const roles = data?.roles;
    if (Array.isArray(roles) && roles.length > 0) forbid();
  }
}

function docSnap(path: string) {
  const data = readDoc(path);
  const id = path.split("/").pop() || path;
  return {
    id,
    exists: () => data != null,
    data: () => (data ? { ...data } : undefined),
  };
}

function colSnap(path: string, constraints: Constraint[]) {
  let rows = childDocs(path).filter((row) => matches(row.data, constraints));
  const order = constraints.find((rule) => rule.type === "orderBy");
  if (order && order.type === "orderBy") {
    rows = [...rows].sort((a, b) => {
      const av = sortKey(a.data[order.field]);
      const bv = sortKey(b.data[order.field]);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return order.dir === "desc" ? -cmp : cmp;
    });
  }
  const docs = rows.map((row) => ({
    id: row.id,
    exists: () => true,
    data: () => ({ ...row.data }),
  }));
  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach(fn: (doc: (typeof docs)[number]) => void) {
      docs.forEach(fn);
    },
  };
}

function readRef(ref: Ref) {
  if (ref.kind === "doc") {
    if (denied(ref.path)) return { denied: true as const };
    return { denied: false as const, snap: docSnap(ref.path) };
  }
  const path = ref.kind === "query" || ref.kind === "collection" ? ref.path : "";
  const constraints = ref.kind === "query" ? ref.constraints : [];
  if (denied(path)) return { denied: true as const };
  return { denied: false as const, snap: colSnap(path, constraints) };
}

export function onSnapshot(ref: Ref, next: (snap: unknown) => void, error?: (err: { code: string; message: string }) => void) {
  const mode = ref.kind === "doc" ? "doc" : "col";
  const path = ref.kind === "doc" || ref.kind === "collection" || ref.kind === "query" ? ref.path : "";
  let stop = () => {};
  let dead = false;
  const run = () => {
    if (dead) return;
    const result = readRef(ref);
    if (result.denied) {
      error?.({ code: "permission-denied", message: "Missing or insufficient permissions." });
      return;
    }
    next(result.snap);
  };
  void whenReady().then(() => {
    if (dead) return;
    run();
    stop = subscribe(path, mode, run);
  });
  return () => {
    dead = true;
    stop();
  };
}

export async function getDoc(ref: Ref) {
  await whenReady();
  const result = readRef(ref);
  if (result.denied) {
    const err = new Error("Missing or insufficient permissions.") as Error & { code: string };
    err.code = "permission-denied";
    throw err;
  }
  return result.snap;
}

export async function getDocs(ref: Ref) {
  return getDoc(ref);
}

export async function setDoc(ref: Ref, data: Record<string, unknown>, opts?: { merge?: boolean }) {
  await whenReady();
  if (ref.kind !== "doc") throw new Error("setDoc needs a document.");
  guardWrite(ref.path, data);
  writeDoc(ref.path, data, Boolean(opts?.merge));
}

export async function updateDoc(ref: Ref, data: Record<string, unknown>) {
  await whenReady();
  if (ref.kind !== "doc") throw new Error("updateDoc needs a document.");
  guardWrite(ref.path, data);
  patchDoc(ref.path, data);
}

export async function addDoc(col: Ref, data: Record<string, unknown>) {
  await whenReady();
  if (col.kind !== "collection") throw new Error("addDoc needs a collection.");
  const id = autoId();
  const path = `${col.path}/${id}`;
  guardWrite(path, data);
  writeDoc(path, data, false);
  return { id, path };
}

export async function deleteDoc(ref: Ref) {
  await whenReady();
  if (ref.kind !== "doc") return;
  guardWrite(ref.path, null);
  removeDoc(ref.path);
}
