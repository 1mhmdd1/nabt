import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { getFirebase } from "../firebase";
import { me } from "../live";
import type { SafetySignal } from "../moderation";
import type { CareAssessment } from "../voice/care";

export type VoiceBundle = {
  screens: Record<string, Record<string, unknown>>;
};

type EventDoc = {
  id: string;
  title: string;
  chip?: string;
  hostLine?: string;
  when?: string;
  whenSub?: string;
  place?: string;
  placeSub?: string;
  access?: { title: string; body: string }[];
};

type CareNote = {
  eyebrow: string;
  text: string;
  quote: string;
  timeLabel: string;
  nickname: string;
};

type State = {
  ready: boolean;
  error: string | null;
  bundle: VoiceBundle | null;
  events: Record<string, EventDoc>;
  voiceOn: boolean;
  anonId: string;
  careNote: CareNote | null;
  sent: string | null;
};

export const useVoiceSafety = create<State>(() => ({
  ready: false,
  error: null,
  bundle: null,
  events: {},
  voiceOn: false,
  anonId: "",
  careNote: null,
  sent: null,
}));

function millis(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toMillis" in v && typeof (v as Timestamp).toMillis === "function") {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

const ANON_KEY = "nabt.anonId";

async function loadAnonId(): Promise<string> {
  const month = 30 * 24 * 60 * 60 * 1000;
  try {
    const raw = await AsyncStorage.getItem(ANON_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { id: string; at: number };
      if (saved.id && Date.now() - saved.at < month) return saved.id;
    }
  } catch {
    /* a fresh id is fine */
  }
  const id = `a-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  await AsyncStorage.setItem(ANON_KEY, JSON.stringify({ id, at: Date.now() }));
  return id;
}

const subscribe = onSnapshot;
let voiceStops: (() => void)[] = [];
let voiceUid: string | null = null;
const watch = ((ref: never, next: never, error?: (err: { code?: string }) => void) => {
  const unsub = subscribe(
    ref,
    next,
    error ||
      ((err: { code?: string }) => {
        if (err.code !== "permission-denied") console.error(err);
      }),
  );
  voiceStops.push(unsub);
  return unsub;
}) as typeof onSnapshot;

function releaseVoice() {
  const mine = voiceStops;
  voiceStops = [];
  voiceUid = null;
  for (const unsub of mine) unsub();
}

let started = false;

export function startVoiceSafety() {
  if (started) return;
  started = true;
  const { auth, db } = getFirebase();
  void loadAnonId().then((anonId) => useVoiceSafety.setState({ anonId }));
  onAuthStateChanged(auth, (user) => {
    const uid = user?.uid || "";
    if (uid === (voiceUid || "")) return;
    releaseVoice();
    if (!uid) return;
    voiceUid = uid;
    attachPublic(db);
    if (uid === me()) attachPrivate(db);
  });
}

function attachPublic(db: ReturnType<typeof getFirebase>["db"]) {
  watch(
    doc(db, "voiceSafety", "bundle"),
    (snap) => {
      const data = snap.data() as VoiceBundle | undefined;
      useVoiceSafety.setState({ bundle: data ?? null, ready: true, error: data ? null : "Voice and safety copy is not seeded yet." });
      if (Platform.OS === "web" && typeof document !== "undefined") {
        document.documentElement.dataset.voice = data ? "ready" : "missing";
      }
    },
    () => {
      useVoiceSafety.setState({ ready: true, error: "Could not open voice and safety copy." });
    },
  );

  watch(collection(db, "events"), (snap) => {
    const events: Record<string, EventDoc> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      events[d.id] = {
        id: d.id,
        title: String(data.title || ""),
        chip: data.chip ? String(data.chip) : undefined,
        hostLine: data.hostLine ? String(data.hostLine) : undefined,
        when: data.when ? String(data.when) : undefined,
        whenSub: data.whenSub ? String(data.whenSub) : undefined,
        place: data.place ? String(data.place) : undefined,
        placeSub: data.placeSub ? String(data.placeSub) : undefined,
        access: Array.isArray(data.access) ? (data.access as { title: string; body: string }[]) : undefined,
      };
    });
    useVoiceSafety.setState({ events });
  });

}

function attachPrivate(db: ReturnType<typeof getFirebase>["db"]) {
  watch(doc(db, "users", me(), "settings", "main"), (snap) => {
    useVoiceSafety.setState({ voiceOn: snap.data()?.voiceCheckins === true });
  });

  watch(doc(db, "careInbox", me(), "messages", "note"), (snap) => {
    const data = snap.data();
    if (!data) {
      useVoiceSafety.setState({ careNote: null });
      return;
    }
    useVoiceSafety.setState({
      careNote: {
        eyebrow: String(data.eyebrow || ""),
        text: String(data.text || ""),
        quote: String(data.quote || ""),
        timeLabel: String(data.timeLabel || ""),
        nickname: String(data.nickname || ""),
      },
    });
    void millis(data.at);
  });
}

export function screenCopy<T extends Record<string, unknown>>(id: string): T | null {
  const block = useVoiceSafety.getState().bundle?.screens?.[id];
  return (block as T) || null;
}

export async function setVoiceCheckins(on: boolean) {
  const { db } = getFirebase();
  await setDoc(doc(db, "users", me(), "settings", "main"), { voiceCheckins: on }, { merge: true });
}

export async function writeSafetySignal(signal: SafetySignal) {
  const { db, auth } = getFirebase();
  if (signal.anonId === auth.currentUser?.uid) return;
  await addDoc(collection(db, "safetySignals"), { ...signal, at: serverTimestamp() });
}

export async function writeCareSignal(assessment: CareAssessment) {
  if (!assessment.send || assessment.word !== "needs_care") return;
  const { db } = getFirebase();
  await addDoc(collection(db, "careSignals"), {
    uid: me(),
    level: "needs_care",
    counts: assessment.counts,
    stepsDone: assessment.stepsDone,
    at: serverTimestamp(),
  });
}

export async function createAccommodation(eventId: string, nickname: string, needs: string[], note: string) {
  const { db } = getFirebase();
  await addDoc(collection(db, "accommodations"), {
    uid: me(),
    nickname,
    eventId,
    needs,
    note: note.slice(0, 140),
    status: "requested",
    createdAt: serverTimestamp(),
  });
  useVoiceSafety.setState({ sent: "Request sent. Only Student Affairs can see it." });
}

export async function shareMessage(text: string, context: string) {
  const { db } = getFirebase();
  await addDoc(collection(db, "sharedItems"), {
    uid: me(),
    text,
    context,
    consent: true,
    at: serverTimestamp(),
  });
  useVoiceSafety.setState({ sent: "Shared. A counselor can reach your nickname." });
}

/** Consent only. The name stays in users_private until a Function copies it. */
export async function shareIdentityConsent() {
  const { db } = getFirebase();
  await addDoc(collection(db, "identityShares"), {
    uid: me(),
    consent: true,
    at: serverTimestamp(),
  });
  useVoiceSafety.setState({ sent: "Only the counselor will see your name." });
}

export async function replyToCounselor(text: string) {
  const { db } = getFirebase();
  await addDoc(collection(db, "careInbox", me(), "messages"), {
    from: "student",
    text: text.slice(0, 500),
    at: serverTimestamp(),
  });
}
