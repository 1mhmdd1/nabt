/**
 * Demo seed for the Verified communities, their events, the Student Affairs dashboard, alumni and the
 * admin log. Demo seed only: screens read these docs through the normal data layer. Counts that a
 * screen can work out from records (members, Circles, Verified communities) are computed here from
 * the records this seed writes, so every screen agrees.
 */
import { NICKS } from "./seedCircles";

type Put = (path: string, data: Record<string, unknown>) => void;
type Docs = Record<string, Record<string, unknown>>;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const OSA = "uid-osa";
const ALUMNI = "uid-alumni";
const SEMESTER = "Fall 2026";

function at(dayOffset: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}
const dayOf = (ms: number) => String(new Date(ms).getDate());
const monOf = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short" });
const dateLabel = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

type Club = {
  id: string;
  name: string;
  charter: string;
  chair: [string, string];
  board: [string, string, string][];
  members: number;
  active: number;
  past: { id: string; title: string; daysAgo: number; place: string; count: number; ratings: number[]; comment: string }[];
  next: { id: string; title: string; inDays: number; hour: number; place: string; blurb: string; rsvp: number };
  order: number;
};

const CLUBS: Club[] = [
  {
    id: "film",
    name: "Film Club",
    charter: "Screenings and a short talk after the lights come up.",
    chair: ["uid-film-chair", "Lea"],
    board: [["uid-film-events", "Marc", "events"], ["uid-film-media", "Hala", "media"]],
    members: 38,
    active: 24,
    past: [
      { id: "film-silent", title: "Silent film night", daysAgo: 23, place: "Auditorium", count: 31, ratings: [0, 1, 3, 11, 12], comment: "Live piano made it." },
      { id: "film-shorts", title: "Lebanese shorts", daysAgo: 9, place: "Auditorium", count: 27, ratings: [0, 0, 2, 9, 10], comment: "Loved the director Q&A." },
    ],
    next: { id: "film-night", title: "Film Club screening", inDays: 3, hour: 18, place: "Auditorium", blurb: "A short film and a quieter conversation after.", rsvp: 19 },
    order: 2,
  },
  {
    id: "debate",
    name: "Debate Society",
    charter: "One topic, two sides, and a Chair who keeps it kind.",
    chair: ["uid-debate-chair", "Sami"],
    board: [["uid-debate-events", "Nadia", "events"], ["uid-debate-treasurer", "Georges", "treasurer"]],
    members: 26,
    active: 17,
    past: [{ id: "debate-ai", title: "Should AI grade exams?", daysAgo: 12, place: "Room B204", count: 22, ratings: [0, 1, 2, 8, 9], comment: "Both sides were fair." }],
    next: { id: "debate-open", title: "Open floor debate", inDays: 5, hour: 17, place: "Room B204", blurb: "Bring a topic. Two minutes each side.", rsvp: 11 },
    order: 3,
  },
  {
    id: "red-cross",
    name: "Red Cross Youth",
    charter: "First aid training, blood drives and weekend volunteering.",
    chair: ["uid-redcross-chair", "Yara"],
    board: [["uid-redcross-log", "Toni", "logistics"], ["uid-redcross-events", "Rim", "events"], ["uid-redcross-hr", "Joe", "hr"]],
    members: 54,
    active: 33,
    past: [
      { id: "rc-firstaid", title: "First aid basics", daysAgo: 20, place: "Health center", count: 40, ratings: [0, 0, 1, 12, 20], comment: "Practical and calm." },
      { id: "rc-blood", title: "Campus blood drive", daysAgo: 6, place: "Main hall", count: 58, ratings: [0, 1, 2, 10, 18], comment: "Quick and well organized." },
    ],
    next: { id: "rc-cpr", title: "CPR certification", inDays: 8, hour: 10, place: "Health center", blurb: "Two hours, certificate at the end.", rsvp: 27 },
    order: 4,
  },
];

/** Robotics past events. The last ones match the Chair dashboard bars (attendance on the Circle). */
const ROBOTICS_PAST = [
  { id: "rob-intro", title: "Intro to Arduino", daysAgo: 40, place: "Robotics lab", count: 12, ratings: [0, 0, 1, 5, 4], comment: "Great first session." },
  { id: "rob-sensors", title: "Sensors workshop", daysAgo: 33, place: "Robotics lab", count: 16, ratings: [0, 1, 2, 6, 5], comment: "More kits next time." },
  { id: "rob-cad", title: "CAD for beginners", daysAgo: 26, place: "Lab 3", count: 9, ratings: [0, 0, 2, 4, 2], comment: "Clear steps." },
  { id: "rob-arm", title: "Robot arm build", daysAgo: 19, place: "Robotics lab", count: 18, ratings: [0, 0, 1, 8, 7], comment: "Loved building together." },
  { id: "rob-race", title: "Line follower race", daysAgo: 12, place: "Main hall", count: 20, ratings: [0, 0, 1, 7, 10], comment: "So much fun." },
];

function feedback(put: Put, e: { id: string; title: string; ratings: number[]; comment: string }, circleId: string, circleName: string) {
  const count = e.ratings.reduce((a, b) => a + b, 0);
  const sum = e.ratings.reduce((a, n, i) => a + n * (i + 1), 0);
  put(`feedbackAggregates/${e.id}`, {
    eventTitle: e.title,
    circleId,
    circleName,
    count,
    sum,
    average: Math.round((sum / Math.max(count, 1)) * 10) / 10,
    distribution: Object.fromEntries(e.ratings.map((n, i) => [String(i + 1), n])),
    comments: [e.comment],
  });
}

function pastEvent(put: Put, docs: Docs, e: (typeof ROBOTICS_PAST)[number], hostId: string, hostLabel: string, memberIds: string[]) {
  const startsAt = at(-e.daysAgo, 17);
  // Past events are not "published", so Discover lists only what is still to come.
  put(`events/${e.id}`, {
    title: e.title,
    hostLabel,
    verified: true,
    meta: `${dateLabel(startsAt)} · ${e.place}`,
    day: dayOf(startsAt),
    mon: monOf(startsAt),
    whenLine: dateLabel(startsAt),
    placeLine: e.place,
    status: "ended",
    ended: true,
    hostType: "circle",
    hostId,
    startsAt,
    endsAt: startsAt + 3 * HOUR,
    venueStatus: "approved",
    rsvpCount: e.count,
  });
  memberIds.slice(0, Math.min(e.count, memberIds.length)).forEach((uid, i) => {
    const nick = String(docs[`circles/${hostId}/members/${uid}`]?.nickname || "Member");
    put(`events/${e.id}/attendance/${uid}`, { uid, nickname: nick, at: startsAt + i * 60000 });
  });
  feedback(put, e, hostId, hostLabel);
}

function upcoming(put: Put, n: Club["next"], hostId: string, hostLabel: string, order: number) {
  const startsAt = at(n.inDays, n.hour);
  put(`events/${n.id}`, {
    title: n.title,
    hostLabel,
    verified: true,
    meta: `${n.inDays <= 7 ? "This week" : "Next week"} · ${n.place}`,
    day: dayOf(startsAt),
    mon: monOf(startsAt),
    whenLine: `${new Date(startsAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${n.hour > 12 ? n.hour - 12 : n.hour}:00 ${n.hour >= 12 ? "PM" : "AM"}`,
    placeLine: n.place,
    blurb: n.blurb,
    description: n.blurb,
    status: "published",
    hostType: "circle",
    hostId,
    order,
    startsAt,
    endsAt: startsAt + 2 * HOUR,
    venueStatus: "approved",
    rsvpCount: n.rsvp,
  });
}

function addMembers(put: Put, circleId: string, chair: [string, string], board: [string, string, string][], total: number, seed: number) {
  const rand = rng(seed);
  const used = new Set([chair[1], ...board.map((b) => b[1])]);
  const pool = [...NICKS].filter((n) => !used.has(n)).sort(() => rand() - 0.5);
  const write = (uid: string, nickname: string, order: number, roles: string[]) =>
    put(`circles/${circleId}/members/${uid}`, { nickname, displayName: nickname, initial: nickname.slice(0, 1).toUpperCase(), order, roles });
  write(chair[0], chair[1], 1, ["chair"]);
  board.forEach(([uid, name, role], i) => write(uid, name, i + 2, [role]));
  const ids = [chair[0], ...board.map((b) => b[0])];
  for (let i = ids.length; i < total; i++) {
    const uid = `uid-${circleId}-m${String(i + 1).padStart(2, "0")}`;
    write(uid, pool[i % pool.length], i + 1, i < ids.length + 2 ? ["mentor"] : []);
    ids.push(uid);
  }
  return ids;
}

export function seedCampus(put: Put, docs: Docs) {
  const now = Date.now();

  /* ---------- Verified communities ---------- */
  const robotIds = Object.keys(docs)
    .filter((p) => p.startsWith("circles/robotics/members/"))
    .map((p) => p.split("/")[3]);
  ROBOTICS_PAST.slice(-2).forEach((e) => pastEvent(put, docs, e, "robotics", "Robotics Society", robotIds));
  ROBOTICS_PAST.forEach((e) => feedback(put, e, "robotics", "Robotics Society"));
  docs["circles/robotics"].attendance = ROBOTICS_PAST.map((e) => e.count);
  upcoming(put, { id: "rob-drone", title: "Drone workshop", inDays: 9, hour: 17, place: "Robotics lab", blurb: "Fly, crash safely, rebuild.", rsvp: 9 }, "robotics", "Robotics Society", 4);
  const robotAttendance = ROBOTICS_PAST.map((e) => ({ eventId: e.id, title: e.title, count: e.count }));
  const robotRatings = ROBOTICS_PAST.reduce(
    (acc, e) => ({ n: acc.n + e.ratings.reduce((a, b) => a + b, 0), s: acc.s + e.ratings.reduce((a, n, i) => a + n * (i + 1), 0) }),
    { n: 0, s: 0 },
  );
  put("circleStats/robotics", { eventsHeld: ROBOTICS_PAST.length, uniqueAttendees: robotIds.length - 2, mentorsTrained: 5, attendance: robotAttendance });
  put("activityReports/robotics", {
    circleId: "robotics",
    circleName: "Robotics Society",
    semester: SEMESTER,
    eventsHeld: ROBOTICS_PAST.length,
    attendance: robotAttendance,
    uniqueAttendees: robotIds.length - 2,
    mentorsTrained: 5,
    board: [{ role: "Chair", nickname: "Lara" }, { role: "Events Lead", nickname: "Jad" }, { role: "Logistics", nickname: "Nabil" }],
    highlights: "Five build sessions, a line follower race, and three new mentors.",
    status: "submitted",
    avgFeedback: Math.round((robotRatings.s / robotRatings.n) * 10) / 10,
  });

  let order = 5;
  CLUBS.forEach((club, ci) => {
    const ids = addMembers(put, club.id, club.chair, club.board, club.members, 900 + ci);
    put(`circles/${club.id}`, {
      name: club.name,
      kind: "community",
      verified: true,
      anonymous: false,
      chairUid: club.chair[0],
      charter: club.charter,
      officialLine: "Official UA club",
      memberCount: ids.length,
      activeCount: club.active,
      mentorCount: 2,
      mentorNeeded: 3,
      attendance: club.past.map((e) => e.count),
      modLine: "Be kind. No phone numbers or links.",
      order: club.order,
    });
    club.past.forEach((e) => pastEvent(put, docs, e, club.id, club.name, ids));
    upcoming(put, club.next, club.id, club.name, order++);
    const att = club.past.map((e) => ({ eventId: e.id, title: e.title, count: e.count }));
    const n = club.past.reduce((a, e) => a + e.ratings.reduce((x, y) => x + y, 0), 0);
    const s = club.past.reduce((a, e) => a + e.ratings.reduce((x, k, i) => x + k * (i + 1), 0), 0);
    put(`activityReports/${club.id}`, {
      circleId: club.id,
      circleName: club.name,
      semester: SEMESTER,
      eventsHeld: club.past.length,
      attendance: att,
      uniqueAttendees: Math.max(...club.past.map((e) => e.count)),
      mentorsTrained: 2,
      board: [{ role: "Chair", nickname: club.chair[1] }, ...club.board.map(([, name, role]) => ({ role: role[0].toUpperCase() + role.slice(1), nickname: name }))],
      highlights: `${club.past.map((e) => e.title).join(", ")}.`,
      status: ci === 0 ? "accepted" : "submitted",
      avgFeedback: Math.round((s / n) * 10) / 10,
    });
  });

  /* ---------- Student Affairs: queues ---------- */
  const venue = (id: string, circleId: string, circle: string, chairUid: string, title: string, inDays: number, place: string, ord: number) =>
    put(`venueRequests/${id}`, {
      queue: "event",
      status: "sent",
      circle,
      circleId,
      chairUid,
      initial: circle.slice(0, 1),
      title,
      detail: `${place} · ${dateLabel(at(inDays, 17))}`,
      time: dateLabel(at(inDays, 17)),
      memberCount: Number(docs[`circles/${circleId}`]?.memberCount || 0),
      venueId: place === "Robotics lab" ? "robotics-lab" : "auditorium",
      dateOptions: [dateLabel(at(inDays, 17)), dateLabel(at(inDays + 1, 17))],
      order: ord,
    });
  venue("vr-drone", "robotics", "Robotics Society", "uid-robot-chair", "Drone workshop room", 9, "Robotics lab", 1);
  venue("vr-debate", "debate", "Debate Society", "uid-debate-chair", "Open floor debate", 5, "Auditorium", 2);
  venue("vr-cpr", "red-cross", "Red Cross Youth", "uid-redcross-chair", "CPR certification", 8, "Auditorium", 3);

  put("supportRequests/olive", { uid: "uid-exam-olive", reason: "I’d like to talk", note: "The week feels heavy.", nickname: "Olive", contact: "anonymous", status: "open", at: now - 4 * HOUR });
  put("supportRequests/thyme", { uid: "uid-quiet-thyme", reason: "I’d like to talk", note: "Not sure where to start with exams.", nickname: "Thyme", contact: "anonymous", status: "open", at: now - 9 * HOUR });
  put("cases/fig-care", {
    kind: "care",
    open: true,
    rank: 1,
    nickname: "Fig",
    initial: "F",
    where: "Exam week",
    when: "Today",
    time: "2h",
    careLabel: "Needs care",
    kindLabel: "Care",
    title: "Fig · Exam week",
    topic: "Several heavy check-ins this week",
    reasons: ["Three heavy mood check-ins in a row", "Skipped the last two Circle meetups"],
    steps: [
      { title: "Gentle message sent", sub: "From the app, by nickname", state: "done" },
      { title: "Offer a short talk", sub: "Only if Fig says yes", state: "next" },
    ],
  });

  /* ---------- Petitions: one open to sign, two under review, one delivered ---------- */
  put("petitions/library-hours", { title: "Later library hours", text: "Keep the library open until midnight on exam weeks.", signCount: 86, goal: 120, status: "published", bucket: "open", by: "Exam week", topic: "Campus", order: 1, category: "campus" });
  put("petitions/evening-bus", { title: "Evening bus", short: "Evening bus", text: "One later bus on exam nights.", signCount: 310, goal: 300, status: "pending", bucket: "goal", by: "First-Year Commuters", topic: "Transport", order: 2 });
  put("petitions/fountains", { title: "Water fountains in Block B", short: "Water fountains", text: "Refill points on each floor of Block B.", signCount: 142, goal: 120, status: "pending", bucket: "goal", by: "Red Cross Youth", topic: "Campus", order: 3 });
  put("petitions/microwaves", { title: "More cafeteria microwaves", short: "Microwaves", text: "Two more microwaves so lunch doesn’t take the whole break.", signCount: 205, goal: 150, status: "answered", bucket: "goal", by: "Coffee & Calm", topic: "Campus", response: "Two microwaves added in the cafeteria.", order: 4 });

  /* ---------- Announcements ---------- */
  const announce = (id: string, title: string, body: string, hoursAgo: number, eventDate?: string, pinDays?: number) =>
    put(`announcements/${id}`, {
      title,
      body,
      audience: "everyone",
      audienceKey: "everyone",
      verified: true,
      status: "published",
      authorUid: OSA,
      createdAt: now - hoursAgo * HOUR,
      ...(eventDate ? { eventDate } : {}),
      ...(pinDays ? { pinUntil: now + pinDays * DAY } : {}),
    });
  // Pinned on Home for a week.
  announce("exam-schedule", "Final exam schedule is out", "Check your faculty page. Clashes go to Student Affairs by Friday.", 3, undefined, 7);
  announce("career-fair", "Career fair", "Forty companies in the main hall. Bring a printed CV.", 20, dateLabel(at(12, 10)));
  announce("library-hours", "Library extended hours", "The library stays open until 10 PM on weeknights during exams.", 30);

  /* ---------- You said, we did: four delivered, two in progress ---------- */
  const said = (id: string, title: string, line: string, date: string, daysAgo: number, extra: Record<string, unknown> = {}) =>
    put(`youSaid/${id}`, { title, line, date, source: "Student Affairs", authorUid: OSA, createdAt: now - daysAgo * DAY, ...extra });
  said("library-morning", "Library opens at 7 AM", "You asked for earlier study hours. The library now opens at 7 on weekdays.", "Delivered · this month", 20);
  said("microwaves", "More microwaves", "Two more microwaves in the cafeteria.", "Delivered · this month", 9, { petitionId: "microwaves" });
  said("quiet-rooms", "A quiet study room", "Block C room 4 is now a quiet room, open late on exam weeks.", "Delivered · last month", 35);
  said("shuttle", "Shuttle time change", "The 5 PM shuttle now leaves at 5:20 so late labs can make it.", "Delivered · last month", 40);
  said("library-hours", "Library hours: answer on the way", "Student Affairs is costing a later closing time for exam weeks.", "In progress", 1, { petitionId: "library-hours", source: "Your petition" });
  said("evening-bus", "Evening bus: talking to the bus company", "Your petition reached its goal. We’re asking for one later bus on exam nights.", "In progress", 2, { petitionId: "evening-bus", source: "Your petition" });

  /* ---------- Impact and mood trend ---------- */
  const circles = Object.entries(docs).filter(([p]) => /^circles\/[^/]+$/.test(p));
  const live = circles.filter(([, c]) => c.kind === "support" || c.verified === true);
  const verified = circles.filter(([, c]) => c.kind === "community" && c.verified === true);
  const moodWeeks = [212, 236, 248, 231, 146, 128, 197, 244];
  const examWeeks = [false, false, false, false, true, true, false, false];
  const weekLabel = (ago: number) => {
    const d = new Date(now - ago * 7 * DAY);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const top = [...verified, ...circles.filter(([, c]) => c.kind === "support")]
    .map(([p, c]) => ({ id: p.split("/")[1], name: String(c.name), score: Number(c.activeCount || Math.round(Number(c.memberCount || 0) * 0.6)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  put("impact/fall-2026", {
    semester: SEMESTER,
    events: 38,
    checkIns: 1150,
    // The semester total; the chart shows the last eight weeks of it.
    moodCheckIns: 1942,
    uniqueStudents: 640,
    activeCircles: live.length,
    verifiedCommunities: verified.length,
    newMembers: 96,
    certificatesIssued: 310,
    supportHandled: 27,
    medianFirstReply: "18 h",
    top,
    weeks: moodWeeks.map((score, i) => ({ label: weekLabel(moodWeeks.length - 1 - i), score, exam: examWeeks[i] })),
  });

  // Safety signals this week, by day, as counts. The chart's bar positions come from these.
  const signals = [
    { label: "Mon", calm: 6, heavy: 2 },
    { label: "Tue", calm: 5, heavy: 4 },
    { label: "Wed", calm: 3, heavy: 6 },
    { label: "Thu", calm: 4, heavy: 3 },
    { label: "Fri", calm: 7, heavy: 1 },
  ];
  const peak = Math.max(...signals.map((d) => d.calm + d.heavy));
  put("staffOverview/week", {
    chip: "This week",
    kpis: [],
    weeks: signals.map((d, i) => {
      const hc = Math.round((d.calm / peak) * 100);
      const hh = Math.round((d.heavy / peak) * 100);
      return { label: d.label, x: 20 + i * 62, bars: [{ y: 110 - hc - hh, h: hh, o: 1 }, { y: 110 - hc, h: hc, o: 0.45 }] };
    }),
    legend: [
      { label: "Calm", opacity: 0.45 },
      { label: "Heavy", opacity: 1 },
    ],
    today: [{ title: "Robotics Build Night", sub: "Robotics lab · today", href: "/e/build-night" }],
  });

  /* ---------- Staff community list ---------- */
  for (const [p, c] of verified) {
    const id = p.split("/")[1];
    const next = Object.entries(docs).find(([ep, e]) => ep.startsWith("events/") && !ep.includes("/", 7) && e.hostId === id && e.status === "published");
    const chair = docs[`circles/${id}/members/${String(c.chairUid)}`];
    put(`staffCommunities/${id}`, {
      name: c.name,
      members: Number(c.memberCount || 0),
      next: next ? String(next[1].title) : "No event planned",
      last: Array.isArray(c.attendance) && c.attendance.length ? `Last event: ${(c.attendance as number[]).slice(-1)[0]} attended` : "No events yet",
      requests: Object.entries(docs).filter(([vp, v]) => vp.startsWith("venueRequests/") && v.circleId === id && v.status === "sent").length,
      chair: String(chair?.nickname || ""),
      since: "Sep 2026",
      order: Number(c.order || 0),
    });
  }

  /* ---------- Alumni ---------- */
  const nourEvents = [
    { id: "nour-c2", title: "First aid basics", circle: "Red Cross Youth", date: "Oct 2022", semester: "Fall 2022", role: "attendee", kind: "training" },
    { id: "nour-c1", title: "Robotics Build Night", circle: "Robotics Society", date: "Mar 2023", semester: "Spring 2023", role: "attendee", kind: "event" },
    { id: "nour-c3", title: "Line follower race", circle: "Robotics Society", date: "Apr 2023", semester: "Spring 2023", role: "organizer", kind: "event" },
    { id: "nour-c4", title: "Events Lead", circle: "Robotics Society", date: "2023–2024", semester: "Fall 2023", role: "board", kind: "board" },
    { id: "nour-c5", title: "Mentor hours", circle: "Robotics Society", date: "2024", semester: "Spring 2024", role: "mentor", kind: "mentoring" },
    { id: "nour-c6", title: "Career fair volunteer", circle: "Student Affairs", date: "May 2024", semester: "Spring 2024", role: "organizer", kind: "event" },
  ];
  nourEvents.forEach((e, i) => {
    const code = `NB-${String(2019 + i * 137).slice(-4)}`;
    put(`certificates/${e.id}`, { uid: ALUMNI, code, fullName: "Nour Saab", eventId: e.id, eventTitle: e.title, circleId: "", circleName: e.circle, role: e.role, dateLabel: e.date, semester: e.semester, kind: e.kind });
    put(`certificatePublic/${code}`, { fullName: "Nour Saab", eventTitle: e.title, dateLabel: e.date, valid: true });
  });
  put(`records/${ALUMNI}`, {
    fullName: "Nour Saab",
    totals: {
      events: nourEvents.filter((e) => e.kind === "event").length,
      trainings: nourEvents.filter((e) => e.kind === "training").length,
      mentoring: nourEvents.filter((e) => e.kind === "mentoring").length,
      board: nourEvents.filter((e) => e.kind === "board").length,
    },
    items: nourEvents.map((e, i) => ({
      id: e.id,
      kind: e.kind,
      title: e.title,
      circle: e.circle,
      dateLabel: e.date,
      role: e.role,
      semester: e.semester,
      certificateId: e.id,
      code: `NB-${String(2019 + i * 137).slice(-4)}`,
    })),
    ask: null,
  });
  const mentor = (uid: string, fullName: string, field: string, line: string, offers: string[], classYear: number, ord: number) =>
    put(`alumniMentors/${uid}`, { uid, fullName, field, line, offers, initial: fullName.slice(0, 1), classYear, order: ord });
  mentor("uid-alum-karim", "Karim Haddad", "Civil Engineering · Joined 2017", "Class of 2021. Site engineer, happy to talk first jobs.", ["chat", "cv"], 2021, 2);
  mentor("uid-alum-rana", "Rana Aoun", "Business · Joined 2018", "Class of 2022. Marketing, CV reviews on weekends.", ["cv", "advice"], 2022, 3);
  mentor("uid-alum-elie", "Elie Tannous", "Music · Joined 2016", "Class of 2020. Teaching and composing, ask me anything.", ["chat", "advice"], 2020, 4);

  /* ---------- Admin audit log ---------- */
  const log = (id: string, row: Record<string, unknown>) => put(`auditLogs/${id}`, row);
  log("log-sa-role", { action: "Role change", actor: "Campus Admin", target: "201903318@ua.edu.lb", when: "Sep 2026", category: "role", chip: "Staff", title: "Student Affairs role", detail: "Maya Nassar · 201903318@ua.edu.lb", counselor: "" });
  log("log-chair", { action: "Chair assigned", actor: "Maya Nassar", target: "202148217@ua.edu.lb", when: "Sep 2026", category: "role", chip: "Chair", title: "Robotics Society Chair", detail: "Student Affairs assigned Lara Khoury as Chair", counselor: "" });
  log("log-verify", { action: "Verified community", actor: "Maya Nassar", target: "Red Cross Youth", when: "Oct 2026", category: "role", chip: "Verified", title: "Red Cross Youth verified", detail: "Student Affairs approved the community", counselor: "" });
  log("log-alumni", { action: "Graduated to alumni", actor: "Maya Nassar", target: "201911457@ua.edu.lb", when: "Jun 2024", category: "role", chip: "Alumni", title: "Nour Saab · Class of 2024", detail: "Student Affairs moved the account to alumni", counselor: "" });
  log("log-reveal", { action: "Reveal", actor: "Maya Nassar", target: "A support chat", when: "Oct 2026", category: "reveal", chip: "Reveal", title: "Identity reveal", detail: "A counselor opened a name with a written reason.", counselor: "Maya Nassar" });
}
