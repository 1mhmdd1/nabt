/**
 * AREA: records
 * Private co-curricular record, certificates, and anonymous feedback.
 *
 * Student Affairs impact reads only:
 *   feedbackAggregates/{eventId}
 *   certificateAggregates/{eventId}
 * Neither document stores a uid. See docs/firestore.rules AREA: records.
 */
import { useEffect, useState } from "react";
import { Platform, Share } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebase } from "../firebase";
import { postFn as sharedPostFn } from "../fn";
import { classify } from "../ml/moderation";

export type CertRole = "attendee" | "mentor" | "board" | "organizer";
export type RecordKind = "event" | "training" | "mentoring" | "board";

export type RecordItem = {
  id: string;
  kind: RecordKind;
  title: string;
  circle: string;
  dateLabel: string;
  role: CertRole;
  semester: string;
  certificateId?: string;
  code?: string;
};

export type StudentRecord = {
  uid: string;
  fullName: string;
  totals: { events: number; trainings: number; mentoring: number; board: number };
  items: RecordItem[];
  ask: { eventId: string; title: string } | null;
};

export type Certificate = {
  id: string;
  uid: string;
  code: string;
  fullName: string;
  eventId: string;
  eventTitle: string;
  circleId: string;
  circleName: string;
  role: CertRole;
  dateLabel: string;
  semester: string;
  kind: RecordKind;
};

export type PublicCertificate = {
  fullName: string;
  eventTitle: string;
  dateLabel: string;
  valid: boolean;
};

export type FeedbackAggregate = {
  eventId: string;
  eventTitle: string;
  circleId: string;
  circleName: string;
  count: number;
  sum: number;
  average: number;
  distribution: Record<string, number>;
  comments: string[];
};

const ROLE: Record<string, string> = {
  attendee: "Attendee",
  mentor: "Mentor",
  board: "Board",
  organizer: "Organizer",
};

export function roleLabel(role: string) {
  return ROLE[role] || "Attendee";
}

export function totalsLine(totals: StudentRecord["totals"]) {
  const events = `${totals.events} ${totals.events === 1 ? "event" : "events"}`;
  const trainings = `${totals.trainings} ${totals.trainings === 1 ? "training" : "trainings"}`;
  const mentoring = `${totals.mentoring} mentoring`;
  const board = `${totals.board} ${totals.board === 1 ? "board role" : "board roles"}`;
  return `${events} · ${trainings} · ${mentoring} · ${board}`;
}

async function postFn(path: string, body: Record<string, unknown>) {
  return sharedPostFn<{ ok?: boolean; issued?: number; created?: number }>(path, body);
}

function numMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  if (!v || typeof v !== "object") return out;
  for (const key of ["1", "2", "3", "4", "5"]) {
    out[key] = Number((v as Record<string, unknown>)[key] || 0);
  }
  return out;
}

function asRecord(id: string, data: Record<string, unknown>): StudentRecord {
  const totals = (data.totals || {}) as Record<string, unknown>;
  const items = Array.isArray(data.items) ? data.items : [];
  const ask = data.ask && typeof data.ask === "object" ? (data.ask as { eventId?: string; title?: string }) : null;
  return {
    uid: id,
    fullName: String(data.fullName || ""),
    totals: {
      events: Number(totals.events || 0),
      trainings: Number(totals.trainings || 0),
      mentoring: Number(totals.mentoring || 0),
      board: Number(totals.board || 0),
    },
    items: items.map((row) => {
      const item = row as Record<string, unknown>;
      return {
        id: String(item.id || ""),
        kind: String(item.kind || "event") as RecordKind,
        title: String(item.title || ""),
        circle: String(item.circle || ""),
        dateLabel: String(item.dateLabel || ""),
        role: String(item.role || "attendee") as CertRole,
        semester: String(item.semester || ""),
        certificateId: item.certificateId ? String(item.certificateId) : undefined,
        code: item.code ? String(item.code) : undefined,
      };
    }),
    ask: ask?.eventId ? { eventId: String(ask.eventId), title: String(ask.title || "this event") } : null,
  };
}

function asCertificate(id: string, data: Record<string, unknown>): Certificate {
  return {
    id,
    uid: String(data.uid || ""),
    code: String(data.code || ""),
    fullName: String(data.fullName || ""),
    eventId: String(data.eventId || ""),
    eventTitle: String(data.eventTitle || ""),
    circleId: String(data.circleId || ""),
    circleName: String(data.circleName || ""),
    role: String(data.role || "attendee") as CertRole,
    dateLabel: String(data.dateLabel || ""),
    semester: String(data.semester || ""),
    kind: String(data.kind || "event") as RecordKind,
  };
}

function asFeedback(id: string, data: Record<string, unknown>): FeedbackAggregate {
  return {
    eventId: id,
    eventTitle: String(data.eventTitle || ""),
    circleId: String(data.circleId || ""),
    circleName: String(data.circleName || ""),
    count: Number(data.count || 0),
    sum: Number(data.sum || 0),
    average: Number(data.average || 0),
    distribution: numMap(data.distribution),
    comments: Array.isArray(data.comments) ? data.comments.map(String) : [],
  };
}

function watchUid(path: string, onData: (uid: string) => () => void) {
  const { auth } = getFirebase();
  let stop = () => {};
  const bind = (uid: string | undefined) => {
    stop();
    stop = () => {};
    if (!uid) return;
    stop = onData(uid);
  };
  if (auth.currentUser) bind(auth.currentUser.uid);
  const unsub = onAuthStateChanged(auth, (user) => bind(user?.uid));
  return () => {
    unsub();
    stop();
  };
}

export function useMyRecord() {
  const [record, setRecord] = useState<StudentRecord | null>(null);
  useEffect(
    () =>
      watchUid("record", (uid) => {
        const { db } = getFirebase();
        return onSnapshot(
          doc(db, "records", uid),
          (snap) => setRecord(snap.exists() ? asRecord(uid, snap.data() as Record<string, unknown>) : null),
          (err) => {
            if (err.code !== "permission-denied") console.error(err);
          },
        );
      }),
    [],
  );
  return record;
}

export function useCertificate(id: string) {
  const [cert, setCert] = useState<Certificate | null>(null);
  useEffect(() => {
    if (!id) return;
    return watchUid(id, () => {
      const { db } = getFirebase();
      return onSnapshot(
        doc(db, "certificates", id),
        (snap) => setCert(snap.exists() ? asCertificate(snap.id, snap.data() as Record<string, unknown>) : null),
        (err) => {
          if (err.code !== "permission-denied") console.error(err);
        },
      );
    });
  }, [id]);
  return cert;
}

export function usePublicCertificate(code: string) {
  const [row, setRow] = useState<PublicCertificate | null | undefined>(undefined);
  useEffect(() => {
    if (!code) return;
    const { db } = getFirebase();
    return onSnapshot(
      doc(db, "certificatePublic", code),
      (snap) => {
        if (!snap.exists()) {
          setRow(null);
          return;
        }
        const data = snap.data();
        setRow({
          fullName: String(data.fullName || ""),
          eventTitle: String(data.eventTitle || ""),
          dateLabel: String(data.dateLabel || ""),
          valid: data.valid !== false,
        });
      },
      () => setRow(null),
    );
  }, [code]);
  return row;
}

export function useFeedbackSummary(eventId: string) {
  const [row, setRow] = useState<FeedbackAggregate | null>(null);
  useEffect(() => {
    if (!eventId) return;
    return watchUid(eventId, () => {
      const { db } = getFirebase();
      return onSnapshot(
        doc(db, "feedbackAggregates", eventId),
        (snap) => setRow(snap.exists() ? asFeedback(snap.id, snap.data() as Record<string, unknown>) : null),
        (err) => {
          if (err.code === "permission-denied") {
            setRow(null);
            return;
          }
          console.error(err);
        },
      );
    });
  }, [eventId]);
  return row;
}

export function useFeedbackBoards() {
  const [rows, setRows] = useState<FeedbackAggregate[]>([]);
  useEffect(
    () =>
      watchUid("boards", () => {
        const { db } = getFirebase();
        return onSnapshot(
          collection(db, "feedbackAggregates"),
          (snap) => setRows(snap.docs.map((d) => asFeedback(d.id, d.data() as Record<string, unknown>)).filter((row) => row.count > 0)),
          (err) => {
            if (err.code !== "permission-denied") console.error(err);
            setRows([]);
          },
        );
      }),
    [],
  );
  return rows;
}

const skipKey = (eventId: string) => `nabt-feedback-skip-${eventId}`;

export async function feedbackWasSkipped(eventId: string) {
  return (await AsyncStorage.getItem(skipKey(eventId))) === "1";
}

export async function skipFeedback(eventId: string) {
  await AsyncStorage.setItem(skipKey(eventId), "1");
}

export async function sendFeedback(eventId: string, rating: number, comment: string) {
  const text = comment.trim().slice(0, 200);
  if (text && classify(text).severity !== "ok") return { held: true as const };
  const { auth, db } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in first.");
  await setDoc(doc(db, "events", eventId, "feedback", uid), {
    uid,
    rating,
    comment: text,
    at: serverTimestamp(),
  });
  try {
    await postFn("/feedback-tally", { eventId });
  } catch {
    /* The response is saved. The aggregate catches up when the function is up. */
  }
  return { held: false as const };
}

export async function issueEventCertificates(eventId: string) {
  return postFn("/issue-certificates", { eventId });
}

export async function issueCircleCertificates(circleId: string) {
  return postFn("/issue-certificates", { circleId });
}

function esc(value: string) {
  return value.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch] || ch);
}

export function certificateSvg(cert: { fullName: string; eventTitle: string; circleName: string; dateLabel: string; role: string; code: string }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1200" viewBox="0 0 390 600">
  <rect width="390" height="600" fill="#411516"/>
  <circle cx="195" cy="92" r="28" fill="none" stroke="#CF9C74" stroke-width="3"/>
  <circle cx="195" cy="92" r="6" fill="#CF9C74"/>
  <text x="195" y="160" fill="#ffffff" font-size="13" text-anchor="middle" font-family="Montserrat, sans-serif">NABT · Antonine University</text>
  <text x="195" y="210" fill="#ffffff" font-size="26" text-anchor="middle" font-family="Montserrat, sans-serif">${esc(cert.fullName)}</text>
  <text x="195" y="258" fill="#ffffff" fill-opacity="0.8" font-size="16" text-anchor="middle" font-family="Montserrat, sans-serif">${esc(cert.eventTitle)}</text>
  <text x="195" y="286" fill="#ffffff" fill-opacity="0.64" font-size="14" text-anchor="middle" font-family="Montserrat, sans-serif">${esc(cert.circleName)}</text>
  <text x="195" y="314" fill="#ffffff" fill-opacity="0.64" font-size="14" text-anchor="middle" font-family="Montserrat, sans-serif">${esc(cert.dateLabel)} · ${esc(roleLabel(cert.role))}</text>
  <text x="195" y="420" fill="#ffffff" font-size="18" text-anchor="middle" font-family="Montserrat, sans-serif">${esc(cert.code)}</text>
</svg>`;
}

export function recordSvg(record: StudentRecord) {
  const lines = record.items
    .slice(0, 8)
    .map((item, i) => `<text x="32" y="${180 + i * 36}" fill="#ffffff" font-size="14" font-family="Montserrat, sans-serif">${esc(item.title)} · ${esc(roleLabel(item.role))}</text>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1200" viewBox="0 0 390 600">
  <rect width="390" height="600" fill="#411516"/>
  <text x="32" y="72" fill="#ffffff" font-size="22" font-family="Montserrat, sans-serif">${esc(record.fullName || "My record")}</text>
  <text x="32" y="108" fill="#ffffff" fill-opacity="0.64" font-size="13" font-family="Montserrat, sans-serif">${esc(totalsLine(record.totals))}</text>
  ${lines}
</svg>`;
}

export async function shareSvg(filename: string, svg: string, text: string) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const file = new File([blob], filename, { type: "image/svg+xml" });
    const nav = navigator as Navigator & { canShare?: (data: { files?: File[] }) => boolean; share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void> };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: "NABT", text });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: "NABT", message: text });
}
