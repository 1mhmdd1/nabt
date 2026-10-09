import { test } from "node:test";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

/** Join, message length, sender, kindness, blocks, support requests, and organizer-only screen copy. */
export function registerFlowRules({ getEnv, as, T }) {
  test("circle messages are the sender's own words and stay within 500 characters", async () => {
    const db = as("cedar", T.student);
    await assertSucceeds(addDoc(collection(db, "circles/exam/messages"), {
      authorUid: "cedar",
      authorNickname: "Quiet Cedar",
      text: "Quiet Cedar joined",
      kind: "system",
    }));
    await assertSucceeds(addDoc(collection(db, "circles/exam/messages"), {
      authorUid: "cedar",
      authorNickname: "Quiet Cedar",
      text: "a quiet hello",
      kind: "text",
    }));
    await assertFails(addDoc(collection(db, "circles/exam/messages"), {
      authorUid: "fig",
      authorNickname: "Quiet Cedar",
      text: "pretend",
      kind: "text",
    }));
    await assertFails(addDoc(collection(db, "circles/exam/messages"), {
      authorUid: "cedar",
      authorNickname: "Quiet Cedar",
      text: "x".repeat(501),
      kind: "text",
    }));
  });

  test("only another member closes a kindness card, and you cannot thank your own reply", async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "circles/exam/messages/kind1"), {
        authorUid: "fig",
        authorNickname: "Quiet Fig",
        text: "I'm stuck on the lab",
        kind: "text",
        kindness: true,
        replyTo: "m1",
      });
    });
    await assertFails(updateDoc(doc(as("fig", T.student), "circles/exam/messages/kind1"), { kindnessClosed: true }));
    await assertSucceeds(updateDoc(doc(as("cedar", T.student), "circles/exam/messages/kind1"), { kindnessClosed: true }));
    await assertFails(setDoc(doc(as("fig", T.student), "circles/exam/messages/m1/thanks/fig"), { at: serverTimestamp() }));
    await assertSucceeds(setDoc(doc(as("cedar", T.student), "circles/exam/messages/m1/thanks/cedar"), { at: serverTimestamp() }));
  });

  test("a member can block another person on a message", async () => {
    await assertSucceeds(setDoc(doc(as("cedar", T.student), "blocks/cedar_fig"), {
      uid: "cedar",
      blockedUid: "fig",
      at: serverTimestamp(),
      circleId: "exam",
      messageId: "m1",
    }));
    await assertFails(setDoc(doc(as("cedar", T.student), "blocks/cedar_self"), {
      uid: "cedar",
      blockedUid: "cedar",
      at: serverTimestamp(),
      circleId: "exam",
      messageId: "m1",
    }));
  });

  test("a support request is a reason card, never a chat transcript", async () => {
    const db = as("cedar", T.student);
    await assertSucceeds(addDoc(collection(db, "supportRequests"), {
      uid: "cedar",
      reason: "stress",
      note: "exams",
      contact: "anonymous",
      nickname: "Quiet Cedar",
      shownName: "",
      status: "open",
      at: serverTimestamp(),
    }));
    await assertFails(addDoc(collection(db, "supportRequests"), {
      uid: "cedar",
      reason: "stress",
      note: "exams",
      contact: "anonymous",
      nickname: "Quiet Cedar",
      shownName: "",
      status: "open",
      at: serverTimestamp(),
      messages: ["the private chat"],
    }));
  });

  test("approval communities take a request, and only the organizer writes the screen line", async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "circles/gated"), {
        name: "Gated",
        kind: "community",
        joinApproval: true,
        chairUid: "lara",
        anonymous: false,
        memberCount: 1,
      });
      await setDoc(doc(db, "circles/gated/members/lara"), { nickname: "Bright Olive", roles: ["chair"] });
      await setDoc(doc(db, "events/e-screen"), {
        title: "Lab",
        status: "published",
        hostType: "circle",
        hostId: "robotics",
        nodeId: "engineering",
      });
    });
    await assertFails(setDoc(doc(as("cedar", T.student), "circles/gated/members/cedar"), {
      nickname: "Quiet Cedar",
      joinedAt: serverTimestamp(),
    }));
    await assertSucceeds(setDoc(doc(as("cedar", T.student), "circles/gated/joinRequests/cedar"), {
      nickname: "Quiet Cedar",
      realName: "Real cedar",
      uaEmail: "a@ua.edu.lb",
      phone: "",
      trainingAttendance: "Not recorded yet",
      status: "pending",
      at: serverTimestamp(),
    }));
    await assertSucceeds(updateDoc(doc(as("lara", T.student), "events/e-screen"), { screenDescription: "Bring a laptop" }));
    await assertFails(updateDoc(doc(as("cedar", T.student), "events/e-screen"), { screenDescription: "Members cannot write this" }));
  });

  test("community cards for Student Affairs are read-only and hidden from students", async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "staffCommunities/lab"), { name: "Lab", members: 1, chair: "Chair" });
    });
    await assertSucceeds(getDoc(doc(as("rima", T.sa), "staffCommunities/lab")));
    await assertFails(getDoc(doc(as("cedar", T.student), "staffCommunities/lab")));
    await assertFails(getDoc(doc(as("lara", T.student), "staffCommunities/lab")));
    await assertFails(setDoc(doc(as("rima", T.sa), "staffCommunities/other"), { name: "Nope", members: 1 }));
    await assertFails(updateDoc(doc(as("rima", T.sa), "staffCommunities/lab"), { chair: "Someone else" }));
  });
}
