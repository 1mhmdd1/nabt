/**
 * Promote a real account while `npm run demo` is running:
 *
 *   node scripts/make-role.mjs <email> <student|staff|admin>
 *
 *   student  approves the account (Student Affairs review done)
 *   staff    Student Affairs + counselor: opens /staff
 *   admin    campus admin: opens /admin/log and can change roles
 *
 * The email is the UA address the person signed up with (e.g. 202312345@ua.edu.lb).
 * They must sign out and back in once so the phone picks up the new role.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();
const auth = getAuth();

const [emailArg, roleArg] = process.argv.slice(2);
const role = String(roleArg || "").toLowerCase();
if (!emailArg || !["student", "staff", "admin"].includes(role)) {
  console.error("usage: node scripts/make-role.mjs <email> <student|staff|admin>");
  process.exit(1);
}
const email = emailArg.includes("@") ? emailArg.toLowerCase() : `${emailArg}@ua.edu.lb`;

let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  console.error(`No account for ${email}. Sign up on a phone first (or check that npm run demo is running).`);
  process.exit(1);
}
const uid = user.uid;
const claims = { ...(user.customClaims || {}) };
const now = Timestamp.now();

if (role === "student") {
  Object.assign(claims, { status: "approved", role: "student", sa: false, counselor: false });
  await db.doc(`users/${uid}`).set({ status: "approved", role: "student", roleLabel: "Student" }, { merge: true });
  await db.doc(`accountQueue/${uid}`).set({ status: "approved", chip: "Approved", chipOn: false, filter: "approved", updatedAt: now }, { merge: true });
} else if (role === "staff") {
  Object.assign(claims, { status: "approved", role: "staff", sa: true, counselor: true });
  const priv = (await db.doc(`users_private/${uid}`).get()).data() || {};
  const profile = (await db.doc(`users/${uid}`).get()).data() || {};
  await db.doc(`users/${uid}`).set({ status: "approved", role: "staff", roleLabel: "Student Affairs", staffRole: "counselor" }, { merge: true });
  await db.doc(`staffProfile/${uid}`).set(
    {
      name: priv.fullName || profile.nickname || "Student Affairs",
      role: "Counselor",
      email,
      onCall: false,
      revealCount: 0,
      createdAt: now,
    },
    { merge: true },
  );
  await db.doc(`accountQueue/${uid}`).set({ status: "approved", chip: "Approved", chipOn: false, filter: "approved", updatedAt: now }, { merge: true });
} else {
  Object.assign(claims, { status: "approved", role: "admin", sa: false, counselor: false });
  await db.doc(`users/${uid}`).set({ status: "approved", role: "admin", roleLabel: "Campus admin" }, { merge: true });
}

await auth.setCustomUserClaims(uid, claims);
await db.collection("auditLogs").add({
  type: "role_change",
  area: "admin",
  category: "role",
  action: `Set role to ${role}`,
  title: `Role set to ${role}`,
  detail: email,
  target: `users/${uid}`,
  actor: "make-role.mjs",
  actorUid: "cli",
  when: new Date().toLocaleString(),
  at: now,
});
console.log(`${email} is now ${role} (uid ${uid}). Sign out and back in on the phone to pick up the role.`);
process.exit(0);
