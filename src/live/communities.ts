import {
  addDoc,
  collection,
  deleteDoc,
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
} from "firebase/firestore";
import { create } from "zustand";
import { getFirebase } from "../firebase";
import { postFn } from "../fn";
import { markJoined, me, rewatchCircle, useCampus } from "../live";

export type DiscoverStory = {
  id: string;
  kind: string;
  author: string;
  initial: string;
  meta: string;
  body: string;
  thanks: number;
  replies: number;
  replyAuthor: string;
  replyInitial: string;
  replyText: string;
  refId: string;
  order: number;
};

export type CampusEvent = {
  id: string;
  title: string;
  hostLabel: string;
  verified: boolean;
  kicker: string;
  meta: string;
  day: string;
  mon: string;
  rsvpCount: number;
  faces?: string[];
  whenLine?: string;
  placeLine?: string;
  blurb?: string;
  goingLine?: string;
  goingFaces?: string[];
  status: string;
  hostType: string;
  hostId: string;
  order: number;
  checkIn?: boolean;
  verifiedHost?: boolean;
  startsAt?: number;
  endsAt?: number;
  venueStatus?: string;
  description?: string;
  screenDescription?: string;
  window?: string;
};

export type Petition = {
  id: string;
  title: string;
  text: string;
  signCount: number;
  goal: number;
  status: string;
  category: string;
};

export type Venue = { id: string; name: string; building: string };

export type VenueRequest = {
  id: string;
  circleId: string;
  chairUid: string;
  venueId: string;
  dateOptions: string[];
  memberCount: number;
  status: string;
  reply: string;
};

export type Contact = {
  id: string;
  realName: string;
  uaEmail: string;
  phone: string;
  trainingAttendance: string;
};

export type BoardTask = { id: string; title: string; owner: string; due: string; done: boolean };
export type AuditRow = { id: string; action: string; actor: string; when: string; order: number };

type CommunityState = {
  stories: DiscoverStory[];
  events: CampusEvent[];
  petitions: Petition[];
  venues: Venue[];
  venueRequests: VenueRequest[];
  contacts: Record<string, Contact[]>;
  tasks: Record<string, BoardTask[]>;
  audit: Record<string, AuditRow[]>;
  myRsvps: Record<string, boolean>;
  rsvpCounts: Record<string, number>;
};

export const useCommunity = create<CommunityState>(() => ({
  stories: [],
  events: [],
  petitions: [],
  venues: [],
  venueRequests: [],
  contacts: {},
  tasks: {},
  audit: {},
  myRsvps: {},
  rsvpCounts: {},
}));

function millis(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toMillis" in v && typeof (v as { toMillis: () => number }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return undefined;
}

/** An event is live while its seeded window contains now. */
export function eventIsLive(event: { startsAt?: number; endsAt?: number; checkIn?: boolean }, now = Date.now()) {
  if (event.startsAt && event.endsAt) return event.startsAt <= now && now < event.endsAt;
  return Boolean(event.checkIn);
}

const watched = new Set<string>();
let communityStops: (() => void)[] = [];

const subscribe = onSnapshot;
const watch = ((ref: never, next: never, error?: (err: { code?: string }) => void) => {
  const unsub = subscribe(
    ref,
    next,
    error ||
      ((err: { code?: string }) => {
        if (err.code !== "permission-denied") console.error(err);
      }),
  );
  communityStops.push(unsub);
  return unsub;
}) as typeof onSnapshot;

/** Drop Circle, event, and petition listeners so a later student session can attach them again. */
export function stopCommunities() {
  const mine = communityStops;
  communityStops = [];
  watched.clear();
  for (const unsub of mine) unsub();
}

export function startCommunities(db: Firestore, uid: string) {
  stopCommunities();
  watch(collection(db, "stories"), (snap) => {
    const stories = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          kind: String(data.kind || ""),
          author: String(data.author || ""),
          initial: String(data.initial || ""),
          meta: String(data.meta || ""),
          body: String(data.body || data.title || ""),
          thanks: Number(data.thanks || 0),
          replies: Number(data.replies || 0),
          replyAuthor: String(data.replyAuthor || ""),
          replyInitial: String(data.replyInitial || ""),
          replyText: String(data.replyText || ""),
          refId: String(data.refId || ""),
          order: Number(data.order || 0),
        } satisfies DiscoverStory;
      })
      .filter((s) => s.kind === "thread")
      .sort((a, b) => a.order - b.order);
    useCommunity.setState({ stories });
  });

  watch(collection(db, "events"), (snap) => {
    const events = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || ""),
          hostLabel: String(data.hostLabel || "Student Affairs"),
          verified: data.verified !== false,
          kicker: String(data.kicker || ""),
          meta: String(data.meta || ""),
          day: String(data.day || ""),
          mon: String(data.mon || ""),
          rsvpCount: Number(data.rsvpCount || 0),
          faces: Array.isArray(data.faces) ? data.faces.map(String) : undefined,
          whenLine: data.whenLine ? String(data.whenLine) : undefined,
          placeLine: data.placeLine ? String(data.placeLine) : undefined,
          blurb: data.blurb ? String(data.blurb) : undefined,
          goingLine: data.goingLine ? String(data.goingLine) : undefined,
          goingFaces: Array.isArray(data.goingFaces) ? data.goingFaces.map(String) : undefined,
          status: String(data.status || ""),
          hostType: String(data.hostType || ""),
          hostId: String(data.hostId || ""),
          order: Number(data.order || 0),
          checkIn: Boolean(data.checkIn),
          verifiedHost: data.verified !== false,
          startsAt: millis(data.startsAt),
          endsAt: millis(data.endsAt),
          venueStatus: data.venueStatus ? String(data.venueStatus) : undefined,
          description: data.description ? String(data.description) : undefined,
          screenDescription: data.screenDescription ? String(data.screenDescription) : undefined,
          window: data.window ? String(data.window) : undefined,
        } satisfies CampusEvent;
      })
      .filter((e) => e.status === "published")
      .sort((a, b) => a.order - b.order);
    useCommunity.setState({ events });
    for (const event of events) {
      const key = `rsvp:${event.id}`;
      if (watched.has(key)) continue;
      watched.add(key);
      watch(doc(db, "events", event.id, "rsvps", uid), (mine) => {
        useCommunity.setState((s) => ({ myRsvps: { ...s.myRsvps, [event.id]: mine.exists() } }));
      });
      watch(collection(db, "events", event.id, "rsvps"), (rows) => {
        useCommunity.setState((s) => ({ rsvpCounts: { ...s.rsvpCounts, [event.id]: rows.size } }));
      });
    }
  });

  watch(query(collection(db, "petitions"), where("status", "in", ["published", "answered", "closed"])), (snap) => {
    useCommunity.setState({
      petitions: snap.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || ""),
            text: String(data.text || ""),
            signCount: Number(data.signCount || 0),
            goal: Number(data.goal || 0),
            status: String(data.status || ""),
            category: String(data.category || ""),
          } satisfies Petition;
        })
        .filter((p) => p.status === "published"),
    });
  });

  watch(collection(db, "venues"), (snap) => {
    useCommunity.setState({
      venues: snap.docs.map((d) => {
        const data = d.data();
        return { id: d.id, name: String(data.name || d.id), building: String(data.building || "") };
      }),
    });
  });

  watch(query(collection(db, "venueRequests"), where("chairUid", "==", uid)), (snap) => {
    const mine = snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          circleId: String(data.circleId || ""),
          chairUid: String(data.chairUid || ""),
          venueId: String(data.venueId || ""),
          dateOptions: Array.isArray(data.dateOptions) ? data.dateOptions.map(String) : [],
          memberCount: Number(data.memberCount || 0),
          status: String(data.status || ""),
          reply: String(data.reply || ""),
        } satisfies VenueRequest;
      })
      .filter((r) => r.chairUid === uid);
    useCommunity.setState({ venueRequests: mine });
    for (const req of mine) {
      const key = `thread:${req.id}`;
      if (watched.has(key)) continue;
      watched.add(key);
      watch(collection(db, "venueRequests", req.id, "thread"), (thread) => {
        const reply = thread.docs
          .map((d) => String(d.data().text || ""))
          .filter(Boolean)
          .join(" ");
        if (!reply) return;
        useCommunity.setState((s) => ({
          venueRequests: s.venueRequests.map((r) => (r.id === req.id ? { ...r, reply } : r)),
        }));
      });
    }
  });

  watch(collection(db, "circles"), (snap) => {
    snap.docs.forEach((circle) => {
      const id = circle.id;
      if (watched.has(id)) return;
      watched.add(id);
      const chair = String(circle.data().chairUid || "") === uid;
      const onDenied = (err: { code?: string }) => {
        if (err.code === "permission-denied") return;
      };
      if (chair) {
        watch(collection(db, "circles", id, "contacts"), (contacts) => {
          useCommunity.setState((s) => ({
            contacts: {
              ...s.contacts,
              [id]: contacts.docs.map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  realName: String(data.realName || ""),
                  uaEmail: String(data.uaEmail || ""),
                  phone: String(data.phone || ""),
                  trainingAttendance: String(data.trainingAttendance || ""),
                };
              }),
            },
          }));
        }, onDenied);
        watch(collection(db, "circles", id, "board"), (board) => {
          useCommunity.setState((s) => ({
            tasks: {
              ...s.tasks,
              [id]: board.docs
                .filter((d) => d.data().kind === "task")
                .map((d) => {
                  const data = d.data();
                  return {
                    id: d.id,
                    title: String(data.title || ""),
                    owner: String(data.owner || ""),
                    due: String(data.due || ""),
                    done: Boolean(data.done),
                  };
                }),
            },
          }));
        }, onDenied);
      }
      watch(collection(db, "circles", id, "audit"), (audit) => {
        useCommunity.setState((s) => ({
          audit: {
            ...s.audit,
            [id]: audit.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  action: String(data.action || ""),
                  actor: String(data.actor || ""),
                  when: String(data.when || ""),
                  order: Number(data.order || 0),
                };
              })
              .sort((a, b) => a.order - b.order),
          },
        }));
      }, onDenied);
    });
  });
}

export async function rsvpEvent(eventId: string, going: boolean) {
  const { auth, db } = getFirebase();
  const uid = me();
  const ref = doc(db, "events", eventId, "rsvps", uid);
  if (!going) {
    await deleteDoc(ref);
    return;
  }
  const self = useCampus.getState();
  await setDoc(ref, { nickname: self.greetingName || self.nickname || "A student", createdAt: serverTimestamp() });
}

export async function joinCommunity(circleId: string, profile: { nickname: string; realName: string; uaEmail: string; phone: string }): Promise<"joined" | "requested"> {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const snap = await getDoc(doc(db, "circles", circleId));
  const data = snap.data() || {};
  let nickname = profile.nickname || "";
  if (!nickname) {
    const user = await getDoc(doc(db, "users", uid));
    nickname = String(user.data()?.nickname || user.data()?.greetingName || "A student");
  }
  if (data.joinApproval === true) {
    await setDoc(doc(db, "circles", circleId, "joinRequests", uid), {
      nickname,
      realName: profile.realName || "",
      uaEmail: profile.uaEmail || "",
      phone: profile.phone || "",
      trainingAttendance: "Not recorded yet",
      status: "pending",
      at: serverTimestamp(),
    });
    return "requested";
  }
  await setDoc(doc(db, "circles", circleId, "members", uid), {
    nickname,
    joinedAt: serverTimestamp(),
  });
  if (data.verified === true) {
    await setDoc(doc(db, "circles", circleId, "contacts", uid), {
      realName: profile.realName || "",
      uaEmail: profile.uaEmail || "",
      phone: profile.phone || "",
      trainingAttendance: "Not recorded yet",
      consentAt: serverTimestamp(),
    });
  }
  await updateDoc(doc(db, "circles", circleId), { memberCount: increment(1) });
  await addDoc(collection(db, "circles", circleId, "messages"), {
    authorUid: uid,
    authorNickname: nickname,
    text: `${nickname} joined`,
    kind: "system",
    createdAt: serverTimestamp(),
  });
  const initial = nickname.slice(0, 1).toUpperCase();
  useCampus.setState((s) => ({
    members: {
      ...s.members,
      [circleId]: [
        ...(s.members[circleId] || []).filter((m) => m.id !== uid),
        { id: uid, nickname, displayName: nickname, initial, order: 99, roles: [] },
      ],
    },
  }));
  markJoined(circleId, true);
  rewatchCircle(circleId);
  return "joined";
}

export async function leaveCommunity(circleId: string) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) return;
  try {
    await updateDoc(doc(db, "circles", circleId), { memberCount: increment(-1) });
  } catch {
    /* count already moved */
  }
  await deleteDoc(doc(db, "circles", circleId, "members", uid));
  await deleteDoc(doc(db, "circles", circleId, "contacts", uid)).catch(() => undefined);
  markJoined(circleId, false);
  useCampus.setState((s) => ({
    members: { ...s.members, [circleId]: (s.members[circleId] || []).filter((m) => m.id !== uid) },
  }));
}

export async function createCircle(input: { name: string; kind: "support" | "community"; joinApproval?: boolean }) {
  return postFn<{ id: string; name: string }>("/create-circle", input);
}

export async function createEvent(input: { circleId: string; title: string; nodeId: string; venueId: string; startsAt: number; endsAt: number; description?: string }) {
  return postFn<{ id: string; title: string }>("/create-event", input);
}

export async function createPetition(input: { title: string; line: string }) {
  return postFn<{ id: string }>("/create-petition", input);
}

export async function askVerification(circleId: string) {
  return postFn("/verify-ask", { circleId });
}

export async function decideJoin(circleId: string, uid: string, status: "approved" | "declined") {
  return postFn("/join-decide", { circleId, uid, status });
}

export async function requestVenue(input: { circleId: string; venueId: string; dateOptions: string[]; memberCount: number }) {
  const { auth, db } = getFirebase();
  const uid = me();
  const ref = doc(collection(db, "venueRequests"));
  await setDoc(ref, {
    circleId: input.circleId,
    chairUid: uid,
    venueId: input.venueId,
    dateOptions: input.dateOptions,
    memberCount: input.memberCount,
    status: "sent",
    createdAt: serverTimestamp(),
  });
}

export async function signPetition(id: string) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const ref = doc(db, "petitions", id, "signatures", uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  await setDoc(ref, { uid, at: serverTimestamp() });
  await updateDoc(doc(db, "petitions", id), { signCount: increment(1) });
}

export async function assignBoardRole(circleId: string, targetUid: string, roles: string[]) {
  await postFn("/board-role", { circleId, targetUid, roles });
}

export const ROLE_LABEL: Record<string, string> = {
  chair: "Chair",
  vice_chair: "Vice-Chair",
  events: "Events Lead",
  moderator: "Moderator",
  logistics: "Logistics/Tech",
  hr: "HR/Secretary",
  media: "Media",
  treasurer: "Treasurer",
  mentor: "Mentor",
};

export function roleChip(roles: string[] | undefined) {
  const id = (roles || []).find((r) => r !== "mentor") || (roles || [])[0];
  if (!id) return "";
  return (ROLE_LABEL[id] || id).toUpperCase();
}
