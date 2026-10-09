import { create } from "zustand";

export type Mood = "Heavy" | "Tired" | "Okay" | "Lighter" | "Good";

export type ChatLine = {
  id: string;
  who: string;
  initial?: string;
  time?: string;
  text: string;
  mine?: boolean;
  system?: boolean;
};

type State = {
  authed: boolean;
  pending: boolean;
  nickname: string;
  initial: string;
  studentId: string;
  fullName: string;
  mood: Mood;
  note: string;
  petalsToday: number;
  roots: number;
  calmMode: boolean;
  plainLanguage: boolean;
  quietPresence: boolean;
  nodeTakeYourTime: boolean;
  offerTyping: boolean;
  hideGarden: boolean;
  chatFilter: "All" | "Circles" | "1:1";
  promptLine: string;
  messages: ChatLine[];
  supportCard: string | null;
  caution: string | null;
  signIn: () => void;
  signOut: () => void;
  setPending: (v: boolean) => void;
  setNickname: (n: string) => void;
  setFullName: (n: string) => void;
  setStudentId: (n: string) => void;
  saveCheckIn: (mood: Mood, note: string) => void;
  setCalm: (v: boolean) => void;
  setPlain: (v: boolean) => void;
  setQuiet: (v: boolean) => void;
  setNodeTime: (v: boolean) => void;
  setTyping: (v: boolean) => void;
  setHideGarden: (v: boolean) => void;
  setFilter: (f: State["chatFilter"]) => void;
  setPrompt: (s: string) => void;
  pushMessage: (line: ChatLine) => void;
  setSupport: (s: string | null) => void;
  setCaution: (s: string | null) => void;
};

export const useNabt = create<State>((set) => ({
  // Identity is filled from the signed-in user's documents. Nothing is pre-filled.
  authed: false,
  pending: false,
  nickname: "",
  initial: "",
  studentId: "",
  fullName: "",
  mood: "Okay",
  note: "",
  petalsToday: 0,
  roots: 0,
  // Accessibility options are off until the signed-in user's settings say otherwise.
  calmMode: false,
  plainLanguage: false,
  quietPresence: true,
  nodeTakeYourTime: false,
  offerTyping: true,
  hideGarden: false,
  chatFilter: "All",
  promptLine: "",
  messages: [],
  supportCard: null,
  caution: null,
  signIn: () => set({ authed: true, pending: false }),
  signOut: () => set({ authed: false }),
  setPending: (pending) => set({ pending, authed: !pending }),
  setNickname: (nickname) =>
    set({
      nickname,
      initial: nickname.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase() || "C",
    }),
  setFullName: (fullName) => set({ fullName }),
  setStudentId: (studentId) => set({ studentId }),
  saveCheckIn: (mood, note) =>
    set((s) => ({
      mood,
      note,
      petalsToday: Math.min(2, s.petalsToday + (s.petalsToday < 2 ? 1 : 0)),
    })),
  setCalm: (calmMode) => set({ calmMode }),
  setPlain: (plainLanguage) => set({ plainLanguage }),
  setQuiet: (quietPresence) => set({ quietPresence }),
  setNodeTime: (nodeTakeYourTime) => set({ nodeTakeYourTime }),
  setTyping: (offerTyping) => set({ offerTyping }),
  setHideGarden: (hideGarden) => set({ hideGarden }),
  setFilter: (chatFilter) => set({ chatFilter }),
  setPrompt: (promptLine) => set({ promptLine }),
  pushMessage: (line) => set((s) => ({ messages: [...s.messages, line], caution: null })),
  setSupport: (supportCard) => set({ supportCard }),
  setCaution: (caution) => set({ caution }),
}));
