import { FnError } from "../fn";
import { DEMO_PASSWORD } from "./mode";
import { findAccount, readDoc, setSession, whenReady } from "./store";

export { DEMO_PASSWORD };

export async function signInDemo(emailOrId: string, password: string) {
  await whenReady();
  const account = findAccount(emailOrId);
  if (!account || account.password !== password) {
    throw new FnError(401, "bad_login", "That email or password is not a demo account.");
  }
  setSession(account.uid);
  const user = readDoc(`users/${account.uid}`) || {};
  const priv = readDoc(`users_private/${account.uid}`) || {};
  return {
    uid: account.uid,
    nickname: String(user.nickname || ""),
    status: String(user.status || "approved"),
    role: String(user.role || account.claims.role || ""),
    studentId: String(priv.studentId || ""),
    claims: account.claims,
  };
}
