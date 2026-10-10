/**
 * Demo seed for the peer Circles (no Chair, no board). Lives only in the demo seed: screens read it
 * through the same data layer as real data. Member counts come from the member records written here.
 */
type Put = (path: string, data: Record<string, unknown>) => void;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Nickname pool. Nicknames are never real names. */
export const NICKS = [
  "Cedar", "Olive", "Pine", "Fig", "Jasmine", "Thyme", "Sage", "Willow", "Maple", "Basil", "Ivy", "Laurel", "Juniper", "Clover", "Fern",
  "Aster", "Birch", "Hazel", "Linden", "Moss", "Poppy", "Rowan", "Sorrel", "Tansy", "Yarrow", "Acacia", "Almond", "Anise", "Bay", "Briar",
  "Carob", "Cypress", "Daisy", "Elm", "Heather", "Iris", "Jade", "Lilac", "Lotus", "Mint", "Myrtle", "Nutmeg", "Oak", "Orchid", "Pebble",
  "Quince", "Reed", "River", "Saffron", "Sumac", "Tulip", "Violet", "Walnut", "Zaatar", "Amber", "Breeze", "Cloud", "Dune", "Ember", "Flint",
  "Harbor", "Lark", "Meadow", "North", "Opal", "Pearl", "Rain", "Shore", "Sky", "Stone", "Tide", "Wren", "Coral", "Dawn", "Echo", "Frost",
  "Glade", "Haven", "Indigo", "Kestrel", "Lagoon", "Marble", "Nova", "Onyx", "Prism", "Quill", "Robin", "Sparrow", "Thistle", "Umber",
];

/** Small deterministic random, so a reset always restores the same seed. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

type Msg = { by: number; text: string; replyTo?: number; daysAgo: number; thanks?: number; kindness?: boolean };

type CircleSeed = {
  id: string;
  name: string;
  charter: string;
  members: number;
  prompt: string;
  answers: string[];
  hope: { text: string; mode: string; replies: { text: string; thanked: boolean }[] };
  chat: Msg[];
  order: number;
};

const CIRCLES: CircleSeed[] = [
  {
    id: "quiet-hour",
    name: "Quiet Hour",
    charter: "A quiet Circle when you want company without a performance.",
    members: 18,
    prompt: "How is the week landing?",
    answers: ["Heavier than I hoped, lighter than last week.", "Slow morning, good afternoon."],
    hope: {
      text: "Couldn’t sleep before the quiz. Anyone else running on two hours?",
      mode: "Quiet mode",
      replies: [
        { text: "Same. A ten-minute walk at lunch helped me more than coffee.", thanked: true },
        { text: "The breathing exercise on Me helped me fall asleep last night.", thanked: false },
      ],
    },
    chat: [
      { by: 0, text: "Library 2nd floor is quiet today if anyone needs a seat.", daysAgo: 12 },
      { by: 1, text: "Thank you, I found one by the window.", replyTo: 0, daysAgo: 12, thanks: 3 },
      { by: 2, text: "Is it okay to just sit here and not talk?", daysAgo: 6 },
      { by: 3, text: "That’s exactly what this Circle is for.", replyTo: 2, daysAgo: 6, thanks: 5 },
      { by: 4, text: "Week 6 check-in: still here, still breathing.", daysAgo: 1 },
    ],
    order: 5,
  },
  {
    id: "commuters",
    name: "First-Year Commuters",
    charter: "Bus times, carpools to campus, and someone to sit with on the ride.",
    members: 41,
    prompt: "What time does your bus leave tomorrow?",
    answers: ["7:10 from Hadath.", "7:30, the full one.", "I’m driving, 2 seats free on Thursday."],
    hope: {
      text: "Missed the last bus twice this week. How do you plan around late labs?",
      mode: "Study mode",
      replies: [
        { text: "I ask the lab TA on Monday which day runs late and plan that night.", thanked: true },
        { text: "The evening bus petition is close to its goal. Sign it.", thanked: true },
        { text: "Leave 10 minutes early and finish the report on the bus.", thanked: false },
      ],
    },
    chat: [
      { by: 0, text: "Anyone from Baabda on the 7:10?", daysAgo: 13 },
      { by: 1, text: "Me. Front seats, usually.", replyTo: 0, daysAgo: 13, thanks: 2 },
      { by: 2, text: "The new schedule moved the 5 PM bus to 5:20.", daysAgo: 8 },
      { by: 3, text: "Life saver. My lab ends at 5:05.", replyTo: 2, daysAgo: 8, thanks: 6 },
      { by: 4, text: "Carpool for Friday’s 8 AM? Two seats.", daysAgo: 3 },
      { by: 5, text: "Taking one, thank you.", replyTo: 4, daysAgo: 3, thanks: 1 },
    ],
    order: 7,
  },
  {
    id: "coffee-calm",
    name: "Coffee & Calm",
    charter: "Short breaks between classes. Coffee optional, calm encouraged.",
    members: 33,
    prompt: "Your best 10-minute break on campus?",
    answers: ["The bench behind the chapel.", "Cafeteria terrace at 11 before the rush."],
    hope: {
      text: "Back-to-back classes all day and no time to eat. Any tips?",
      mode: "Exam mode",
      replies: [
        { text: "Pack something the night before. Small win, big difference.", thanked: true },
        { text: "The cafeteria has the new microwaves now, no line at 12:45.", thanked: false },
      ],
    },
    chat: [
      { by: 0, text: "Terrace in 10 min?", daysAgo: 11 },
      { by: 1, text: "Yalla, ana jeye. Bring the cards.", replyTo: 0, daysAgo: 11, thanks: 2 },
      { by: 2, text: "Today was a lot. Sitting with tea for a bit.", daysAgo: 5 },
      { by: 3, text: "Proud of you for taking the break.", replyTo: 2, daysAgo: 5, thanks: 4 },
      { by: 4, text: "Kifkon el yom? Midterms almost done.", daysAgo: 2 },
    ],
    order: 8,
  },
  {
    id: "night-owls",
    name: "Engineering Night Owls",
    charter: "Late study sessions for engineering students. Problem sets, not pressure.",
    members: 57,
    prompt: "One problem you solved today?",
    answers: ["Finally got the Laplace transform question.", "Fixed the bug in my circuit sim.", "Read the whole Signals chapter."],
    hope: {
      text: "Thermodynamics problem set due Friday and I’m lost on question 4.",
      mode: "Study mode",
      replies: [
        { text: "Start from the energy balance, not the formula sheet.", thanked: true },
        { text: "Old exams on the library shelf have a near copy of Q4.", thanked: true },
      ],
    },
    chat: [
      { by: 0, text: "Who’s still up for the circuits set?", daysAgo: 14 },
      { by: 1, text: "Here. Q3 is mean.", replyTo: 0, daysAgo: 14, thanks: 2 },
      { by: 2, text: "Drew the free-body diagram for Q2, happy to share in person tomorrow.", daysAgo: 9 },
      { by: 3, text: "Yes please, I’ll be in the lab at 10.", replyTo: 2, daysAgo: 9, thanks: 3 },
      { by: 4, text: "I'm stuck on the first exercise of the new set.", daysAgo: 1, kindness: true },
    ],
    order: 9,
  },
  {
    id: "arabic-poetry",
    name: "Arabic Poetry",
    charter: "Read a line, share a line. Classical and new, Arabic and translation.",
    members: 22,
    prompt: "A line that stayed with you this week?",
    answers: ["على قدر أهل العزم تأتي العزائم", "Darwish: we love life whenever we can."],
    hope: {
      text: "Writing my first poem in Arabic for the reading night. Nervous.",
      mode: "Quiet mode",
      replies: [
        { text: "Read it to us first. Small room, kind ears.", thanked: true },
        { text: "Nervous means you care about it.", thanked: false },
      ],
    },
    chat: [
      { by: 0, text: "قصيدة اليوم: الصبر مفتاح الفرج", daysAgo: 10 },
      { by: 1, text: "جميلة. شكراً على المشاركة", replyTo: 0, daysAgo: 10, thanks: 4 },
      { by: 2, text: "Reading night is next Thursday in the small hall.", daysAgo: 4 },
      { by: 3, text: "I’ll bring Qabbani.", replyTo: 2, daysAgo: 4, thanks: 2 },
    ],
    order: 10,
  },
  {
    id: "gym-buddies",
    name: "Gym Buddies",
    charter: "Find someone to train with at the campus gym. All levels.",
    members: 46,
    prompt: "What are you training this week?",
    answers: ["Legs on Tuesday, sadly.", "Just showing up three times."],
    hope: {
      text: "First time at the gym and I don’t know where to start.",
      mode: "Study mode",
      replies: [
        { text: "Come Wednesday at 5. I’ll show you the basics.", thanked: true },
        { text: "Start with 20 minutes. Showing up is the hard part.", thanked: true },
      ],
    },
    chat: [
      { by: 0, text: "Anyone at the gym at 7 AM tomorrow?", daysAgo: 12 },
      { by: 1, text: "Me, see you at the door.", replyTo: 0, daysAgo: 12, thanks: 1 },
      { by: 2, text: "Gym hours change during exams: 7 AM to 9 PM.", daysAgo: 7 },
      { by: 3, text: "Good to know, thanks.", replyTo: 2, daysAgo: 7, thanks: 3 },
      { by: 4, text: "Stretching session Friday after the last class.", daysAgo: 2 },
    ],
    order: 11,
  },
  {
    id: "music-corner",
    name: "Music Corner",
    charter: "Swap playlists, jam on Fridays, and borrow the practice room.",
    members: 29,
    prompt: "What’s on your study playlist?",
    answers: ["Fairuz in the morning, lo-fi at night.", "Ziad Rahbani, always."],
    hope: {
      text: "Looking for someone to accompany me on oud for the talent night.",
      mode: "Quiet mode",
      replies: [
        { text: "I play percussion. Practice room Thursday?", thanked: true },
        { text: "Ask in the jam on Friday, a few oud players come.", thanked: false },
      ],
    },
    chat: [
      { by: 0, text: "Friday jam is on, practice room B.", daysAgo: 13 },
      { by: 1, text: "Bringing my guitar.", replyTo: 0, daysAgo: 13, thanks: 2 },
      { by: 2, text: "Shared playlist for exam week: calm, no lyrics.", daysAgo: 6 },
      { by: 3, text: "Exactly what I needed, thank you.", replyTo: 2, daysAgo: 6, thanks: 7 },
    ],
    order: 12,
  },
];

/** Exam week keeps its five named members first; the rest come from the pool. */
const EXAM_WEEK_EXTRA = 19;

function memberIds(circleId: string, count: number) {
  return Array.from({ length: count }, (_, i) => `uid-${circleId}-${String(i + 1).padStart(2, "0")}`);
}

function putMember(put: Put, circleId: string, uid: string, nickname: string, order: number) {
  put(`circles/${circleId}/members/${uid}`, {
    nickname,
    displayName: nickname,
    initial: nickname.slice(0, 1).toUpperCase(),
    order,
    roles: [],
  });
}

/** Writes the peer Circles, their members, today's prompt, a Hope thread, a meetup card and two weeks of chat. */
export function seedPeerCircles(put: Put) {
  const today = new Date().toDateString();
  const now = Date.now();
  CIRCLES.forEach((c, ci) => {
    const rand = rng(ci * 7919 + 17);
    const pool = [...NICKS].sort(() => rand() - 0.5);
    const names = pool.slice(0, c.members);
    const ids = memberIds(c.id, c.members);
    ids.forEach((uid, i) => putMember(put, c.id, uid, names[i], i + 1));
    put(`circles/${c.id}`, {
      name: c.name,
      kind: "support",
      verified: false,
      anonymous: true,
      charter: c.charter,
      officialLine: "Circle",
      memberCount: ids.length,
      hereCount: 1 + Math.floor(rand() * 5),
      modLine: "Moderated by a campus counselor · nicknames only",
      prompt: c.prompt,
      promptMeta: "Today’s prompt · clears tomorrow",
      promptFaces: names.slice(0, 3).map((n) => n.slice(0, 1)),
      order: c.order,
    });
    c.answers.forEach((text, i) => {
      const uid = ids[i + 3];
      put(`circles/${c.id}/prompts/today/answers/${uid}`, {
        authorUid: uid,
        displayName: names[i + 3],
        initial: names[i + 3].slice(0, 1),
        text,
        order: now - (4 - i) * HOUR,
        day: today,
      });
    });
    put(`circles/${c.id}/threads/hope`, {
      authorUid: ids[0],
      nickname: names[0],
      initial: names[0].slice(0, 1),
      text: c.hope.text,
      mode: c.hope.mode,
      when: "2d",
      createdAt: now - 2 * DAY,
    });
    c.hope.replies.forEach((r, i) => {
      put(`circles/${c.id}/threads/hope/replies/r${i + 1}`, {
        authorUid: ids[i + 1],
        nickname: names[i + 1],
        initial: names[i + 1].slice(0, 1),
        when: `${2 - Math.min(i, 1)}d`,
        text: r.text,
        thankedBy: r.thanked ? [ids[0]] : [],
        order: i + 1,
      });
    });
    put(`circles/${c.id}/meetups/quiet-sit`, {
      title: "Propose a meetup",
      kinds: ["Talk", "Quiet sit", "Short meditation"],
      selected: "Quiet sit",
      note: "A counselor approves the campus spot.",
      approvedLine: "",
    });
    c.chat.forEach((m, i) => {
      const uid = ids[(m.by * 3 + 2) % ids.length];
      const name = names[(m.by * 3 + 2) % ids.length];
      put(`circles/${c.id}/messages/s${i + 1}`, {
        authorUid: uid,
        authorNickname: name,
        initial: name.slice(0, 1),
        text: m.text,
        kind: "text",
        createdAt: now - m.daysAgo * DAY - (6 - i) * HOUR,
        ...(m.replyTo !== undefined ? { replyTo: `s${m.replyTo + 1}` } : {}),
        ...(m.thanks ? { reactions: [{ icon: "root", label: `${m.thanks} thanks` }] } : {}),
        ...(m.kindness ? { kindness: true, kindnessClosed: false } : {}),
      });
    });
  });
}

/** Extra Exam week members after the five named ones, so the Circle reads as a real one. */
export function seedExamWeekExtra(put: Put, startOrder: number) {
  const rand = rng(4242);
  const taken = new Set(["Cedar", "Olive", "Pine", "Fig", "Jasmine"]);
  const names = [...NICKS].filter((n) => !taken.has(n)).sort(() => rand() - 0.5).slice(0, EXAM_WEEK_EXTRA);
  names.forEach((name, i) => putMember(put, "exam-week", `uid-exam-${String(i + 6).padStart(2, "0")}`, name, startOrder + i));
  return names.length;
}
