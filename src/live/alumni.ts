/**
 * AREA: alumni
 * Confirmed graduates keep their record. Mentor profiles are opt-in.
 * mentorRequests are read only by the student and the alumnus.
 * An accepted request opens a named 1:1 chat through the function server.
 */
import { useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebase } from "../firebase";
import { postFn as sharedPostFn } from "../fn";
import { classify } from "../ml/moderation";
import { reviewOutgoing } from "../moderation/outgoing";
import { toast } from "../toast";

export type MentorOffer = "chat" | "cv" | "advice";

export type Mentor = {
  id: string;
  fullName: string;
  field: string;
  line: string;
  offers: MentorOffer[];
  initial: string;
  classYear: number;
  order: number;
};

export type MentorRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  chatId?: string;
};

export const OFFER_LABEL: Record<MentorOffer, string> = {
  chat: "15-min chat",
  cv: "CV review",
  advice: "Career advice",
};

function asMentor(id: string, data: Record<string, unknown>, order = 0): Mentor {
  const offers = Array.isArray(data.offers) ? data.offers.map(String).filter((o): o is MentorOffer => o === "chat" || o === "cv" || o === "advice") : [];
  return {
    id,
    fullName: String(data.fullName || "Alumni"),
    field: String(data.field || ""),
    line: String(data.line || ""),
    offers,
    initial: String(data.initial || data.fullName || "A").slice(0, 1),
    classYear: Number(data.classYear || 0),
    order: Number(data.order || order),
  };
}

function asRequest(id: string, data: Record<string, unknown>): MentorRequest {
  const status = data.status === "accepted" || data.status === "declined" ? data.status : "pending";
  return {
    id,
    fromUid: String(data.fromUid || ""),
    toUid: String(data.toUid || ""),
    fromName: String(data.fromName || ""),
    toName: String(data.toName || ""),
    message: String(data.message || ""),
    status,
    chatId: data.chatId ? String(data.chatId) : undefined,
  };
}

function watchSigned(listen: (uid: string) => () => void) {
  const { auth } = getFirebase();
  let stop = () => {};
  const bind = (uid?: string) => {
    stop();
    stop = () => {};
    if (uid) stop = listen(uid);
  };
  if (auth.currentUser) bind(auth.currentUser.uid);
  const unsub = onAuthStateChanged(auth, (user) => bind(user?.uid));
  return () => {
    unsub();
    stop();
  };
}

export function useMentors() {
  const [rows, setRows] = useState<Mentor[]>([]);
  useEffect(
    () =>
      watchSigned(() => {
        const { db } = getFirebase();
        return onSnapshot(collection(db, "alumniMentors"), (snap) => {
          setRows(snap.docs.map((d, i) => asMentor(d.id, d.data() as Record<string, unknown>, i)).sort((a, b) => a.order - b.order));
        });
      }),
    [],
  );
  return rows;
}

export function useMentor(uid: string) {
  const [row, setRow] = useState<Mentor | null>(null);
  useEffect(() => {
    if (!uid) return;
    return watchSigned(() => {
      const { db } = getFirebase();
      return onSnapshot(doc(db, "alumniMentors", uid), (snap) => {
        setRow(snap.exists() ? asMentor(snap.id, snap.data() as Record<string, unknown>) : null);
      });
    });
  }, [uid]);
  return row;
}

export function useMentorRequests() {
  const [incoming, setIncoming] = useState<MentorRequest[]>([]);
  const [outgoing, setOutgoing] = useState<MentorRequest[]>([]);
  useEffect(
    () =>
      watchSigned((uid) => {
        const { db } = getFirebase();
        const stopIn = onSnapshot(query(collection(db, "mentorRequests"), where("toUid", "==", uid)), (snap) => {
          setIncoming(snap.docs.map((d) => asRequest(d.id, d.data() as Record<string, unknown>)));
        });
        const stopOut = onSnapshot(query(collection(db, "mentorRequests"), where("fromUid", "==", uid)), (snap) => {
          setOutgoing(snap.docs.map((d) => asRequest(d.id, d.data() as Record<string, unknown>)));
        });
        return () => {
          stopIn();
          stopOut();
        };
      }),
    [],
  );
  return { incoming, outgoing };
}

export async function saveMentorProfile(input: { fullName: string; field: string; line: string; offers: MentorOffer[]; initial: string; classYear: number }) {
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  const line = input.line.trim();
  if (!input.field.trim() || !line) throw new Error("Add a field and a short line.");
  if (reviewOutgoing(line, "alumni", uid).action !== "send") throw new Error("Rewrite that line before saving.");
  await setDoc(doc(db, "alumniMentors", uid), {
    uid,
    fullName: input.fullName.slice(0, 80),
    field: input.field.slice(0, 40),
    line: line.slice(0, 140),
    offers: input.offers.slice(0, 3),
    initial: input.initial.slice(0, 1) || "A",
    classYear: input.classYear,
  });
  toast("Mentor profile saved.");
}

export async function requestMentor(mentor: Mentor, fromName: string, message: string) {
  const text = message.trim().slice(0, 200);
  if (!text) throw new Error("Write a short note.");
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  if (classify(text).severity !== "ok" || reviewOutgoing(text, "alumni", uid).action !== "send") return { held: true as const, id: "" };
  const ref = await addDoc(collection(db, "mentorRequests"), {
    fromUid: uid,
    toUid: mentor.id,
    fromName: fromName.slice(0, 80),
    toName: mentor.fullName,
    message: text,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return { held: false as const, id: ref.id };
}

async function postFn(path: string, body: Record<string, unknown>) {
  return sharedPostFn<{ chatId?: string }>(path, body);
}

export async function answerMentorRequest(id: string, status: "accepted" | "declined") {
  const { db } = getFirebase();
  await updateDoc(doc(db, "mentorRequests", id), { status });
  if (status === "accepted") {
    const result = await postFn("/mentor-respond", { requestId: id });
    return result.chatId || "";
  }
  return "";
}
