/**
 * Seed Auth + Firestore emulators with the Milestone 1 campus.
 * Placeholder names are invented. Embrace 1564, @ua.edu.lb and Antonine University are real.
 *
 *   firebase emulators:start --only auth,firestore
 *   node scripts/seed.mjs
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const here = dirname(fileURLToPath(import.meta.url));

function runSeed(file) {
  const script = join(here, "seed", file);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${file} exited ${code}`))));
  });
}

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();
const auth = getAuth();

const morning = Date.parse("2026-10-08T09:24:00Z");

const users = [
  ["cedar", { nickname: "Quiet Cedar", displayName: "Cedar", greetingName: "Cedar", greetingWhen: "Evening", initial: "C", role: "student", roleLabel: "Student", status: "approved", campus: "UA", mode: "exam", modeLabel: "Exam mode", plant: { petals: 1, roots: 3, stage: "First petal" }, gardenCount: 3, gardenLine: "3 lotuses in your garden", gardenSub: "Lotus #4 is growing · 4 of 7 petals", notesSummary: "2 notes · last at Faculty of Engineering", petitionsSummary: "Signed 2 · started 0" }],
  ["olive", { nickname: "Gentle Olive", displayName: "Olive", initial: "O", role: "student", status: "approved", campus: "UA", mode: "exam", plant: { petals: 2, roots: 4, stage: "Second petal" }, gardenCount: 2 }],
  ["pine", { nickname: "Soft Pine", displayName: "Pine", initial: "P", role: "student", status: "approved", campus: "UA", mode: "exam", plant: { petals: 1, roots: 2, stage: "First petal" }, gardenCount: 1 }],
  ["fig", { nickname: "Kind Fig", displayName: "Fig", initial: "F", role: "student", status: "approved", campus: "UA", mode: "quiet", plant: { petals: 1, roots: 1, stage: "Seed" }, gardenCount: 1 }],
  ["jasmine", { nickname: "Warm Jasmine", displayName: "Jasmine", initial: "J", role: "student", status: "approved", campus: "UA", mode: "exam", plant: { petals: 2, roots: 3, stage: "Second petal" }, gardenCount: 2 }],
  ["maple", { nickname: "Calm Maple", displayName: "Maple", initial: "M", role: "student", status: "approved", campus: "UA", mode: "study", plant: { petals: 1, roots: 2, stage: "First petal" }, gardenCount: 1 }],
  ["nour-alum", { nickname: "Nour", displayName: "Nour", initial: "N", role: "alumni", roleLabel: "Alumni", alumni: true, classYear: 2024, status: "approved", campus: "UA", mode: "mentor", plant: { petals: 3, roots: 5, stage: "Bloom" }, gardenCount: 4 }],
  ["rami-alum", { nickname: "Steady Rami", displayName: "Rami", initial: "R", role: "alumni", status: "approved", campus: "UA", mode: "mentor", plant: { petals: 2, roots: 4, stage: "Second petal" }, gardenCount: 2 }],
  ["sa-lina", { nickname: "Lina SA", displayName: "Lina", initial: "L", role: "student-affairs", status: "approved", campus: "UA", mode: "staff", plant: { petals: 0, roots: 0, stage: "Staff" }, gardenCount: 0 }],
  ["counselor", { nickname: "Campus Counselor", displayName: "Counselor", initial: "K", role: "counselor", status: "approved", campus: "UA", mode: "staff", plant: { petals: 0, roots: 0, stage: "Staff" }, gardenCount: 0 }],
  ["admin", { nickname: "UA Admin", displayName: "Admin", initial: "A", role: "admin", status: "approved", campus: "UA", mode: "staff", plant: { petals: 0, roots: 0, stage: "Staff" }, gardenCount: 0 }],
];

async function ensureUser(uid, email, claims) {
  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({ uid, email, password: "nabt-demo-local", emailVerified: true });
  }
  await auth.setCustomUserClaims(uid, claims);
}

async function main() {
  await ensureUser("cedar", "cedar@ua.edu.lb", { status: "approved", role: "student" });
  await ensureUser("nour-alum", "nour@ua.edu.lb", { status: "approved", role: "alumni" });
  await ensureUser("admin", "admin@ua.edu.lb", { status: "approved", role: "admin" });

  const batch = db.batch();
  const set = (path, data) => batch.set(db.doc(path), data);

  for (const [id, pub] of users) set(`users/${id}`, pub);

  set("users_private/cedar", {
    fullName: "Rami K. Haddad",
    studentId: "202312345",
    email: "202312345@ua.edu.lb",
    nameEdited: true,
    label: "invented placeholder",
  });
  set("users/cedar/settings/main", {
    accessibility: {
      calmMode: "on",
      plainLanguage: true,
      quietPresence: true,
      nodeTakeYourTime: true,
      offerTyping: true,
    },
    hideGardenCount: false,
    quietHours: "22:00-08:00",
  });
  for (const [id, name, order] of [
    ["first-bloom", "First bloom", 1],
    ["engineering-regular", "Engineering regular", 2],
    ["circle-helper", "Circle helper", 3],
  ]) {
    set(`badges/${id}`, { name, source: "circle" });
    set(`users/cedar/badges/${id}`, { name, order, earnedAt: Timestamp.fromMillis(morning) });
  }

  set("microActions/today", {
    title: "Get through one chapter",
    body: "Read one page with a 3-minute timer",
  });
  set("growthEvents/new-root", {
    uid: "cedar",
    kind: "root",
    source: "thanks",
    circleId: "exam-week",
    title: "A new root from Exam Week",
    body: "They thanked you for your reply.",
    action: "Thank them back",
    badge: "+1 root",
    counted: true,
    at: Timestamp.fromMillis(morning),
  });

  set("circles/exam-week", {
    name: "Exam Week",
    kind: "support",
    anonymous: true,
    memberCount: 5,
    hereCount: 4,
    counselorUid: "counselor",
    modLine: "Moderated by a campus counselor · nicknames only",
    prompt: "One thing that helped you study today?",
    promptMeta: "Today’s prompt  ·  clears tomorrow",
    promptFaces: ["P", "F", "J"],
    promptStat: "24 answered · clears tomorrow",
    inboxRank: 1,
    listPreview: "Prompt open · 3 answered",
    previewAt: morning,
    timeLabel: "9:24",
    unread: 3,
    typing: "Fig",
    listStack: ["O", "P", "J"],
  });
  const examMembers = [
    ["cedar", "Quiet Cedar", "Cedar", "C", 0],
    ["olive", "Gentle Olive", "Olive", "O", 1],
    ["pine", "Soft Pine", "Pine", "P", 2],
    ["fig", "Kind Fig", "Fig", "F", 3],
    ["jasmine", "Warm Jasmine", "Jasmine", "J", 4],
  ];
  for (const [uid, nickname, displayName, initial, order] of examMembers) {
    set(`circles/exam-week/members/${uid}`, { nickname, displayName, initial, order, joinedAt: Timestamp.fromMillis(morning) });
  }
  const answers = [
    ["pine", "Pine", "P", "The window seat in Faculty of Engineering.", 1],
    ["fig", "Fig", "F", "Phone in my bag until the break.", 2],
    ["jasmine", "Jasmine", "J", "Old exams from the library shelf.", 3],
  ];
  for (const [uid, displayName, initial, text, order] of answers) {
    set(`circles/exam-week/prompts/today/answers/${uid}`, { text, displayName, initial, order, createdAt: Timestamp.fromMillis(morning + order) });
  }
  set("circles/exam-week/threads/hope", {
    authorUid: "olive",
    nickname: "Olive",
    initial: "O",
    text: "Stuck on the last chapter of Signals. Can’t start.",
    mode: "Exam mode",
    when: "1h",
    createdAt: Timestamp.fromMillis(morning),
  });
  set("circles/exam-week/threads/hope/replies/cedar", {
    authorUid: "cedar",
    nickname: "Cedar",
    initial: "C",
    when: "You · 40m",
    text: "Summary page only. Ten minutes.",
    done: "Thanked · +1 root for both",
    order: 1,
    createdAt: Timestamp.fromMillis(morning + 10),
  });
  set("circles/exam-week/threads/hope/replies/pine", {
    authorUid: "pine",
    nickname: "Pine",
    initial: "P",
    when: "25m",
    text: "Same chapter. Let’s start together.",
    action: "Thanks",
    order: 2,
    createdAt: Timestamp.fromMillis(morning + 20),
  });
  set("circles/exam-week/meetups/quiet-sit", {
    title: "Propose a meetup",
    whenLabel: "Tue · 4:00 PM",
    kinds: ["Talk", "Quiet sit", "Short meditation"],
    selected: "Quiet sit",
    note: "A counselor approves the campus spot.",
    status: "approved",
    approvedLine: "Quiet sit · Library, 2nd floor · approved",
    proposedBy: "pine",
  });

  const chat = [
    ["m0", "counselor", "", "", "This morning", "day", "", morning, null],
    ["m1", "olive", "Olive", "O", "Anyone else stuck on Signals ch. 7?", "text", "9:12", morning + 1, null],
    ["m2", "pine", "Pine", "P", "Same. Summary page, ten minutes, then we compare?", "text", "9:15", morning + 2, [{ icon: "heart", label: "3", mine: true }, { icon: "root", label: "+1" }]],
    ["m3", "pine", "Pine", "P", "Pine proposed Quiet sit · Tue 4:00 PM", "system", "", morning + 3, null],
    ["m4", "cedar", "Cedar", "C", "I’m in. Library 2nd floor works for me.", "text", "", morning + 4, null],
    ["m5", "jasmine", "Jasmine", "J", "Bringing last year’s exams.", "text", "9:24", morning + 5, null],
  ];
  for (const [id, authorUid, authorNickname, initial, text, kind, timeLabel, at, reactions] of chat) {
    const data = { authorUid, authorNickname, initial, text, kind, timeLabel, createdAt: Timestamp.fromMillis(at) };
    if (kind === "system") data.link = "Join";
    if (reactions) data.reactions = reactions;
    set(`circles/exam-week/messages/${id}`, data);
  }

  set("circles/library", {
    name: "Library Circle",
    kind: "support",
    anonymous: true,
    memberCount: 3,
    inboxRank: 5,
    listPreview: "Quiet sit moved to 4:30",
    previewPrefix: "Maple",
    previewAt: morning,
    timeLabel: "Sun",
    unread: 0,
    listStack: ["L", "M", "R"],
    prompt: "Quiet sit moved to 4:30",
    modLine: "Moderated by a campus counselor · nicknames only",
  });
  set("circles/library/members/maple", { nickname: "Calm Maple", displayName: "Maple", initial: "M", order: 1, joinedAt: Timestamp.fromMillis(morning) });
  set("circles/library/members/cedar", { nickname: "Quiet Cedar", displayName: "Cedar", initial: "C", order: 0, joinedAt: Timestamp.fromMillis(morning) });
  set("circles/library/messages/m1", {
    authorUid: "maple",
    authorNickname: "Maple",
    initial: "M",
    text: "Quiet sit moved to 4:30",
    kind: "text",
    timeLabel: "Sun",
    createdAt: Timestamp.fromMillis(morning),
  });

  set("circles/robotics", {
    name: "Robotics Society",
    kind: "community",
    verified: true,
    anonymous: false,
    memberCount: 23,
    activeCount: 14,
    mentorCount: 7,
    mentorNeeded: 10,
    attendance: [10, 14, 8, 18, 22],
    nextEventTitle: "Hall C lab night",
    nextEventIn: "in 8 days",
    needs: [
      { title: "Student Affairs replied", sub: "Hall C lab free Thu 16 Oct" },
      { title: "2 join requests", sub: "Consent shared: email" },
      { title: "1 flagged post", sub: "Moderator is on it" },
    ],
    chairUid: "cedar",
    charter: "Build robots together, from first blink to open day.",
    officialLine: "Official UA club · aligned with Student Affairs",
    facultyAdvisor: "Dr. Hani Nassar",
    semesterGoal: "Robot at UA open day",
    goalDone: 2,
    goalTotal: 5,
    perks: ["Room priority", "Small budget", "Kit loans", "Alumni mentor", "Fast-track venue requests"],
  });
  const roboticsMembers = [
    ["cedar", "Quiet Cedar", "Cedar", "C", 0, ["chair"], "2 of 3 prep", false],
    ["jad", "Keen Jad", "Jad", "J", 1, ["events"], "3 of 3 prep", true],
    ["nour-alum", "Nour", "Nour", "N", 2, ["mentor"], "mentor · workshop", false],
    ["karim", "Steady Karim", "Karim", "K", 3, ["mentor"], "mentor · workshop", false],
    ["tala", "New Tala", "Tala", "T", 4, [], "new", false],
    ["rami-board", "Rami", "Rami", "R", 5, ["media"], "no prep yet", true],
    ["lea", "Bright Lea", "Lea", "L", 6, ["logistics"], "2 of 3 prep", false],
    ["sara", "Sara", "Sara", "S", 7, ["treasurer"], "board", false],
  ];
  for (const [uid, nickname, displayName, initial, order, roles, line, alert] of roboticsMembers) {
    set(`circles/robotics/members/${uid}`, { nickname, displayName, initial, order, roles, line, alert, joinedAt: Timestamp.fromMillis(morning) });
  }
  const filler = ["Amal", "Hadi", "Lina", "Omar", "Yara", "Ziad", "Maya", "Fadi", "Rita", "Sami", "Dina", "Eli", "Noor", "Paul", "Wissam"];
  filler.forEach((name, i) => {
    const uid = `m${i + 8}`;
    set(`circles/robotics/members/${uid}`, {
      nickname: name,
      displayName: name,
      initial: name.slice(0, 1),
      order: i + 8,
      roles: [],
      line: "member",
      joinedAt: Timestamp.fromMillis(morning),
    });
  });
  const roboticsContacts = [
    ["cedar", "Rami K. Haddad", "202312345@ua.edu.lb", "", "2 of 3 prep"],
    ["jad", "Jad Khoury", "2022xxxx4@ua.edu.lb", "", "3 of 3 prep"],
    ["lea", "Lea Haddad", "2023xxxx8@ua.edu.lb", "", "2 of 3 prep"],
    ["nour-alum", "Nour Saab", "2021xxxx7@ua.edu.lb", "", "mentor · workshop"],
    ["karim", "Karim Aoun", "2024xxxx2@ua.edu.lb", "", "mentor · workshop"],
    ["tala", "Tala Rizk", "2025xxxx9@ua.edu.lb", "", "new"],
    ["rami-board", "Rami Nassar", "2023xxxx3@ua.edu.lb", "", "no prep yet"],
    ["sara", "Sara Khoury", "2022xxxx1@ua.edu.lb", "", "board"],
  ];
  for (const [uid, realName, uaEmail, phone, trainingAttendance] of roboticsContacts) {
    set(`circles/robotics/contacts/${uid}`, { realName, uaEmail, phone, trainingAttendance, consentAt: Timestamp.fromMillis(morning) });
  }
  set("circles/robotics/board/task-hall", { kind: "task", title: "Confirm Hall C layout", owner: "Jad", due: "Thu", done: false });
  set("circles/robotics/board/task-kits", { kind: "task", title: "Count kit loans", owner: "Lea", due: "Fri", done: false });
  set("circles/robotics/board/task-poster", { kind: "task", title: "Open-day poster", owner: "Sara", due: "Mon", done: false });
  set("circles/robotics/audit/a1", { actorUid: "cedar", actor: "Cedar", action: "Made Jad Events Lead", when: "Today 3:10 PM", order: 1, target: "jad" });
  set("circles/robotics/audit/a2", { actorUid: "jad", actor: "Jad", action: "Corrected check-in: Karim", when: "Thu 6:12 PM", order: 2, target: "karim" });
  set("circles/robotics/audit/a3", { actorUid: "cedar", actor: "Sara + Cedar", action: "Approved $40 snacks (2 approvals)", when: "Wed", order: 3, target: "ledger" });

  set("circles/film", {
    name: "Film Society",
    kind: "community",
    verified: true,
    anonymous: false,
    memberCount: 12,
    chairUid: "maple",
    charter: "Short films, shared cuts, and one screening a month.",
    officialLine: "Official UA club · aligned with Student Affairs",
    perks: ["Edit-room hours", "Festival submissions"],
  });
  set("circles/film/members/maple", { nickname: "Calm Maple", displayName: "Maple", initial: "M", order: 0, roles: ["chair"], joinedAt: Timestamp.fromMillis(morning) });

  set("chats/fig", {
    type: "buddy",
    members: ["cedar", "fig"],
    anonymous: true,
    nameShares: { cedar: false, fig: false },
    inboxRank: 2,
    title: "Quiet Fig",
    tag: "Anonymous",
    timeLabel: "10:05",
    unread: 1,
    letter: "F",
    previewAt: morning,
  });
  set("chats/fig/messages/m1", {
    authorUid: "fig",
    authorNickname: "Kind Fig",
    text: "Deal. Starting now.",
    kind: "text",
    createdAt: Timestamp.fromMillis(morning),
  });
  set("chats/nour", {
    type: "alumni_named",
    members: ["cedar", "nour-alum"],
    anonymous: false,
    nameShares: { cedar: true, "nour-alum": true },
    inboxRank: 4,
    title: "Nour",
    tag: "Names shared",
    tagOk: true,
    timeLabel: "Mon",
    unread: 0,
    letter: "N",
    you: true,
    previewAt: morning,
  });
  set("chats/nour/messages/m1", {
    authorUid: "cedar",
    authorNickname: "Cedar",
    text: "Thanks for today.",
    kind: "text",
    createdAt: Timestamp.fromMillis(morning),
  });
  set("chatRequests/olive", {
    type: "buddy",
    fromUid: "olive",
    toUid: "cedar",
    status: "pending",
    intro: "Wants to be study buddies for Signals",
    title: "Gentle Olive",
    tag: "Anonymous",
    letter: "O",
    timeLabel: "8:40",
    inboxRank: 3,
    createdAt: Timestamp.fromMillis(morning),
  });

  set("nodes/engineering", {
    name: "Faculty of Engineering",
    title: "Faculty of Engineering node is awake",
    hours: "Breathing hour today, 1–2 PM",
    awake: true,
    status: "active",
    inboxOrder: 2,
  });
  set("nodes/library-2", { name: "Library, 2nd floor", awake: false, status: "offline" });
  set("nodes/engineering/notes/n1", { authorUid: "cedar", nickname: "Cedar", text: "One page, then a breath.", status: "approved", createdAt: Timestamp.fromMillis(morning) });
  set("nodes/engineering/notes/n2", { authorUid: "cedar", nickname: "Cedar", text: "Window seat was enough.", status: "approved", createdAt: Timestamp.fromMillis(morning + 1) });

  set("perks/library-tea", { title: "Library tea", costLotuses: 1, label: "placeholder perk" });
  set("campusGoal/current", { title: "Exam week roots", target: 200, progress: 48 });
  set("stories/maple-thread", {
    kind: "thread",
    author: "Maple",
    initial: "M",
    meta: "Hope Thread · Exam Week · 2h",
    body: "Three exams in four days. What’s one small thing that keeps you going between them?",
    thanks: 14,
    replies: 6,
    replyAuthor: "Cedar",
    replyInitial: "C",
    replyText: "A ten-minute walk to the courtyard, no phone.",
    refId: "exam-week",
    order: 1,
  });
  set("events/breathe", {
    title: "Breathe before finals",
    status: "published",
    hostType: "sa",
    hostId: "sa",
    hostLabel: "Student Affairs",
    verified: true,
    kicker: "Event · counselor-led",
    meta: "Short guided meditation · Thu 12:30 PM · Faculty of Engineering",
    day: "9",
    mon: "OCT",
    rsvpCount: 18,
    faces: ["F", "O", "P"],
    whenLine: "Thu, Dec 4 · 12:30–1:00 PM",
    placeLine: "Faculty of Engineering · 2nd floor",
    blurb: "A short guided breathing session with a counselor before exams. Come as you are; no sign-up needed, cameras off, nicknames only.",
    goingLine: "Pine, Jasmine and 10 others are going",
    goingFaces: ["P", "J", "O", "M"],
    order: 1,
  });
  set("events/build-night", {
    title: "Hall C lab night",
    status: "published",
    hostType: "circle",
    hostId: "robotics",
    hostLabel: "Robotics Society",
    verified: true,
    kicker: "Circle event",
    meta: "Thu 16 Oct · 6 PM · Hall C lab",
    when: "Thu 16 Oct · 6 PM",
    day: "16",
    mon: "OCT",
    rsvpCount: 11,
    order: 2,
    startsAt: Timestamp.fromMillis(Date.parse("2026-10-16T15:00:00Z")),
    endsAt: Timestamp.fromMillis(Date.parse("2026-10-16T18:00:00Z")),
  });
  set("events/alumni-demo", {
    title: "Alumni demo",
    status: "published",
    hostType: "circle",
    hostId: "robotics",
    hostLabel: "Robotics Society",
    verified: true,
    kicker: "Circle event",
    meta: "Tue 28 Oct · 5 PM · placeholder",
    day: "28",
    mon: "OCT",
    rsvpCount: 6,
    order: 3,
    startsAt: Timestamp.fromMillis(Date.parse("2026-10-28T14:00:00Z")),
    endsAt: Timestamp.fromMillis(Date.parse("2026-10-28T16:00:00Z")),
  });
  set("venues/hall-c", { name: "Hall C lab", building: "Engineering" });
  set("venues/engineering", { name: "Faculty of Engineering", building: "Main" });
  set("venues/hall-b", { name: "Hall B", building: "Engineering" });
  set("venueRequests/build-night", {
    circleId: "robotics",
    chairUid: "cedar",
    venueId: "hall-c",
    dateOptions: ["Thu 16 Oct"],
    memberCount: 23,
    status: "in_discussion",
    createdAt: Timestamp.fromMillis(morning),
  });
  set("venueRequests/build-night/thread/reply", {
    from: "sa",
    text: "Hall C lab free Thu 16 Oct",
    at: Timestamp.fromMillis(morning),
  });
  set("auditLogs/reveal-fig", {
    category: "reveal",
    counselor: "Rana Haddad",
    chip: "Ladder 1–3 done",
    when: "Oct 6 · 4:12 PM",
    title: "Quiet Fig · ID …2210",
    detail: "Rana Haddad · Immediate danger to self",
    action: "Identity reveal",
    actor: "Rana Haddad",
    target: "users/fig",
    at: Timestamp.fromMillis(morning),
  });
  set("auditLogs/reveal-maple", {
    category: "reveal",
    counselor: "Maya Saab",
    chip: "Ladder 1–2 done",
    when: "Sep 30 · 11:05 AM",
    title: "Soft Maple · ID …0931",
    detail: "Maya Saab · Legal requirement",
    action: "Identity reveal",
    actor: "Maya Saab",
    target: "users/maple",
    at: Timestamp.fromMillis(morning + 2),
  });
  set("auditLogs/reveal-owl", {
    category: "reveal",
    counselor: "Rana Haddad",
    chip: "Ladder 1–3 done",
    when: "Sep 22 · 9:40 PM",
    title: "Night Owl · ID …4417",
    detail: "Rana Haddad · Danger to others",
    action: "Identity reveal",
    actor: "Rana Haddad",
    target: "users/owl",
    at: Timestamp.fromMillis(morning + 3),
  });
  set("auditLogs/chair-robotics", {
    category: "role",
    actorUid: "admin",
    actor: "Campus admin",
    action: "Assigned Cedar as Chair of Robotics Society",
    target: "circles/robotics",
    when: "Mon",
    at: Timestamp.fromMillis(morning),
  });
  set("auditLogs/perk-tea", {
    actorUid: "sa-lina",
    actor: "Student Affairs",
    action: "Perk change reviewed",
    target: "perks/library-tea",
    when: "Tue",
    at: Timestamp.fromMillis(morning + 1),
  });
  set("petitions/library-hours", {
    title: "Keep the library open until midnight during exam week",
    text: "A later close would give people a quiet room after the last bus.",
    category: "Campus",
    status: "published",
    signCount: 86,
    goal: 150,
  });

  await batch.commit();
  // AREA: voice-safety-a11y — copy, events, care inbox, accommodation retention.
  const { seedVoiceSafety } = await import("./seed/voice-safety.mjs");
  await seedVoiceSafety(db, Timestamp, morning);
  // AREA: staff — counselor, safety queue, reviews, schedule.
  await runSeed("staff.mjs");
  // AREA: node-rewards — lotuses, perks, badge shelf. Today's Faculty of Engineering check-in stays open
  // unless SEED_TODAY_CHECKIN=1. node scripts/seed/reset-node-checkin.mjs clears it.
  await runSeed("node-rewards.mjs");
  await runSeed("records.mjs");
  await runSeed("alumni.mjs");
  // AREA: impact — semester numbers, announcements, reports, You said we did.
  // Records writes the aggregates first, so this rollup can read them.
  await runSeed("impact.mjs");
  console.log("Seeded demo-nabt. Sign in on the emulator as cedar@ua.edu.lb / nabt-demo-local");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
