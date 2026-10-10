import test from "node:test";
import assert from "node:assert";
import { handleFn } from "./handlers.ts";
import { setSession, readDoc } from "./store.ts";
import * as fs from "./shims/firestore.ts";

const as = (uid: string) => setSession(uid);
const refused = async (p: Promise<unknown>) => { await assert.rejects(p, (e: any) => [401, 403, 409, 400, 501].includes(e.status) || /permission/i.test(String(e.message))); };

test("student can't run organizer, SA or role actions", async () => {
  as("uid-student");
  await refused(handleFn("/end-event", { eventId: "build-night" }));
  await refused(handleFn("/issue-certificates", { eventId: "build-night" }));
  await refused(handleFn("/issue-certificates", { circleId: "robotics" }));
  await refused(handleFn("/event-code", { eventId: "build-night" }));
  await refused(handleFn("/event-check-in", { eventId: "build-night" }));
  await refused(handleFn("/verify-decide", { id: "cedar-club", status: "verified" }));
  await refused(handleFn("/staff/chair", { circleId: "robotics", toChair: "uid-student", reason: "x" }));
  await refused(handleFn("/staff/graduate", { uid: "uid-student", classYear: 2024 }));
  await refused(handleFn("/staff/account", { uid: "uid-student", decision: "approve" }));
  await refused(handleFn("/confirm-graduation", { classYear: 2024 }));
  await refused(handleFn("/board-role", { circleId: "robotics", targetUid: "uid-robot-05", roles: ["events"] }));
  await refused(handleFn("/mentor-respond", { requestId: "hadi" }));
  await refused(fs.updateDoc(fs.doc(fs.getFirestore(), "users", "uid-student"), { alumni: true, classYear: 2024 }));
  await refused(fs.updateDoc(fs.doc(fs.getFirestore(), "users", "uid-student"), { role: "alumni" }));
  await refused(fs.updateDoc(fs.doc(fs.getFirestore(), "circles", "cedar-club"), { verified: true }));
  await refused(fs.setDoc(fs.doc(fs.getFirestore(), "events", "build-night", "attendance", "uid-student"), { uid: "uid-student" }));
  await refused(fs.updateDoc(fs.doc(fs.getFirestore(), "events", "build-night"), { ended: true }));
});

test("Chair can't verify or reassign Chair, but runs their event", async () => {
  as("uid-robot-chair");
  await refused(handleFn("/verify-decide", { id: "robotics", status: "verified" }));
  await refused(handleFn("/staff/chair", { circleId: "robotics", toChair: "uid-robot-05", reason: "x" }));
  await refused(fs.updateDoc(fs.doc(fs.getFirestore(), "circles", "robotics"), { chairUid: "uid-robot-05" }));
  const { code } = (await handleFn("/event-code", { eventId: "build-night" })) as { code: string };
  assert.ok(code.length === 6);
  // a member checks in only with the code
  as("uid-student");
  await refused(handleFn("/event-check-in", { eventId: "build-night", code: "NOPE00" }));
  as("uid-robot-05");
  await refused(handleFn("/event-check-in", { eventId: "build-night", code: "NOPE00" }));
  await handleFn("/event-check-in", { eventId: "build-night", code });
  assert.ok(readDoc("events/build-night/attendance/uid-robot-05"));
  as("uid-robot-chair");
  await refused(handleFn("/end-event", { eventId: "wellbeing-walk" }));
  const r = (await handleFn("/end-event", { eventId: "build-night" })) as { ok: boolean };
  assert.ok(r.ok);
  assert.equal(readDoc("events/build-night")?.ended, true);
});

test("Student Affairs verifies, assigns Chair, graduates", async () => {
  as("uid-osa");
  await handleFn("/verify-decide", { id: "cedar-club", status: "verified" });
  assert.equal(readDoc("circles/cedar-club")?.verified, true);
  await handleFn("/staff/graduate", { uid: "uid-student", classYear: 2024 });
  assert.equal(readDoc("users/uid-student")?.alumni, true);
  await handleFn("/end-event", { eventId: "wellbeing-walk" });
});
