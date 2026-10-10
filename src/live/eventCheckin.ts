import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { getFirebase } from "../firebase";
import { me, useCampus } from "../live";
import { useCommunity } from "./communities";
import { markEventPresent } from "./nodeRewards";
import { appOrigin } from "../components/LinkQr";
import { classify } from "../ml/moderation";
import { postFn } from "../fn";

export type AttendanceRow = { uid: string; nickname: string; at: number };

type State = {
  rows: Record<string, AttendanceRow[]>;
};

export const useAttendance = create<State>(() => ({ rows: {} }));

function millis(v: unknown): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && "toMillis" in v && typeof (v as { toMillis: () => number }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/** Chair and board only. A plain member's listener is denied and stays empty. */
export function useEventRoster(eventId: string) {
  useEffect(() => {
    if (!eventId) return;
    const { auth, db } = getFirebase();
    let unsub = () => {};
    const listen = () => {
      unsub();
      unsub = onSnapshot(
        collection(db, "events", eventId, "attendance"),
        (snap) => {
          const rows = snap.docs
            .map((d) => {
              const data = d.data();
              return { uid: d.id, nickname: String(data.nickname || "Member"), at: millis(data.at) };
            })
            .sort((a, b) => a.at - b.at);
          useAttendance.setState((s) => ({ rows: { ...s.rows, [eventId]: rows } }));
        },
        (err) => {
          if (err.code === "permission-denied") {
            useAttendance.setState((s) => ({ rows: { ...s.rows, [eventId]: [] } }));
            return;
          }
          console.error(err);
        },
      );
    };
    if (auth.currentUser) listen();
    const stopAuth = onAuthStateChanged(auth, (user) => {
      if (user) listen();
    });
    return () => {
      stopAuth();
      unsub();
    };
  }, [eventId]);
  return useAttendance((s) => s.rows[eventId]);
}

const BOARD = ["chair", "vice_chair", "events", "logistics", "media", "treasurer", "moderator", "hr"];

export function useOrganizer(circleId: string) {
  const circle = useCampus((s) => s.circles[circleId]);
  const memberMap = useCampus((s) => s.members);
  const mine = (memberMap[circleId] || []).find((m) => m.id === me());
  const organizer = Boolean(circleId && (circle?.chairUid === me() || (mine?.roles || []).some((role) => BOARD.includes(role))));
  return { circle, organizer, verified: Boolean(circle?.verified) };
}

/**
 * The organizer of one event: the host Circle's Chair, or Student Affairs for an OSA event.
 * Only they open Event check-in, show the QR, see who is here, end the event and issue certificates.
 * The server checks the same rule.
 */
export function useEventOrganizer(event: { hostType?: string; hostId?: string } | undefined | null) {
  const circle = useCampus((s) => (event?.hostType === "circle" && event.hostId ? s.circles[event.hostId] : undefined));
  const role = useCampus((s) => s.role);
  if (!event) return false;
  if (event.hostType === "circle") return Boolean(circle?.chairUid && circle.chairUid === me());
  return role === "staff";
}

export function checkInUrl(eventId: string, code?: string) {
  return `${appOrigin()}/e/${eventId}/checkin${code ? `?code=${encodeURIComponent(code)}` : ""}`;
}

/** Organizer only. The code that goes in the event's QR. */
export async function eventCode(eventId: string) {
  const res = await postFn<{ code?: string }>("/event-code", { eventId });
  return String(res.code || "");
}

/** The code typed from under the organizer's QR, when the camera can't scan. Returns the event id. */
export async function eventByCode(code: string) {
  const res = await postFn<{ eventId?: string }>("/event-by-code", { code });
  return String(res.eventId || "");
}

export async function endEvent(eventId: string) {
  return postFn<{ issued?: number }>("/end-event", { eventId });
}

export function nodeCheckInUrl(nodeId: string) {
  return `${appOrigin()}/n/${nodeId}?checkin=1`;
}

export const SCREEN_DESC_MAX = 90;

export function screenLine(screenDescription?: string, description?: string) {
  const line = (screenDescription || description || "").trim();
  return line.slice(0, SCREEN_DESC_MAX);
}

/** Chair or board only. The same on-device check as a node note runs before the write. */
export async function saveScreenDescription(eventId: string, text: string) {
  const clipped = text.slice(0, SCREEN_DESC_MAX);
  if (classify(clipped).severity !== "ok") {
    throw new Error("This line can’t go on the screen.");
  }
  const { db } = getFirebase();
  await updateDoc(doc(db, "events", eventId), { screenDescription: clipped });
}

export type EventCopy = { title: string; place: string; screenDescription: string; window: string };

export function useEventCopy(eventId: string): EventCopy {
  const [copy, setCopy] = useState<EventCopy>({ title: "", place: "", screenDescription: "", window: "" });
  useEffect(() => {
    if (!eventId) {
      setCopy({ title: "", place: "", screenDescription: "", window: "" });
      return;
    }
    const { auth, db } = getFirebase();
    let unsub = () => {};
    const listen = () => {
      unsub();
      unsub = onSnapshot(
        doc(db, "events", eventId),
        (snap) => {
          const data = snap.data() || {};
          setCopy({
            title: String(data.title || ""),
            place: String(data.place || "Faculty of Engineering"),
            screenDescription: screenLine(
              data.screenDescription ? String(data.screenDescription) : "",
              data.description ? String(data.description) : "",
            ),
            window: String(data.window || ""),
          });
        },
        () => undefined,
      );
    };
    if (auth.currentUser) listen();
    const stopAuth = onAuthStateChanged(auth, (user) => {
      if (user) listen();
    });
    return () => {
      stopAuth();
      unsub();
    };
  }, [eventId]);
  return copy;
}

/** Mark the signed-in member present, once, and record it on their Circle talent line. */
export async function checkInToEvent(eventId: string, code: string) {
  const result = await markEventPresent(eventId, code);
  if (!result.already && result.hostType === "circle" && result.hostId) {
    const circle = useCampus.getState().circles[result.hostId];
    const verified = result.verified || circle?.verified || useCommunity.getState().events.find((e) => e.id === eventId)?.verifiedHost;
    if (verified) {
      const { auth, db } = getFirebase();
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await updateDoc(doc(db, "circles", result.hostId, "contacts", uid), {
            trainingAttendance: `Present · ${result.title}`,
          });
        } catch {
          /* Anonymous Circles have no contact card. The attendance row still stands. */
        }
      }
    }
  }
  return result;
}
