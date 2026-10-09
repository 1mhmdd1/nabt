import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildSeed, type SeedAccount, type SeedBlob } from "./seed";
import { Timestamp } from "./time";

const KEY = "nabt.demo.store.v1";

export type Account = SeedAccount;

type Listener = { path: string; mode: "doc" | "col"; run: () => void };

let memory: SeedBlob = buildSeed();
let ready = false;
const readyWait: Array<() => void> = [];
const listeners = new Set<Listener>();
const authListeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function revive(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(revive);
  if (v && typeof v === "object") {
    const row = v as Record<string, unknown>;
    if (typeof row.__ts === "number" && Object.keys(row).length === 1) return Timestamp.fromMillis(row.__ts);
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(row)) out[k] = revive(val);
    return out;
  }
  return v;
}

function dehydrate(v: unknown): unknown {
  if (v instanceof Timestamp) return { __ts: v.toMillis() };
  if (Array.isArray(v)) return v.map(dehydrate);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = dehydrate(val);
    return out;
  }
  return v;
}

function applyValue(v: unknown, prev: unknown): unknown {
  if (v && typeof v === "object" && (v as { __op?: string }).__op === "serverTimestamp") return Timestamp.now();
  if (v && typeof v === "object" && (v as { __op?: string }).__op === "increment") {
    const n = typeof prev === "number" ? prev : 0;
    return n + Number((v as { n?: number }).n || 0);
  }
  if (v instanceof Timestamp) return v;
  if (Array.isArray(v)) return v.slice();
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = applyValue(val, undefined);
    return out;
  }
  return v;
}

function affects(listener: Listener, changed: string) {
  if (listener.mode === "doc") return listener.path === changed;
  if (changed === listener.path) return true;
  if (!changed.startsWith(`${listener.path}/`)) return false;
  return !changed.slice(listener.path.length + 1).includes("/");
}

let depth = 0;
function touch(path: string) {
  schedulePersist();
  if (depth > 6) return;
  depth += 1;
  try {
    for (const listener of [...listeners]) {
      if (affects(listener, path)) listener.run();
    }
  } finally {
    depth -= 1;
  }
}

function schedulePersist() {
  if (!ready) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistNow();
  }, 80);
}

async function persistNow() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(dehydrate(memory)));
  } catch {
    /* the in-memory campus still works for this session */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    if (ready) void persistNow();
  });
}

function finish() {
  ready = true;
  const waiters = readyWait.splice(0);
  waiters.forEach((fn) => fn());
  for (const listener of [...listeners]) listener.run();
  for (const fn of [...authListeners]) fn();
}

function hydrate() {
  const giveUp = setTimeout(() => {
    if (!ready) finish();
  }, 1500);
  void AsyncStorage.getItem(KEY)
    .then(async (raw) => {
      const today = new Date().toDateString();
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SeedBlob;
          if (parsed && parsed.day === today && parsed.docs && Array.isArray(parsed.accounts)) {
            memory = revive(parsed) as SeedBlob;
          } else {
            memory = buildSeed();
            await persistNow();
          }
        } catch {
          memory = buildSeed();
        }
      } else {
        memory = buildSeed();
        await persistNow();
      }
    })
    .catch(() => {
      memory = buildSeed();
    })
    .finally(() => {
      clearTimeout(giveUp);
      if (!ready) finish();
    });
}

hydrate();

export function whenReady() {
  if (ready) return Promise.resolve();
  return new Promise<void>((resolve) => readyWait.push(resolve));
}

export function sessionUid() {
  return memory.sessionUid;
}

export function setSession(uid: string | null) {
  memory.sessionUid = uid;
  schedulePersist();
  for (const fn of [...authListeners]) fn();
}

export function subscribeAuth(fn: () => void) {
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

export function accounts() {
  return memory.accounts;
}

export function findAccount(emailOrId: string) {
  const raw = emailOrId.trim().toLowerCase();
  const email = raw.includes("@") ? raw : `${raw}@ua.edu.lb`;
  return memory.accounts.find((account) => account.email.toLowerCase() === email);
}

export function upsertAccount(next: Account) {
  const at = memory.accounts.findIndex((account) => account.uid === next.uid);
  if (at >= 0) memory.accounts[at] = next;
  else memory.accounts.push(next);
  schedulePersist();
}

export function currentAccount() {
  const uid = memory.sessionUid;
  if (!uid) return undefined;
  return memory.accounts.find((account) => account.uid === uid);
}

export function readDoc(path: string) {
  return memory.docs[path];
}

export function writeDoc(path: string, data: Record<string, unknown>, merge = false) {
  const prev = memory.docs[path] || {};
  const next: Record<string, unknown> = merge ? { ...prev } : {};
  for (const [key, value] of Object.entries(data)) next[key] = applyValue(value, prev[key]);
  memory.docs[path] = next;
  touch(path);
}

export function patchDoc(path: string, data: Record<string, unknown>) {
  const prev = memory.docs[path];
  if (!prev) throw new Error("That document is not on this phone.");
  const next = { ...prev };
  for (const [key, value] of Object.entries(data)) next[key] = applyValue(value, prev[key]);
  memory.docs[path] = next;
  touch(path);
}

export function removeDoc(path: string) {
  if (!(path in memory.docs)) return;
  delete memory.docs[path];
  touch(path);
}

export function childDocs(collectionPath: string) {
  const prefix = `${collectionPath}/`;
  const rows: { id: string; data: Record<string, unknown> }[] = [];
  for (const [path, data] of Object.entries(memory.docs)) {
    if (!path.startsWith(prefix)) continue;
    const id = path.slice(prefix.length);
    if (!id || id.includes("/")) continue;
    rows.push({ id, data });
  }
  return rows;
}

export function subscribe(path: string, mode: "doc" | "col", run: () => void) {
  const listener = { path, mode, run };
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function resetDemo() {
  await whenReady();
  memory = buildSeed();
  for (const listener of [...listeners]) listener.run();
  for (const fn of [...authListeners]) fn();
  await persistNow();
}
