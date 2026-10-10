/**
 * Student Affairs live data. Listens for the signed-in staff member (sa claim)
 * to staff collections. Does not modify src/live.ts.
 */
import { Platform } from "react-native";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { create } from "zustand";
import { getFirebase } from "../firebase";
import { postFn as sharedPostFn } from "../fn";
import { startCampus } from "../live";
import { toast } from "../toast";

/** The signed-in staff member's uid, or "" when nobody is signed in. */
function staffUid() {
  return getFirebase().auth.currentUser?.uid || "";
}

function tell(message: string) {
  useStaff.setState({ notice: message });
  toast(message);
}

const EMPTY_OVERVIEW = { chip: "This week", kpis: [] as Kpi[], weeks: [] as WeekBar[], legend: [] as { label: string; opacity: number }[], today: [] as { title: string; sub: string; href: string }[] };

export type Kpi = { n: string; label: string; white?: boolean };
export type WeekBar = { label: string; x: number; bars: { y: number; h: number; o: number }[] };
export type StaffCase = {
  id: string;
  nickname: string;
  initial: string;
  severity: string;
  kind: string;
  kindLabel: string;
  careLabel?: string;
  where: string;
  context?: string;
  title?: string;
  topic: string;
  time: string;
  excerpt?: string;
  fullExcerpt?: string;
  shareNote?: string;
  ladderStep?: number;
  stepLabel?: string;
  rank: number;
  filter: string;
  open?: boolean;
  assignedName?: string;
  level?: string;
  when?: string;
  reasons?: string[];
  steps?: { title: string; sub: string; state: string }[];
  ladder?: { n: string; title: string; sub: string; state: string }[];
  revealed?: boolean;
};
export type ThreadMsg = { id: string; from: string; text: string; initial?: string };
export type AccountCard = {
  id: string;
  initial: string;
  name: string;
  role: string;
  edited: number;
  when: string;
  status: string;
  chip: string;
  chipOn?: boolean;
  uid: string;
  order: number;
  filter: string;
  email?: string;
  submitted?: string;
  fields?: { label: string; scanned: string; submitted: string; edited?: boolean; locked?: boolean }[];
};
export type Petition = {
  id: string;
  title: string;
  short?: string;
  by: string;
  topic: string;
  goal: number;
  signCount: number;
  status: string;
  bucket: string;
  order: number;
  response?: string;
};
export type MeetupRow = {
  id: string;
  circle: string;
  by: string;
  title: string;
  detail: string;
  spot?: string;
  status: string;
  order: number;
};
export type VenueReq = {
  id: string;
  queue: string;
  circle: string;
  initial: string;
  title: string;
  detail: string;
  time: string;
  fast?: boolean;
  status: string;
  order: number;
  clash?: string;
  chairName?: string;
  memberCount?: number;
  slots?: { label: string; sub: string; ok?: boolean }[];
};
export type Community = {
  id: string;
  name: string;
  next?: string;
  members: number;
  last?: string;
  requests?: number;
  line?: string;
  order: number;
  chair?: string;
  since?: string;
  candidates?: { id: string; name: string; sub: string; current?: boolean }[];
};
export type ReviewCircle = Community & {
  initial: string;
  sub: string;
  status: string;
  activeMonth?: number;
  eventsTerm?: number;
  charter?: string;
  board?: number;
  advisor?: string;
  checklist?: string;
};
export type HeldItem = {
  id: string;
  severity: string;
  where: string;
  text: string;
  topic: string;
  status: string;
  order: number;
};
export type Space = {
  id: string;
  name: string;
  state: string;
  stateLabel: string;
  cap: string;
  line: string;
  progress?: number;
  eq?: string[];
  order: number;
  selected?: boolean;
  seats?: string;
  place?: string;
  floor?: string;
  access?: string;
  accessSub?: string;
  gear?: string[];
  slots?: { t: string; label: string; tone: string }[];
};
export type Perk = { id: string; order: number; cost?: string; title: string; detail?: string; value?: string; status?: string; kind?: string; partner?: string; chip?: string; progress?: number; target?: number; reward?: string; sub?: string };
export type Cert = { id: string; order: number; initial: string; name: string; sub: string; verified: boolean; issued?: boolean };
export type RevealRow = { id: string; reason: string; when: string; note: string };

type StaffState = {
  ready: boolean;
  allowed: boolean;
  counselor: boolean;
  error: string | null;
  profile: Record<string, unknown> | null;
  overview: Record<string, unknown> | null;
  nodes: { id: string; name: string; line: string; awake: boolean; count?: string; order: number }[];
  cases: StaffCase[];
  threads: Record<string, ThreadMsg[]>;
  held: HeldItem[];
  accounts: AccountCard[];
  petitions: Petition[];
  meetups: MeetupRow[];
  spots: { id: string; name: string; sub: string }[];
  venues: VenueReq[];
  communities: Community[];
  reviews: ReviewCircle[];
  schedule: Record<string, unknown> | null;
  spaces: Space[];
  live: Record<string, unknown> | null;
  insights: Record<string, unknown> | null;
  perks: Perk[];
  certs: Cert[];
  reveals: RevealRow[];
  revealName: string | null;
  notice: string | null;
  supportRequests: { id: string; reason: string; note: string; nickname: string; status: string; chatId: string }[];
  reports: { id: string; circleId: string; messageId: string; reporterUid: string }[];
  eventCount: number;
};

export const useStaff = create<StaffState>(() => ({
  ready: false,
  allowed: false,
  counselor: false,
  error: null,
  profile: null,
  overview: null,
  nodes: [],
  cases: [],
  threads: {},
  held: [],
  accounts: [],
  petitions: [],
  meetups: [],
  spots: [],
  venues: [],
  communities: [],
  reviews: [],
  schedule: null,
  spaces: [],
  live: null,
  insights: null,
  perks: [],
  certs: [],
  reveals: [],
  revealName: null,
  notice: null,
  supportRequests: [],
  reports: [],
  eventCount: 0,
}));

function markReady() {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.dataset.nabt = "ready";
  }
}

function num(v: unknown, fallback = 0) {
  return typeof v === "number" ? v : fallback;
}

const subscribe = onSnapshot;
let staffStops: (() => void)[] = [];
const watch = ((ref: never, next: never, error?: (err: { code?: string }) => void) => {
  const unsub = subscribe(
    ref,
    next,
    error ||
      ((err: { code?: string }) => {
        if (err.code !== "permission-denied") console.error(err);
      }),
  );
  staffStops.push(unsub);
  return unsub;
}) as typeof onSnapshot;

let staffHooked = false;
let staffListening = false;
let staffGen = 0;
let studentBooted = false;
const watchedThreads = new Set<string>();

function releaseStaff() {
  staffGen += 1;
  const mine = staffStops;
  staffStops = [];
  staffListening = false;
  watchedThreads.clear();
  for (const unsub of mine) unsub();
}

/**
 * Opens the Student Affairs listeners for whoever is signed in. Nobody is signed in
 * automatically: a staff member signs in with their UA ID and code like everyone else,
 * and the `sa` claim (set by `node scripts/make-role.mjs <email> staff`) opens this area.
 */
export async function startStaffSession() {
  const { auth, db } = getFirebase();
  if (!staffHooked) {
    staffHooked = true;
    onAuthStateChanged(auth, (user) => {
      if (staffListening) releaseStaff();
      if (!user) {
        useStaff.setState({ ready: true, allowed: false, error: "Sign in to open Student Affairs." });
        markReady();
        return;
      }
      void openStaff(db, user);
    });
  }
}

async function openStaff(db: ReturnType<typeof getFirebase>["db"], user: User) {
  if (staffListening) return;
  staffListening = true;
  const gen = staffGen;
  try {
    const token = await user.getIdTokenResult(true);
    if (gen !== staffGen || getFirebase().auth.currentUser?.uid !== user.uid) {
      if (gen === staffGen) staffListening = false;
      return;
    }
    const sa = token.claims.sa === true;
    const counselor = token.claims.counselor === true;
    if (!sa) {
      useStaff.setState({ ready: true, allowed: false, error: "This account is not Student Affairs." });
      markReady();
      return;
    }
    useStaff.setState({ allowed: true, counselor, ready: true, error: null, overview: { ...EMPTY_OVERVIEW } });
    markReady();
    const uid = user.uid;

    watch(doc(db, "staffOverview", "week"), (snap) => {
      useStaff.setState({ overview: snap.exists() ? snap.data() || { ...EMPTY_OVERVIEW } : { ...EMPTY_OVERVIEW }, ready: true, error: null });
    });
    watch(doc(db, "staffProfile", uid), (snap) => {
      const data = snap.data() || null;
      useStaff.setState({ profile: data });
    });
    watch(collection(db, "staffProfile", uid, "reveals"), (snap) => {
      useStaff.setState({
        reveals: snap.docs.map((d) => ({
          id: d.id,
          reason: String(d.data().reason || ""),
          when: String(d.data().when || ""),
          note: String(d.data().note || ""),
        })),
      });
    });
    watch(collection(db, "cases"), (snap) => {
      const cases = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as object) }) as StaffCase)
        .sort((a, b) => num(a.rank) - num(b.rank));
      useStaff.setState({ cases });
      for (const c of cases) watchThread(db, c.id);
    });
    watch(collection(db, "heldItems"), (snap) => {
      useStaff.setState({
        held: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as HeldItem)
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(collection(db, "accountQueue"), (snap) => {
      useStaff.setState({
        accounts: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as AccountCard)
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(collection(db, "petitions"), (snap) => {
      useStaff.setState({
        petitions: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as Petition)
          .filter((p) => p.title)
          .sort((a, b) => num(a.order) - num(b.order)),
      });
    });
    watch(collection(db, "staffMeetups"), (snap) => {
      useStaff.setState({
        meetups: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as MeetupRow)
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(collection(db, "staffSpots"), (snap) => {
      useStaff.setState({
        spots: snap.docs
          .map((d) => ({ id: d.id, name: String(d.data().name || ""), sub: String(d.data().sub || ""), order: num(d.data().order) }))
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(collection(db, "supportRequests"), (snap) => {
      useStaff.setState({
        supportRequests: snap.docs.map((d) => ({
          id: d.id,
          reason: String(d.data().reason || ""),
          note: String(d.data().note || ""),
          nickname: String(d.data().nickname || "A student"),
          status: String(d.data().status || "open"),
          chatId: String(d.data().chatId || ""),
        })),
      });
    });
    watch(collection(db, "reports"), (snap) => {
      useStaff.setState({
        reports: snap.docs.map((d) => ({
          id: d.id,
          circleId: String(d.data().circleId || ""),
          messageId: String(d.data().messageId || ""),
          reporterUid: String(d.data().reporterUid || ""),
        })),
      });
    });
    watch(collection(db, "venueRequests"), (snap) => {
      useStaff.setState({
        venues: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as VenueReq)
          .sort((a, b) => a.order - b.order),
      });
    });
    let fromSeed: Community[] = [];
    let fromLive: Community[] = [];
    const publishCommunities = () => {
      const map = new Map<string, Community>();
      for (const row of fromLive) map.set(row.id, row);
      for (const row of fromSeed) {
        const live = map.get(row.id);
        map.set(
          row.id,
          live
            ? {
                ...live,
                ...row,
                members: live.members || row.members,
                name: row.name || live.name,
                candidates: row.candidates?.length ? row.candidates : live.candidates,
              }
            : row,
        );
      }
      useStaff.setState({ communities: [...map.values()].sort((a, b) => a.order - b.order) });
    };
    watch(collection(db, "staffCommunities"), (snap) => {
      fromSeed = snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Community);
      publishCommunities();
    });
    watch(collection(db, "circles"), (snap) => {
      fromLive = snap.docs
        // Communities waiting on verification are in Reviews → Verify, not here.
        .filter((d) => d.data().kind === "community" && d.data().verified === true)
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: String(data.name || "Community"),
            members: num(data.memberCount),
            order: num(data.order, Date.now()),
            chair: String(data.chairUid || ""),
            line: data.verified ? "Verified community" : "Community",
            requests: 0,
            candidates: [],
          } satisfies Community;
        });
      publishCommunities();
    });
    watch(collection(db, "events"), (snap) => {
      useStaff.setState({ eventCount: snap.size });
    });
    watch(collection(db, "communityReviews"), (snap) => {
      useStaff.setState({
        reviews: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as ReviewCircle)
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(doc(db, "staffSchedule", "thu"), (snap) => {
      useStaff.setState({ schedule: snap.data() || null });
    });
    watch(collection(db, "venues"), (snap) => {
      useStaff.setState({
        spaces: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as Space)
          .filter((s) => s.name)
          .sort((a, b) => num(a.order) - num(b.order)),
      });
    });
    watch(doc(db, "staffLive", "breathe"), (snap) => useStaff.setState({ live: snap.data() || null }));
    watch(doc(db, "staffInsights", "breathe"), (snap) => useStaff.setState({ insights: snap.data() || null }));
    watch(collection(db, "staffPerks"), (snap) => {
      useStaff.setState({
        perks: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as Perk)
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(collection(db, "staffCertificates"), (snap) => {
      useStaff.setState({
        certs: snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as object) }) as Cert)
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(collection(db, "nodes"), (snap) => {
      useStaff.setState({
        nodes: snap.docs
          .filter((d) => Boolean(d.data().showOnStaff))
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name || "Faculty of Engineering"),
              line: String(data.staffLine || data.hours || ""),
              awake: Boolean(data.awake),
              count: data.checkInCount ? `${data.checkInCount} check-ins` : String(data.staffAction || ""),
              order: num(data.staffOrder, 9),
            };
          })
          .sort((a, b) => a.order - b.order),
      });
    });
    watch(query(collection(db, "revealResults"), where("counselorUid", "==", uid)), (snap) => {
      const mine = snap.docs.map((d) => d.data()).find((d) => d.fullName);
      if (mine) useStaff.setState({ revealName: `${mine.fullName} · ${mine.studentId}` });
    });

  } catch (err) {
    releaseStaff();
    useStaff.setState({
      ready: true,
      allowed: false,
      error: err instanceof Error ? err.message : "Could not open the staff app.",
    });
    markReady();
  }
}

function watchThread(db: ReturnType<typeof getFirebase>["db"], id: string) {
  if (watchedThreads.has(id)) return;
  watchedThreads.add(id);
  watch(collection(db, "cases", id, "thread"), (snap) => {
    const msgs = snap.docs.map((d) => ({
      id: d.id,
      from: String(d.data().from || ""),
      text: String(d.data().text || ""),
      initial: d.data().initial ? String(d.data().initial) : undefined,
    }));
    useStaff.setState((s) => ({ threads: { ...s.threads, [id]: msgs } }));
  });
}

async function postFn(path: string, body: Record<string, unknown>) {
  return sharedPostFn<Record<string, unknown>>(path, body);
}

export async function loadCircleRoster(circleId: string) {
  const data = await postFn("/staff/roster", { circleId });
  const members = Array.isArray(data.members) ? data.members : [];
  return members.map((row) => {
    const item = row as { id?: string; name?: string; sub?: string; current?: boolean };
    return { id: String(item.id || ""), name: String(item.name || "Member"), sub: String(item.sub || "Member"), current: Boolean(item.current) };
  });
}

export async function findCampusMember(email: string) {
  const data = await postFn("/staff/find", { email });
  return { id: String(data.uid || ""), name: String(data.name || "Member"), sub: "Found by UA email" };
}

export async function sendOutreach(caseId: string, text: string) {
  const { db } = getFirebase();
  await addDoc(collection(db, "cases", caseId, "thread"), {
    from: "counselor",
    authorNickname: "Student Affairs (counselor)",
    text,
    at: serverTimestamp(),
  });
}

export async function setHeld(id: string, status: "released" | "removed") {
  const { db } = getFirebase();
  await updateDoc(doc(db, "heldItems", id), { status, updatedAt: serverTimestamp() });
}

export async function decideAccount(uid: string, decision: "approve" | "reject" | "new_photo") {
  const { auth, db } = getFirebase();
  const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "new_photo";
  const chip = decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "New photo requested";
  await updateDoc(doc(db, "accountQueue", uid), { status, chip, reviewedBy: staffUid(), updatedAt: serverTimestamp() });
  await addDoc(collection(db, "accountDecisions"), {
    uid,
    reviewerUid: staffUid(),
    decision,
    at: serverTimestamp(),
  });
  await postFn("/staff/account", { uid, decision, reviewerUid: staffUid() });
}

export async function respondPetition(id: string, status: string, response: string) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "petitions", id), { status, response, respondedAt: serverTimestamp() });
}

export async function publishPetition(id: string) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "petitions", id), { status: "published", respondedAt: serverTimestamp() });
}

export async function declinePetition(id: string) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "petitions", id), { status: "declined", respondedAt: serverTimestamp() });
}

export async function approveMeetup(id: string, spot: string) {
  const { auth, db } = getFirebase();
  await updateDoc(doc(db, "staffMeetups", id), {
    status: "approved",
    spot,
    approvedBy: staffUid(),
  });
  await answerMeetupRequest(id, { status: "approved", spot });
}

export async function declineMeetup(id: string) {
  const { auth, db } = getFirebase();
  await updateDoc(doc(db, "staffMeetups", id), {
    status: "declined",
    approvedBy: staffUid(),
  });
  await answerMeetupRequest(id, { status: "declined" });
}

/** The student who proposed sees the answer on their Circle's Space. */
async function answerMeetupRequest(id: string, answer: Record<string, unknown>) {
  const { db } = getFirebase();
  const row = useStaff.getState().meetups.find((m) => m.id === id) as (MeetupRow & { circleId?: string; uid?: string }) | undefined;
  if (!row?.circleId || !row.uid) return;
  await setDoc(doc(db, "circles", row.circleId, "meetupRequests", row.uid), answer, { merge: true }).catch(() => undefined);
}

export async function openSupportChat(id: string) {
  await postFn("/support-open", { id });
  tell("Anonymous chat opened.");
}

export async function replySupport(chatId: string, text: string) {
  const { db } = getFirebase();
  try {
    await addDoc(collection(db, "chats", chatId, "messages"), {
      authorUid: staffUid(),
      authorNickname: "Student Affairs",
      text: text.slice(0, 500),
      kind: "text",
      createdAt: serverTimestamp(),
    });
    tell("Reply sent.");
  } catch (err) {
    tell(err instanceof Error ? err.message : "Reply did not send.");
    throw err;
  }
}

export async function replyVenue(id: string, text: string) {
  const { db } = getFirebase();
  await addDoc(collection(db, "venueRequests", id, "thread"), {
    text: text.slice(0, 300),
    from: "sa",
    at: serverTimestamp(),
  });
  tell("Reply sent to the Chair.");
}

export async function setVenueStatus(id: string, status: string) {
  await postFn("/venue-decide", { id, status });
  tell(status === "approved" ? "Venue approved. The Chair is notified." : `Venue ${status}. The Chair is notified.`);
}

export async function verifyCommunity(id: string, status: "verified" | "changes" | "declined") {
  await postFn("/verify-decide", { id, status });
  tell(status === "verified" ? "Circle verified." : `Circle marked ${status}.`);
}

export async function changeChair(circleId: string, toChair: string, toName: string, reason: string, fromChair: string) {
  const { auth, db } = getFirebase();
  await addDoc(collection(db, "chairChanges"), {
    circleId,
    byUid: staffUid(),
    fromChair,
    toChair,
    toName,
    reason,
    at: serverTimestamp(),
  });
  await postFn("/staff/chair", {
    circleId,
    toChair,
    toName,
    reason,
    fromChair,
    byUid: staffUid(),
  });
  tell(`${toName} is now Chair. Logged for the Admin.`);
}

export async function fileReveal(caseId: string, reason: string, note: string) {
  const { auth, db } = getFirebase();
  const counselorUid = staffUid();
  await addDoc(collection(db, "revealRequests"), {
    caseId,
    counselorUid,
    reason,
    note,
    confirm: true,
    at: serverTimestamp(),
  });
  await postFn("/staff/reveal", { caseId, counselorUid, reason, note, confirm: true });
  tell("Revealed. Written to the Admin log and the student’s privacy log.");
}

export async function advanceCase(caseId: string, ladderStep: number) {
  await postFn("/staff/case", {
    caseId,
    ladderStep,
    stepLabel: `Step ${ladderStep} of 4`,
    open: ladderStep < 5,
    status: ladderStep >= 5 ? "resolved" : "open",
  });
}

export async function toggleOnCall(on: boolean) {
  const { db } = getFirebase();
  await updateDoc(doc(db, "staffProfile", staffUid()), { onCall: on });
}

export async function toggleCert(id: string, verified: boolean) {
  const { auth, db } = getFirebase();
  await updateDoc(doc(db, "staffCertificates", id), {
    verified,
    verifiedBy: staffUid(),
  });
}

/** Issue every verified role that has no certificate yet. */
export async function issueCerts(ids: string[]) {
  const { db } = getFirebase();
  await Promise.all(ids.map((id) => updateDoc(doc(db, "staffCertificates", id), { issued: true, issuedBy: staffUid() })));
}

/** Book a slot in a campus space. The space keeps the booking, so the button stays booked. */
export async function bookSpace(id: string, slot: string) {
  const { db } = getFirebase();
  await setDoc(doc(db, "staffBookings", `${id}-${slot}`), { space: id, slot, by: staffUid(), at: Date.now() });
}

export async function publishEvent(title: string, when: string, place: string, description = "") {
  const { db } = getFirebase();
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "event";
  const line = description.trim().slice(0, 90);
  await setDoc(doc(db, "events", id), {
    title,
    status: "published",
    hostType: "sa",
    when,
    place,
    ...(line ? { description: line } : {}),
  });
  tell("Published to Discover.");
}

export async function addPerk(title: string) {
  const { db } = getFirebase();
  await addDoc(collection(db, "staffPerks"), {
    title,
    cost: "3",
    detail: "Student Affairs",
    status: "on",
    order: 9,
  });
}

export async function logoutStaff() {
  const { auth } = getFirebase();
  useStaff.setState({ ready: false, allowed: false, profile: null, notice: null });
  await signOut(auth);
}

export function clearNotice() {
  useStaff.setState({ notice: null });
}

/** Used by the root layout. One real session serves every area; roles come from claims. */
export function bootNabt(path: string) {
  if (path.startsWith("/staff")) void startStaffSession();
  if (!studentBooted) {
    studentBooted = true;
    startCampus();
  }
}
