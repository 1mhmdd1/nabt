import { currentAccount, sessionUid, setSession, subscribeAuth, whenReady } from "../store";

type Claims = Record<string, unknown>;

export type User = {
  uid: string;
  email: string;
  getIdToken: () => Promise<string>;
  getIdTokenResult: (_refresh?: boolean) => Promise<{ claims: Claims }>;
};

function buildUser(uid: string | null): User | null {
  if (!uid) return null;
  const account = currentAccount();
  return {
    uid,
    email: account?.email || "",
    getIdToken: async () => uid,
    getIdTokenResult: async () => ({ claims: { ...(currentAccount()?.claims || {}) } }),
  };
}

const auth = {
  get currentUser() {
    return buildUser(sessionUid());
  },
};

export function getAuth() {
  return auth;
}

export function initializeAuth() {
  return auth;
}

export function connectAuthEmulator() {
  /* phone demo has no emulator */
}

export function getReactNativePersistence() {
  return {};
}

export function onAuthStateChanged(
  _auth: unknown,
  next: (user: User | null) => void,
  _error?: (err: unknown) => void,
) {
  let live = true;
  let stop = () => {};
  const fire = () => {
    if (live) next(buildUser(sessionUid()));
  };
  void whenReady().then(() => {
    if (!live) return;
    fire();
    stop = subscribeAuth(fire);
  });
  return () => {
    live = false;
    stop();
  };
}

export async function signInWithCustomToken(_auth: unknown, token: string) {
  setSession(token);
  return { user: buildUser(token) };
}

export async function signOut(_auth?: unknown) {
  setSession(null);
}
