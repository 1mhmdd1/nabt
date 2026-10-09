import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebase } from "./firebase";

/** The three intro slides show once, on the first launch of this install. */
const KEY = "nabt.intro.seen.v1";

export async function hasSeenIntro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markIntroSeen() {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable: the intro simply shows again next time */
  }
}

/** Dev reset: Settings → "Show the intro again". */
export async function resetIntro() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Resolves once Firebase Auth has restored (or ruled out) a saved session. */
export function authSettled(timeoutMs = 2500): Promise<User | null> {
  const { auth } = getFirebase();
  return new Promise((resolve) => {
    let done = false;
    let unsub: () => void = () => undefined;
    const finish = (user: User | null) => {
      if (done) return;
      done = true;
      unsub();
      resolve(user);
    };
    unsub = onAuthStateChanged(
      auth,
      (user) => finish(user),
      () => finish(null),
    );
    setTimeout(() => finish(auth.currentUser), timeoutMs);
  });
}

/** Where the launch screen goes after the loader. */
export async function resolveLaunchRoute(): Promise<string> {
  const [seen, user] = await Promise.all([hasSeenIntro(), authSettled()]);
  if (user) return "/home";
  return seen ? "/login" : "/onboarding";
}
