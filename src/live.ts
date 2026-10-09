import { Platform } from "react-native";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { getFirebase } from "./firebase";
import { postFn } from "./fn";
import { useNabt } from "./state";
import { startCommunities, stopCommunities } from "./live/communities";
import { useVoiceSafety } from "./live/voiceSafety";
import { assertSendable } from "./moderation/outgoing";

/** The signed-in user's uid, or "" when nobody is signed in. Never a seeded account. */
export function me(): string {
  return getFirebase().auth.currentUser?.uid || "";
}

export type Member = {
  id: string;
  nickname: string;
  displayName: string;
  initial: string;
  order: number;
  roles?: string[];
  line?: string;
  alert?: boolean;
};

export type ChatMsg = {
  id: string;
  authorUid: string;
  authorNickname: string;
  initial?: string;
  text: string;
  kind: string;
  timeLabel?: string;
  link?: string;
  createdAt: number;
  kindness?: boolean;
  kindnessClosed?: boolean;
  replyTo?: string;
  reactions?: { icon: "heart" | "root"; label: string; mine?: boolean }[];
  attachment?: ChatAttachment;
  poll?: { question: string; options: string[] };
};

export type ChatAttachment = { type: "photo" | "video" | "document"; uri: string; name: string; size?: number; mimeType?: string; width?: number; height?: number };

export type Answer = { id: string; displayName: string; initial: string; text: string; order: number };
export type Reply = {
  id: string;
  nickname: string;
  initial: string;
  when: string;
  text: string;
  done?: string;
  action?: string;
  order: number;
  authorUid?: string;
};
export type Thread = {
  nickname: string;
  initial: string;
  text: string;
  mode?: string;
  when?: string;
};
export type Meetup = {
  title: string;
  whenLabel: string;
  kinds: string[];
  selected: string;
  note: string;
  approvedLine: string;
  proposedBy: string;
};
export type CircleDoc = {
  id: string;
  name: string;
  kind?: string;
  verified?: boolean;
  anonymous?: boolean;
  chairUid?: string;
  charter?: string;
  officialLine?: string;
  facultyAdvisor?: string;
  semesterGoal?: string;
  goalDone?: number;
  goalTotal?: number;
  perks?: string[];
  activeCount?: number;
  memberCount?: number;
  hereCount?: number;
  modLine?: string;
  prompt?: string;
  promptMeta?: string;
  promptFaces?: string[];
  promptStat?: string;
  mentorCount?: number;
  mentorNeeded?: number;
  attendance?: number[];
  needs?: { title: string; sub: string }[];
  nextEventTitle?: string;
  nextEventIn?: string;
  inboxRank?: number;
  listPreview?: string;
  previewPrefix?: string;
  previewAt?: number;
  timeLabel?: string;
  unread?: number;
  typing?: string;
  listStack?: string[];
  joinApproval?: boolean;
};
export type InboxRow = {
  id: string;
  kind: "circle" | "dm" | "request";
  name: string;
  tag?: string;
  tagOk?: boolean;
  preview: string;
  prefix?: string;
  you?: boolean;
  time: string;
  badge?: string;
  letters: string[];
  href?: string;
  rank: number;
};
export type CampusItem = { title: string; body: string; href: string; icon: "circles" | "pin" };

type CampusState = {
  ready: boolean;
  error: string | null;
  /** True when nobody is signed in. Screens send the visitor to sign-in. */
  signedOut: boolean;
  uid: string;
  /** Account status from the profile: "pending" until Student Affairs approves. */
  status: string;
  nickname: string;
  greetingName: string;
  greetingWhen: string;
  initial: string;
  role: string;
  roleLabel: string;
  classYear: number;
  alumni: boolean;
  modeLabel: string;
  email: string;
  studentId: string;
  fullName: string;
  plant: { petals: number; roots: number; stage: string };
  gardenLine: string;
  gardenSub: string;
  notesSummary: string;
  petitionsSummary: string;
  hideGarden: boolean;
  badges: { id: string; name: string; order?: number }[];
  today: { title: string; body: string } | null;
  dropGoing: boolean;
  rootNote: { title: string; body: string; action: string; badge: string; href?: string; circleId?: string; replyId?: string } | null;
  going: string[];
  blocked: string[];
  campus: CampusItem[];
  circles: Record<string, CircleDoc>;
  members: Record<string, Member[]>;
  messages: Record<string, ChatMsg[]>;
  answers: Answer[];
  thread: Thread | null;
  replies: Reply[];
  meetup: Meetup | null;
  inbox: InboxRow[];
};

const emptyPlant = { petals: 0, roots: 0, stage: "" };

export const useCampus = create<CampusState>(() => ({
  ready: false,
  error: null,
  signedOut: false,
  uid: "",
  status: "",
  nickname: "",
  greetingName: "",
  greetingWhen: "",
  initial: "",
  role: "",
  roleLabel: "",
  classYear: 0,
  alumni: false,
  modeLabel: "",
  email: "",
  studentId: "",
  fullName: "",
  plant: emptyPlant,
  gardenLine: "",
  gardenSub: "",
  notesSummary: "",
  petitionsSummary: "",
  hideGarden: false,
  badges: [],
  today: null,
  dropGoing: false,
  rootNote: null,
  going: [],
  blocked: [],
  campus: [],
  circles: {},
  members: {},
  messages: {},
  answers: [],
  thread: null,
  replies: [],
  meetup: null,
  inbox: [],
}));

function millis(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toMillis" in v && typeof (v as Timestamp).toMillis === "function") {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

function markReady() {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.dataset.nabt = "ready";
  }
}

const dms: Record<string, { title: string; tag?: string; tagOk?: boolean; letter: string; time: string; unread?: number; rank: number; you?: boolean; preview: string; previewAt: number }> = {};
const requests: InboxRow[] = [];
let nodes: CampusItem[] = [];

const joinedIds = new Set<string>();

export function markJoined(id: string, on = true) {
  if (on) joinedIds.add(id);
  else joinedIds.delete(id);
  rebuildInbox();
}

function rebuildInbox() {
  const { circles, messages, members } = useCampus.getState();
  const uid = me();
  const rows: InboxRow[] = [];
  for (const c of Object.values(circles)) {
    const memberOf = joinedIds.has(c.id) || (members[c.id] || []).some((m) => m.id === uid);
    if (c.inboxRank == null && !memberOf) continue;
    const msgs = messages[c.id] || [];
    const newest = [...msgs].filter((m) => m.kind !== "system").sort((a, b) => b.createdAt - a.createdAt)[0];
    const live = newest && newest.createdAt > (c.previewAt || 0);
    rows.push({
      id: c.id,
      kind: "circle",
      name: c.name,
      preview: live ? newest.text : c.listPreview || (memberOf ? "You’re in this Circle" : ""),
      prefix: live ? undefined : c.previewPrefix,
      time: c.timeLabel || "",
      badge: c.unread ? String(c.unread) : undefined,
      letters: c.listStack || [],
      href: c.kind === "community" ? `/c/${c.id}` : `/circle/${c.id}/chat`,
      rank: c.inboxRank ?? 40,
    });
  }
  for (const [id, d] of Object.entries(dms)) {
    rows.push({
      id,
      kind: "dm",
      name: d.title,
      tag: d.tag,
      tagOk: d.tagOk,
      preview: d.preview,
      you: d.you,
      time: d.time,
      badge: d.unread ? String(d.unread) : undefined,
      letters: [d.letter],
      href: `/dm/${id}`,
      rank: d.rank,
    });
  }
  rows.push(...requests);
  rows.sort((a, b) => a.rank - b.rank);
  useCampus.setState({ inbox: rows });
}

let need = new Set(["user", "circles", "today"]);

const subscribe = onSnapshot;
let campusStops: (() => void)[] = [];
let campusUid: string | null = null;
let tokenStatus = "";
const watched = new Set<string>();
const rsvpWatched = new Set<string>();
const circleStops = new Map<string, (() => void)[]>();
const watch = ((ref: never, next: never, error?: (err: { code?: string }) => void) => {
  const unsub = subscribe(
    ref,
    next,
    error ||
      ((err: { code?: string }) => {
        if (err.code !== "permission-denied") console.error(err);
      }),
  );
  campusStops.push(unsub);
  return unsub;
}) as typeof onSnapshot;

function releaseCampus() {
  const mine = campusStops;
  campusStops = [];
  campusUid = null;
  watched.clear();
  rsvpWatched.clear();
  circleStops.clear();
  joinedIds.clear();
  for (const key of Object.keys(dms)) delete dms[key];
  requests.length = 0;
  nodes = [];
  stopCommunities();
  for (const unsub of mine) unsub();
  useCampus.setState({
    nickname: "",
    greetingName: "",
    initial: "",
    role: "",
    roleLabel: "",
    status: "",
    plant: emptyPlant,
    badges: [],
    today: null,
    dropGoing: false,
    rootNote: null,
    going: [],
    blocked: [],
    campus: [],
    circles: {},
    members: {},
    messages: {},
    inbox: [],
    fullName: "",
    studentId: "",
    email: "",
  });
  useNabt.setState({ nickname: "", initial: "", fullName: "", studentId: "" });
}

function got(key: string) {
  if (!need.has(key)) return;
  need.delete(key);
  if (need.size === 0) {
    useCampus.setState({ ready: true, error: null });
    markReady();
  }
}

let booted = false;

export function startCampus() {
  if (booted) return;
  booted = true;
  void boot();
}

async function boot() {
  try {
    const { auth, db } = getFirebase();
    let waitTimer: ReturnType<typeof setTimeout> | null = null;
    const sync = (uid: string | undefined) => {
      if (!uid) {
        // Nobody is signed in. No demo account is used; screens go to sign-in.
        if (campusUid) releaseCampus();
        if (waitTimer) clearTimeout(waitTimer);
        useCampus.setState({ ready: true, error: null, signedOut: true, uid: "" });
        markReady();
        return;
      }
      if (campusUid === uid) return;
      releaseCampus();
      campusUid = uid;
      tokenStatus = "";
      need = new Set(["user", "circles", "today"]);
      useCampus.setState({ ready: false, error: null, signedOut: false, uid });
      attachCampus(db, uid);
      if (waitTimer) clearTimeout(waitTimer);
      waitTimer = setTimeout(() => {
        if (need.size > 0 && campusUid === uid) {
          useCampus.setState({
            ready: true,
            error: `Still waiting for ${[...need].join(", ")}. Is npm run demo running on the PC?`,
          });
          markReady();
        }
      }, 12000);
    };
    onAuthStateChanged(auth, (user) => sync(user?.uid));
  } catch (err) {
    useCampus.setState({ ready: true, error: err instanceof Error ? err.message : "Could not open the campus." });
    markReady();
  }
}

/** Student Affairs approval lands in users/{uid}.status; the token has to be refreshed to match. */
async function refreshTokenFor(status: string, db: ReturnType<typeof getFirebase>["db"], uid: string) {
  const { auth } = getFirebase();
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  try {
    const before = (await auth.currentUser.getIdTokenResult()).claims.status;
    if (before === status) {
      tokenStatus = status;
      return;
    }
    const after = (await auth.currentUser.getIdTokenResult(true)).claims.status;
    tokenStatus = String(after || "");
    if (after === status && campusUid === uid) {
      // Listeners that were refused before approval need to be opened again.
      releaseCampus();
      campusUid = uid;
      need = new Set(["user", "circles", "today"]);
      useCampus.setState({ uid, signedOut: false });
      attachCampus(db, uid);
    }
  } catch {
    /* token refresh is best effort */
  }
}

function attachCampus(db: ReturnType<typeof getFirebase>["db"], uid: string) {
    watch(doc(db, "users", uid), (snap) => {
      got("user");
      const u = snap.data() || {};
      const plant = (u.plant as CampusState["plant"]) || emptyPlant;
      const status = String(u.status || (snap.exists() ? "pending" : ""));
      if (status && status !== tokenStatus) void refreshTokenFor(status, db, uid);
      useCampus.setState({
        status,
        nickname: String(u.nickname || ""),
        greetingName: String(u.greetingName || u.displayName || ""),
        greetingWhen: String(u.greetingWhen || ""),
        initial: String(u.initial || ""),
        role: String(u.role || ""),
        roleLabel: String(u.roleLabel || u.role || ""),
        classYear: Number(u.classYear || 0),
        alumni: Boolean(u.alumni),
        modeLabel: String(u.modeLabel || ""),
        plant: {
          petals: Number(plant.petals || 0),
          roots: Number(plant.roots || 0),
          stage: String(plant.stage || ""),
        },
        gardenLine: String(u.gardenLine || ""),
        gardenSub: String(u.gardenSub || ""),
        notesSummary: String(u.notesSummary || ""),
        petitionsSummary: String(u.petitionsSummary || ""),
      });
      useNabt.setState({
        nickname: String(u.nickname || ""),
        initial: String(u.initial || ""),
        pending: status !== "approved",
        authed: true,
      });
    });

    watch(doc(db, "users_private", uid), (snap) => {
      const p = snap.data() || {};
      useCampus.setState({
        fullName: String(p.fullName || ""),
        studentId: String(p.studentId || ""),
        email: String(p.email || ""),
      });
      useNabt.setState({
        fullName: String(p.fullName || ""),
        studentId: String(p.studentId || ""),
      });
    });

    watch(doc(db, "users", uid, "settings", "main"), (snap) => {
      const s = snap.data() || {};
      const a = (s.accessibility || {}) as Record<string, unknown>;
      const calm = a.calmMode === "on" || a.calmMode === true;
      useCampus.setState({ hideGarden: Boolean(s.hideGardenCount), dropGoing: s.dropGoing === true });
      useNabt.setState({
        calmMode: calm,
        plainLanguage: Boolean(a.plainLanguage),
        quietPresence: a.quietPresence !== false,
        nodeTakeYourTime: Boolean(a.nodeTakeYourTime),
        offerTyping: a.offerTyping !== false,
        hideGarden: Boolean(s.hideGardenCount),
      });
    });

    watch(collection(db, "users", uid, "badges"), (snap) => {
      useCampus.setState({
        badges: snap.docs
          .map((d) => ({ id: d.id, name: String(d.data().name || d.id), order: Number(d.data().order || 0) }))
          .sort((a, b) => a.order - b.order),
      });
    });

    watch(doc(db, "microActions", "today"), (snap) => {
      got("today");
      const d = snap.data();
      useCampus.setState({ today: d ? { title: String(d.title), body: String(d.body) } : null });
    });

    watch(query(collection(db, "growthEvents"), where("uid", "==", uid)), (snap) => {
      const roots = snap.docs
        .map((d) => d.data())
        .filter((d) => d.kind === "root" && d.source === "thanks" && d.title);
      const note = roots[0];
      const circleId = note?.circleId ? String(note.circleId) : "";
      const replyId = note?.replyId ? String(note.replyId) : "";
      useCampus.setState({
        rootNote: note
          ? {
              title: String(note.title),
              body: String(note.body || ""),
              action: String(note.action || ""),
              badge: String(note.badge || ""),
              circleId: circleId || undefined,
              replyId: replyId || undefined,
              href: circleId ? `/circle/${circleId}/chat?reply=${replyId}` : "/chats",
            }
          : null,
      });
    });

    watch(query(collection(db, "blocks"), where("uid", "==", uid)), (snap) => {
      useCampus.setState({ blocked: snap.docs.map((d) => String(d.data().blockedUid || "")) });
    });

    watch(collection(db, "nodes"), (snap) => {
      nodes = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as { id: string; title?: string; hours?: string; inboxOrder?: number; awake?: boolean })
        .filter((n) => n.awake && n.title)
        .sort((a, b) => (a.inboxOrder || 0) - (b.inboxOrder || 0))
        .map((n) => ({
          title: String(n.title),
          body: String(n.hours || ""),
          href: `/n/${n.id}`,
          icon: "pin" as const,
        }));
      for (const n of snap.docs) {
        if (rsvpWatched.has(n.id)) continue;
        rsvpWatched.add(n.id);
        const title = String(n.data().title || n.id);
        watch(doc(db, "nodes", n.id, "rsvps", uid), (rs) => {
          useCampus.setState((s) => {
            const going = new Set(s.going);
            if (rs.data()?.going === true) going.add(title);
            else going.delete(title);
            return { going: [...going] };
          });
        });
      }
      publishCampus();
    });

    watch(collection(db, "circles"), (snap) => {
      const circles: Record<string, CircleDoc> = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        circles[d.id] = {
          id: d.id,
          name: String(data.name || ""),
          kind: data.kind,
          verified: Boolean(data.verified),
          anonymous: data.anonymous !== false,
          chairUid: data.chairUid ? String(data.chairUid) : undefined,
          charter: data.charter ? String(data.charter) : undefined,
          officialLine: data.officialLine ? String(data.officialLine) : undefined,
          facultyAdvisor: data.facultyAdvisor ? String(data.facultyAdvisor) : undefined,
          semesterGoal: data.semesterGoal ? String(data.semesterGoal) : undefined,
          goalDone: data.goalDone != null ? Number(data.goalDone) : undefined,
          goalTotal: data.goalTotal != null ? Number(data.goalTotal) : undefined,
          perks: Array.isArray(data.perks) ? data.perks.map(String) : undefined,
          activeCount: data.activeCount != null ? Number(data.activeCount) : undefined,
          memberCount: data.memberCount,
          hereCount: data.hereCount,
          modLine: data.modLine,
          prompt: data.prompt,
          promptMeta: data.promptMeta,
          promptFaces: Array.isArray(data.promptFaces) ? data.promptFaces.map(String) : undefined,
          promptStat: data.promptStat ? String(data.promptStat) : undefined,
          mentorCount: data.mentorCount != null ? Number(data.mentorCount) : undefined,
          mentorNeeded: data.mentorNeeded != null ? Number(data.mentorNeeded) : undefined,
          attendance: Array.isArray(data.attendance) ? data.attendance.map(Number) : undefined,
          needs: Array.isArray(data.needs)
            ? data.needs.map((row: { title?: string; sub?: string }) => ({ title: String(row.title || ""), sub: String(row.sub || "") }))
            : undefined,
          nextEventTitle: data.nextEventTitle ? String(data.nextEventTitle) : undefined,
          nextEventIn: data.nextEventIn ? String(data.nextEventIn) : undefined,
          inboxRank: data.inboxRank,
          listPreview: data.listPreview,
          previewPrefix: data.previewPrefix,
          previewAt: millis(data.previewAt),
          timeLabel: data.timeLabel,
          unread: data.unread,
          typing: data.typing,
          listStack: data.listStack,
          joinApproval: data.joinApproval === true,
        };
      });
      useCampus.setState({ circles });
      got("circles");
      publishCampus();
      rebuildInbox();
      for (const id of Object.keys(circles)) watchCircle(db, id);
    });

    watch(query(collection(db, "chats"), where("members", "array-contains", uid)), (snap) => {
      snap.docs.forEach((d) => {
        const data = d.data();
        const prev = dms[d.id];
        dms[d.id] = {
          title: String(data.title || ""),
          tag: data.tag,
          tagOk: Boolean(data.tagOk),
          letter: String(data.letter || ""),
          time: String(data.timeLabel || ""),
          unread: data.unread,
          rank: Number(data.inboxRank || 99),
          you: Boolean(data.you),
          preview: prev?.preview || "",
          previewAt: millis(data.previewAt),
        };
        if (prev) return;
        watch(query(collection(db, "chats", d.id, "messages"), orderBy("createdAt", "asc")), (ms) => {
          const last = ms.docs[ms.docs.length - 1];
          if (!dms[d.id] || !last) return;
          dms[d.id].preview = String(last.data().text || "");
          dms[d.id].you = last.data().authorUid === uid;
          rebuildInbox();
        });
      });
      rebuildInbox();
    });

    watch(query(collection(db, "chatRequests"), where("toUid", "==", uid)), (snap) => {
      requests.length = 0;
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.status !== "pending") return;
        requests.push({
          id: d.id,
          kind: "request",
          name: String(data.title || ""),
          tag: data.tag,
          preview: String(data.intro || ""),
          time: String(data.timeLabel || ""),
          letters: [String(data.letter || "")],
          rank: Number(data.inboxRank || 50),
        });
      });
      rebuildInbox();
    });

    watchCircleContent(db, "exam-week");
    startCommunities(db, uid);
}

export function rewatchCircle(id: string) {
  for (const stop of circleStops.get(id) || []) stop();
  circleStops.delete(id);
  watched.delete(id);
  watchCircle(getFirebase().db, id);
}

function watchCircle(db: ReturnType<typeof getFirebase>["db"], id: string) {
  if (watched.has(id)) return;
  watched.add(id);
  const stops: (() => void)[] = [];
  circleStops.set(id, stops);
  const ignoreDenied = (err: { code?: string }) => {
    if (err.code === "permission-denied") return;
  };
  const track = (ref: never, next: never, error?: (err: { code?: string }) => void) => {
    stops.push(watch(ref, next, error) as unknown as () => void);
  };
  track(query(collection(db, "circles", id, "messages"), orderBy("createdAt", "asc")) as never, ((snap: { docs: { id: string; data: () => Record<string, unknown> }[] }) => {
    const messages = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        authorUid: String(data.authorUid || ""),
        authorNickname: String(data.authorNickname || ""),
        initial: data.initial ? String(data.initial) : undefined,
        text: String(data.text || ""),
        kind: String(data.kind || "text"),
        timeLabel: data.timeLabel ? String(data.timeLabel) : undefined,
        link: data.link ? String(data.link) : undefined,
        createdAt: millis(data.createdAt),
        kindness: data.kindness === true,
        kindnessClosed: data.kindnessClosed === true,
        replyTo: data.replyTo ? String(data.replyTo) : undefined,
        reactions: data.reactions as ChatMsg["reactions"],
        attachment: data.attachment ? (data.attachment as ChatAttachment) : undefined,
        poll: data.poll ? (data.poll as ChatMsg["poll"]) : undefined,
      } satisfies ChatMsg;
    });
    useCampus.setState((s) => ({ messages: { ...s.messages, [id]: messages } }));
    if (id === "exam-week") got("messages");
    rebuildInbox();
  }) as never, ignoreDenied);
  track(collection(db, "circles", id, "members") as never, ((snap: { docs: { id: string; data: () => Record<string, unknown> }[] }) => {
    const members = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nickname: String(data.nickname || ""),
          displayName: String(data.displayName || data.nickname || ""),
          initial: String(data.initial || ""),
          order: Number(data.order || 0),
          roles: Array.isArray(data.roles) ? data.roles.map(String) : [],
          line: data.line ? String(data.line) : undefined,
          alert: Boolean(data.alert),
        };
      })
      .sort((a, b) => a.order - b.order);
    if (members.some((m) => m.id === me())) joinedIds.add(id);
    useCampus.setState((s) => ({ members: { ...s.members, [id]: members } }));
    rebuildInbox();
  }) as never, ignoreDenied);
}

function watchCircleContent(db: ReturnType<typeof getFirebase>["db"], id: string) {
  watch(collection(db, "circles", id, "prompts", "today", "answers"), (snap) => {
    const answers = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          displayName: String(data.displayName || ""),
          initial: String(data.initial || ""),
          text: String(data.text || ""),
          order: Number(data.order || 0),
        };
      })
      .sort((a, b) => a.order - b.order);
    useCampus.setState({ answers });
  });
  watch(doc(db, "circles", id, "threads", "hope"), (snap) => {
    const data = snap.data();
    useCampus.setState({
      thread: data
        ? {
            nickname: String(data.nickname || ""),
            initial: String(data.initial || ""),
            text: String(data.text || ""),
            mode: data.mode,
            when: data.when,
          }
        : null,
    });
  });
  watch(collection(db, "circles", id, "threads", "hope", "replies"), (snap) => {
    const replies = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nickname: String(data.nickname || ""),
          initial: String(data.initial || ""),
          when: String(data.when || ""),
          text: String(data.text || ""),
          done: data.done,
          action: data.action,
          order: Number(data.order || 0),
          authorUid: data.authorUid ? String(data.authorUid) : undefined,
        };
      })
      .sort((a, b) => a.order - b.order);
    useCampus.setState({ replies });
  });
  watch(doc(db, "circles", id, "meetups", "quiet-sit"), (snap) => {
    const data = snap.data();
    useCampus.setState({
      meetup: data
        ? {
            title: String(data.title || ""),
            whenLabel: String(data.whenLabel || ""),
            kinds: (data.kinds as string[]) || [],
            selected: String(data.selected || ""),
            note: String(data.note || ""),
            approvedLine: String(data.approvedLine || ""),
            proposedBy: String(data.proposedBy || ""),
          }
        : null,
    });
  });
}

function publishCampus() {
  const circles = useCampus.getState().circles;
  const exam = circles["exam-week"];
  const items: CampusItem[] = [];
  if (exam?.prompt) {
    items.push({
      title: `${exam.name} prompt is open`,
      body: exam.prompt,
      href: "/circle/exam-week",
      icon: "circles",
    });
  }
  items.push(...nodes);
  useCampus.setState({ campus: items });
}

function safetyAnon(): string {
  return useVoiceSafety.getState().anonId || "";
}

export async function sendCircleMessage(circleId: string, text: string, extra?: { replyTo?: string }) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const body = text.trim();
  if (!body) throw new Error("Write a message first.");
  const { kindness } = assertSendable(body, "circle", safetyAnon());
  const self = useCampus.getState();
  const payload: Record<string, unknown> = {
    authorUid: uid,
    authorNickname: self.greetingName || self.nickname || "A student",
    text: body.slice(0, 500),
    kind: "text",
    createdAt: serverTimestamp(),
  };
  if (kindness) payload.kindness = true;
  if (extra?.replyTo) payload.replyTo = extra.replyTo;
  const ref = await addDoc(collection(db, "circles", circleId, "messages"), payload);
  return ref.id;
}

/**
 * A photo, video or document from this phone. The caption and file name go through the same
 * on-phone safety check as a message, so phone numbers, links and blocked words still don't send.
 */
export async function sendCircleAttachment(circleId: string, attachment: ChatAttachment, caption = "") {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const text = caption.trim();
  if (text) assertSendable(text, "circle", safetyAnon());
  if (attachment.type === "document") assertSendable(attachment.name.replace(/\.[a-z0-9]{1,5}$/i, ""), "circle", safetyAnon());
  const self = useCampus.getState();
  const ref = await addDoc(collection(db, "circles", circleId, "messages"), {
    authorUid: uid,
    authorNickname: self.greetingName || self.nickname || "A student",
    text: text.slice(0, 500),
    kind: attachment.type === "document" ? "file" : "media",
    attachment,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** A poll: one question and two to four choices, each checked like a message. */
export async function sendCirclePoll(circleId: string, question: string, options: string[]) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const q = question.trim();
  const opts = options.map((o) => o.trim()).filter(Boolean).slice(0, 4);
  if (!q) throw new Error("Ask a question first.");
  if (opts.length < 2) throw new Error("Add at least two choices.");
  if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) throw new Error("Each choice needs to be different.");
  for (const line of [q, ...opts]) assertSendable(line, "circle", safetyAnon());
  const self = useCampus.getState();
  const ref = await addDoc(collection(db, "circles", circleId, "messages"), {
    authorUid: uid,
    authorNickname: self.greetingName || self.nickname || "A student",
    text: q.slice(0, 200),
    kind: "poll",
    poll: { question: q.slice(0, 200), options: opts.map((o) => o.slice(0, 60)) },
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** One vote per person. Voting again moves your vote. */
export async function votePoll(circleId: string, messageId: string, option: number) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  await setDoc(doc(db, "circles", circleId, "messages", messageId, "votes", uid), { option, at: serverTimestamp() });
}

/** Answering a kindness card is helping, so it grows a root. */
export async function answerKindness(circleId: string, messageId: string) {
  await postFn("/kindness-reply", { circleId, messageId });
}

export async function closeKindness(circleId: string, messageId: string) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "circles", circleId, "messages", messageId), { kindnessClosed: true });
}

export async function reportMessage(where: { circleId?: string; chatId?: string; messageId: string }) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  await addDoc(collection(db, "reports"), {
    reporterUid: uid,
    messageId: where.messageId,
    circleId: where.circleId || "",
    chatId: where.chatId || "",
    at: serverTimestamp(),
  });
}

export async function blockAuthor(blockedUid: string, where: { circleId?: string; messageId?: string }) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid || !blockedUid || blockedUid === uid) throw new Error("That person can’t be blocked.");
  await setDoc(doc(db, "blocks", `${uid}_${blockedUid}`), {
    uid,
    blockedUid,
    circleId: where.circleId || "",
    messageId: where.messageId || "",
    at: serverTimestamp(),
  });
}

export async function postThreadReply(circleId: string, threadId: string, text: string) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const body = text.trim();
  if (!body) throw new Error("Write a reply first.");
  assertSendable(body, "thread", safetyAnon());
  const self = useCampus.getState();
  const ref = await addDoc(collection(db, "circles", circleId, "threads", threadId, "replies"), {
    authorUid: uid,
    nickname: self.greetingName || self.nickname || "A student",
    initial: self.initial,
    text: body.slice(0, 500),
    when: "Just now",
    order: Date.now(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function thankReply(input: { circleId: string; messageId?: string; threadId?: string; replyId?: string }) {
  await postFn("/thanks", input);
}

export async function saveAccessibility(partial: Record<string, boolean | string>) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) return;
  const ref = doc(db, "users", uid, "settings", "main");
  const cur = useNabt.getState();
  await setDoc(
    ref,
    {
      accessibility: {
        calmMode: partial.calmMode !== undefined ? (partial.calmMode ? "on" : "off") : cur.calmMode ? "on" : "off",
        plainLanguage: partial.plainLanguage !== undefined ? partial.plainLanguage : cur.plainLanguage,
        quietPresence: partial.quietPresence !== undefined ? partial.quietPresence : cur.quietPresence,
        nodeTakeYourTime: partial.nodeTakeYourTime !== undefined ? partial.nodeTakeYourTime : cur.nodeTakeYourTime,
        offerTyping: partial.offerTyping !== undefined ? partial.offerTyping : cur.offerTyping,
      },
    },
    { merge: true },
  );
}

export async function setDropGoing(going: boolean) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) return;
  await setDoc(doc(db, "users", uid, "settings", "main"), { dropGoing: going }, { merge: true });
  useCampus.setState({ dropGoing: going });
}

export async function saveHideGarden(hide: boolean) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) return;
  await setDoc(doc(db, "users", uid, "settings", "main"), { hideGardenCount: hide }, { merge: true });
}

const CAMPUS_MODES = [
  { mode: "exam", modeLabel: "Exam mode" },
  { mode: "quiet", modeLabel: "Quiet mode" },
  { mode: "study", modeLabel: "Study mode" },
] as const;

export async function setCampusMode(modeLabel: string) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) return;
  const next = CAMPUS_MODES.find((m) => m.modeLabel === modeLabel);
  if (!next) return;
  await updateDoc(doc(db, "users", uid), { mode: next.mode, modeLabel: next.modeLabel });
}

export async function cycleCampusMode(currentLabel: string) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) return;
  const at = CAMPUS_MODES.findIndex((m) => m.modeLabel === currentLabel);
  const next = CAMPUS_MODES[(at + 1) % CAMPUS_MODES.length];
  await updateDoc(doc(db, "users", uid), { mode: next.mode, modeLabel: next.modeLabel });
}

export async function answerChatRequest(id: string, status: "accepted" | "declined") {
  const { db } = getFirebase();
  await updateDoc(doc(db, "chatRequests", id), { status });
}

export async function recordCheckIn(source: "mood" | "voice" = "mood") {
  try {
    await postFn("/check-in", { source });
  } catch {
    throw new Error("Check-in could not update the plant.");
  }
}

export async function postPromptAnswer(circleId: string, text: string) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const body = text.trim();
  if (!body) throw new Error("Write a line first.");
  assertSendable(body, "circle", safetyAnon());
  const self = useCampus.getState();
  await setDoc(doc(db, "circles", circleId, "prompts", "today", "answers", uid), {
    authorUid: uid,
    text: body.slice(0, 200),
    displayName: self.greetingName || self.nickname,
    initial: self.initial,
    order: Date.now(),
    day: new Date().toDateString(),
    createdAt: serverTimestamp(),
  });
}
