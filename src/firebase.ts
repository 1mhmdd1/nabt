import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import * as fbAuth from "firebase/auth";
import { getAuth, connectAuthEmulator, initializeAuth, type Auth, type Persistence } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo-nabt-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-nabt.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo-nabt",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-nabt.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "0",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:0:web:demo-nabt",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let emulatorsBound = false;

/**
 * On a phone, Firebase Auth only remembers the session when it is given AsyncStorage.
 * The React Native build of firebase/auth exports getReactNativePersistence; the web
 * typings do not list it, so it is looked up at runtime.
 */
function makeAuth(forApp: FirebaseApp): Auth {
  if (Platform.OS === "web") return getAuth(forApp);
  const rn = (fbAuth as unknown as { getReactNativePersistence?: (storage: unknown) => Persistence }).getReactNativePersistence;
  if (!rn) return getAuth(forApp);
  try {
    return initializeAuth(forApp, { persistence: rn(AsyncStorage) });
  } catch {
    // already initialised (fast refresh)
    return getAuth(forApp);
  }
}

export function getFirebase() {
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    auth = makeAuth(app);
    db = getFirestore(app);
  }
  const projectId = config.projectId;
  const useEmulator =
    process.env.EXPO_PUBLIC_USE_EMULATOR === "1" ||
    (process.env.EXPO_PUBLIC_USE_EMULATOR !== "0" && projectId === "demo-nabt");
  if (!emulatorsBound && useEmulator && auth && db) {
    const host = process.env.EXPO_PUBLIC_EMULATOR_HOST || "127.0.0.1";
    const authPort = Number(process.env.EXPO_PUBLIC_AUTH_PORT || 9099);
    const firestorePort = Number(process.env.EXPO_PUBLIC_FIRESTORE_PORT || 8080);
    connectAuthEmulator(auth, `http://${host}:${authPort}`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, firestorePort);
    emulatorsBound = true;
  }
  return { app: app!, auth: auth!, db: db! };
}

/** Claims from the current ID token: role, status, sa, counselor. Empty when signed out. */
export async function currentClaims(refresh = false): Promise<Record<string, unknown>> {
  const { auth: a } = getFirebase();
  const user = a.currentUser;
  if (!user) return {};
  try {
    return (await user.getIdTokenResult(refresh)).claims as Record<string, unknown>;
  } catch {
    return {};
  }
}
