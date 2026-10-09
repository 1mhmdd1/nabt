/**
 * Student Affairs seed. Run AFTER scripts/seed.mjs (the main agent owns that file).
 *
 *   firebase emulators:start --only auth,firestore --project demo-nabt
 *   node scripts/seed.mjs
 *   node scripts/seed/staff.mjs
 *
 * Staff sign-in: 199804121@ua.edu.lb / nabt-demo-local (Rima K., counselor).
 * Names, counts and venues are invented placeholders.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();
const auth = getAuth();
const at = Timestamp.fromMillis(Date.parse("2026-10-08T08:14:00Z"));

async function ensureUser(uid, email, claims) {
  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({ uid, email, password: "nabt-demo-local", emailVerified: true });
  }
  await auth.setCustomUserClaims(uid, claims);
}

async function main() {
  await ensureUser("rima", "199804121@ua.edu.lb", {
    status: "approved",
    role: "staff",
    sa: true,
    counselor: true,
  });

  const batch = db.batch();
  const set = (path, data) => batch.set(db.doc(path), data, { merge: true });

  set("users/rima", {
    nickname: "Rima K.",
    displayName: "Rima K.",
    initial: "R",
    role: "student-affairs",
    roleLabel: "Counselor",
    status: "approved",
    campus: "UA",
    mode: "staff",
  });

  set("staffProfile/rima", {
    displayName: "Rima K.",
    initial: "R",
    roleLabel: "Counselor",
    roleNote: "Staff role set by the Admin.",
    onCall: true,
    revealCount: 3,
    revealLine: "3 this semester · all visible to the Admin",
    embrace: "Embrace 1564",
    embraceSub: "Lebanon’s 24/7 lifeline",
    emailLocal: "199804121",
  });
  for (const [id, reason, when] of [
    ["r1", "danger_to_self", "Sep 12"],
    ["r2", "danger_to_others", "Sep 28"],
    ["r3", "legal_requirement", "Oct 2"],
  ]) {
    set(`staffProfile/rima/reveals/${id}`, {
      reason,
      when,
      note: "Logged for the Admin and on the student’s privacy log.",
      order: id,
    });
  }

  set("staffOverview/week", {
    chip: "This week",
    openCases: 4,
    kpis: [
      { n: "842", label: "Active students" },
      { n: "23", label: "Circles active" },
      { n: "2", label: "Meetups pending" },
      { n: "3", label: "Petitions awaiting" },
      { n: "6", label: "Accounts to review", white: true },
      { n: "4", label: "Open safety cases" },
    ],
    legend: [
      { label: "Exam stress", opacity: 1 },
      { label: "Loneliness", opacity: 0.6 },
      { label: "Money", opacity: 0.35 },
      { label: "Other", opacity: 0.18 },
    ],
    weeks: [
      { label: "W36", x: 18, bars: [{ y: 94.4, h: 14.1, o: 1 }, { y: 84.0, h: 8.9, o: 0.6 }, { y: 78.8, h: 3.7, o: 0.35 }, { y: 73.6, h: 3.7, o: 0.18 }] },
      { label: "W37", x: 80, bars: [{ y: 89.2, h: 19.3, o: 1 }, { y: 73.6, h: 14.1, o: 0.6 }, { y: 68.4, h: 3.7, o: 0.35 }] },
      { label: "W38", x: 142, bars: [{ y: 78.8, h: 29.7, o: 1 }, { y: 63.2, h: 14.1, o: 0.6 }, { y: 52.8, h: 8.9, o: 0.35 }, { y: 47.6, h: 3.7, o: 0.18 }] },
      { label: "W39", x: 204, bars: [{ y: 63.2, h: 45.3, o: 1 }, { y: 42.4, h: 19.3, o: 0.6 }, { y: 32.0, h: 8.9, o: 0.35 }, { y: 26.8, h: 3.7, o: 0.18 }] },
      { label: "W40", x: 266, bars: [{ y: 73.6, h: 34.9, o: 1 }, { y: 47.6, h: 24.5, o: 0.6 }, { y: 32.0, h: 14.1, o: 0.35 }, { y: 26.8, h: 3.7, o: 0.18 }] },
    ],
    today: [
      { title: "Approve Quiet sit · Exam Week", sub: "Tue 4:00 PM · needs a spot", href: "/staff/reviews/meetups" },
      { title: "Library hours petition hit 250", sub: "Response due in 5 days", href: "/staff/reviews/petitions?respond=library-hours" },
    ],
  });
  set("wellbeingTrends/current", {
    note: "Anonymous signals by category per week. No names, no message text.",
    weeks: ["W36", "W37", "W38", "W39", "W40"],
  });

  set("nodes/engineering", {
    staffLine: "Awake · heartbeat 1 min ago",
    checkInCount: 31,
    showOnStaff: true,
    staffOrder: 1,
  });
  set("nodes/library-entrance", {
    name: "Library entrance",
    staffLine: "Offline since 9:40 AM",
    awake: false,
    showOnStaff: true,
    staffOrder: 2,
    staffAction: "Check",
  });

  const cases = [
    ["fig-shared", {
      nickname: "Quiet Fig",
      initial: "F",
      severity: "high",
      kind: "shared",
      kindLabel: "Shared by student",
      where: "Exam Week circle",
      context: "Exam Week circle",
      topic: "Hopelessness · Arabizi · new",
      time: "11:02",
      excerpt: "“I can’t keep doing this, nothing I do is enough anymore…”",
      fullExcerpt: "“I can’t keep doing this, nothing I do is enough anymore. I haven’t slept properly in a week.”",
      shareNote: "The student chose to share this message. Identity hidden.",
      ladderStep: 2,
      stepLabel: "Step 2 of 4",
      rank: 1,
      filter: "shared",
      open: true,
      ladder: [
        { n: "1", title: "More support", sub: "Extra support card sent 11:04", state: "done" },
        { n: "2", title: "Reach out anonymously", sub: "Now · identity stays hidden", state: "now" },
        { n: "3", title: "Student chooses to share", sub: "Ask; they accept or decline", state: "" },
        { n: "4", title: "Reveal (last resort)", sub: "Serious reason · logged", state: "" },
      ],
    }],
    ["fig-care", {
      nickname: "Quiet Fig",
      initial: "Q",
      severity: "care",
      kind: "care",
      kindLabel: "From the phone",
      careLabel: "Care level · Needs care",
      where: "care signal",
      title: "Quiet Fig · care signal",
      topic: "No content · heavy week, declined support · softer steps done",
      time: "8:40",
      rank: 2,
      filter: "care",
      open: true,
      level: "needs_care",
      when: "Oct 7, 8:40 AM",
      reasons: [
        "Heavy check-ins 4 of the last 6 days",
        "Declined support 3 times",
        "Voice check-ins low twice",
      ],
      steps: [
        { title: "Extra support card shown", sub: "On the phone · Oct 5", state: "done" },
        { title: "Next-day gentle check-in", sub: "On the phone · Oct 6 · not answered", state: "done" },
        { title: "Reach out anonymously", sub: "Ladder step 2 · you write to the nickname", state: "now" },
      ],
    }],
    ["pine-shared", {
      nickname: "Gentle Pine",
      initial: "P",
      severity: "medium",
      kind: "shared",
      kindLabel: "Shared by student",
      where: "1:1 chat",
      topic: "Loneliness · EN · in progress · Rima",
      time: "Yesterday",
      rank: 3,
      filter: "shared",
      open: true,
      ladderStep: 2,
    }],
    ["anon-3c19", {
      nickname: "Money worries",
      initial: "#",
      severity: "low",
      kind: "signal",
      kindLabel: "Anonymous signal",
      where: "anon #3C19",
      title: "Money worries · anon #3C19",
      topic: "Count only · handled in-app",
      time: "Yesterday",
      rank: 4,
      filter: "signal",
      open: true,
      ladderStep: 1,
    }],
  ];
  for (const [id, data] of cases) set(`cases/${id}`, data);

  set("casesPrivate/fig-shared", { subjectUid: "fig" });
  set("users_private/fig", {
    fullName: "Nour F. Example",
    studentId: "202298761",
    email: "202298761@ua.edu.lb",
    label: "invented placeholder",
  });
  set("cases/fig-shared/thread/m1", {
    from: "counselor",
    authorNickname: "Student Affairs (counselor)",
    text: "Hi Quiet Fig, I’m a counselor at Student Affairs. I saw things feel heavy right now. I’m here if you want to talk.",
    at,
  });
  set("cases/fig-shared/thread/m2", {
    from: "student",
    authorNickname: "Quiet Fig",
    initial: "F",
    text: "thanks. i don’t really know what to say",
    at,
  });

  const held = [
    ["node-engineering", { severity: "medium", where: "Node note · Faculty of Engineering", text: "“everyone here is useless and so am i”", topic: "Self-harm wording · held · author anonymous", status: "held", order: 1 }],
    ["thread-exam", { severity: "low", where: "Hope Thread · Exam Week", text: "“Selling last year’s exam answers, DM me”", topic: "Academic integrity · held · author anonymous", status: "held", order: 2 }],
    ["node-library", { severity: "low", where: "Node note · Library", text: "“call me 70 123 456”", topic: "Personal info · held · author anonymous", status: "held", order: 3 }],
  ];
  for (const [id, data] of held) set(`heldItems/${id}`, data);

  const accounts = [
    ["bright-olive", { initial: "B", name: "Bright Olive", role: "Student", edited: 2, when: "9 min ago", status: "pending", chip: "Pending", chipOn: true, uid: "bright-olive", order: 1, filter: "pending", email: "202301874@ua.edu.lb", submitted: "9 min ago", fields: [{ label: "Full name", scanned: "Lara Haddad", submitted: "Lara Hadad", edited: true }, { label: "ID number", scanned: "202301874", submitted: "202301874", edited: false }, { label: "Role", scanned: "Student", submitted: "Student", locked: true }] }],
    ["calm-river", { initial: "C", name: "Calm River", role: "Alumni", edited: 0, when: "24 min ago", status: "pending", chip: "Pending", uid: "calm-river", order: 2, filter: "alumni" }],
    ["soft-maple", { initial: "S", name: "Soft Maple", role: "Student", edited: 1, when: "1 h ago", status: "pending", chip: "Pending", uid: "soft-maple", order: 3, filter: "pending" }],
    ["quiet-fern", { initial: "Q", name: "Quiet Fern", role: "Student", edited: 0, when: "3 h ago", status: "new_photo", chip: "New photo requested", uid: "quiet-fern", order: 4, filter: "pending" }],
    ["warm-cedar", { initial: "W", name: "Warm Cedar", role: "Alumni", edited: 0, when: "Yesterday", status: "approved", chip: "Approved", uid: "warm-cedar", order: 5, filter: "done" }],
  ];
  for (const [id, data] of accounts) {
    set(`accountQueue/${id}`, data);
    set(`users/${id}`, {
      nickname: data.name,
      initial: data.initial,
      status: data.status === "approved" ? "approved" : "pending",
      role: data.role === "Alumni" ? "alumni" : "student",
    });
  }
  set("users_private/bright-olive", {
    fullName: "Lara Hadad",
    scannedName: "Lara Haddad",
    studentId: "202301874",
    email: "202301874@ua.edu.lb",
    label: "invented placeholder",
  });

  set("petitions/quiet-room", {
    title: "Quiet room in every faculty",
    by: "Willow",
    topic: "Wellbeing",
    goal: 300,
    signCount: 40,
    status: "pending",
    bucket: "pending",
    order: 1,
  });
  set("petitions/timetable", {
    title: "Exam timetable two weeks earlier",
    by: "Maple",
    topic: "Academics",
    goal: 250,
    signCount: 80,
    status: "pending",
    bucket: "pending",
    order: 2,
  });
  set("petitions/library-hours", {
    title: "Longer library hours during finals",
    short: "Library hours",
    by: "Maple",
    topic: "Campus",
    goal: 250,
    signCount: 260,
    status: "published",
    bucket: "goal",
    order: 3,
    response: "We’re extending library hours during finals. From Dec 8 to Dec 20 the library stays open until 11 PM.",
  });

  set("staffMeetups/quiet-sit", {
    circle: "Exam Week circle",
    by: "Pine",
    title: "Quiet sit · Tue 4:00 PM · 45 min",
    detail: "6 interested · from the circle poll",
    spot: "Faculty of Engineering, 2nd floor lounge",
    status: "proposed",
    order: 1,
    circleId: "exam-week",
    meetupId: "quiet-sit-staff",
  });
  set("staffMeetups/walk", {
    circle: "Night owls",
    by: "Willow",
    title: "Walk & talk · Thu 6:30 PM",
    detail: "Asked for: outdoor, near the main gate",
    status: "proposed",
    order: 2,
  });
  set("circles/exam-week/meetups/quiet-sit-staff", {
    title: "Quiet sit",
    whenLabel: "Tue 4:00 PM",
    status: "proposed",
    proposedBy: "pine",
    spot: "Faculty of Engineering, 2nd floor lounge",
  });
  for (const [id, name, sub, order] of [
    ["engineering", "Faculty of Engineering lounge", "Indoor · quiet · up to 12", 1],
    ["courtyard", "Library courtyard", "Outdoor · up to 20", 2],
    ["gate", "Main gate garden", "Outdoor · daytime only", 3],
  ]) set(`staffSpots/${id}`, { name, sub, order });

  const pitches = [
    ["robotics-build", { queue: "pitch", circle: "Robotics Society", initial: "R", title: "Robotics Build Night", detail: "Hall C lab · Thu 16 Oct or Tue 21 Oct · 23 members", time: "5 min", fast: true, status: "sent", order: 1, circleId: "robotics", chairUid: "maya", venueId: "hall-c", dateOptions: ["2026-10-16", "2026-10-21"], memberCount: 23, chairName: "Maya", slots: [{ label: "Hall C lab · Thu 16 Oct", sub: "Free 6–7 PM · no clash", ok: true }, { label: "Hall C lab · Tue 21 Oct", sub: "Booked 5–6 PM · Room 204 free", ok: false }] }],
    ["debate-friendly", { queue: "pitch", circle: "Debate Circle", initial: "D", title: "Inter-uni debate friendly", detail: "Hall B · Mon 20 Oct · 41 members", time: "2 h", fast: true, status: "sent", order: 2, circleId: "debate", chairUid: "fig", venueId: "hall-b", dateOptions: ["2026-10-20"], memberCount: 41 }],
    ["late-study", { queue: "pitch", circle: "Night owls", initial: "N", title: "Late study session", detail: "Other: quiet room · exam week · 12 members", time: "Yesterday", status: "sent", order: 3, circleId: "night-owls", chairUid: "willow", venueId: "quiet", dateOptions: ["2026-10-18"], memberCount: 12 }],
    ["debate-prep", { queue: "event", circle: "Debate Circle", initial: "D", title: "Debate night prep", detail: "Thu 2:00–4:00 · Hall B · 60", time: "8 min", status: "sent", order: 1, clash: "Clash with your draft", circleId: "debate", chairUid: "fig", venueId: "hall-b", dateOptions: ["2026-12-04"], memberCount: 60 }],
    ["walk-talk", { queue: "event", circle: "Night owls", initial: "N", title: "Walk & talk", detail: "Thu 4:30–5:30 · Courtyard · 15", time: "1 h", status: "sent", order: 2, clash: "No clash · node on", circleId: "night-owls", chairUid: "willow", venueId: "courtyard", dateOptions: ["2026-12-04"], memberCount: 15 }],
    ["arduino", { queue: "event", circle: "IEEE club", initial: "I", title: "Arduino 101 workshop", detail: "Mon 11:00–1:00 · Room 204 · 30", time: "Yesterday", status: "sent", order: 3, clash: "Needs projector ✓", circleId: "ieee", chairUid: "lea", venueId: "room-204", dateOptions: ["2026-12-08"], memberCount: 30 }],
  ];
  for (const [id, data] of pitches) set(`venueRequests/${id}`, { ...data, createdAt: at });

  set("communityReviews/robotics", {
    name: "Robotics Society",
    initial: "R",
    sub: "Chair + 2 board · charter · advisor pending · 20 min ago",
    status: "waiting",
    order: 1,
    members: 23,
    activeMonth: 4,
    eventsTerm: 3,
    charter: "We help UA students build robots, from basics to competitions like WRO Lebanon. Open to all faculties.",
    chair: "Maya",
    board: 2,
    advisor: "Optional · not added",
    checklist: "2 of 3 done",
  });
  set("communityReviews/photo", {
    name: "Photography Circle",
    initial: "P",
    sub: "Chair + 1 board · 1 day ago",
    status: "waiting",
    order: 2,
    members: 18,
    activeMonth: 6,
    eventsTerm: 2,
    charter: "A Circle for students learning to see the campus with care.",
    chair: "Lea",
    board: 1,
    advisor: "Confirmed",
    checklist: "3 of 3 done",
  });
  set("communityReviews/redcross", {
    name: "Red Cross Youth",
    initial: "R",
    sub: "Chair + 4 board · advisor ✓ · 2 days ago",
    status: "waiting",
    order: 3,
    members: 37,
    activeMonth: 12,
    eventsTerm: 5,
    charter: "Campus first-aid and blood-drive Circle.",
    chair: "Hadi",
    board: 4,
    advisor: "Confirmed",
    checklist: "3 of 3 done",
  });

  const communities = [
    ["robotics", { name: "Robotics Society", next: "Next: Thu 16 Oct", members: 23, last: "Sep 2", requests: 1, line: "2 venues approved · contact: the Chair", order: 1, chair: "Maya", since: "Sep 2026", candidates: [{ id: "maya", name: "Maya", sub: "Current Chair · since Sep 2026", current: true }, { id: "jad", name: "Jad", sub: "Board · Events Lead" }, { id: "lea", name: "Lea", sub: "Board · Tech" }] }],
    ["debate", { name: "Debate Circle", next: "Next: Mon 20 Oct", members: 41, last: "Oct 3", requests: 1, line: "3 venues approved · contact: the Chair", order: 2, chair: "Fig", since: "Oct 2025", candidates: [{ id: "fig", name: "Fig", sub: "Current Chair · since Oct 2025", current: true }, { id: "jad", name: "Jad", sub: "Board · Events" }] }],
    ["redcross", { name: "Red Cross Youth", next: "Next: Oct 24", members: 37, last: "Sep 28", requests: 0, line: "4 venues approved · contact: the Chair", order: 3, chair: "Hadi", since: "Sep 2024", candidates: [{ id: "hadi", name: "Hadi", sub: "Current Chair · since Sep 2024", current: true }] }],
    ["photo", { name: "Photography Circle", next: "Planning", members: 18, last: "Sep 12", requests: 0, line: "1 venue approved · contact: the Chair", order: 4, chair: "Lea", since: "Jan 2026", candidates: [{ id: "lea", name: "Lea", sub: "Current Chair · since Jan 2026", current: true }] }],
  ];
  for (const [id, data] of communities) set(`staffCommunities/${id}`, data);

  set("staffSchedule/thu", {
    chip: "Thu · Dec 4",
    days: [
      { d: "Mon", n: "1" },
      { d: "Tue", n: "2" },
      { d: "Wed", n: "3" },
      { d: "Thu", n: "4", on: true },
      { d: "Fri", n: "5" },
      { d: "Sat", n: "6" },
    ],
    hours: ["9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p"],
    rows: [
      { name: "Engineering", sub: "220 seats", top: 24, events: [
        { title: "Career talk", sub: "Alumni Circle", left: 112, width: 128, tone: "b" },
        { title: "Breathe before finals", sub: "Student Affairs", left: 376, width: 84, tone: "live", extra: "Live · 64", href: "/staff/events/live" },
      ] },
      { name: "Hall B", sub: "80 seats", top: 116, events: [
        { title: "Robotics demo", sub: "IEEE club", left: 156, width: 172, tone: "b" },
        { title: "Debate night prep", sub: "Debate Circle", left: 508, width: 172, tone: "p", extra: "Pending", href: "/staff/events/requests" },
      ] },
      { name: "Room 204", sub: "35 seats", top: 208, events: [
        { title: "Exam Week Circle", sub: "Quiet sit", left: 244, width: 128, tone: "b" },
        { title: "Arabizi poetry", sub: "Writers Circle", left: 596, width: 128, tone: "b" },
      ] },
      { name: "Courtyard", sub: "Outdoor · 150", top: 300, events: [
        { title: "Bake sale", sub: "Red Cross club", left: 332, width: 172, tone: "b" },
        { title: "Walk & talk", sub: "Night owls", left: 684, width: 128, tone: "p", extra: "Pending", href: "/staff/events/requests" },
      ] },
    ],
    nowLeft: 409,
    nowLabel: "12:54",
    summary: [
      { n: "14", label: "events today" },
      { n: "2", label: "free halls now" },
      { n: "1", label: "clash fixed" },
    ],
  });

  const spaces = [
    ["engineering", { name: "Faculty of Engineering", state: "use", stateLabel: "In use", cap: "Auditorium · 220", line: "In use · Breathe before finals · till 1:30", progress: 0.29, eq: ["Mic", "Projector", "Node"], order: 1 }],
    ["hall-b", { name: "Hall B", state: "free", stateLabel: "Free", cap: "Lecture hall · 80", line: "Free till 2:00 PM", eq: ["Projector", "Mic"], order: 2, selected: true, seats: "80", place: "Building C", floor: "2nd floor", access: "Step-free", accessSub: "lift", gear: ["Projector", "Mic ×2", "Speakers", "Whiteboard", "AC"], slots: [{ t: "9:00", label: "Career talk", tone: "b" }, { t: "11:00", label: "Free", tone: "f" }, { t: "12:00", label: "Free", tone: "f" }, { t: "13:00", label: "Free · 1:00–2:00", tone: "sel" }, { t: "14:00", label: "Debate prep · pending", tone: "p" }, { t: "16:00", label: "Free", tone: "f" }, { t: "17:00", label: "Cleaning", tone: "b" }] }],
    ["room-204", { name: "Room 204", state: "book", stateLabel: "Booked", cap: "Seminar · 35", line: "Booked 3:00 · Arabizi poetry", eq: ["Screen"], order: 3 }],
    ["courtyard", { name: "Courtyard", state: "free", stateLabel: "Free", cap: "Outdoor · 150", line: "Free all afternoon", eq: ["Power", "Node"], order: 4 }],
    ["library-quiet", { name: "Library quiet room", state: "use", stateLabel: "In use", cap: "Small · 12", line: "In use · Exam Week Circle", progress: 0.75, eq: ["Quiet"], order: 5 }],
  ];
  for (const [id, data] of spaces) set(`venues/${id}`, data);

  set("staffLive/breathe", {
    title: "Breathe before finals",
    line: "Faculty of Engineering · 12:30–1:30 · Student Affairs",
    checked: 64,
    rsvp: 80,
    inRoom: 71,
    walkIns: 7,
    freeSeats: 140,
    cap: 220,
    doors: [
      { name: "Door A · NFC", sub: "Last tap 20 s ago · +1 petal each", n: "52", on: true },
      { name: "Door B · NFC", sub: "Last tap 2 min ago", n: "12", on: true },
    ],
  });
  set("staffInsights/breathe", {
    title: "After: Breathe before finals",
    chip: "Thu Dec 4",
    kpis: [
      { n: "78", label: "Checked in" },
      { n: "82%", label: "RSVPs showed" },
      { n: "35%", label: "Hall used" },
    ],
    replies: 51,
    moods: [
      { label: "Lighter", pct: "58%", width: 0.58, opacity: 1 },
      { label: "Same", pct: "27%", width: 0.27, opacity: 0.55 },
      { label: "Heavier", pct: "9%", width: 0.09, opacity: 0.55 },
      { label: "Skipped", pct: "6%", width: 0.06, opacity: 0.55 },
    ],
    petals: "78 petals planted",
    petalSub: "Toward the campus cedar goal · 418 / 500 lotuses",
    next: [
      { title: "Book a smaller room", sub: "Hall B (80) would have been 98% full" },
      { title: "Repeat before exams", sub: "Lighter mood was highest in exam week" },
    ],
  });

  const perks = [
    ["bloom", { order: 1, cost: "1", title: "Bloom badge + story card", detail: "App · unlimited", value: "On" }],
    ["coffee", { order: 2, cost: "3", title: "Coffee at UA cafeteria", detail: "Proposed partner · 1 per semester", value: "64 / 200 left" }],
    ["study", { order: 3, cost: "3", title: "Study-room priority", detail: "Library · 1 per semester", value: "On" }],
    ["seat", { order: 4, cost: "5", title: "Priority event seat", detail: "Student Affairs · 1 per semester", value: "30 seats" }],
  ];
  for (const [id, data] of perks) set(`staffPerks/${id}`, data);
  set("staffPerks/goal", {
    order: 0,
    kind: "goal",
    partner: "Jouzour Loubnan",
    chip: "Planned partnership",
    progress: 412,
    target: 500,
    reward: "Reward: 50 native cedars · pending agreement · Edit goal",
  });
  const redemptions = [
    ["k7", { order: 1, title: "Coffee · K7Q-4M2", sub: "Cafeteria counter 1 · 10:42", chip: "Used" }],
    ["p2", { order: 2, title: "Study room · P2D-8L1", sub: "Library desk · 9:15", chip: "Used" }],
    ["t5", { order: 3, title: "Coffee · T5N-1X9", sub: "Expired after 10 min", chip: "Expired" }],
  ];
  for (const [id, data] of redemptions) set(`staffPerks/${id}`, data);

  const certs = [
    ["cedar", { order: 1, initial: "Q", name: "Quiet Cedar", sub: "ID …1874 · Circle host · Node volunteer", verified: true }],
    ["pine", { order: 2, initial: "G", name: "Gentle Pine", sub: "ID …2210 · Buddy", verified: true }],
    ["maple", { order: 3, initial: "M", name: "Maple", sub: "ID …0931 · Circle host", verified: false }],
    ["willow", { order: 4, initial: "W", name: "Willow", sub: "ID …4417 · Buddy · Node volunteer", verified: false }],
    ["river", { order: 5, initial: "C", name: "Calm River", sub: "ID …3302 · Node volunteer", verified: false }],
  ];
  for (const [id, data] of certs) set(`staffCertificates/${id}`, data);

  set("events/breathe", {
    title: "Breathe before finals",
    status: "published",
    hostType: "sa",
    live: true,
    when: "Thu, Dec 4 · 12:30",
    place: "Faculty of Engineering",
    blurb: "Short guided meditation · Thu 12:30 · Faculty of Engineering",
  });

  await batch.commit();
  console.log("Staff seed ready. Sign in as 199804121@ua.edu.lb / nabt-demo-local");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
