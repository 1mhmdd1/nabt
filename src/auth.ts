import { signInWithCustomToken, signOut as fbSignOut } from "firebase/auth";
import { getFirebase } from "./firebase";
import { FnError, postFn } from "./fn";
import { markIntroSeen } from "./intro";
import { useSignup } from "./signup";
import { nicknameProblem, type NicknameIdentity } from "./nickname/rules.mjs";

export { FnError };

/** Asks the server for a sign-in code. Locally the code comes back so the app can show it. */
export async function requestCode(mode: "signup" | "login") {
  const s = useSignup.getState();
  const res = await postFn<{ ok: boolean; demoCode: string | null; expiresIn: number }>("/auth/send-code", {
    studentId: s.studentId,
    mode,
    fullName: s.fullName,
    faculty: s.faculty,
    scanned: s.scanned,
  });
  s.setCode(res.demoCode, res.expiresIn);
  return res;
}

export type VerifyResult = { uid: string; isNew: boolean; status: string; nickname: string };

/** Checks the code with the server and signs the phone in as that account. */
export async function verifyCode(code: string): Promise<VerifyResult> {
  const s = useSignup.getState();
  const res = await postFn<{ ok: boolean; customToken: string; uid: string; isNew: boolean; status: string; nickname: string }>(
    "/auth/verify",
    { studentId: s.studentId, code },
  );
  const { auth } = getFirebase();
  if (auth.currentUser && auth.currentUser.uid !== res.uid) await fbSignOut(auth);
  await signInWithCustomToken(auth, res.customToken);
  // Someone who signed in has seen enough of the intro.
  void markIntroSeen();
  return { uid: res.uid, isNew: res.isNew, status: res.status, nickname: res.nickname };
}

/** Local check, same rules as the server. Null means fine. */
export function localNicknameProblem(nickname: string, identity: NicknameIdentity) {
  return nicknameProblem(nickname, identity);
}

/** Server check (adds "already taken"). */
export async function checkNickname(nickname: string): Promise<string | null> {
  const res = await postFn<{ ok: boolean; problem: string | null }>("/auth/nickname-check", { nickname });
  return res.problem;
}

/** Saves the nickname and creates the public profile (pending Student Affairs review). */
export async function claimNickname(nickname: string) {
  return postFn<{ ok: boolean; nickname: string; status?: string }>("/auth/nickname", { nickname });
}

export async function signOutEverywhere() {
  const { auth } = getFirebase();
  await fbSignOut(auth);
  useSignup.getState().reset();
}
