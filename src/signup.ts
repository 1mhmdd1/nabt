import { create } from "zustand";

/** What the card reader found. Empty strings when a field could not be read. */
export type CardRead = { fullName: string; studentId: string; faculty: string };

type SignupState = {
  /** Values as read from the card. "Edited" shows when the current value differs from these. */
  scanned: CardRead;
  fullName: string;
  studentId: string;
  faculty: string;
  /** Card reading state for the scan screen. */
  reading: "idle" | "reading" | "done" | "failed";
  /** Demo only: the code the server would have emailed. Shown under the boxes. */
  demoCode: string | null;
  codeSentAt: number;
  codeExpiresInSec: number;
  setRead: (read: CardRead, status: SignupState["reading"]) => void;
  setReading: (status: SignupState["reading"]) => void;
  setFullName: (v: string) => void;
  setStudentId: (v: string) => void;
  setCode: (demoCode: string | null, expiresInSec: number) => void;
  reset: () => void;
};

const empty: CardRead = { fullName: "", studentId: "", faculty: "" };

export const useSignup = create<SignupState>((set) => ({
  scanned: empty,
  fullName: "",
  studentId: "",
  faculty: "",
  reading: "idle",
  demoCode: null,
  codeSentAt: 0,
  codeExpiresInSec: 0,
  setRead: (read, reading) =>
    set({ scanned: read, fullName: read.fullName, studentId: read.studentId, faculty: read.faculty, reading }),
  setReading: (reading) => set({ reading }),
  setFullName: (fullName) => set({ fullName }),
  setStudentId: (studentId) => set({ studentId: studentId.replace(/\D/g, "").slice(0, 9) }),
  setCode: (demoCode, codeExpiresInSec) => set({ demoCode, codeExpiresInSec, codeSentAt: Date.now() }),
  reset: () =>
    set({ scanned: empty, fullName: "", studentId: "", faculty: "", reading: "idle", demoCode: null, codeSentAt: 0, codeExpiresInSec: 0 }),
}));

export function emailFor(studentId: string) {
  return studentId ? `${studentId}@ua.edu.lb` : "";
}

/** True when the student changed a field after the card was read. */
export function fieldEdited(current: string, scanned: string) {
  return current.trim() !== scanned.trim();
}
