/**
 * Hope Node + rewards seed. Run AFTER scripts/seed.mjs.
 * Merges the Faculty of Engineering node (keeps the Home row) and never replaces users.plant.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed/node-rewards.mjs
 *
 * Today's Faculty of Engineering check-in is left open so a live tap adds a petal.
 * SEED_TODAY_CHECKIN=1 writes the already-checked doc instead.
 * node scripts/seed/reset-node-checkin.mjs clears it again.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();

const day = "2026-10-08";
const morning = Date.parse("2026-10-08T09:24:00Z");

const notes = [
  ["n1", "cedar", "Cedar", "One page, then a breath.", 1],
  ["n2", "cedar", "Cedar", "Window seat was enough.", 2],
  ["n3", "pine", "Gentle Pine", "Whatever you finish today is enough.", 3],
  ["n4", "cedar", "Quiet Cedar", "You’re allowed to rest before you’ve earned it.", 4],
  ["n5", "olive", "Gentle Olive", "The library light was enough.", 5],
  ["n6", "jasmine", "Warm Jasmine", "Sit before you start.", 6],
  ["n7", "fig", "Kind Fig", "One kind page counts.", 7],
  ["n8", "maple", "Calm Maple", "You can leave the rest.", 8],
  ["n9", "pine", "Soft Pine", "Breathe, then the next line.", 9],
  ["n10", "olive", "Quiet Willow", "The courtyard can wait.", 10],
  ["n11", "fig", "Cedar Moss", "Water, then one problem.", 11],
  ["n12", "nour-alum", "Nour", "Alumni still remember this hall.", 12],
  ["n13", "rami-alum", "Steady Rami", "Finish the page you started.", 13],
  ["n14", "olive", "Lina", "You showed up. That is the work.", 14],
];

async function main() {
  const batch = db.batch();
  const set = (path, data, merge = false) => batch.set(db.doc(path), data, merge ? { merge: true } : undefined);

  set(
    "nodes/engineering",
    {
      name: "Faculty of Engineering",
      title: "Faculty of Engineering node is awake",
      hours: "Breathing hour today, 1–2 PM",
      awake: true,
      status: "active",
      inboxOrder: 2,
      clockLabel: "1:12 PM",
      featuredOrder: 3,
      offlineAt: "9:40 AM",
      offlineBody: "This node is offline. Check-ins and notes still work on your phone.",
      phoneOffline:
        "It went offline at 9:40 AM. Your check-in still counts: we saved it on your phone and it syncs when the node is back.",
      bloomsToday: 3,
      bloomLine: "Someone’s hope is growing. Yours can too.",
      circleId: "engineering-quiet",
      circleName: "Engineering quiet hour",
      memberCount: 9,
      emptyLine: "No notes yet today.",
      emptyFoot: "Notes clear every night and start fresh at 8 AM.",
      photoSeconds: 20,
      phoneLiveSeconds: 14,
      queueLine: "Queue position 3 · about 20 s · clears tomorrow · a copy stays in My notes",
      checkinLine: "Checked in at Faculty of Engineering · see your phone",
      mode: "normal",
      eventId: "",
      eventTitle: "",
      presentCount: 0,
    },
    true,
  );

  set("nodes/engineering/live/current", { event: "idle" });
  set("nodes/engineering/drops/today", {
    kind: "breathing",
    title: "Breathing hour",
    window: "1–2 PM",
    body: "Stand by the node. Its light ring grows as you breathe in and fades as you breathe out. Five minutes is enough.",
    short: "Five slow minutes with the node’s light ring.",
    phoneLine: "Breathing hour · 1–2 PM, on your phone",
    remind: "Remind me at 1 PM",
    durationLabel: "3:20",
    guide: "In for 4 · out for 4",
    follow: "The light ring follows you.",
  });

  notes.forEach(([id, authorUid, nickname, text, order], i) => {
    set(`nodes/engineering/notes/${id}`, {
      authorUid,
      nickname,
      text,
      status: "approved",
      order,
      createdAt: Timestamp.fromMillis(morning + i * 1000),
    });
  });

  set(
    "users/cedar",
    { sproutLabel: "4th sprouting" },
    true,
  );

  const givers = [
    { nickname: "Pine", initial: "P", roots: 3 },
    { nickname: "Jasmine", initial: "J", roots: 1 },
    { nickname: "Olive", initial: "O", roots: 1 },
  ];
  set("users/cedar/garden/l1", { n: 1, name: "Finals fall", order: 1, petals: 7, roots: 4, days: 9, place: "Library", semester: "Fall 2026", bloomedLabel: "Bloomed Oct 1" });
  set("users/cedar/garden/l2", { n: 2, name: "Tuesday sits", order: 2, petals: 7, roots: 3, days: 11, place: "Faculty of Engineering", semester: "Fall 2026", bloomedLabel: "Bloomed Oct 4" });
  set("users/cedar/garden/l3", {
    n: 3,
    name: "The Signals bloom",
    order: 3,
    petals: 7,
    roots: 5,
    days: 12,
    place: "Faculty of Engineering",
    semester: "Fall 2026",
    bloomedLabel: "Bloomed Oct 7",
    rootGivers: givers,
    dedicatedTo: "Pine",
    dedicationNote: "Thanks for the Tuesday quiet sits.",
    suggestions: ["Finals fall", "Tuesday sits", "First one"],
  });

  const badges = [
    ["exam-week", "Exam Week", "Circle", 1, 1, true, false, false, "", "", "", "", "", ""],
    ["circle-helper", "Circle helper", "Circle", 1, 2, false, false, false, "", "", "", "", "", ""],
    ["engineering-regular", "Engineering regular", "Node", 2, 1, true, false, false, "", "", "", "", "", ""],
    ["breathing-hour", "Breathing hour", "Node", 2, 2, false, false, true, "", "", "", "Breathing hour badge", "Limited · today only", "Earned at Faculty of Engineering node · Oct 7"],
    ["first-bloom", "First bloom", "Bloom stage", 3, 1, false, false, false, "", "", "", "", "", ""],
    ["third-bloom", "Third bloom", "Bloom stage", 3, 2, false, true, false, "", "", "", "", "", ""],
    ["october-bloom", "October bloom", "Campus moment", 4, 1, false, false, true, "Campus moment · October campaign", "Oct 4, 2026 · Faculty of Engineering node", "Oct 1–31 · no longer earnable after", "", "", ""],
    ["spring-fair", "Spring fair 2026", "Campus moment", 4, 2, false, true, true, "", "", "", "", "", ""],
  ];
  for (const [id, name, group, groupOrder, order, pinned, locked, limited, source, earned, window, dropTitle, dropChip, dropEarned] of badges) {
    set(`users/cedar/earned/${id}`, { name, group, groupOrder, order, pinned, locked, limited, source, earned, window, dropTitle, dropChip, dropEarned });
  }

  set("users/cedar/nodeNotes/on-screen", { state: "On screen", place: "Faculty of Engineering · today", text: "You’re allowed to rest before you’ve earned it.", order: 1 });
  set("users/cedar/nodeNotes/cleared", { state: "Cleared", place: "Library · Oct 3", text: "Whatever you finish today is enough.", order: 2 });
  set("users/cedar/nodeNotes/held", { state: "Held by filter", place: "Faculty of Engineering · Oct 1", text: "call me if you…", order: 3 });
  set("users/cedar/drafts/node-note", { text: "You’re allowed to rest before you’ve earned it." });

  set("perks/bloom-kit", { tier: 1, title: "Bloom badge · story card · dedicate", sort: 1, unlockedLabel: "Unlocked" });
  set("perks/coffee", {
    tier: 3,
    title: "Coffee at the cafeteria",
    showTitle: "Coffee at UA cafeteria",
    partnerLine: "Proposed partner · planned, to be confirmed",
    once: "Once per semester · no cash value",
    privacy: "The cafeteria sees only valid/used. Never your name or garden.",
    perkShort: "Coffee",
    sort: 2,
    counterLine: "Proposed partner · show this at the counter",
  });
  set("perks/priority", { tier: 5, title: "Priority event seat", sort: 3, remainingLabel: "2 to go" });

  set("campusGoal/current", {
    title: "UA garden",
    chip: "Planned partnership",
    current: 412,
    target: 500,
    trees: 50,
    partner: "Jouzour Loubnan (planned, to be confirmed)",
    body: "with Jouzour Loubnan (planned, to be confirmed), with a planting day you can join.",
    pending: "Pending agreement · every bloom on campus counts",
    barLabel: "412 / 500 toward 50 cedars",
  });

  const dedications = [
    ["d1", "Pine", "P", "Jasmine", "2 min ago", 1],
    ["d2", "Quiet Fig", "Q", "Maple", "18 min ago", 2],
    ["d3", "Olive", "O", "Pine", "1 h ago", 3],
    ["d4", "Willow", "W", "Cedar Moss", "Yesterday", 4],
  ];
  for (const [id, from, initial, to, ago, order] of dedications) {
    set(`dedications/${id}`, { from, initial, to, ago, order, status: "approved" });
  }

  set("redemptions/cedar-coffee", {
    uid: "cedar",
    code: "K7Q-4M2",
    perkId: "coffee",
    perkShort: "Coffee",
    status: "valid",
    showTitle: "Coffee at UA cafeteria",
    itemLine: "Coffee at UA cafeteria · one item",
    partnerName: "UA Cafeteria · Counter 1",
    validHeadline: "Valid ✓",
    usedHeadline: "Already used",
    usedBody: "This code was used today at 10:42.",
    validStatus: "Marked used now",
    usedStatus: "Used · not valid again",
    expiresLabel: "10:00",
    privacy: "You see only valid / used. No student names.",
    expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
  });

  set("stories/signals-bloom", {
    kind: "card",
    title: "The Signals bloom",
    line: "Lotus #3 · Fall 2026",
    place: "Faculty of Engineering · Antonine University",
    badges: ["First bloom", "Engineering regular", "Exam Week"],
    footnote: "9:16 for Instagram. Never shows chats, moods or your real name.",
    lotusId: "l3",
  });

  set("circles/engineering-quiet", {
    name: "Engineering quiet hour",
    kind: "support",
    anonymous: true,
    memberCount: 9,
    place: "Faculty of Engineering",
  });
  for (const [uid, nickname] of [
    ["olive", "Gentle Olive"],
    ["pine", "Soft Pine"],
    ["fig", "Kind Fig"],
    ["jasmine", "Warm Jasmine"],
    ["maple", "Calm Maple"],
    ["nour-alum", "Nour"],
    ["rami-alum", "Steady Rami"],
    ["willow", "Quiet Willow"],
  ]) {
    set(`circles/engineering-quiet/members/${uid}`, { nickname, joinedAt: Timestamp.fromMillis(morning) });
  }

  if (process.env.SEED_TODAY_CHECKIN === "1") {
    set(`checkins/cedar_engineering_${day}`, {
      uid: "cedar",
      nodeId: "engineering",
      date: day,
      nickname: "Quiet Cedar",
      place: "Faculty of Engineering",
    });
  }

  set("blooms/today", { count: 3, line: "Someone’s hope is growing. Yours can too." });
  set("nfcStickers/engineering-circle", { nodeId: "engineering", kind: "circle", public: false });

  await batch.commit();
  if (process.env.SEED_TODAY_CHECKIN !== "1") {
    await db.doc(`checkins/cedar_engineering_${day}`).delete();
  }
  console.log("Seeded Hope Node + rewards.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
