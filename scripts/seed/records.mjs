/**
 * AREA: records — past events, certificates, Cedar's private record, and one feedback aggregate.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed/records.mjs
 *
 * Impact dashboard reads feedbackAggregates/{eventId} and certificateAggregates/{eventId} only.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();

const people = {
  cedar: ["Rami K. Haddad", "attendee"],
  jad: ["Jad Khoury", "board"],
  lea: ["Lea Haddad", "board"],
  sara: ["Sara Khoury", "board"],
  tala: ["Tala Rizk", "attendee"],
  karim: ["Karim Aoun", "mentor"],
  "nour-alum": ["Nour Saab", "mentor"],
  "rami-board": ["Rami Nassar", "board"],
  m8: ["Amal", "attendee"],
  m9: ["Hadi", "attendee"],
  m10: ["Lina", "attendee"],
};

const kitFeedback = [
  ["jad", 5, "The kits were ready."],
  ["lea", 5, "Clear steps."],
  ["sara", 4, "Glad I stayed."],
  ["tala", 4, ""],
  ["karim", 4, "A bit loud near the door."],
  ["nour-alum", 4, ""],
  ["rami-board", 3, "Short and useful."],
  ["m8", 3, ""],
  ["m9", 5, "I could follow along."],
  ["m10", 2, "I arrived late."],
];

function at(iso) {
  return Timestamp.fromDate(new Date(iso));
}

async function main() {
  const batch = db.batch();
  const set = (path, data) => batch.set(db.doc(path), data);

  const events = [
    ["robotics-open-lab", "Open lab", "event", "Sat, Sep 12", "2026-09-12T14:00:00Z", "2026-09-12T16:00:00Z", [], ["cedar"], "UA-LAB12", "attendee", "event"],
    ["robotics-kit-night", "Kit night", "event", "Sat, Sep 26", "2026-09-26T15:00:00Z", "2026-09-26T18:00:00Z", [], Object.keys(people), "", "", ""],
    ["robotics-alumni-night", "Alumni lab night", "event", "Fri, Oct 2", "2026-10-02T15:00:00Z", "2026-10-02T17:00:00Z", [], ["cedar"], "UA-ALM02", "organizer", "event"],
    ["robotics-outreach", "Robotics outreach training", "training", "Sat, Oct 4", "2026-10-04T09:00:00Z", "2026-10-04T12:00:00Z", ["cedar"], ["cedar"], "UA-OUT04", "mentor", "training"],
  ];

  const byEventRole = {};
  for (const [id, title, kind, dateLabel, start, end, mentorUids, attendees, code, role, certKind] of events) {
    set(`events/${id}`, {
      title,
      status: "ended",
      hostType: "circle",
      hostId: "robotics",
      hostLabel: "Robotics Society",
      verified: true,
      kicker: kind === "training" ? "Training" : "Circle event",
      meta: `${dateLabel} · Robotics Society`,
      whenLine: dateLabel,
      placeLine: "Hall C lab",
      blurb: kind === "training" ? "A Saturday training for school visitors." : "A past Circle evening.",
      kind,
      mentorUids,
      semester: "Fall 2026",
      dateLabel,
      startsAt: at(start),
      endsAt: at(end),
      certificatesIssued: true,
    });
    const byRole = { attendee: 0, mentor: 0, board: 0, organizer: 0 };
    for (const uid of attendees) {
      const [fullName, memberRole] = people[uid];
      const certRole = id === "robotics-kit-night" ? memberRole : role;
      const thisKind = id === "robotics-kit-night" ? (certRole === "mentor" ? "mentoring" : "event") : certKind;
      const thisCode = id === "robotics-kit-night" ? (uid === "cedar" ? "UA-KIT26" : `UA-K${uid.slice(0, 4).toUpperCase()}`) : code;
      set(`events/${id}/attendance/${uid}`, { uid, nickname: fullName.split(" ")[0], at: at(end) });
      set(`certificates/${id}_${uid}`, {
        uid,
        code: thisCode,
        fullName,
        eventId: id,
        eventTitle: title,
        circleId: "robotics",
        circleName: "Robotics Society",
        role: certRole,
        dateLabel,
        semester: "Fall 2026",
        kind: thisKind,
        issuedAt: at(end),
      });
      set(`certificatePublic/${thisCode}`, { fullName, eventTitle: title, dateLabel, valid: true });
      byRole[certRole] += 1;
    }
    byEventRole[id] = byRole;
    set(`certificateAggregates/${id}`, {
      eventId: id,
      eventTitle: title,
      circleId: "robotics",
      circleName: "Robotics Society",
      semester: "Fall 2026",
      issued: attendees.length,
      byRole,
      updatedAt: at(end),
    });
  }

  const distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let sum = 0;
  const comments = [];
  for (const [uid, rating, comment] of kitFeedback) {
    set(`events/robotics-kit-night/feedback/${uid}`, {
      uid,
      rating,
      comment,
      at: at("2026-09-26T18:10:00Z"),
    });
    distribution[String(rating)] += 1;
    sum += rating;
    if (comment) comments.push(comment);
  }
  set("feedbackAggregates/robotics-kit-night", {
    eventId: "robotics-kit-night",
    eventTitle: "Kit night",
    circleId: "robotics",
    circleName: "Robotics Society",
    count: kitFeedback.length,
    sum,
    average: Math.round((sum / kitFeedback.length) * 10) / 10,
    distribution,
    comments,
    updatedAt: at("2026-09-26T18:30:00Z"),
  });

  set("records/cedar", {
    uid: "cedar",
    fullName: "Rami K. Haddad",
    totals: { events: 3, trainings: 1, mentoring: 1, board: 1 },
    ask: { eventId: "robotics-outreach", title: "Robotics outreach training" },
    items: [
      { id: "robotics-outreach_cedar", kind: "training", title: "Robotics outreach training", circle: "Robotics Society", dateLabel: "Sat, Oct 4", role: "mentor", semester: "Fall 2026", certificateId: "robotics-outreach_cedar", code: "UA-OUT04" },
      { id: "robotics-alumni-night_cedar", kind: "event", title: "Alumni lab night", circle: "Robotics Society", dateLabel: "Fri, Oct 2", role: "organizer", semester: "Fall 2026", certificateId: "robotics-alumni-night_cedar", code: "UA-ALM02" },
      { id: "robotics-kit-night_cedar", kind: "event", title: "Kit night", circle: "Robotics Society", dateLabel: "Sat, Sep 26", role: "attendee", semester: "Fall 2026", certificateId: "robotics-kit-night_cedar", code: "UA-KIT26" },
      { id: "robotics-open-lab_cedar", kind: "event", title: "Open lab", circle: "Robotics Society", dateLabel: "Sat, Sep 12", role: "attendee", semester: "Fall 2026", certificateId: "robotics-open-lab_cedar", code: "UA-LAB12" },
      { id: "board-robotics", kind: "board", title: "Chair", circle: "Robotics Society", dateLabel: "Fall 2026", role: "organizer", semester: "Fall 2026" },
    ],
  });

  await batch.commit();
  console.log("records: Cedar has 4 certificates. Kit night has 10 feedback replies.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
