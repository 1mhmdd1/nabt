/**
 * Two signed-in clients. One writes a Circle message; the other must see it
 * from a live listener. Then the message is removed so the seeded chat stays intact.
 */
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp as initAdmin } from "firebase-admin/app";
import { getFirestore as getAdmin } from "firebase-admin/firestore";

const config = {
  apiKey: "demo-nabt-key",
  authDomain: "demo-nabt.firebaseapp.com",
  projectId: "demo-nabt",
  appId: "1:0:web:demo-nabt",
};
const TEXT = "Live from the second desk.";

function client(name) {
  const app = initializeApp(config, name);
  const auth = getAuth(app);
  const db = getFirestore(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  return { auth, db };
}

const a = client("a");
const b = client("b");
await signInWithEmailAndPassword(a.auth, "cedar@ua.edu.lb", "nabt-demo-local");
await signInWithEmailAndPassword(b.auth, "cedar@ua.edu.lb", "nabt-demo-local");

const q = query(collection(b.db, "circles", "exam-week", "messages"), orderBy("createdAt", "asc"));
let seen = false;
const ready = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("listener timed out")), 8000);
  const unsub = onSnapshot(q, (snap) => {
    if (snap.docs.some((d) => d.data().text === TEXT)) {
      seen = true;
      clearTimeout(timer);
      unsub();
      resolve(snap.size);
    }
  });
});

const ref = await addDoc(collection(a.db, "circles", "exam-week", "messages"), {
  authorUid: a.auth.currentUser.uid,
  authorNickname: "Cedar",
  text: TEXT,
  kind: "text",
  createdAt: serverTimestamp(),
});
const count = await ready;
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
const adminApp = initAdmin({ projectId: "demo-nabt" }, "admin-clean");
await getAdmin(adminApp).doc(`circles/exam-week/messages/${ref.id}`).delete();
if (!seen) throw new Error("second client never saw the message");
console.log(`live ok: second client saw the message (snapshot size ${count}), then it was removed`);
process.exit(0);
