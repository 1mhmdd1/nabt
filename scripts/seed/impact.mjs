/**
 * AREA: impact — semester numbers, announcements, activity reports, You said we did.
 * Counts are computed from events, attendance, circles and members already in the emulator.
 * The written aggregates carry no student id.
 *
 *   node scripts/seed/impact.mjs
 */
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SEMESTER = "Fall 2026";
const SEMESTER_START = Date.parse("2026-09-01T00:00:00Z");
const IMPACT_ID = "fall-2026";

const FACULTY = {
  cedar: "Faculty of Engineering",
  jad: "Faculty of Engineering",
  lea: "Faculty of Engineering",
  sara: "Faculty of Engineering",
  tala: "Faculty of Engineering",
  karim: "Faculty of Engineering",
  olive: "Faculty of Engineering",
  pine: "Faculty of Engineering",
  maple: "Faculty of Music and Fine Arts",
  jasmine: "Faculty of Music and Fine Arts",
  fig: "Faculty of Business",
};

const ATTENDANCE = {
  breathe: ["cedar", "olive", "pine", "fig", "jasmine", "maple"],
  "build-night": ["cedar", "jad", "lea", "sara", "tala", "karim", "nour-alum", "m8", "m9", "m10"],
  "alumni-demo": ["cedar", "jad", "nour-alum", "sara"],
  "film-night": ["maple", "jasmine", "olive"],
  "debate-night": ["fig", "pine", "olive", "jad"],
};

const NEW_MEMBERS = new Set([
  "circles/robotics/members/tala",
  "circles/robotics/members/m8",
  "circles/robotics/members/m9",
]);

const BOARD_ROLES = ["chair", "vice_chair", "events", "logistics", "media", "treasurer", "moderator", "hr"];
const ROLE_LABEL = {
  chair: "Chair",
  vice_chair: "Vice",
  events: "Events",
  logistics: "Tech",
  media: "Media",
  treasurer: "Treasurer",
  moderator: "Mod",
  hr: "HR",
};

function millisOf(value) {
  if (value && typeof value.toMillis === "function") return value.toMillis();
  if (typeof value === "number") return value;
  return 0;
}

async function commitOps(db, ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    for (const op of ops.slice(i, i + 400)) op(batch);
    await batch.commit();
  }
}

function aggregateTotals(feedbackSnap, certSnap) {
  let count = 0;
  let sum = 0;
  for (const row of feedbackSnap.docs) {
    const data = row.data();
    const n = Number(data.count || 0);
    if (n <= 0) continue;
    if (typeof data.sum === "number") {
      count += n;
      sum += data.sum;
    } else if (typeof data.average === "number") {
      count += n;
      sum += data.average * n;
    }
  }
  let issued = 0;
  let sawIssued = false;
  for (const row of certSnap.docs) {
    const n = row.data().issued;
    if (typeof n !== "number") continue;
    issued += n;
    sawIssued = true;
  }
  return {
    avgRating: count >= 5 ? Math.round((sum / count) * 10) / 10 : undefined,
    certificatesIssued: !sawIssued || (issued > 0 && issued < 5) ? undefined : issued,
  };
}

export async function recomputeImpact(db) {
  const { Timestamp } = await import("firebase-admin/firestore");
  const at = Timestamp.fromMillis(Date.parse("2026-10-08T08:14:00Z"));
  const circles = await db.collection("circles").get();
  let activeCircles = 0;
  let verifiedCommunities = 0;
  let newMembers = 0;
  const names = {};
  const mentors = {};
  const boards = {};

  for (const circle of circles.docs) {
    const data = circle.data();
    names[circle.id] = data.name || circle.id;
    if (data.verified === true) verifiedCommunities += 1;
    else activeCircles += 1;
    const members = await db.collection(`circles/${circle.id}/members`).get();
    let trained = 0;
    const board = [];
    for (const member of members.docs) {
      const row = member.data();
      if (millisOf(row.joinedAt) >= SEMESTER_START) newMembers += 1;
      const roles = Array.isArray(row.roles) ? row.roles.map(String) : [];
      if (roles.includes("mentor")) trained += 1;
      const role = roles.find((item) => BOARD_ROLES.includes(item));
      if (role) board.push({ role: ROLE_LABEL[role] || role, nickname: String(row.nickname || row.displayName || "Member") });
    }
    mentors[circle.id] = trained;
    boards[circle.id] = board;
  }

  const events = await db.collection("events").get();
  let eventCount = 0;
  let checkIns = 0;
  const people = new Set();
  const byHost = {};
  const perCircle = {};

  for (const event of events.docs) {
    const data = event.data();
    if (data.status && data.status !== "published") continue;
    eventCount += 1;
    const attendance = await db.collection(`events/${event.id}/attendance`).get();
    checkIns += attendance.size;
    attendance.docs.forEach((row) => people.add(row.id));
    const hostId = String(data.hostId || "");
    if (!hostId || hostId === "sa") continue;
    const title = String(data.title || event.id);
    if (!byHost[hostId]) byHost[hostId] = { name: String(data.hostLabel || names[hostId] || hostId), score: 0, people: new Set(), rows: [] };
    byHost[hostId].score += attendance.size;
    attendance.docs.forEach((row) => byHost[hostId].people.add(row.id));
    byHost[hostId].rows.push({ eventId: event.id, title, count: attendance.size });
  }

  const top = Object.entries(byHost)
    .sort((a, b) => b[1].score - a[1].score || a[1].name.localeCompare(b[1].name))
    .slice(0, 3)
    .map(([id, row]) => ({ id, name: row.name, score: row.score }));

  for (const [id, row] of Object.entries(byHost)) {
    perCircle[id] = {
      circleId: id,
      name: row.name,
      eventsHeld: row.rows.length,
      attendance: row.rows,
      uniqueAttendees: row.people.size,
      mentorsTrained: mentors[id] || 0,
    };
  }

  const feedbackSnap = await db.collection("feedbackAggregates").get();
  const certSnap = await db.collection("certificateAggregates").get();
  const fromAggregates = aggregateTotals(feedbackSnap, certSnap);
  const overview = await db.doc("staffOverview/week").get();
  const examWeeks = new Set(["W39", "W40"]);
  const weeks = (overview.data()?.weeks || []).map((week) => ({
    label: String(week.label || ""),
    score: Math.round((week.bars || []).reduce((sum, bar) => sum + Number(bar.h || 0), 0)),
    exam: examWeeks.has(String(week.label || "")),
  }));

  const impact = {
    semester: SEMESTER,
    events: eventCount,
    checkIns,
    uniqueStudents: people.size,
    activeCircles,
    verifiedCommunities,
    newMembers,
    top,
    weeks,
    note: "Aggregate only. No names.",
  };
  if (typeof fromAggregates.avgRating === "number") impact.avgRating = fromAggregates.avgRating;
  if (typeof fromAggregates.certificatesIssued === "number") impact.certificatesIssued = fromAggregates.certificatesIssued;

  const ops = [(batch) => batch.set(db.doc(`impact/${IMPACT_ID}`), impact)];
  for (const [id, row] of Object.entries(perCircle)) {
    ops.push((batch) => batch.set(db.doc(`circleStats/${id}`), row));
  }
  await commitOps(db, ops);
  return { impact, perCircle, boards, at, Timestamp };
}

export async function seedImpact(db) {
  const { Timestamp } = await import("firebase-admin/firestore");
  const early = Timestamp.fromMillis(Date.parse("2026-05-04T09:00:00Z"));
  const fresh = Timestamp.fromMillis(Date.parse("2026-09-18T09:00:00Z"));
  const ops = [];

  for (const [uid, faculty] of Object.entries(FACULTY)) {
    const ref = db.doc(`users/${uid}`);
    const snap = await ref.get();
    if (snap.exists) ops.push((batch) => batch.set(ref, { faculty }, { merge: true }));
  }

  ops.push((batch) => batch.set(db.doc("circles/debate"), {
    name: "Debate Circle",
    kind: "community",
    verified: true,
    anonymous: false,
    memberCount: 4,
    chairUid: "fig",
    charter: "One resolution a month, spoken with care.",
    officialLine: "Official UA club · aligned with Student Affairs",
  }, { merge: true }));
  for (const [uid, nickname, initial, roles] of [
    ["fig", "Kind Fig", "F", ["chair"]],
    ["pine", "Soft Pine", "P", []],
    ["olive", "Gentle Olive", "O", []],
    ["jad", "Keen Jad", "J", ["events"]],
  ]) {
    ops.push((batch) => batch.set(db.doc(`circles/debate/members/${uid}`), {
      nickname,
      displayName: nickname,
      initial,
      roles,
      joinedAt: NEW_MEMBERS.has(`circles/debate/members/${uid}`) ? fresh : early,
    }, { merge: true }));
  }

  ops.push((batch) => batch.set(db.doc("events/film-night"), {
    title: "Film night",
    status: "published",
    hostType: "circle",
    hostId: "film",
    hostLabel: "Film Society",
    verified: true,
    kicker: "Circle event",
    meta: "Fri 24 Oct · 7 PM · Edit room",
    day: "24",
    mon: "OCT",
    rsvpCount: 3,
    order: 4,
  }, { merge: true }));
  ops.push((batch) => batch.set(db.doc("events/debate-night"), {
    title: "Debate night",
    status: "published",
    hostType: "circle",
    hostId: "debate",
    hostLabel: "Debate Circle",
    verified: true,
    kicker: "Circle event",
    meta: "Mon 20 Oct · 5 PM · Hall B",
    day: "20",
    mon: "OCT",
    rsvpCount: 4,
    order: 5,
  }, { merge: true }));

  for (const [eventId, uids] of Object.entries(ATTENDANCE)) {
    uids.forEach((uid, index) => {
      ops.push((batch) => batch.set(db.doc(`events/${eventId}/attendance/${uid}`), {
        at: Timestamp.fromMillis(Date.parse("2026-10-01T12:00:00Z") + index),
      }));
    });
  }

  const memberSnaps = await db.collectionGroup("members").get();
  for (const member of memberSnaps.docs) {
    if (member.ref.parent.id !== "members") continue;
    const path = member.ref.path;
    ops.push((batch) => batch.set(member.ref, {
      joinedAt: NEW_MEMBERS.has(path) ? fresh : early,
    }, { merge: true }));
  }

  await commitOps(db, ops);
  const { perCircle, boards } = await recomputeImpact(db);

  const pin = (iso) => Timestamp.fromDate(new Date(iso));
  const content = [];
  const announcements = [
    ["exam-timetable", {
      title: "Exam timetable published",
      body: "The fall timetable is on the UA portal. Check your faculty list before Monday.",
      link: "https://ua.edu.lb",
      audience: "everyone",
      audienceKey: "everyone",
      authorUid: "rima",
      verified: true,
      status: "published",
      pinUntil: pin("2026-12-20T20:59:00Z"),
      createdAt: pin("2026-10-06T09:00:00Z"),
    }],
    ["campus-closure", {
      title: "Campus closure",
      body: "Faculty of Engineering buildings close Friday 17 Oct after 4 PM.",
      audience: "faculty",
      faculty: "Faculty of Engineering",
      audienceKey: "faculty:Faculty of Engineering",
      authorUid: "rima",
      verified: true,
      status: "published",
      pinUntil: pin("2026-10-18T20:59:00Z"),
      createdAt: pin("2026-10-01T09:00:00Z"),
    }],
    ["build-night-note", {
      title: "Robotics Build Night",
      body: "Hall C lab, Thu 16 Oct, 6 PM. Bring your kit.",
      eventDate: "Thu 16 Oct",
      audience: "circle",
      circleId: "robotics",
      audienceKey: "circle:robotics",
      authorUid: "cedar",
      verified: false,
      status: "published",
      pinUntil: pin("2026-10-16T20:59:00Z"),
      createdAt: pin("2026-10-07T09:00:00Z"),
    }],
  ];
  for (const [id, data] of announcements) {
    content.push((batch) => batch.set(db.doc(`announcements/${id}`), data));
  }

  const said = [
    ["library-hours", {
      title: "Library open until 10 PM during finals",
      line: "Exam-week hours now run to 10 PM.",
      source: "Library hours petition",
      date: "Oct 2",
      authorUid: "rima",
      createdAt: pin("2026-10-02T09:00:00Z"),
    }],
    ["breathe-aisle", {
      title: "Quieter aisle at Breathe",
      line: "The side aisle at the main hall stays clear.",
      source: "Breathe before finals",
      link: "/e/breathe",
      date: "Sep 28",
      authorUid: "rima",
      createdAt: pin("2026-09-28T09:00:00Z"),
    }],
    ["hall-c", {
      title: "Hall C for Build Night",
      line: "Robotics asked for a lab. Hall C is booked.",
      source: "Robotics Build Night",
      link: "/e/build-night",
      date: "Oct 6",
      authorUid: "rima",
      createdAt: pin("2026-10-06T15:00:00Z"),
    }],
  ];
  for (const [id, data] of said) content.push((batch) => batch.set(db.doc(`youSaid/${id}`), data));

  const robotics = perCircle.robotics || { eventsHeld: 0, attendance: [], uniqueAttendees: 0, mentorsTrained: 0 };
  const film = perCircle.film || { eventsHeld: 0, attendance: [], uniqueAttendees: 0, mentorsTrained: 0 };
  content.push((batch) => batch.set(db.doc("activityReports/robotics-fall-2026"), {
    circleId: "robotics",
    circleName: "Robotics Society",
    semester: SEMESTER,
    eventsHeld: robotics.eventsHeld,
    attendance: robotics.attendance,
    uniqueAttendees: robotics.uniqueAttendees,
    mentorsTrained: robotics.mentorsTrained,
    board: boards.robotics || [],
    highlights: "Hall C was full. The kits came back.",
    status: "draft",
    authorUid: "cedar",
    updatedAt: pin("2026-10-08T08:00:00Z"),
  }));
  content.push((batch) => batch.set(db.doc("activityReports/film-fall-2026"), {
    circleId: "film",
    circleName: "Film Society",
    semester: SEMESTER,
    eventsHeld: film.eventsHeld,
    attendance: film.attendance,
    uniqueAttendees: film.uniqueAttendees,
    mentorsTrained: film.mentorsTrained,
    board: boards.film || [],
    highlights: "One screening, a full room.",
    status: "submitted",
    authorUid: "maple",
    updatedAt: pin("2026-10-05T08:00:00Z"),
  }));
  await commitOps(db, content);
}

async function main() {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  const { initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
  await seedImpact(getFirestore());
  console.log("Impact seed ready.");
}

const invoked = process.argv[1] ? realpathSync(process.argv[1]) : "";
const here = realpathSync(fileURLToPath(import.meta.url));
if (invoked && invoked === here) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
