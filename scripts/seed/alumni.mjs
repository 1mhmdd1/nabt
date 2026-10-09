/**
 * AREA: alumni — Nour Saab is the class-of-2024 demo alumnus. Cedar stays a student.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 node scripts/seed/alumni.mjs
 *
 * Circle membership is left in place. The record and certificates are not cleared.
 * Cedar's accepted mentor request to Nour stays open.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();
const auth = getAuth();

const mentors = [
  ["nour-alum", "nour@ua.edu.lb", "Nour Saab", "N", "Engineering", "I still love first builds.", ["chat", "advice"], 2024, 1],
  ["rami-alum", "rami.alum@ua.edu.lb", "Rami Haddad", "R", "Business", "Happy to read a CV.", ["cv", "advice"], 2020, 2],
  ["haya-alum", "haya.alum@ua.edu.lb", "Haya Nassar", "H", "Design", "Portfolio chats, calmly.", ["chat", "cv"], 2022, 3],
  ["omar-alum", "omar.alum@ua.edu.lb", "Omar Khoury", "O", "Engineering", "Fifteen minutes on internships.", ["chat", "advice"], 2019, 4],
];

async function ensureUser(uid, email) {
  try {
    const existing = await auth.getUser(uid);
    if (existing.email !== email) await auth.updateUser(uid, { email, emailVerified: true });
  } catch {
    await auth.createUser({ uid, email, password: "nabt-demo-local", emailVerified: true });
  }
  await auth.setCustomUserClaims(uid, { status: "approved", role: "alumni" });
}

async function main() {
  await auth.setCustomUserClaims("cedar", { status: "approved", role: "student" });
  await db.doc("users/cedar").set(
    { role: "student", roleLabel: "Student", alumni: false, classYear: FieldValue.delete(), mode: "exam", modeLabel: "Exam mode" },
    { merge: true },
  );

  for (const [uid, email, fullName, initial, field, line, offers, classYear, order] of mentors) {
    await ensureUser(uid, email);
    const shown = uid === "nour-alum" ? fullName : fullName.split(" ")[0];
    await db.doc(`users/${uid}`).set(
      { nickname: shown, displayName: shown, initial, role: "alumni", roleLabel: "Alumni", status: "approved", classYear, alumni: true, campus: "UA" },
      { merge: true },
    );
    await db.doc(`users_private/${uid}`).set({ fullName, email }, { merge: true });
    await db.doc(`alumniMentors/${uid}`).set({ uid, fullName, field, line, offers, initial, classYear, order });
  }

  await db.doc("mentorRequests/cedar-nour").set({
    fromUid: "cedar",
    toUid: "nour-alum",
    fromName: "Rami K. Haddad",
    toName: "Nour Saab",
    message: "Could we talk about internships?",
    status: "accepted",
    chatId: "nour",
    createdAt: Timestamp.fromDate(new Date("2026-10-06T15:00:00Z")),
  });
  await db.doc("chats/nour").set(
    {
      type: "alumni_named",
      members: ["cedar", "nour-alum"],
      anonymous: false,
      nameShares: { cedar: true, "nour-alum": true },
      title: "Nour Saab",
      tag: "Alumni",
      tagOk: true,
      letter: "N",
    },
    { merge: true },
  );
  await db.doc("chats/nour/messages/m2").set({
    authorUid: "nour-alum",
    authorNickname: "Nour Saab",
    text: "Thursday works. Bring the draft if you like.",
    kind: "text",
    createdAt: Timestamp.fromDate(new Date("2026-10-06T16:00:00Z")),
  });
  console.log("alumni: Nour Saab (nour@ua.edu.lb) is class of 2024. Cedar stays a student. Chat with Nour is open.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
