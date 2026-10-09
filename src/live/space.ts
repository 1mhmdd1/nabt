import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebase } from "../firebase";
import { me, useCampus } from "../live";
import { assertSendable } from "../moderation/outgoing";
import { useVoiceSafety } from "./voiceSafety";

export type SpaceLine = { id: string; displayName: string; initial: string; text: string; order: number; mine: boolean };
export type SpaceReply = { id: string; authorUid: string; nickname: string; initial: string; when: string; text: string; order: number; thankedBy: string[] };
export type SpaceThread = { authorUid: string; nickname: string; initial: string; text: string; mode: string; when: string };
export type SpaceMeetup = { title: string; kinds: string[]; selected: string; note: string; approvedLine: string };
export type MeetupRequest = { kind: string; whenLabel: string; status: string };

export type Space = {
  lines: SpaceLine[];
  thread: SpaceThread | null;
  replies: SpaceReply[];
  meetup: SpaceMeetup | null;
  request: MeetupRequest | null;
  ready: boolean;
};

const EMPTY: Space = { lines: [], thread: null, replies: [], meetup: null, request: null, ready: false };

/** Everything on a Circle's Space, read straight from the stored Circle so a member and a visitor see the same cards. */
export function useSpace(circleId: string): Space {
  const [space, setSpace] = useState<Space>(EMPTY);
  const uid = useCampus((s) => (s.ready ? me() : ""));
  useEffect(() => {
    if (!circleId) return;
    setSpace(EMPTY);
    const { db } = getFirebase();
    const today = new Date().toDateString();
    const patch = (next: Partial<Space>) => setSpace((cur) => ({ ...cur, ...next, ready: true }));
    const quiet = () => undefined;
    const stops = [
      onSnapshot(
        collection(db, "circles", circleId, "prompts", "today", "answers"),
        (snap) => {
          const lines = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                displayName: String(data.displayName || "A member"),
                initial: String(data.initial || String(data.displayName || "·").slice(0, 1)),
                text: String(data.text || ""),
                order: Number(data.order || 0),
                day: String(data.day || today),
                mine: d.id === uid,
              };
            })
            // Today's prompt clears tomorrow.
            .filter((row) => row.day === today && row.text)
            .sort((a, b) => a.order - b.order);
          patch({ lines });
        },
        quiet,
      ),
      onSnapshot(
        doc(db, "circles", circleId, "threads", "hope"),
        (snap) => {
          const data = snap.data();
          patch({
            thread: data
              ? {
                  authorUid: String(data.authorUid || ""),
                  nickname: String(data.nickname || ""),
                  initial: String(data.initial || ""),
                  text: String(data.text || ""),
                  mode: String(data.mode || ""),
                  when: String(data.when || ""),
                }
              : null,
          });
        },
        quiet,
      ),
      onSnapshot(
        collection(db, "circles", circleId, "threads", "hope", "replies"),
        (snap) => {
          const replies = snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                authorUid: String(data.authorUid || ""),
                nickname: String(data.nickname || ""),
                initial: String(data.initial || ""),
                when: String(data.when || ""),
                text: String(data.text || ""),
                order: Number(data.order || 0),
                thankedBy: Array.isArray(data.thankedBy) ? data.thankedBy.map(String) : [],
              };
            })
            .sort((a, b) => a.order - b.order);
          patch({ replies });
        },
        quiet,
      ),
      onSnapshot(
        doc(db, "circles", circleId, "meetups", "quiet-sit"),
        (snap) => {
          const data = snap.data();
          patch({
            meetup: data
              ? {
                  title: String(data.title || "Propose a meetup"),
                  kinds: Array.isArray(data.kinds) ? data.kinds.map(String) : ["Talk", "Quiet sit", "Short meditation"],
                  selected: String(data.selected || "Quiet sit"),
                  note: String(data.note || ""),
                  approvedLine: String(data.approvedLine || ""),
                }
              : null,
          });
        },
        quiet,
      ),
    ];
    if (uid) {
      stops.push(
        onSnapshot(
          doc(db, "circles", circleId, "meetupRequests", uid),
          (snap) => {
            const data = snap.data();
            patch({ request: data ? { kind: String(data.kind || ""), whenLabel: String(data.whenLabel || ""), status: String(data.status || "proposed") } : null });
          },
          quiet,
        ),
      );
    }
    return () => stops.forEach((stop) => stop());
  }, [circleId, uid]);
  return space;
}

/** The next few real meetup times: weekdays, 1:00 or 4:00 PM, starting tomorrow. */
export function meetupSlots(count = 4) {
  const slots: { at: number; label: string }[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (slots.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      for (const hour of [13, 16]) {
        if (slots.length >= count) break;
        const at = new Date(d);
        at.setHours(hour, 0, 0, 0);
        slots.push({
          at: at.getTime(),
          label: `${at.toLocaleDateString("en-US", { weekday: "short" })} ${at.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${at.toLocaleTimeString("en-US", { hour: "numeric" })}`,
        });
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return slots;
}

/** One line under today's prompt. The same on-phone safety check as chat runs first. */
export async function postSpaceLine(circleId: string, text: string) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const body = text.trim();
  if (!body) throw new Error("Write a line first.");
  assertSendable(body, "circle", useVoiceSafety.getState().anonId || "");
  const self = useCampus.getState();
  const name = self.greetingName || self.nickname || "A member";
  await setDoc(doc(db, "circles", circleId, "prompts", "today", "answers", uid), {
    authorUid: uid,
    text: body.slice(0, 80),
    displayName: name,
    initial: self.initial || name.slice(0, 1).toUpperCase(),
    order: Date.now(),
    day: new Date().toDateString(),
    createdAt: serverTimestamp(),
  });
}

/** Ask Student Affairs to approve a meetup. It lands in Staff → Reviews → Meetups, and stays on this Space as sent. */
export async function requestMeetup(circleId: string, kind: string, slot: { at: number; label: string }) {
  const { db } = getFirebase();
  const uid = me();
  if (!uid) throw new Error("Sign in first.");
  const state = useCampus.getState();
  const circle = state.circles[circleId];
  const by = state.greetingName || state.nickname || "A member";
  await setDoc(doc(db, "staffMeetups", `${circleId}-${uid}`), {
    circleId,
    uid,
    circle: circle?.name || circleId,
    by,
    title: `${kind} · ${circle?.name || "Circle"}`,
    detail: `${kind} · ${slot.label}`,
    kind,
    whenAt: slot.at,
    whenLabel: slot.label,
    status: "proposed",
    order: Date.now(),
  });
  await setDoc(doc(db, "circles", circleId, "meetupRequests", uid), { kind, whenLabel: slot.label, whenAt: slot.at, status: "proposed", at: Date.now() });
}
