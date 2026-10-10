import { DEMO_PASSWORD } from "./mode";
import { voiceBundle } from "../voice/bundle";
import { seedExamWeekExtra, seedPeerCircles } from "./seedCircles";

export type SeedAccount = {
  email: string;
  password: string;
  uid: string;
  claims: Record<string, unknown>;
};

export type SeedBlob = {
  day: string;
  sessionUid: string | null;
  accounts: SeedAccount[];
  docs: Record<string, Record<string, unknown>>;
};

const STUDENT = "uid-student";
const OSA = "uid-osa";
const ALUMNI = "uid-alumni";
const ADMIN = "uid-admin";
const CHAIR = "uid-robot-chair";

function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function weekLabel(weeksAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function user(
  put: (path: string, data: Record<string, unknown>) => void,
  uid: string,
  pub: Record<string, unknown>,
  priv: Record<string, unknown>,
) {
  put(`users/${uid}`, {
    status: "approved",
    plant: { petals: 0, roots: 0, stage: "Seed" },
    ...pub,
  });
  put(`users_private/${uid}`, priv);
  put(`users/${uid}/settings/main`, {
    hideGardenCount: false,
    dropGoing: false,
    accessibility: { offerTyping: true, quietPresence: true },
  });
}

function member(
  put: (path: string, data: Record<string, unknown>) => void,
  circleId: string,
  uid: string,
  nickname: string,
  order: number,
  roles: string[] = [],
) {
  put(`circles/${circleId}/members/${uid}`, {
    nickname,
    displayName: nickname,
    initial: nickname.slice(0, 1).toUpperCase(),
    order,
    roles,
  });
}

export function buildSeed(): SeedBlob {
  const docs: Record<string, Record<string, unknown>> = {};
  const put = (path: string, data: Record<string, unknown>) => {
    docs[path] = data;
  };
  const now = new Date();
  const day = String(now.getDate());
  const mon = now.toLocaleDateString("en-US", { month: "short" });

  const accounts: SeedAccount[] = [
    {
      email: "202212826@ua.edu.lb",
      password: DEMO_PASSWORD,
      uid: STUDENT,
      claims: { role: "student", status: "approved", sa: false },
    },
    {
      email: "201903318@ua.edu.lb",
      password: DEMO_PASSWORD,
      uid: OSA,
      claims: { role: "staff", status: "approved", sa: true, counselor: true },
    },
    {
      email: "201911457@ua.edu.lb",
      password: DEMO_PASSWORD,
      uid: ALUMNI,
      claims: { role: "alumni", status: "approved", sa: false, alumni: true },
    },
    {
      email: "admin@ua.edu.lb",
      password: DEMO_PASSWORD,
      uid: ADMIN,
      claims: { role: "admin", status: "approved", admin: true, sa: false },
    },
    {
      email: "202148217@ua.edu.lb",
      password: DEMO_PASSWORD,
      uid: CHAIR,
      claims: { role: "student", status: "approved", sa: false },
    },
  ];

  user(put, STUDENT, {
    nickname: "",
    greetingName: "",
    initial: "",
    role: "student",
    roleLabel: "Student",
    faculty: "Faculty of Engineering",
    plant: { petals: 0, roots: 0, stage: "Seed" },
  }, {
    fullName: "",
    studentId: "202212826",
    email: "202212826@ua.edu.lb",
  });
  user(put, OSA, {
    nickname: "Maya",
    greetingName: "Maya",
    initial: "M",
    role: "staff",
    roleLabel: "Student Affairs",
    plant: { petals: 4, roots: 2, stage: "Bloom" },
  }, {
    fullName: "Maya Nassar",
    studentId: "201903318",
    email: "201903318@ua.edu.lb",
  });
  user(put, ALUMNI, {
    nickname: "Nour",
    greetingName: "Nour",
    initial: "N",
    role: "alumni",
    roleLabel: "Alumni",
    alumni: true,
    classYear: 2024,
    plant: { petals: 6, roots: 3, stage: "Bloom" },
  }, {
    fullName: "Nour Saab",
    studentId: "201911457",
    email: "201911457@ua.edu.lb",
  });
  user(put, ADMIN, {
    nickname: "Admin",
    greetingName: "Admin",
    initial: "A",
    role: "admin",
    roleLabel: "Admin",
  }, {
    fullName: "Campus Admin",
    studentId: "",
    email: "admin@ua.edu.lb",
  });
  user(put, CHAIR, {
    nickname: "Lara",
    greetingName: "Lara",
    initial: "L",
    role: "student",
    roleLabel: "Chair",
    faculty: "Faculty of Engineering",
    plant: { petals: 3, roots: 1, stage: "Bloom" },
  }, {
    fullName: "Lara Khoury",
    studentId: "202148217",
    email: "202148217@ua.edu.lb",
  });

  put("microActions/today", {
    title: "One small step today",
    body: "Check in with how you feel. A petal grows each time you do.",
  });
  put(`records/${STUDENT}`, {
    fullName: "",
    totals: { events: 0, trainings: 0, mentoring: 0, board: 0 },
    items: [],
    ask: null,
  });
  put(`records/${ALUMNI}`, {
    fullName: "Nour Saab",
    totals: { events: 4, trainings: 1, mentoring: 2, board: 1 },
    items: [
      {
        id: "alum-mentor",
        kind: "mentoring",
        title: "Mentor hours",
        circle: "Robotics Society",
        dateLabel: "2024",
        role: "mentor",
        semester: "Class of 2024",
        code: "NB-2019",
      },
    ],
    ask: null,
  });

  put("circles/robotics", {
    name: "Robotics Society",
    kind: "community",
    verified: true,
    anonymous: false,
    chairUid: CHAIR,
    charter: "Build nights, wiring help, and a calm room when a project stalls.",
    officialLine: "Official UA club",
    memberCount: 20,
    activeCount: 14,
    hereCount: 4,
    mentorCount: 3,
    mentorNeeded: 5,
    attendance: [12, 16, 9, 18, 20],
    needs: [
      { title: "Wiring mentor", sub: "One more mentor for Build Night" },
      { title: "Lab confirmed", sub: "Student Affairs approved the room" },
    ],
    modLine: "Be kind. No phone numbers or links.",
    prompt: "What are you building tonight?",
    order: 1,
  });
  const board: [string, string, string][] = [
    ["uid-robot-chair", "Lara", "chair"],
    ["uid-robot-events", "Jad", "events"],
    ["uid-robot-log", "Nabil", "logistics"],
  ];
  board.forEach(([uid, name, role], index) => member(put, "robotics", uid, name, index + 1, [role]));
  const more = ["Rana", "Karim", "Tala", "Lina", "Omar", "Dina", "Fadi", "Rita", "Elie", "Sara", "Walid", "Joya", "Bassem", "Celine", "Yara", "Ziad", "Mira"];
  const mentors = new Set(["Rana", "Karim", "Lina"]);
  more.forEach((name, index) => member(put, "robotics", `uid-robot-${String(index + 4).padStart(2, "0")}`, name, index + 4, mentors.has(name) ? ["mentor"] : []));
  put("circles/robotics/joinRequests/uid-join-nadine", {
    status: "pending",
    nickname: "Nadine",
  });

  const hour = 60 * 60 * 1000;
  put("circles/robotics/messages/msg-parent", {
    authorUid: "uid-robot-06",
    authorNickname: "Tala",
    initial: "T",
    text: "The wiring diagram is on the board.",
    kind: "text",
    createdAt: Date.now() - 3 * hour,
  });
  put("circles/robotics/messages/msg-reply", {
    authorUid: "uid-robot-05",
    authorNickname: "Karim",
    initial: "K",
    text: "That unblocked me. Thank you.",
    kind: "text",
    replyTo: "msg-parent",
    createdAt: Date.now() - 2 * hour,
  });
  put("circles/robotics/messages/msg-stuck", {
    authorUid: "uid-robot-04",
    authorNickname: "Rana",
    initial: "R",
    text: "I'm stuck on the first exercise",
    kind: "text",
    kindness: true,
    kindnessClosed: false,
    createdAt: Date.now() - 1 * hour,
  });

  put("circles/film", {
    name: "Film Society",
    kind: "community",
    verified: true,
    anonymous: false,
    chairUid: "uid-film-chair",
    charter: "Screenings and a short talk after the lights come up.",
    officialLine: "Official UA club",
    memberCount: 16,
    order: 2,
  });
  member(put, "film", "uid-film-chair", "Lea", 1, ["chair"]);
  put("circles/debate", {
    name: "Debate Club",
    kind: "community",
    verified: true,
    anonymous: false,
    chairUid: "uid-debate-chair",
    charter: "One topic, two sides, and a chair who keeps it kind.",
    officialLine: "Official UA club",
    memberCount: 12,
    order: 3,
  });
  member(put, "debate", "uid-debate-chair", "Sami", 1, ["chair"]);
  put("circles/green", {
    name: "Green Campus",
    kind: "community",
    verified: true,
    anonymous: false,
    chairUid: "uid-green-chair",
    charter: "Campus gardens, reuse drives, and a weekly walk.",
    officialLine: "Official UA club",
    memberCount: 9,
    order: 4,
  });
  member(put, "green", "uid-green-chair", "Yara", 1, ["chair"]);
  seedPeerCircles(put);
  put("circles/exam-week", {
    name: "Exam week",
    kind: "support",
    verified: false,
    anonymous: true,
    officialLine: "Circle",
    charter: "A lighter week, one small step at a time.",
    modLine: "Moderated by a campus counselor · nicknames only",
    prompt: "One thing that helped you study today?",
    promptMeta: "Today’s prompt · clears tomorrow",
    promptFaces: ["P", "F", "J"],
    hereCount: 4,
    order: 6,
  });
  const examMembers: [string, string, string][] = [
    ["uid-exam-cedar", "Cedar", "C"],
    ["uid-exam-olive", "Olive", "O"],
    ["uid-exam-pine", "Pine", "P"],
    ["uid-exam-fig", "Fig", "F"],
    ["uid-exam-jasmine", "Jasmine", "J"],
  ];
  examMembers.forEach(([uid, name], index) => member(put, "exam-week", uid, name, index + 1));
  const examExtra = seedExamWeekExtra(put, examMembers.length + 1);
  docs["circles/exam-week"].memberCount = examMembers.length + examExtra;
  const morning = Date.now() - 4 * hour;
  const examAnswers: [string, string, string, string][] = [
    ["uid-exam-pine", "Pine", "P", "The window seat in Faculty of Engineering."],
    ["uid-exam-fig", "Fig", "F", "Phone in my bag until the break."],
    ["uid-exam-jasmine", "Jasmine", "J", "Old exams from the library shelf."],
  ];
  examAnswers.forEach(([uid, displayName, initial, text], index) =>
    put(`circles/exam-week/prompts/today/answers/${uid}`, { authorUid: uid, displayName, initial, text, order: morning + index, day: new Date().toDateString() }),
  );
  put("circles/exam-week/threads/hope", {
    authorUid: "uid-exam-olive",
    nickname: "Olive",
    initial: "O",
    text: "Stuck on the last chapter of Signals. Can’t start.",
    mode: "Exam mode",
    when: "1h",
    createdAt: Date.now() - hour,
  });
  put("circles/exam-week/threads/hope/replies/cedar", {
    authorUid: "uid-exam-cedar",
    nickname: "Cedar",
    initial: "C",
    when: "40m",
    text: "Summary page only. Ten minutes.",
    thankedBy: ["uid-exam-olive"],
    order: 1,
  });
  put("circles/exam-week/threads/hope/replies/pine", {
    authorUid: "uid-exam-pine",
    nickname: "Pine",
    initial: "P",
    when: "25m",
    text: "Same chapter. Let’s start together.",
    thankedBy: [],
    order: 2,
  });
  put("circles/exam-week/meetups/quiet-sit", {
    title: "Propose a meetup",
    kinds: ["Talk", "Quiet sit", "Short meditation"],
    selected: "Quiet sit",
    note: "A counselor approves the campus spot.",
    approvedLine: "Last time: Quiet sit · Library, 2nd floor · approved",
  });
  const examChat: [string, string, string, string, string, string, number][] = [
    ["m1", "uid-exam-olive", "Olive", "O", "Anyone else stuck on Signals ch. 7?", "text", morning + 1],
    ["m2", "uid-exam-pine", "Pine", "P", "Same. Summary page, ten minutes, then we compare?", "text", morning + 2],
    ["m4", "uid-exam-cedar", "Cedar", "C", "I’m in. Library 2nd floor works for me.", "text", morning + 4],
    ["m5", "uid-exam-jasmine", "Jasmine", "J", "Bringing last year’s exams.", "text", morning + 5],
  ];
  examChat.forEach(([id, authorUid, authorNickname, initial, text, kind, createdAt]) =>
    put(`circles/exam-week/messages/${id}`, { authorUid, authorNickname, initial, text, kind, createdAt }),
  );
  put("circles/cedar-club", {
    name: "Cedar Club",
    kind: "community",
    verified: false,
    anonymous: false,
    chairUid: "uid-cedar-chair",
    charter: "Waiting on Student Affairs before it can be verified.",
    officialLine: "Not verified yet",
    memberCount: 4,
    order: 9,
  });

  put("events/build-night", {
    title: "Robotics Build Night",
    hostLabel: "Robotics Society",
    verified: true,
    kicker: "Today",
    meta: "Today · Robotics lab",
    day,
    mon,
    rsvpCount: 12,
    whenLine: "Today · 6:00–9:00 PM",
    placeLine: "Robotics lab · approved by Student Affairs",
    blurb: "Build, wire, and stay for the demo. The room is already approved.",
    goingLine: "A few members are going",
    status: "published",
    hostType: "circle",
    hostId: "robotics",
    order: 1,
    checkIn: true,
    startsAt: at(0, 9, 0),
    endsAt: at(0, 23, 59),
    venueStatus: "approved",
    description: "Hands-on build night in the robotics lab.",
    ended: false,
  });
  put("events/film-night", {
    title: "Film Society screening",
    hostLabel: "Film Society",
    verified: true,
    meta: "This week · Auditorium",
    day: String(new Date(at(3, 18)).getDate()),
    mon: new Date(at(3, 18)).toLocaleDateString("en-US", { month: "short" }),
    whenLine: "In 3 days · 6:00 PM",
    placeLine: "Auditorium",
    blurb: "A short film and a quieter conversation after.",
    status: "published",
    hostType: "circle",
    hostId: "film",
    order: 2,
    startsAt: at(3, 18),
    endsAt: at(3, 20),
    venueStatus: "approved",
  });
  put("events/wellbeing-walk", {
    title: "Campus wellbeing walk",
    hostLabel: "Student Affairs",
    verified: true,
    meta: "Next week · Main gate",
    day: String(new Date(at(6, 16)).getDate()),
    mon: new Date(at(6, 16)).toLocaleDateString("en-US", { month: "short" }),
    whenLine: "Next week · 4:00 PM",
    placeLine: "Main gate",
    blurb: "A short walk. Come as you are.",
    status: "published",
    hostType: "sa",
    hostId: "sa",
    order: 3,
    startsAt: at(6, 16),
    endsAt: at(6, 17),
    venueStatus: "approved",
  });

  put("petitions/library-hours", {
    title: "Later library hours",
    text: "Keep the library open until midnight on exam weeks.",
    signCount: 24,
    goal: 80,
    status: "published",
    bucket: "open",
    by: "Film Society",
    topic: "Campus",
    order: 1,
    category: "campus",
  });
  put("petitions/quiet-rooms", {
    title: "More quiet rooms",
    text: "Two more quiet rooms in Block C during exams.",
    signCount: 12,
    goal: 40,
    status: "pending",
    bucket: "pending",
    by: "Quiet Hour",
    topic: "Space",
    order: 2,
  });
  put("petitions/fountains", {
    title: "Water fountains in Block B",
    text: "Refill points on each floor of Block B.",
    signCount: 8,
    goal: 30,
    status: "pending",
    bucket: "pending",
    by: "Green Campus",
    topic: "Campus",
    order: 3,
  });
  put("petitions/evening-bus", {
    title: "Evening bus",
    text: "One later bus on exam nights.",
    signCount: 41,
    goal: 40,
    status: "pending",
    bucket: "goal",
    by: "Debate Club",
    topic: "Transport",
    short: "Evening bus",
    order: 4,
  });

  put("venueRequests/vr-lab", {
    queue: "pitch",
    status: "sent",
    circle: "Robotics Society",
    circleId: "robotics",
    title: "Build night room",
    detail: "Robotics lab, this evening",
    initial: "R",
    time: "Today",
    order: 1,
    chairUid: "uid-robot-chair",
  });
  put("venueRequests/vr-screen", {
    queue: "pitch",
    status: "sent",
    circle: "Film Society",
    circleId: "film",
    title: "Screening room",
    detail: "Auditorium, later this week",
    initial: "F",
    time: "This week",
    order: 2,
    chairUid: "uid-film-chair",
  });
  put("communityReviews/cedar-club", {
    status: "waiting",
    name: "Cedar Club",
    sub: "New community · waiting",
    initial: "C",
    order: 1,
  });
  put("venues/robotics-lab", { name: "Robotics lab", building: "Engineering" });
  put("venues/auditorium", { name: "Auditorium", building: "Main" });

  put("announcements/library", {
    title: "Library hours this exam week",
    body: "The library stays open until 10 on weeknights.",
    audience: "everyone",
    audienceKey: "everyone",
    verified: true,
    status: "published",
    authorUid: OSA,
    createdAt: Date.now() - 2 * hour,
  });
  put("announcements/quiet", {
    title: "Quiet rooms are open",
    body: "Block C rooms 2 and 4 are unlocked after 6.",
    audience: "everyone",
    audienceKey: "everyone",
    verified: true,
    status: "published",
    authorUid: OSA,
    createdAt: Date.now() - 5 * hour,
  });
  put("announcements/walk", {
    title: "Wellbeing walk",
    body: "Meet at the main gate next week. No signup list.",
    audience: "everyone",
    audienceKey: "everyone",
    verified: true,
    status: "published",
    authorUid: OSA,
    createdAt: Date.now() - 26 * hour,
  });
  put("youSaid/quiet-rooms", {
    title: "Quiet rooms during exams",
    line: "Two rooms in Block C now stay open late on exam weeks.",
    date: "This month",
    source: "Student Affairs",
    forEveryone: true,
    authorUid: OSA,
    createdAt: Date.now() - 3 * hour,
  });

  put("youSaid/library-hours", {
    title: "Library hours: answer on the way",
    line: "Student Affairs is costing a later closing time for exam weeks.",
    date: "This week",
    source: "Your petition",
    petitionId: "library-hours",
    authorUid: OSA,
    createdAt: Date.now() - hour,
  });

  put("supportRequests/olive", {
    uid: "uid-olive",
    reason: "Stress or exams",
    note: "The week feels heavy.",
    nickname: "Olive",
    contact: "anonymous",
    status: "open",
    at: Date.now() - 4 * hour,
  });

  const scores = [72, 68, 64, 30, 26, 61];
  const exams = [false, false, false, true, true, false];
  put("impact/fall-2026", {
    semester: "Fall 2026",
    events: 6,
    checkIns: 48,
    uniqueStudents: 120,
    activeCircles: 6,
    verifiedCommunities: 4,
    newMembers: 11,
    top: [{ id: "robotics", name: "Robotics Society", score: 18 }],
    weeks: [5, 4, 3, 2, 1, 0].map((ago, index) => ({
      label: weekLabel(ago),
      score: scores[index],
      exam: exams[index],
    })),
  });
  put("staffOverview/week", {
    chip: "This week",
    kpis: [],
    weeks: [
      { label: "Mon", x: 20, bars: [{ y: 40, h: 50, o: 0.45 }] },
      { label: "Tue", x: 70, bars: [{ y: 55, h: 35, o: 0.7 }] },
      { label: "Wed", x: 120, bars: [{ y: 30, h: 60, o: 1 }] },
    ],
    legend: [
      { label: "Calm", opacity: 0.45 },
      { label: "Heavy", opacity: 1 },
    ],
    today: [{ title: "Robotics Build Night", sub: "Robotics lab · today", href: "/e/build-night" }],
  });
  put(`staffProfile/${OSA}`, { name: "Maya Nassar", onCall: true });

  put(`alumniMentors/${ALUMNI}`, {
    uid: ALUMNI,
    fullName: "Nour Saab",
    field: "Engineering · Joined 2019",
    line: "Class of 2024. I still take a short chat about a first job.",
    offers: ["chat", "advice"],
    initial: "N",
    classYear: 2024,
    order: 1,
  });
  put("mentorRequests/hadi", {
    fromUid: "uid-hadi",
    toUid: ALUMNI,
    fromName: "Hadi",
    toName: "Nour Saab",
    message: "Could we talk about a first robotics job?",
    status: "pending",
    createdAt: Date.now() - 6 * hour,
  });

  put("auditLogs/log-role", {
    action: "Role change",
    actor: "Campus Admin",
    target: "201903318@ua.edu.lb",
    when: "Sep 2026",
    category: "role",
    chip: "Staff",
    title: "Student Affairs role",
    detail: "Maya Nassar · 201903318@ua.edu.lb",
    counselor: "",
  });
  put("auditLogs/log-reveal", {
    action: "Reveal",
    actor: "Maya Nassar",
    target: "A support chat",
    when: "Oct 2026",
    category: "reveal",
    chip: "Reveal",
    title: "Identity reveal",
    detail: "A counselor opened a name with a written reason.",
    counselor: "Maya Nassar",
  });

  put("voiceSafety/bundle", voiceBundle);

  return { day: now.toDateString(), sessionUid: null, accounts, docs };
}
