/**
 * AREA: impact — semester aggregates, announcements, activity reports, You said we did.
 * Staff reads the rollup. Students read only the announcements for their audience.
 */
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { getFirebase } from "../firebase";
import { reviewOutgoing } from "../moderation/outgoing";
import { toast } from "../toast";
import { useEffect, useState } from "react";
import { me, useCampus } from "../live";

/** Counts between 1 and this floor are hidden so a small group cannot be identified. Zero stays zero. */
export const PRIVACY_MIN = 5;

export function privacyCount(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < PRIVACY_MIN) return "—";
  return String(n);
}

function guardWritten(text: string) {
  const review = reviewOutgoing(text, "circle", "campus");
  if (review.action !== "send") throw new Error(review.reason);
}

export type WeekPoint = { label: string; score: number; exam: boolean };
export type TopCommunity = { id: string; name: string; score: number };
export type ImpactNumbers = {
  semester: string;
  events: number;
  checkIns: number;
  uniqueStudents: number;
  activeCircles: number;
  verifiedCommunities: number;
  newMembers: number;
  avgRating?: number;
  certificatesIssued?: number;
  moodCheckIns?: number;
  supportHandled?: number;
  medianFirstReply?: string;
  top: TopCommunity[];
  weeks: WeekPoint[];
};
export type Announcement = {
  id: string;
  title: string;
  body: string;
  link?: string;
  eventDate?: string;
  audience: string;
  faculty?: string;
  circleId?: string;
  pinUntil?: number;
  verified: boolean;
  createdAt: number;
};
export type AttendanceRow = { eventId: string; title: string; count: number };
export type BoardSeat = { role: string; nickname: string };
export type ActivityReport = {
  id: string;
  circleId: string;
  circleName: string;
  semester: string;
  eventsHeld: number;
  attendance: AttendanceRow[];
  uniqueAttendees: number;
  mentorsTrained: number;
  board: BoardSeat[];
  highlights: string;
  status: string;
  reviewNote?: string;
  avgFeedback?: number;
};
export type CircleStat = {
  eventsHeld: number;
  attendance: AttendanceRow[];
  uniqueAttendees: number;
  mentorsTrained: number;
};
export type YouSaid = {
  id: string;
  title: string;
  line: string;
  source?: string;
  link?: string;
  date: string;
  createdAt: number;
  /** Set when the update answers one petition or one Circle; otherwise it is campus-wide. */
  petitionId?: string;
  circleId?: string;
};

type ImpactState = {
  faculty: string;
  impact: ImpactNumbers | null;
  announcements: Announcement[];
  hides: string[];
  reports: ActivityReport[];
  circleStats: Record<string, CircleStat>;
  youSaid: YouSaid[];
  notice: string | null;
};

export const useImpact = create<ImpactState>(() => ({
  faculty: "",
  impact: null,
  announcements: [],
  hides: [],
  reports: [],
  circleStats: {},
  youSaid: [],
  notice: null,
}));

function millis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : 0;
}

function num(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function mapAnnouncement(id: string, data: DocumentData): Announcement {
  return {
    id,
    title: String(data.title || ""),
    body: String(data.body || ""),
    link: data.link ? String(data.link) : undefined,
    eventDate: data.eventDate ? String(data.eventDate) : undefined,
    audience: String(data.audience || ""),
    faculty: data.faculty ? String(data.faculty) : undefined,
    circleId: data.circleId ? String(data.circleId) : undefined,
    pinUntil: data.pinUntil ? millis(data.pinUntil) : undefined,
    verified: Boolean(data.verified),
    createdAt: millis(data.createdAt),
  };
}

function mapReport(id: string, data: DocumentData): ActivityReport {
  const attendance = Array.isArray(data.attendance) ? data.attendance : [];
  const board = Array.isArray(data.board) ? data.board : [];
  return {
    id,
    circleId: String(data.circleId || ""),
    circleName: String(data.circleName || ""),
    semester: String(data.semester || ""),
    eventsHeld: num(data.eventsHeld),
    attendance: attendance.map((row) => ({
      eventId: String(row.eventId || ""),
      title: String(row.title || ""),
      count: num(row.count),
    })),
    uniqueAttendees: num(data.uniqueAttendees),
    mentorsTrained: num(data.mentorsTrained),
    board: board.map((row) => ({ role: String(row.role || ""), nickname: String(row.nickname || "") })),
    highlights: String(data.highlights || ""),
    status: String(data.status || "draft"),
    reviewNote: data.reviewNote ? String(data.reviewNote) : undefined,
    avgFeedback: typeof data.avgFeedback === "number" ? data.avgFeedback : undefined,
  };
}

function mapYouSaid(id: string, data: DocumentData): YouSaid {
  return {
    id,
    title: String(data.title || ""),
    line: String(data.line || ""),
    source: data.source ? String(data.source) : undefined,
    link: data.link ? String(data.link) : undefined,
    date: String(data.date || ""),
    createdAt: millis(data.createdAt),
    petitionId: data.petitionId ? String(data.petitionId) : undefined,
    circleId: data.circleId ? String(data.circleId) : undefined,
  };
}

/**
 * "You said, we did" for one student: campus-wide updates, plus updates on petitions they signed
 * and Circles they belong to. Nothing about other people's petitions or Circles.
 */
export function useMyYouSaid() {
  const rows = useImpact((s) => s.youSaid);
  const members = useCampus((s) => s.members);
  const uid = useCampus((s) => (s.ready ? me() : ""));
  const [signed, setSigned] = useState<Record<string, boolean>>({});
  const petitionIds = Array.from(new Set(rows.map((r) => r.petitionId).filter((v): v is string => Boolean(v)))).join(",");
  useEffect(() => {
    if (!uid || !petitionIds) return;
    const { db } = getFirebase();
    const stops = petitionIds.split(",").map((pid) =>
      onSnapshot(
        doc(db, "petitions", pid, "signatures", uid),
        (snap) => setSigned((cur) => ({ ...cur, [pid]: snap.exists() })),
        () => undefined,
      ),
    );
    return () => stops.forEach((stop) => stop());
  }, [uid, petitionIds]);
  return rows.filter((row) => {
    if (row.petitionId) return Boolean(signed[row.petitionId]);
    if (row.circleId) return (members[row.circleId] || []).some((m) => m.id === uid);
    return true;
  });
}

function mapImpact(data: DocumentData): ImpactNumbers {
  const top = Array.isArray(data.top) ? data.top : [];
  const weeks = Array.isArray(data.weeks) ? data.weeks : [];
  const impact: ImpactNumbers = {
    semester: String(data.semester || "This semester"),
    events: num(data.events),
    checkIns: num(data.checkIns),
    uniqueStudents: num(data.uniqueStudents),
    activeCircles: num(data.activeCircles),
    verifiedCommunities: num(data.verifiedCommunities),
    newMembers: num(data.newMembers),
    top: top.map((row) => ({ id: String(row.id || ""), name: String(row.name || ""), score: num(row.score) })),
    weeks: weeks.map((row) => ({ label: String(row.label || ""), score: num(row.score), exam: Boolean(row.exam) })),
  };
  if (typeof data.avgRating === "number") impact.avgRating = data.avgRating;
  if (typeof data.certificatesIssued === "number") impact.certificatesIssued = data.certificatesIssued;
  if (typeof data.moodCheckIns === "number") impact.moodCheckIns = data.moodCheckIns;
  if (typeof data.supportHandled === "number") impact.supportHandled = data.supportHandled;
  if (typeof data.medianFirstReply === "string") impact.medianFirstReply = data.medianFirstReply;
  return impact;
}

function fromSnap(snap: QuerySnapshot<DocumentData>, map: (id: string, data: DocumentData) => Announcement) {
  return snap.docs.map((row) => map(row.id, row.data()));
}

function fnHost() {
  return process.env.EXPO_PUBLIC_FN_URL || "http://127.0.0.1:5055";
}

let started = false;
let stopListen = () => {};

export function startImpact() {
  if (started) return;
  started = true;
  const { auth } = getFirebase();
  let generation = 0;
  onAuthStateChanged(auth, (user) => {
    const gen = ++generation;
    stopListen();
    const unsubs: (() => void)[] = [];
    stopListen = () => unsubs.forEach((unsub) => unsub());
    useImpact.setState({
      faculty: "",
      impact: null,
      announcements: [],
      hides: [],
      reports: [],
      circleStats: {},
      youSaid: [],
      notice: null,
    });
    if (!user) return;
    void user.getIdTokenResult(true).then((token) => {
      if (gen !== generation) return;
      if (token.claims.sa === true) bindStaff(unsubs);
      else bindStudent(unsubs, user.uid);
    });
  });
}

function foldAggregates(feedback: DocumentData[], certs: DocumentData[]) {
  let count = 0;
  let sum = 0;
  for (const row of feedback) {
    const n = num(row.count);
    if (n <= 0) continue;
    if (typeof row.sum === "number") {
      count += n;
      sum += row.sum;
    } else if (typeof row.average === "number") {
      count += n;
      sum += row.average * n;
    }
  }
  let issued = 0;
  let sawIssued = false;
  for (const row of certs) {
    if (typeof row.issued !== "number") continue;
    issued += row.issued;
    sawIssued = true;
  }
  return {
    avgRating: count >= 5 ? Math.round((sum / count) * 10) / 10 : undefined,
    certificatesIssued: !sawIssued || (issued > 0 && issued < 5) ? undefined : issued,
  };
}

function bindStaff(unsubs: (() => void)[]) {
  const { db } = getFirebase();
  let base: ImpactNumbers | null = null;
  let feedbackRows: DocumentData[] = [];
  let certRows: DocumentData[] = [];
  const publishImpact = () => {
    const extra = foldAggregates(feedbackRows, certRows);
    if (!base && extra.avgRating == null && extra.certificatesIssued == null) {
      useImpact.setState({ impact: null });
      return;
    }
    const impact: ImpactNumbers = {
      ...(base || {
        semester: "This semester",
        events: 0,
        checkIns: 0,
        uniqueStudents: 0,
        activeCircles: 0,
        verifiedCommunities: 0,
        newMembers: 0,
        top: [],
        weeks: [],
      }),
    };
    if (typeof extra.avgRating === "number") impact.avgRating = extra.avgRating;
    if (typeof extra.certificatesIssued === "number") impact.certificatesIssued = extra.certificatesIssued;
    useImpact.setState({ impact });
  };
  unsubs.push(onSnapshot(doc(db, "impact", "fall-2026"), (snap) => {
    base = snap.exists() ? mapImpact(snap.data()) : null;
    publishImpact();
  }));
  unsubs.push(onSnapshot(collection(db, "feedbackAggregates"), (snap) => {
    feedbackRows = snap.docs.map((row) => row.data());
    publishImpact();
  }, () => undefined));
  unsubs.push(onSnapshot(collection(db, "certificateAggregates"), (snap) => {
    certRows = snap.docs.map((row) => row.data());
    publishImpact();
  }, () => undefined));
  unsubs.push(onSnapshot(collection(db, "announcements"), (snap) => {
    const announcements = fromSnap(snap, mapAnnouncement).sort((a, b) => b.createdAt - a.createdAt);
    useImpact.setState({ announcements });
  }));
  unsubs.push(onSnapshot(collection(db, "activityReports"), (snap) => {
    useImpact.setState({
      reports: snap.docs.map((row) => mapReport(row.id, row.data())).sort((a, b) => a.circleName.localeCompare(b.circleName)),
    });
  }));
  unsubs.push(onSnapshot(collection(db, "youSaid"), (snap) => {
    useImpact.setState({
      youSaid: snap.docs.map((row) => mapYouSaid(row.id, row.data())).sort((a, b) => b.createdAt - a.createdAt),
    });
  }));
}

function bindStudent(unsubs: (() => void)[], uid: string) {
  const { db } = getFirebase();
  const buckets = new Map<string, Announcement[]>();
  const publish = () => {
    const all = new Map<string, Announcement>();
    for (const rows of buckets.values()) for (const row of rows) all.set(row.id, row);
    useImpact.setState({ announcements: [...all.values()].sort((a, b) => b.createdAt - a.createdAt) });
  };
  const take = (key: string, snap: QuerySnapshot<DocumentData>) => {
    buckets.set(key, fromSnap(snap, mapAnnouncement));
    publish();
  };
  unsubs.push(onSnapshot(query(collection(db, "announcements"), where("audienceKey", "==", "everyone")), (snap) => take("everyone", snap), () => undefined));
  unsubs.push(onSnapshot(collection(db, "users", uid, "announcementHides"), (snap) => {
    useImpact.setState({ hides: snap.docs.map((row) => row.id) });
  }, () => undefined));
  unsubs.push(onSnapshot(collection(db, "youSaid"), (snap) => {
    useImpact.setState({
      youSaid: snap.docs.map((row) => mapYouSaid(row.id, row.data())).sort((a, b) => b.createdAt - a.createdAt),
    });
  }, () => undefined));

  let facultyUnsub: (() => void) | null = null;
  unsubs.push(onSnapshot(doc(db, "users", uid), (snap) => {
    const faculty = String(snap.data()?.faculty || "");
    useImpact.setState({ faculty });
    if (!faculty || facultyUnsub) return;
    facultyUnsub = onSnapshot(
      query(
        collection(db, "announcements"),
        where("audience", "==", "faculty"),
        where("faculty", "==", faculty),
        where("audienceKey", "==", `faculty:${faculty}`),
      ),
      (next) => take("faculty", next),
      () => undefined,
    );
    unsubs.push(facultyUnsub);
  }, () => undefined));

  let wave = 0;
  let circleStops: (() => void)[] = [];
  unsubs.push(onSnapshot(collection(db, "circles"), (snap) => {
    const myWave = ++wave;
    void (async () => {
      const mine: string[] = [];
      const chaired: string[] = [];
      await Promise.all(snap.docs.map(async (circle) => {
        const chairUid = String(circle.data().chairUid || "");
        if (chairUid === uid) chaired.push(circle.id);
        try {
          const member = await getDoc(doc(db, "circles", circle.id, "members", uid));
          if (!member.exists()) return;
          mine.push(circle.id);
          const roles = Array.isArray(member.data()?.roles) ? member.data()?.roles : [];
          if (roles.length > 0 && !chaired.includes(circle.id)) chaired.push(circle.id);
        } catch {
          // Not a member of this Circle.
        }
      }));
      if (myWave !== wave) return;
      circleStops.forEach((stop) => stop());
      circleStops = [];
      const reportBuckets = new Map<string, ActivityReport[]>();
      const publishReports = () => {
        useImpact.setState({ reports: [...reportBuckets.values()].flat() });
      };
      for (const id of mine) {
        const unsub = onSnapshot(
          query(
            collection(db, "announcements"),
            where("audience", "==", "circle"),
            where("circleId", "==", id),
            where("audienceKey", "==", `circle:${id}`),
          ),
          (next) => take(`circle:${id}`, next),
          () => undefined,
        );
        circleStops.push(unsub);
        unsubs.push(unsub);
      }
      for (const id of chaired) {
        const unsub = onSnapshot(
          query(collection(db, "activityReports"), where("circleId", "==", id)),
          (next) => {
            reportBuckets.set(id, next.docs.map((row) => mapReport(row.id, row.data())));
            publishReports();
          },
          () => undefined,
        );
        circleStops.push(unsub);
        unsubs.push(unsub);
        const stats = onSnapshot(doc(db, "circleStats", id), (next) => {
          if (!next.exists()) return;
          const data = next.data();
          const attendance = Array.isArray(data.attendance) ? data.attendance : [];
          useImpact.setState((state) => ({
            circleStats: {
              ...state.circleStats,
              [id]: {
                eventsHeld: num(data.eventsHeld),
                uniqueAttendees: num(data.uniqueAttendees),
                mentorsTrained: num(data.mentorsTrained),
                attendance: attendance.map((row) => ({
                  eventId: String(row.eventId || ""),
                  title: String(row.title || ""),
                  count: num(row.count),
                })),
              },
            },
          }));
        }, () => undefined);
        circleStops.push(stats);
        unsubs.push(stats);
      }
    })();
  }, () => undefined));
}

export async function refreshImpact() {
  if (process.env.EXPO_PUBLIC_DEMO_LOCAL !== "0") return;
  try {
    await fetch(`${fnHost()}/impact/recompute`, { method: "POST" });
  } catch {
    // Seeded aggregates stay on screen when the local function is down.
  }
}

function pinStamp(day: string | undefined) {
  if (!day) return undefined;
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return undefined;
  return Timestamp.fromDate(new Date(Date.UTC(year, month - 1, date, 20, 59)));
}

export async function publishAnnouncement(input: {
  title: string;
  body: string;
  link?: string;
  eventDate?: string;
  pinUntil?: string;
  audience: "everyone" | "faculty" | "circle";
  faculty?: string;
  circleId?: string;
}) {
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  const token = await auth.currentUser!.getIdTokenResult();
  const sa = token.claims.sa === true;
  if (sa && input.audience === "circle") throw new Error("Student Affairs posts to everyone or a faculty.");
  if (!sa && input.audience !== "circle") throw new Error("A Chair posts to their own Circle only.");
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title || !body) throw new Error("Add a title and a short note.");
  if (title.length > 80 || body.length > 280) throw new Error("Keep the title and note short.");
  guardWritten(`${title}\n${body}`);
  const data: Record<string, unknown> = {
    title,
    body,
    audience: input.audience,
    audienceKey: "everyone",
    authorUid: uid,
    verified: sa,
    status: "published",
    createdAt: serverTimestamp(),
  };
  if (input.audience === "faculty") {
    const faculty = (input.faculty || "").trim();
    if (!faculty) throw new Error("Name the faculty.");
    data.faculty = faculty;
    data.audienceKey = `faculty:${faculty}`;
  }
  if (input.audience === "circle") {
    if (!input.circleId) throw new Error("Choose a Circle.");
    data.circleId = input.circleId;
    data.audienceKey = `circle:${input.circleId}`;
  }
  if (input.link?.trim()) data.link = input.link.trim();
  if (input.eventDate?.trim()) data.eventDate = input.eventDate.trim();
  const pin = pinStamp(input.pinUntil);
  if (pin) data.pinUntil = pin;
  await addDoc(collection(db, "announcements"), data);
  useImpact.setState({ notice: "Announcement posted." });
  toast("Announcement posted.");
}

export async function hideAnnouncement(id: string) {
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  await setDoc(doc(db, "users", uid, "announcementHides", id), { at: serverTimestamp() });
}

export async function publishYouSaid(input: { title: string; line: string; source?: string; link?: string; date: string }) {
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  const title = input.title.trim();
  const line = input.line.trim();
  const date = input.date.trim();
  if (!title || !line || !date) throw new Error("Add a title, one line, and a date.");
  if (title.length > 80 || line.length > 140) throw new Error("Keep the title and line short.");
  guardWritten(`${title}\n${line}`);
  const data: Record<string, unknown> = {
    title,
    line,
    date,
    authorUid: uid,
    createdAt: serverTimestamp(),
  };
  if (input.source?.trim()) data.source = input.source.trim();
  if (input.link?.trim()) data.link = input.link.trim();
  await addDoc(collection(db, "youSaid"), data);
  useImpact.setState({ notice: "Update posted." });
  toast("Update posted.");
}

export async function submitReport(circleId: string, circleName: string, existingId: string | null, highlights: string, snapshot: CircleStat, board: BoardSeat[]) {
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  const text = highlights.trim();
  if (!text) throw new Error("Add a short highlight.");
  if (text.length > 600) throw new Error("Keep the highlight shorter.");
  guardWritten(text);
  const id = existingId || `${circleId}-fall-2026`;
  const ref = doc(db, "activityReports", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      circleId,
      circleName,
      semester: "Fall 2026",
      eventsHeld: snapshot.eventsHeld,
      attendance: snapshot.attendance,
      uniqueAttendees: snapshot.uniqueAttendees,
      mentorsTrained: snapshot.mentorsTrained,
      board,
      highlights: text,
      status: "draft",
      authorUid: uid,
      updatedAt: serverTimestamp(),
    });
  }
  await updateDoc(ref, { highlights: text, status: "submitted", updatedAt: serverTimestamp() });
  useImpact.setState({ notice: "Sent to Student Affairs." });
  toast("Sent to Student Affairs.");
}

export async function reviewReport(id: string, status: "accepted" | "changes", reviewNote: string) {
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  await updateDoc(doc(db, "activityReports", id), {
    status,
    reviewNote: reviewNote.trim(),
    reviewedBy: uid,
    updatedAt: serverTimestamp(),
  });
  const message = status === "accepted" ? "Report accepted." : "Sent back to the Chair.";
  useImpact.setState({ notice: message });
  toast(message);
}
