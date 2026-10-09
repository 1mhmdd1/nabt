// AREA: impact — announcements, activity reports, You said we did, semester aggregates.
import { test } from "node:test";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export function registerImpactRules({ getEnv, as, T }) {
  async function seedAudiences() {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users/cedar"), { faculty: "Faculty of Engineering" }, { merge: true });
      await setDoc(doc(db, "users/fig"), { faculty: "Faculty of Business" }, { merge: true });
      await setDoc(doc(db, "announcements/all"), {
        title: "Exam timetable published",
        body: "Check the portal.",
        audience: "everyone",
        audienceKey: "everyone",
        authorUid: "rima",
        verified: true,
        status: "published",
      });
      await setDoc(doc(db, "announcements/eng"), {
        title: "Campus closure",
        body: "Engineering buildings close Friday after 4.",
        audience: "faculty",
        faculty: "Faculty of Engineering",
        audienceKey: "faculty:Faculty of Engineering",
        authorUid: "rima",
        verified: true,
        status: "published",
      });
      await setDoc(doc(db, "announcements/bots"), {
        title: "Robotics Build Night",
        body: "Hall C on Thursday.",
        audience: "circle",
        circleId: "robotics",
        audienceKey: "circle:robotics",
        authorUid: "lara",
        verified: false,
        status: "published",
      });
      await setDoc(doc(db, "announcements/debate"), {
        title: "Debate night",
        body: "Hall B on Monday.",
        audience: "circle",
        circleId: "debate",
        audienceKey: "circle:debate",
        authorUid: "fig",
        verified: false,
        status: "published",
      });
    });
  }

  const saPost = (extra = {}) => ({
    title: "Quiet week",
    body: "Library closes at 10 PM during finals.",
    audience: "everyone",
    audienceKey: "everyone",
    authorUid: "rima",
    verified: true,
    status: "published",
    createdAt: serverTimestamp(),
    ...extra,
  });

  test("AREA impact: only Student Affairs posts global or faculty announcements", async () => {
    const sa = as("rima", T.sa);
    await assertSucceeds(addDoc(collection(sa, "announcements"), saPost()));
    await assertSucceeds(addDoc(collection(sa, "announcements"), saPost({
      audience: "faculty",
      faculty: "Faculty of Engineering",
      audienceKey: "faculty:Faculty of Engineering",
      title: "Engineering quiet hours",
    })));
    await assertFails(addDoc(collection(sa, "announcements"), saPost({
      audience: "circle",
      circleId: "robotics",
      audienceKey: "circle:robotics",
      verified: true,
    })));
    await assertFails(addDoc(collection(as("lara", T.student), "announcements"), saPost({ authorUid: "lara" })));
    await assertFails(addDoc(collection(as("cedar", T.student), "announcements"), saPost({ authorUid: "cedar", verified: false })));
    await assertFails(addDoc(collection(sa, "announcements"), saPost({ fullName: "Real Rima" })));
  });

  test("AREA impact: a Chair posts only to their own Circle", async () => {
    const chair = as("lara", T.student);
    const own = (extra = {}) => ({
      title: "Build Night",
      body: "Bring the kits Thursday.",
      audience: "circle",
      circleId: "robotics",
      audienceKey: "circle:robotics",
      authorUid: "lara",
      verified: false,
      status: "published",
      createdAt: serverTimestamp(),
      ...extra,
    });
    await assertSucceeds(addDoc(collection(chair, "announcements"), own()));
    await assertFails(addDoc(collection(chair, "announcements"), own({ circleId: "debate", audienceKey: "circle:debate" })));
    await assertFails(addDoc(collection(as("jad", T.student), "announcements"), own({ authorUid: "jad" })));
    await assertFails(addDoc(collection(as("fig", T.student), "announcements"), own({ authorUid: "fig", circleId: "robotics", audienceKey: "circle:robotics" })));
    await assertSucceeds(addDoc(collection(as("fig", T.student), "announcements"), own({
      authorUid: "fig",
      circleId: "debate",
      audienceKey: "circle:debate",
      title: "Resolution posted",
    })));
  });

  test("AREA impact: students read only announcements for their audience", async () => {
    await seedAudiences();
    const cedar = as("cedar", T.student);
    const fig = as("fig", T.student);
    await assertSucceeds(getDoc(doc(cedar, "announcements/all")));
    await assertSucceeds(getDoc(doc(fig, "announcements/all")));
    await assertSucceeds(getDoc(doc(cedar, "announcements/eng")));
    await assertFails(getDoc(doc(fig, "announcements/eng")));
    await assertSucceeds(getDoc(doc(cedar, "announcements/bots")));
    await assertFails(getDoc(doc(as("rana", T.alum), "announcements/bots")));
    await assertSucceeds(getDoc(doc(fig, "announcements/debate")));
    await assertFails(getDoc(doc(cedar, "announcements/debate")));
    await assertSucceeds(getDocs(query(collection(cedar, "announcements"), where("audienceKey", "==", "everyone"))));
    await assertSucceeds(getDocs(query(
      collection(cedar, "announcements"),
      where("audience", "==", "faculty"),
      where("faculty", "==", "Faculty of Engineering"),
      where("audienceKey", "==", "faculty:Faculty of Engineering"),
    )));
    await assertFails(getDocs(query(
      collection(fig, "announcements"),
      where("audience", "==", "faculty"),
      where("faculty", "==", "Faculty of Engineering"),
      where("audienceKey", "==", "faculty:Faculty of Engineering"),
    )));
    await assertFails(getDocs(query(
      collection(cedar, "announcements"),
      where("audience", "==", "circle"),
      where("circleId", "==", "debate"),
      where("audienceKey", "==", "circle:debate"),
    )));
    await assertSucceeds(getDocs(collection(as("rima", T.sa), "announcements")));
    await assertFails(getDocs(collection(cedar, "announcements")));
    await assertSucceeds(setDoc(doc(cedar, "users/cedar/announcementHides/all"), { at: serverTimestamp() }));
    await assertFails(getDoc(doc(fig, "users/cedar/announcementHides/all")));
  });

  test("AREA impact: only the Chair or board writes a Circle report; Student Affairs reads all", async () => {
    const draft = (extra = {}) => ({
      circleId: "robotics",
      circleName: "Robotics Society",
      semester: "Fall 2026",
      eventsHeld: 2,
      attendance: [{ eventId: "build-night", title: "Build Night", count: 10 }],
      uniqueAttendees: 10,
      mentorsTrained: 2,
      board: [{ role: "Chair", nickname: "Lara" }],
      highlights: "Hall C was full.",
      status: "draft",
      authorUid: "lara",
      updatedAt: serverTimestamp(),
      ...extra,
    });
    await assertSucceeds(setDoc(doc(as("lara", T.student), "activityReports/robotics-fall"), draft()));
    await assertSucceeds(setDoc(doc(as("jad", T.student), "activityReports/robotics-board"), draft({ authorUid: "jad", highlights: "Board note." })));
    await assertFails(setDoc(doc(as("cedar", T.student), "activityReports/nope"), draft({ authorUid: "cedar" })));
    await assertFails(setDoc(doc(as("fig", T.student), "activityReports/other"), draft({ authorUid: "fig" })));
    await assertFails(setDoc(doc(as("rima", T.sa), "activityReports/staff"), draft({ authorUid: "rima" })));
    await assertSucceeds(updateDoc(doc(as("lara", T.student), "activityReports/robotics-fall"), {
      highlights: "Hall C was full. Kits came back.",
      status: "submitted",
      updatedAt: serverTimestamp(),
    }));
    await assertFails(getDoc(doc(as("fig", T.student), "activityReports/robotics-fall")));
    await assertFails(getDoc(doc(as("cedar", T.student), "activityReports/robotics-fall")));
    await assertSucceeds(getDoc(doc(as("rima", T.sa), "activityReports/robotics-fall")));
    await assertSucceeds(getDocs(collection(as("rima", T.sa), "activityReports")));
    await assertFails(getDocs(collection(as("cedar", T.student), "activityReports")));
    await assertSucceeds(updateDoc(doc(as("rima", T.sa), "activityReports/robotics-fall"), {
      status: "accepted",
      reviewNote: "Received.",
      reviewedBy: "rima",
      updatedAt: serverTimestamp(),
    }));
    await assertFails(updateDoc(doc(as("lara", T.student), "activityReports/robotics-board"), {
      status: "accepted",
      updatedAt: serverTimestamp(),
    }));
    await assertFails(updateDoc(doc(as("rima", T.sa), "activityReports/robotics-board"), {
      status: "changes",
      reviewNote: "Too soon.",
      reviewedBy: "rima",
      updatedAt: serverTimestamp(),
    }));
  });

  test("AREA impact: only Student Affairs posts You said, we did", async () => {
    const row = (extra = {}) => ({
      title: "Library open until 10 PM during finals",
      line: "Exam-week hours now run to 10 PM.",
      source: "Library hours petition",
      date: "Oct 2",
      authorUid: "rima",
      createdAt: serverTimestamp(),
      ...extra,
    });
    const made = await assertSucceeds(addDoc(collection(as("rima", T.sa), "youSaid"), row()));
    await assertFails(updateDoc(made, { line: "Changed later." }));
    await assertFails(addDoc(collection(as("lara", T.student), "youSaid"), row({ authorUid: "lara" })));
    await assertFails(addDoc(collection(as("cedar", T.student), "youSaid"), row({ authorUid: "cedar" })));
    await assertFails(addDoc(collection(as("rima", T.sa), "youSaid"), row({ fullName: "Real Rima" })));
    await assertSucceeds(getDocs(collection(as("cedar", T.student), "youSaid")));
    await assertSucceeds(getDoc(doc(as("fig", T.student), made.path)));
    await assertFails(getDocs(collection(as("newbie", T.pending), "youSaid")));
  });

  test("AREA impact: semester aggregates are Student Affairs read-only", async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "impact/fall-2026"), { events: 5, checkIns: 27, uniqueStudents: 15 });
      await setDoc(doc(ctx.firestore(), "circleStats/robotics"), { eventsHeld: 2, uniqueAttendees: 10 });
    });
    await assertSucceeds(getDoc(doc(as("rima", T.sa), "impact/fall-2026")));
    await assertFails(getDoc(doc(as("cedar", T.student), "impact/fall-2026")));
    await assertFails(setDoc(doc(as("rima", T.sa), "impact/fall-2026"), { events: 1 }));
    await assertSucceeds(getDoc(doc(as("lara", T.student), "circleStats/robotics")));
    await assertSucceeds(getDoc(doc(as("jad", T.student), "circleStats/robotics")));
    await assertFails(getDoc(doc(as("cedar", T.student), "circleStats/robotics")));
    await assertFails(setDoc(doc(as("lara", T.student), "circleStats/robotics"), { eventsHeld: 9 }));
  });
}
