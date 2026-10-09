import { create } from "zustand";
import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
  type Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebase } from "../firebase";
import { postFn as sharedPostFn } from "../fn";
import { me } from "../live";
import { assertSendable } from "../moderation/outgoing";
import { useVoiceSafety } from "./voiceSafety";
export type PublicNote = { id: string; nickname: string; text: string; order: number };
export type RootGiver = { nickname: string; initial: string; roots: number };
export type LotusDoc = {
  id: string;
  n: number;
  name: string;
  bloomedLabel: string;
  semester: string;
  petals: number;
  roots: number;
  days: number;
  place: string;
  rootGivers: RootGiver[];
  dedicatedTo: string;
  dedicationNote: string;
  suggestions: string[];
  order: number;
};
export type EarnedBadge = {
  id: string;
  name: string;
  group: string;
  groupOrder: number;
  order: number;
  pinned: boolean;
  locked: boolean;
  limited: boolean;
  source: string;
  earned: string;
  window: string;
  dropTitle: string;
  dropChip: string;
  dropEarned: string;
};
export type PerkDoc = {
  id: string;
  tier: number;
  title: string;
  showTitle: string;
  partnerLine: string;
  counterLine: string;
  once: string;
  privacy: string;
  perkShort: string;
  sort: number;
  remainingLabel: string;
};
export type DedicationDoc = { id: string; from: string; initial: string; to: string; ago: string; order: number };
export type MyNote = { id: string; state: string; place: string; text: string; order: number };
export type GoalDoc = {
  title: string;
  chip: string;
  current: number;
  target: number;
  trees: number;
  body: string;
  pending: string;
  barLabel: string;
  partner: string;
};
export type RedemptionDoc = {
  id: string;
  code: string;
  perkShort: string;
  showTitle: string;
  itemLine: string;
  partnerName: string;
  validHeadline: string;
  usedHeadline: string;
  usedBody: string;
  validStatus: string;
  usedStatus: string;
  expiresLabel: string;
  privacy: string;
  status: string;
  expiresAt: number;
};
export type StoryDoc = { title: string; line: string; place: string; badges: string[]; footnote: string; lotusId: string };
export type DropDoc = {
  title: string;
  window: string;
  body: string;
  short: string;
  phoneLine: string;
  remind: string;
  durationLabel: string;
  guide: string;
  follow: string;
};
export type NodeProfile = {
  id: string;
  name: string;
  title: string;
  hours: string;
  awake: boolean;
  clockLabel: string;
  featuredOrder: number;
  offlineAt: string;
  offlineBody: string;
  phoneOffline: string;
  bloomsToday: number;
  bloomLine: string;
  circleId: string;
  circleName: string;
  memberCount: number;
  emptyLine: string;
  emptyFoot: string;
  photoSeconds: number;
  phoneLiveSeconds: number;
  queueLine: string;
  checkinLine: string;
  mode: string;
  eventId: string;
  eventTitle: string;
  presentCount: number;
  eventEndsAt: number;
  scheduleLine: string;
};
export type LiveEvent = { event: string; text: string; nickname: string; at: number };

type State = {
  ready: boolean;
  error: string;
  nodes: Record<string, NodeProfile>;
  notes: Record<string, PublicNote[]>;
  live: Record<string, LiveEvent>;
  drop: DropDoc | null;
  lotuses: LotusDoc[];
  sproutLabel: string;
  earned: EarnedBadge[];
  perks: PerkDoc[];
  goal: GoalDoc | null;
  dedications: DedicationDoc[];
  myNotes: MyNote[];
  draftText: string;
  redemption: RedemptionDoc | null;
  story: StoryDoc | null;
  checkedIn: Record<string, boolean>;
  nickname: string;
  initial: string;
};

const emptyDrop: DropDoc = {
  title: "",
  window: "",
  body: "",
  short: "",
  phoneLine: "",
  remind: "",
  durationLabel: "",
  guide: "",
  follow: "",
};

export const useNodeRewards = create<State>(() => ({
  ready: false,
  error: "",
  nodes: {},
  notes: {},
  live: {},
  drop: null,
  lotuses: [],
  sproutLabel: "",
  earned: [],
  perks: [],
  goal: null,
  dedications: [],
  myNotes: [],
  draftText: "",
  redemption: null,
  story: null,
  checkedIn: {},
  nickname: "",
  initial: "",
}));

const s = (v: unknown, fallback = "") => (v == null ? fallback : String(v));
const n = (v: unknown, fallback = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};

function asNode(id: string, data: Record<string, unknown>): NodeProfile {
  return {
    id,
    name: s(data.name, "Hope Node"),
    title: s(data.title),
    hours: s(data.hours),
    awake: Boolean(data.awake),
    clockLabel: s(data.clockLabel, "1:12 PM"),
    featuredOrder: n(data.featuredOrder, 1),
    offlineAt: s(data.offlineAt),
    offlineBody: s(data.offlineBody),
    phoneOffline: s(data.phoneOffline),
    bloomsToday: n(data.bloomsToday),
    bloomLine: s(data.bloomLine),
    circleId: s(data.circleId),
    circleName: s(data.circleName),
    memberCount: n(data.memberCount),
    emptyLine: s(data.emptyLine),
    emptyFoot: s(data.emptyFoot),
    photoSeconds: n(data.photoSeconds, 20),
    phoneLiveSeconds: n(data.phoneLiveSeconds, 14),
    queueLine: s(data.queueLine),
    checkinLine: s(data.checkinLine),
    mode: s(data.mode, "normal"),
    eventId: s(data.eventId),
    eventTitle: s(data.eventTitle),
    presentCount: n(data.presentCount),
    eventEndsAt: millis(data.endsAt),
    scheduleLine: Array.isArray(data.schedule)
      ? data.schedule.map((row) => (row && typeof row === "object" && "title" in row ? String((row as { title?: string }).title || "") : "")).filter(Boolean).join(" · ")
      : "",
  };
}

function millis(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toMillis" in v && typeof (v as Timestamp).toMillis === "function") {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

const subscribe = onSnapshot;
let nodeStops: (() => void)[] = [];
let nodeUid: string | null = null;
const watch = ((ref: never, next: never, error?: (err: { code?: string }) => void) => {
  const unsub = subscribe(
    ref,
    next,
    error ||
      ((err: { code?: string }) => {
        if (err.code !== "permission-denied") console.error(err);
      }),
  );
  nodeStops.push(unsub);
  return unsub;
}) as typeof onSnapshot;

let booted = false;
let liveDb: Firestore | null = null;
const watched = new Set<string>();
const pending = new Set<string>();

function releaseNodes() {
  for (const id of watched) pending.add(id);
  const mine = nodeStops;
  nodeStops = [];
  nodeUid = null;
  watched.clear();
  liveDb = null;
  for (const unsub of mine) unsub();
}

export function watchNode(nodeId: string) {
  if (!nodeId || watched.has(nodeId)) return;
  // A tablet may open a node before anyone signs in: the public live/current feed still works.
  attachNode(liveDb ?? getFirebase().db, nodeId);
}

function attachNode(db: Firestore, nodeId: string) {
  if (watched.has(nodeId)) return;
  watched.add(nodeId);
  watch(doc(db, "nodes", nodeId), (snap) => {
    const nodes = { ...useNodeRewards.getState().nodes };
    if (snap.exists()) nodes[nodeId] = asNode(nodeId, snap.data() as Record<string, unknown>);
    useNodeRewards.setState({ nodes });
  });
  watch(query(collection(db, "nodes", nodeId, "notes"), where("status", "==", "approved")), (snap) => {
    const notes = snap.docs
      .map((d) => {
        const data = d.data();
        return { id: d.id, nickname: s(data.nickname), text: s(data.text), order: n(data.order, 99) };
      })
      .sort((a, b) => a.order - b.order);
    useNodeRewards.setState({ notes: { ...useNodeRewards.getState().notes, [nodeId]: notes } });
  });
  watch(doc(db, "nodes", nodeId, "live", "current"), (snap) => {
    const data = snap.data() || {};
    useNodeRewards.setState({
      live: {
        ...useNodeRewards.getState().live,
        [nodeId]: { event: s(data.event, "idle"), text: s(data.text), nickname: s(data.nickname), at: millis(data.at) },
      },
    });
  });
  const day = new Date().toISOString().slice(0, 10);
  // A query (not a get) so a day with no tap yet is an empty list, not a missing-doc rules error.
  watch(
    query(collection(db, "checkins"), where("uid", "==", me()), where("nodeId", "==", nodeId), where("date", "==", day)),
    (snap) => {
      useNodeRewards.setState({ checkedIn: { ...useNodeRewards.getState().checkedIn, [nodeId]: !snap.empty } });
    },
  );
}

/** One local function server; the shared helper attaches the signed-in user's ID token. */
async function postFn(path: string, body: Record<string, unknown>) {
  try {
    return await sharedPostFn<Record<string, unknown>>(path, body);
  } catch (err) {
    throw new Error(err instanceof Error && err.message ? err.message : "The node could not finish that.");
  }
}

/** Tablets call this on first open so the node has a document even on an empty campus. */
export async function ensureNode(nodeId: string) {
  try {
    await sharedPostFn("/node-ensure", { nodeId });
  } catch {
    /* offline tablet: the screen still renders its idle state */
  }
}

export function startNodeRewards() {
  if (booted) return;
  booted = true;
  void boot();
}

async function boot() {
  try {
    const { auth, db } = getFirebase();
    const sync = (uid: string | undefined) => {
      if (!uid) {
        // Signed out: nothing to listen to. Nobody is signed in on the visitor's behalf.
        if (nodeUid) releaseNodes();
        useNodeRewards.setState({ ready: true });
        return;
      }
      if (nodeUid === uid) return;
      releaseNodes();
      nodeUid = uid;
      attach(db);
    };
    onAuthStateChanged(auth, (user) => sync(user?.uid));
  } catch (err) {
    useNodeRewards.setState({ error: err instanceof Error ? err.message : "Rewards could not open.", ready: true });
  }
}

function attach(db: Firestore) {
  liveDb = db;
  attachNode(db, "engineering");
  for (const id of pending) attachNode(db, id);
  pending.clear();
  watch(doc(db, "users", me()), (snap) => {
    const u = snap.data() || {};
    useNodeRewards.setState({
      sproutLabel: s(u.sproutLabel),
      nickname: s(u.nickname, ""),
      initial: s(u.initial, ""),
    });
  });
  watch(doc(db, "nodes", "engineering", "drops", "today"), (snap) => {
    const d = snap.data() || {};
    useNodeRewards.setState({
      drop: {
        ...emptyDrop,
        title: s(d.title),
        window: s(d.window),
        body: s(d.body),
        short: s(d.short),
        phoneLine: s(d.phoneLine),
        remind: s(d.remind),
        durationLabel: s(d.durationLabel),
        guide: s(d.guide),
        follow: s(d.follow),
      },
    });
  });
  watch(collection(db, "users", me(), "garden"), (snap) => {
    const lotuses = snap.docs
      .map((d) => {
        const data = d.data();
        const givers = Array.isArray(data.rootGivers) ? data.rootGivers : [];
        return {
          id: d.id,
          n: n(data.n),
          name: s(data.name),
          bloomedLabel: s(data.bloomedLabel),
          semester: s(data.semester),
          petals: n(data.petals),
          roots: n(data.roots),
          days: n(data.days),
          place: s(data.place),
          rootGivers: givers.map((g) => {
            const row = g as Record<string, unknown>;
            return { nickname: s(row.nickname), initial: s(row.initial), roots: n(row.roots) };
          }),
          dedicatedTo: s(data.dedicatedTo),
          dedicationNote: s(data.dedicationNote),
          suggestions: Array.isArray(data.suggestions) ? data.suggestions.map((x) => s(x)) : [],
          order: n(data.order, 99),
        } satisfies LotusDoc;
      })
      .sort((a, b) => a.order - b.order);
    useNodeRewards.setState({ lotuses, ready: true });
  });
  watch(collection(db, "users", me(), "earned"), (snap) => {
    const earned = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: s(data.name),
          group: s(data.group),
          groupOrder: n(data.groupOrder, 99),
          order: n(data.order, 99),
          pinned: Boolean(data.pinned),
          locked: Boolean(data.locked),
          limited: Boolean(data.limited),
          source: s(data.source),
          earned: s(data.earned),
          window: s(data.window),
          dropTitle: s(data.dropTitle),
          dropChip: s(data.dropChip),
          dropEarned: s(data.dropEarned),
        } satisfies EarnedBadge;
      })
      .sort((a, b) => a.groupOrder - b.groupOrder || a.order - b.order);
    useNodeRewards.setState({ earned });
  });
  watch(collection(db, "users", me(), "nodeNotes"), (snap) => {
    const myNotes = snap.docs
      .map((d) => {
        const data = d.data();
        return { id: d.id, state: s(data.state), place: s(data.place), text: s(data.text), order: n(data.order, 99) };
      })
      .sort((a, b) => a.order - b.order);
    useNodeRewards.setState({ myNotes });
  });
  watch(doc(db, "users", me(), "drafts", "node-note"), (snap) => {
    useNodeRewards.setState({ draftText: s(snap.data()?.text) });
  });
  watch(collection(db, "perks"), (snap) => {
    const perks = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          tier: n(data.tier),
          title: s(data.title),
          showTitle: s(data.showTitle, s(data.title)),
          partnerLine: s(data.partnerLine),
          counterLine: s(data.counterLine),
          once: s(data.once),
          privacy: s(data.privacy),
          perkShort: s(data.perkShort),
          sort: n(data.sort, 99),
          remainingLabel: s(data.remainingLabel),
        } satisfies PerkDoc;
      })
      .filter((p) => p.tier > 0)
      .sort((a, b) => a.sort - b.sort);
    useNodeRewards.setState({ perks });
  });
  watch(doc(db, "campusGoal", "current"), (snap) => {
    const d = snap.data() || {};
    useNodeRewards.setState({
      goal: {
        title: s(d.title),
        chip: s(d.chip),
        current: n(d.current),
        target: n(d.target),
        trees: n(d.trees),
        body: s(d.body),
        pending: s(d.pending),
        barLabel: s(d.barLabel),
        partner: s(d.partner),
      },
    });
  });
  watch(collection(db, "dedications"), (snap) => {
    const dedications = snap.docs
      .map((d) => {
        const data = d.data();
        return { id: d.id, from: s(data.from), initial: s(data.initial), to: s(data.to), ago: s(data.ago), order: n(data.order, 99) };
      })
      .sort((a, b) => a.order - b.order);
    useNodeRewards.setState({ dedications });
  });
  watch(query(collection(db, "redemptions"), where("uid", "==", me())), (snap) => {
    const d = snap.docs[0];
    if (!d) {
      useNodeRewards.setState({ redemption: null });
      return;
    }
    const data = d.data();
    const exp = data.expiresAt?.toMillis?.() ?? n(data.expiresAt);
    useNodeRewards.setState({
      redemption: {
        id: d.id,
        code: s(data.code),
        perkShort: s(data.perkShort),
        showTitle: s(data.showTitle),
        itemLine: s(data.itemLine),
        partnerName: s(data.partnerName),
        validHeadline: s(data.validHeadline),
        usedHeadline: s(data.usedHeadline),
        usedBody: s(data.usedBody),
        validStatus: s(data.validStatus),
        usedStatus: s(data.usedStatus),
        expiresLabel: s(data.expiresLabel, "10:00"),
        privacy: s(data.privacy),
        status: s(data.status),
        expiresAt: exp,
      },
    });
  });
  watch(doc(db, "stories", "signals-bloom"), (snap) => {
    const d = snap.data() || {};
    useNodeRewards.setState({
      story: {
        title: s(d.title),
        line: s(d.line),
        place: s(d.place),
        badges: Array.isArray(d.badges) ? d.badges.map((x) => s(x)) : [],
        footnote: s(d.footnote),
        lotusId: s(d.lotusId, "l3"),
      },
    });
  });
}

export async function nodeCheckIn(nodeId: string, opts?: { token?: string; kiosk?: boolean }) {
  return postFn("/node-check-in", { nodeId, token: opts?.token, kiosk: opts?.kiosk === true });
}

export async function fetchNodeToken(nodeId: string) {
  if (process.env.EXPO_PUBLIC_DEMO_LOCAL !== "0") return "demo";
  const res = await fetch(`${process.env.EXPO_PUBLIC_FN_URL || "http://127.0.0.1:5055"}/node-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nodeId }),
  });
  const data = (await res.json()) as { token?: string };
  return String(data.token || "");
}

export function nodeEventLive(node: NodeProfile | undefined, now = Date.now()) {
  return Boolean(node && node.mode === "event" && node.eventId && node.eventEndsAt > now);
}

/** Chair or board only, and only while the approved event is happening. */
export async function startNodeEvent(nodeId: string, eventId: string) {
  await postFn("/node-mode", { nodeId, eventId, action: "start" });
}

export async function endNodeEvent(nodeId: string, eventId?: string) {
  const id = eventId || useNodeRewards.getState().nodes[nodeId]?.eventId;
  if (!id) throw new Error("This node is not showing an event.");
  await postFn("/node-mode", { nodeId, eventId: id, action: "end" });
}

/** A member scan. The node count moves first when this event is on the tablet, then the attendance row. */
export async function markEventPresent(eventId: string) {
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in on your phone first.");
  const ev = await getDoc(doc(db, "events", eventId));
  const data = ev.data();
  if (!data) throw new Error("This event is not on the calendar.");
  const hostId = String(data.hostId || "");
  const hostType = String(data.hostType || "");
  if (hostType === "circle" && hostId) {
    try {
      const member = await getDoc(doc(db, "circles", hostId, "members", uid));
      if (!member.exists()) throw new Error("This check-in is for members of the Circle.");
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("This check-in")) throw err;
      throw new Error("This check-in is for members of the Circle.");
    }
  }
  const nodeId = String(data.nodeId || "");
  const nickname = useNodeRewards.getState().nickname || "Member";
  if (nodeId) {
    try {
      await updateDoc(doc(db, "nodes", nodeId), { presentCount: increment(1) });
    } catch {
      /* The node is not showing this event. Attendance still counts for the Circle. */
    }
  }
  let already = false;
  try {
    await setDoc(doc(db, "events", eventId, "attendance", uid), { uid, nickname, at: serverTimestamp() });
  } catch (err) {
    const code = String((err as { code?: string }).code || "");
    if (!code.includes("permission-denied")) throw err;
    already = true;
  }
  return {
    nodeId,
    title: String(data.title || "Event"),
    hostId,
    hostType,
    already,
    nickname,
    verified: data.verified !== false,
  };
}

export async function postNodeNote(nodeId: string, text: string) {
  const clipped = text.slice(0, 80);
  assertSendable(clipped, "circle", useVoiceSafety.getState().anonId || "");
  useNodeRewards.setState({ draftText: clipped });
  await setDoc(doc(getFirebase().db, "users", me(), "drafts", "node-note"), { text: clipped });
  return postFn("/node-note", { nodeId, text: clipped, passedFilter: true });
}

export async function dedicateBloom(lotusId: string, toNickname: string, note: string) {
  return postFn("/dedicate", { lotusId, toNickname, note: note.slice(0, 80) });
}

export async function redeemPerk(perkId: string) {
  return postFn("/redeem", { perkId });
}

export async function vendorScan(code: string) {
  return postFn("/vendor-scan", { code });
}

export async function pinBadge(badgeId: string, pinned: boolean) {
  return postFn("/pin-badge", { badgeId, pinned });
}

export async function nameBloom(lotusId: string, name: string) {
  return postFn("/name-bloom", { lotusId, name: name.slice(0, 40) });
}

export async function saveDraft(text: string) {
  await setDoc(doc(getFirebase().db, "users", me(), "drafts", "node-note"), { text: text.slice(0, 80), updatedAt: serverTimestamp() });
}

export async function joinSpotCircle(circleId: string, nickname: string) {
  try {
    await setDoc(doc(getFirebase().db, "circles", circleId, "members", me()), {
      nickname,
      joinedAt: serverTimestamp(),
    });
  } catch {
    /* Already in this Circle. */
  }
}

export function latestLotus(lotuses: LotusDoc[]) {
  return lotuses[lotuses.length - 1] || null;
}
