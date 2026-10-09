// AREA: node-rewards — rules for notes copies, badge shelf, dedications, drafts.
import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let env;
const student = { status: "approved", role: "student" };
const as = (uid, claims) => env.authenticatedContext(uid, claims).firestore();
const anon = () => env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-nabt-node",
    firestore: { rules: readFileSync(new URL("./firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const S = (p, d) => setDoc(doc(db, p), d);
    await S("users/cedar", { nickname: "Quiet Cedar", status: "approved", role: "student" });
    await S("users/fig", { nickname: "Quiet Fig", status: "approved", role: "student" });
    await S("users/cedar/nodeNotes/n1", { text: "Rest is allowed.", state: "On screen" });
    await S("users/cedar/earned/october-bloom", { name: "October bloom", pinned: false });
    await S("dedications/d1", { from: "Pine", to: "Jasmine", status: "approved" });
    await S("redemptions/cedar-coffee", { uid: "cedar", code: "K7Q-4M2", status: "valid" });
    await S("blooms/today", { count: 3 });
    await S("nfcStickers/engineering-circle", { nodeId: "engineering" });
    await S("users/cedar/drafts/node-note", { text: "A kind line." });
  });
});

test("owner reads node note copies; a peer and a client write cannot", async () => {
  await assertSucceeds(getDoc(doc(as("cedar", student), "users/cedar/nodeNotes/n1")));
  await assertFails(getDoc(doc(as("fig", student), "users/cedar/nodeNotes/n1")));
  await assertFails(setDoc(doc(as("cedar", student), "users/cedar/nodeNotes/n2"), { text: "no" }));
});

test("owner reads the badge shelf; a peer cannot, and the client cannot pin", async () => {
  await assertSucceeds(getDoc(doc(as("cedar", student), "users/cedar/earned/october-bloom")));
  await assertFails(getDoc(doc(as("fig", student), "users/cedar/earned/october-bloom")));
  await assertFails(updateDoc(doc(as("cedar", student), "users/cedar/earned/october-bloom"), { pinned: true }));
});

test("approved students read dedications; anonymous and writers cannot", async () => {
  await assertSucceeds(getDoc(doc(as("cedar", student), "dedications/d1")));
  await assertFails(getDoc(doc(anon(), "dedications/d1")));
  await assertFails(setDoc(doc(as("cedar", student), "dedications/d2"), { from: "Cedar", to: "Pine" }));
});

test("owner drafts stay within 80 characters and carry no identity", async () => {
  const db = as("cedar", student);
  await assertSucceeds(getDoc(doc(db, "users/cedar/drafts/node-note")));
  await assertSucceeds(setDoc(doc(db, "users/cedar/drafts/node-note"), { text: "x".repeat(80) }));
  await assertFails(setDoc(doc(db, "users/cedar/drafts/node-note"), { text: "x".repeat(81) }));
  await assertFails(setDoc(doc(db, "users/cedar/drafts/node-note"), { text: "hi", fullName: "Real cedar" }));
  await assertFails(getDoc(doc(as("fig", student), "users/cedar/drafts/node-note")));
});

test("bloom catalog is readable, NFC stickers are not, and neither is client-writable", async () => {
  const db = as("cedar", student);
  await assertSucceeds(getDoc(doc(db, "blooms/today")));
  await assertFails(setDoc(doc(db, "blooms/today"), { count: 9 }));
  await assertFails(getDoc(doc(db, "nfcStickers/engineering-circle")));
  await assertFails(setDoc(doc(db, "nfcStickers/x"), { nodeId: "engineering" }));
});

test("a student cannot mark a redemption used or write their plant", async () => {
  const db = as("cedar", student);
  await assertFails(updateDoc(doc(db, "redemptions/cedar-coffee"), { status: "used" }));
  await assertFails(updateDoc(doc(db, "users/cedar"), { plant: { petals: 7, roots: 0, stage: "Bloom" } }));
});
