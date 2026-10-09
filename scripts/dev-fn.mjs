/**
 * Local stand-in for the recordGrowth Cloud Function.
 * Clients cannot write users.plant (rules). This process uses the Admin SDK,
 * the same path a Function would. Mood text is never accepted or stored.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/dev-fn.mjs
 * Also serves /staff/* and the Hope Node routes (/node-check-in, /node-note, …).
 */
import http from "node:http";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
// STAFF HOOK: reveal, Chair change and account approval run through the Admin SDK.
import { handleStaffRequest } from "./staff-fn.mjs";
// NODE HOOK: check-in, notes, dedications, perks and badge pins share this port.
import { handleNodeRequest, isNodeRoute } from "./node-fn.mjs";
// CARD HOOK: reads the printed text on a UA ID photo, then forgets the photo.
import { readIdCard, warmReader } from "./ocr-fn.mjs";
// AUTH HOOK: sign-in codes, account creation, nickname claims.
import { callerUid, handleAuthRequest, isAuthRoute } from "./auth-fn.mjs";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();
const port = Number(process.env.NABT_FN_PORT || 5055);

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method === "POST" && isAuthRoute(req.url)) {
    await handleAuthRequest(req, res, db);
    return;
  }
  if (req.method === "POST" && req.url && req.url.startsWith("/staff/")) {
    const actorUid = await callerUid(req);
    await handleStaffRequest(req, res, db, actorUid);
    return;
  }
  if (req.method === "POST" && req.url === "/admin/role") {
    try {
      const actorUid = await callerUid(req);
      if (!actorUid) {
        res.statusCode = 401;
        res.end("sign in first");
        return;
      }
      const actor = await getAuth().getUser(actorUid);
      if (actor.customClaims?.role !== "admin") {
        res.statusCode = 403;
        res.end("admin only");
        return;
      }
      const body = JSON.parse(await readBody(req));
      const email = String(body.email || "").trim().toLowerCase();
      const role = String(body.role || "");
      if (!email.includes("@") || !["student", "staff", "admin"].includes(role)) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: false, message: "Use a UA email and a role." }));
        return;
      }
      const target = await getAuth().getUserByEmail(email);
      const claims = { ...(target.customClaims || {}) };
      if (role === "student") Object.assign(claims, { status: "approved", role: "student", sa: false, counselor: false });
      else if (role === "staff") Object.assign(claims, { status: "approved", role: "staff", sa: true, counselor: true });
      else Object.assign(claims, { status: "approved", role: "admin", sa: false, counselor: false });
      await getAuth().setCustomUserClaims(target.uid, claims);
      const label = role === "staff" ? "Student Affairs" : role === "admin" ? "Campus admin" : "Student";
      await db.doc(`users/${target.uid}`).set({ status: "approved", role, roleLabel: label }, { merge: true });
      if (role === "staff") {
        const profile = (await db.doc(`users/${target.uid}`).get()).data() || {};
        await db.doc(`staffProfile/${target.uid}`).set({ name: profile.nickname || label, role: "Counselor", email, onCall: false }, { merge: true });
      }
      await db.collection("auditLogs").add({
        type: "role_change",
        area: "admin",
        category: "role",
        action: `Set role to ${role}`,
        title: `Role set to ${role}`,
        detail: email,
        target: `users/${target.uid}`,
        actor: "Campus admin",
        actorUid,
        when: "Just now",
        at: Timestamp.now(),
      });
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, role }));
    } catch (err) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: false, message: String(err?.message || err) }));
    }
    return;
  }
  if (req.method === "POST" && isNodeRoute(req.url)) {
    await handleNodeRequest(req, res, db);
    return;
  }
  if (req.method === "POST" && req.url === "/ocr-id") {
    try {
      const body = JSON.parse(await readBody(req));
      const image = String(body.image || "");
      if (!image) {
        res.statusCode = 400;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ code: "no_image", message: "No photo was sent." }));
        return;
      }
      const started = Date.now();
      const read = await readIdCard(image);
      // Log what was found, never the values.
      console.log(
        `card read in ${Date.now() - started}ms: id ${read.studentId ? "yes" : "no"}, name ${read.fullName ? "yes" : "no"}, faculty ${read.faculty ? "yes" : "no"}`,
      );
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: Boolean(read.studentId || read.fullName), ...read }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ code: "ocr_failed", message: String(err?.message || err) }));
    }
    return;
  }
  if (req.method === "POST" && req.url === "/impact/recompute") {
    try {
      const { recomputeImpact } = await import("./seed/impact.mjs");
      await recomputeImpact(db);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(String(err));
    }
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 404;
    res.end("not found");
    return;
  }
  if (req.url === "/board-role") {
    try {
      const body = JSON.parse(await readBody(req));
      const actorUid = await callerUid(req);
      if (!actorUid) {
        res.statusCode = 401;
        res.end("sign in first");
        return;
      }
      const circleId = String(body.circleId || "");
      const targetUid = String(body.targetUid || "");
      const roles = Array.isArray(body.roles) ? body.roles.map(String).slice(0, 2) : [];
      const allowed = new Set(["vice_chair", "events", "moderator", "logistics", "hr", "media", "treasurer", "mentor"]);
      if (!circleId || !targetUid || roles.some((role) => !allowed.has(role))) {
        res.statusCode = 400;
        res.end("bad role");
        return;
      }
      const circle = await db.doc(`circles/${circleId}`).get();
      if (circle.data()?.chairUid !== actorUid) {
        res.statusCode = 403;
        res.end("chair only");
        return;
      }
      const actorName = String((await db.doc(`users/${actorUid}`).get()).data()?.nickname || "Chair");
      const member = db.doc(`circles/${circleId}/members/${targetUid}`);
      const before = (await member.get()).data()?.roles || [];
      await member.set({ roles }, { merge: true });
      const at = Timestamp.now();
      await db.collection(`circles/${circleId}/audit`).add({
        actorUid,
        actor: actorName,
        action: `Set roles to ${roles.join(", ") || "member"}`,
        target: targetUid,
        before,
        after: roles,
        at,
        when: "Just now",
        order: Date.now(),
      });
      await db.collection("auditLogs").add({
        actorUid,
        action: "board_role",
        target: `${circleId}/${targetUid}`,
        before,
        after: roles,
        at,
      });
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(String(err));
    }
    return;
  }
  if (req.url === "/issue-certificates" || req.url === "/end-event" || req.url === "/event-code" || req.url === "/event-check-in" || req.url === "/feedback-tally" || req.url === "/mentor-respond") {
    try {
      const body = JSON.parse(await readBody(req));
      const actorUid = await callerUid(req);
      if (!actorUid && req.url !== "/feedback-tally") {
        res.statusCode = 401;
        res.end("sign in first");
        return;
      }
      const result =
        req.url === "/issue-certificates"
          ? await issueCertificates(body, actorUid)
          : req.url === "/end-event"
            ? await endEventRoute(body, actorUid)
            : req.url === "/event-code"
              ? await eventCodeRoute(body, actorUid)
              : req.url === "/event-check-in"
                ? await eventCheckIn(body, actorUid)
                : req.url === "/feedback-tally"
                  ? await tallyFeedback(String(body.eventId || ""))
                  : await openMentorChat(String(body.requestId || ""), actorUid);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch (err) {
      res.statusCode = err?.status || 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: false, message: String(err?.message || err) }));
    }
    return;
  }
  const campusRoutes = new Set([
    "/create-circle",
    "/task-done",
    "/thanks",
    "/join-decide",
    "/support-open",
    "/create-event",
    "/venue-decide",
    "/create-petition",
    "/verify-ask",
    "/verify-decide",
    "/node-mode",
  ]);
  if (campusRoutes.has(req.url || "")) {
    try {
      const body = JSON.parse(await readBody(req));
      const uid = await callerUid(req);
      if (!uid) {
        res.statusCode = 401;
        res.end("sign in first");
        return;
      }
      const result = await handleCampus(db, req.url, uid, body);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch (err) {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: false, message: String(err?.message || err) }));
    }
    return;
  }
  if (req.url !== "/check-in" && req.url !== "/task-done") {
    res.statusCode = 404;
    res.end("not found");
    return;
  }
  try {
    const uid = await callerUid(req);
    if (!uid) {
      res.statusCode = 401;
      res.end("sign in first");
      return;
    }
    await addPetal(db, uid, req.url === "/task-done" ? "task" : "checkin");
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.statusCode = 500;
    res.end(String(err));
  }
});

async function addPetal(db, uid, source) {
  const ref = db.doc(`users/${uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("Finish sign-up first.");
    const plant = snap.data()?.plant || { petals: 0, roots: 0, stage: "Seed" };
    const petals = Math.min(7, Number(plant.petals || 0) + 1);
    const stage = petals >= 7 ? "Bloom" : petals >= 2 ? "Second petal" : petals === 1 ? "First petal" : "Seed";
    tx.update(ref, { plant: { ...plant, petals, stage } });
    tx.set(db.collection("growthEvents").doc(), {
      uid,
      kind: "petal",
      source,
      counted: true,
      at: Timestamp.now(),
    });
  });
}

async function addRoot(db, uid) {
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) return;
  const plant = snap.data()?.plant || { petals: 0, roots: 0, stage: "Seed" };
  await ref.update({ plant: { ...plant, roots: Number(plant.roots || 0) + 1 } });
}

async function handleCampus(db, url, uid, body) {
  if (url === "/task-done") {
    await addPetal(db, uid, "task");
    return {};
  }
  if (url === "/create-circle") {
    const user = await db.doc(`users/${uid}`).get();
    const profile = user.data() || {};
    if (profile.status && profile.status !== "approved") throw new Error("Circles open after approval.");
    const name = String(body.name || "").trim().slice(0, 60);
    if (name.length < 2) throw new Error("Give the Circle a name.");
    const kind = body.kind === "community" ? "community" : "support";
    const joinApproval = kind === "community" && body.joinApproval === true;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "circle";
    const id = `${slug}-${Date.now().toString(36)}`;
    const nickname = String(profile.nickname || profile.greetingName || "A student");
    const batch = db.batch();
    batch.set(db.doc(`circles/${id}`), {
      name,
      kind,
      verified: false,
      anonymous: kind !== "community",
      joinApproval,
      memberCount: 1,
      chairUid: kind === "community" ? uid : "",
      createdAt: Timestamp.now(),
    });
    batch.set(db.doc(`circles/${id}/members/${uid}`), {
      nickname,
      joinedAt: Timestamp.now(),
      roles: kind === "community" ? ["chair"] : [],
      privileges: kind === "community" ? ["members"] : [],
    });
    batch.set(db.collection(`circles/${id}/messages`).doc(), {
      authorUid: uid,
      authorNickname: nickname,
      text: `${nickname} joined`,
      kind: "system",
      createdAt: Timestamp.now(),
    });
    if (kind === "community") {
      batch.set(db.doc(`staffCommunities/${id}`), {
        name,
        members: 1,
        requests: 0,
        line: "New community",
        order: Date.now(),
        chair: nickname,
        since: "Today",
        candidates: [{ id: uid, name: nickname, sub: "Current Chair", current: true }],
      });
    }
    await batch.commit();
    return { id, name };
  }
  if (url === "/thanks") {
    const circleId = String(body.circleId || "");
    const messageId = String(body.messageId || "");
    const threadId = String(body.threadId || "");
    const replyId = String(body.replyId || "");
    if (!circleId) throw new Error("Missing Circle.");
    const member = await db.doc(`circles/${circleId}/members/${uid}`).get();
    if (!member.exists) throw new Error("Join the Circle first.");
    let authorUid = "";
    let thanksPath = "";
    if (messageId) {
      const msg = await db.doc(`circles/${circleId}/messages/${messageId}`).get();
      if (!msg.exists) throw new Error("That reply is gone.");
      authorUid = String(msg.data()?.authorUid || "");
      if (!msg.data()?.replyTo) throw new Error("Thanks grows from a kind reply.");
      thanksPath = `circles/${circleId}/messages/${messageId}/thanks/${uid}`;
    } else if (threadId && replyId) {
      const reply = await db.doc(`circles/${circleId}/threads/${threadId}/replies/${replyId}`).get();
      if (!reply.exists) throw new Error("That reply is gone.");
      authorUid = String(reply.data()?.authorUid || "");
      thanksPath = `circles/${circleId}/threads/${threadId}/replies/${replyId}/thanks/${uid}`;
    } else throw new Error("Missing reply.");
    if (!authorUid || authorUid === uid) throw new Error("You can’t thank your own reply.");
    const existing = await db.doc(thanksPath).get();
    if (existing.exists) return { already: true };
    await db.doc(thanksPath).set({ at: Timestamp.now() });
    await addRoot(db, uid);
    await addRoot(db, authorUid);
    await db.collection("growthEvents").add({
      uid: authorUid,
      kind: "root",
      source: "thanks",
      title: "Someone thanked you",
      body: "A kind reply grew a root for both of you.",
      action: "Thank them back",
      badge: "+1 root",
      circleId,
      replyId: messageId || replyId,
      fromUid: uid,
      at: Timestamp.now(),
    });
    return { ok: true };
  }
  if (url === "/join-decide") {
    const circleId = String(body.circleId || "");
    const target = String(body.uid || "");
    const status = body.status === "approved" ? "approved" : body.status === "declined" ? "declined" : "";
    if (!circleId || !target || !status) throw new Error("Missing request.");
    const circle = await db.doc(`circles/${circleId}`).get();
    const chair = circle.data()?.chairUid === uid;
    const actor = await db.doc(`circles/${circleId}/members/${uid}`).get();
    const priv = Array.isArray(actor.data()?.privileges) && actor.data().privileges.includes("members");
    if (!chair && !priv) throw new Error("Only the Chair can decide.");
    const reqRef = db.doc(`circles/${circleId}/joinRequests/${target}`);
    const request = await reqRef.get();
    if (!request.exists || request.data()?.status !== "pending") throw new Error("That request is closed.");
    await reqRef.update({ status });
    if (status === "approved") {
      const nickname = String(request.data()?.nickname || "A student");
      const memberRef = db.doc(`circles/${circleId}/members/${target}`);
      const already = await memberRef.get();
      if (!already.exists) {
        await memberRef.set({ nickname, joinedAt: Timestamp.now(), roles: [] });
        if (circle.data()?.verified === true) {
          await db.doc(`circles/${circleId}/contacts/${target}`).set({
            realName: String(request.data()?.realName || ""),
            uaEmail: String(request.data()?.uaEmail || ""),
            phone: String(request.data()?.phone || ""),
            trainingAttendance: String(request.data()?.trainingAttendance || ""),
            consentAt: Timestamp.now(),
          });
        }
        await db.doc(`circles/${circleId}`).update({ memberCount: Number(circle.data()?.memberCount || 0) + 1 });
        await db.collection(`circles/${circleId}/messages`).add({
          authorUid: target,
          authorNickname: nickname,
          text: `${nickname} joined`,
          kind: "system",
          createdAt: Timestamp.now(),
        });
      }
    }
    return { status };
  }
  if (url === "/create-event") return createEvent(db, uid, body);
  if (url === "/venue-decide") return venueDecide(db, uid, body);
  if (url === "/create-petition") return createPetition(db, uid, body);
  if (url === "/verify-ask") return verifyAsk(db, uid, body);
  if (url === "/verify-decide") return verifyDecide(db, uid, body);
  if (url === "/node-mode") return setNodeMode(db, uid, body);
  if (url === "/support-open") {
    const caller = await getAuth().getUser(uid);
    if (caller.customClaims?.counselor !== true) throw new Error("A counselor opens this chat.");
    const id = String(body.id || "");
    const request = await db.doc(`supportRequests/${id}`).get();
    if (!request.exists) throw new Error("That request is gone.");
    const student = String(request.data()?.uid || "");
    const chatId = `support-${id}`;
    await db.doc(`chats/${chatId}`).set({
      type: "buddy",
      members: [student, uid],
      anonymous: request.data()?.contact !== "name",
      title: request.data()?.contact === "name" ? String(request.data()?.shownName || "Student") : String(request.data()?.nickname || "A student"),
      nameShares: {},
      inboxRank: 10,
    }, { merge: true });
    await request.ref.update({ status: "chatting", chatId });
    return { chatId };
  }
  throw new Error("Unknown request.");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8") || "{}"));
    req.on("error", reject);
  });
}

const BOARD = ["chair", "vice_chair", "events", "logistics", "media", "treasurer", "moderator", "hr"];

function semesterOf(date) {
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  if (month >= 8) return `Fall ${year}`;
  if (month >= 5) return `Summer ${year}`;
  return `Spring ${year}`;
}

function codeFor(eventId, uid) {
  let hash = 2166136261;
  const raw = `${eventId}:${uid}`;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `UA-${(hash >>> 0).toString(36).toUpperCase().padStart(4, "0").slice(0, 6)}`;
}

async function roleFor(uid, event, circle) {
  const mentors = Array.isArray(event.mentorUids) ? event.mentorUids : [];
  if (mentors.includes(uid)) return "mentor";
  if (circle?.chairUid === uid) return "organizer";
  const member = event.hostId ? await db.doc(`circles/${event.hostId}/members/${uid}`).get() : null;
  const roles = member?.data()?.roles || [];
  if (roles.includes("mentor")) return "mentor";
  if (roles.some((role) => BOARD.includes(role))) return "board";
  return "attendee";
}

function kindFor(event, role) {
  if (event.kind === "training") return "training";
  if (role === "mentor") return "mentoring";
  return "event";
}

async function issueEvent(eventId) {
  const snap = await db.doc(`events/${eventId}`).get();
  if (!snap.exists) return { issued: 0, created: 0 };
  const event = snap.data();
  const attendance = await db.collection(`events/${eventId}/attendance`).get();
  const circleId = String(event.hostId || "");
  const circle = circleId ? (await db.doc(`circles/${circleId}`).get()).data() || null : null;
  const circleName = circle?.name || event.hostLabel || "Circle";
  const when = event.endsAt || event.startsAt || Timestamp.now();
  const dateLabel = event.dateLabel || when.toDate().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const semester = event.semester || semesterOf(when.toDate());
  const byRole = { attendee: 0, mentor: 0, board: 0, organizer: 0 };
  let created = 0;
  for (const row of attendance.docs) {
    const uid = row.id;
    const certId = `${eventId}_${uid}`;
    const existing = await db.doc(`certificates/${certId}`).get();
    if (existing.exists) {
      const role = existing.data().role || "attendee";
      if (byRole[role] != null) byRole[role] += 1;
      continue;
    }
    const role = await roleFor(uid, event, circle);
    const kind = kindFor(event, role);
    const priv = await db.doc(`users_private/${uid}`).get();
    const contact = circleId ? await db.doc(`circles/${circleId}/contacts/${uid}`).get() : null;
    const fullName = priv.data()?.fullName || contact.data()?.realName || "UA student";
    const code = codeFor(eventId, uid);
    await db.doc(`certificates/${certId}`).set({
      uid,
      code,
      fullName,
      eventId,
      eventTitle: event.title || "Event",
      circleId,
      circleName,
      role,
      dateLabel,
      semester,
      kind,
      issuedAt: Timestamp.now(),
    });
    await db.doc(`certificatePublic/${code}`).set({ fullName, eventTitle: event.title || "Event", dateLabel, valid: true });
    byRole[role] += 1;
    created += 1;
    await rebuildRecord(uid);
  }
  await db.doc(`certificateAggregates/${eventId}`).set({
    eventId,
    eventTitle: event.title || "Event",
    circleId,
    circleName,
    semester,
    issued: attendance.size,
    byRole,
    updatedAt: Timestamp.now(),
  });
  await db.doc(`events/${eventId}`).set({ certificatesIssued: true }, { merge: true });
  return { issued: attendance.size, created };
}

async function issueCertificates(body, uid) {
  if (body.eventId) {
    await requireOrganizer(String(body.eventId), uid);
    return issueEvent(String(body.eventId));
  }
  const circleId = String(body.circleId || "");
  const circle = await db.doc(`circles/${circleId}`).get();
  if (circle.data()?.chairUid !== uid) throw refuse(403, "Only the Chair can issue certificates.");
  const snap = await db.collection("events").where("hostId", "==", circleId).get();
  let issued = 0;
  let created = 0;
  for (const row of snap.docs) {
    const data = row.data();
    const ended = data.endsAt && data.endsAt.toMillis() <= Date.now();
    if (!ended) continue;
    const result = await issueEvent(row.id);
    issued += result.issued;
    created += result.created;
  }
  return { issued, created };
}

async function rebuildRecord(uid) {
  const certs = await db.collection("certificates").where("uid", "==", uid).get();
  const priv = await db.doc(`users_private/${uid}`).get();
  const items = certs.docs
    .map((row) => {
      const cert = row.data();
      return {
        id: row.id,
        kind: cert.kind,
        title: cert.eventTitle,
        circle: cert.circleName,
        dateLabel: cert.dateLabel,
        role: cert.role,
        semester: cert.semester,
        certificateId: row.id,
        code: cert.code,
        at: cert.issuedAt?.toMillis?.() || 0,
      };
    })
    .sort((a, b) => b.at - a.at)
    .map(({ at, ...item }) => item);
  const circles = await db.collection("circles").where("chairUid", "==", uid).get();
  for (const circle of circles.docs) {
    items.push({
      id: `board-${circle.id}`,
      kind: "board",
      title: "Chair",
      circle: circle.data().name || "Circle",
      dateLabel: "Fall 2026",
      role: "organizer",
      semester: "Fall 2026",
    });
  }
  const totals = {
    events: items.filter((item) => item.kind === "event").length,
    trainings: items.filter((item) => item.kind === "training").length,
    mentoring: items.filter((item) => item.role === "mentor").length,
    board: items.filter((item) => item.kind === "board").length,
  };
  const prev = await db.doc(`records/${uid}`).get();
  let ask = prev.data()?.ask || null;
  if (ask?.eventId) {
    const wrote = await db.doc(`events/${ask.eventId}/feedback/${uid}`).get();
    if (wrote.exists) ask = null;
  }
  await db.doc(`records/${uid}`).set({
    uid,
    fullName: priv.data()?.fullName || prev.data()?.fullName || "UA student",
    totals,
    items,
    ask,
    updatedAt: Timestamp.now(),
  });
}

async function tallyFeedback(eventId) {
  const event = (await db.doc(`events/${eventId}`).get()).data() || {};
  const feedback = await db.collection(`events/${eventId}/feedback`).get();
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  const comments = [];
  for (const row of feedback.docs) {
    const rating = Number(row.data().rating || 0);
    if (distribution[rating] != null) {
      distribution[rating] += 1;
      sum += rating;
    }
    const comment = String(row.data().comment || "").trim().slice(0, 200);
    if (comment) comments.push(comment);
  }
  const count = feedback.size;
  const circleId = String(event.hostId || "");
  const circle = circleId ? (await db.doc(`circles/${circleId}`).get()).data() : null;
  await db.doc(`feedbackAggregates/${eventId}`).set({
    eventId,
    eventTitle: event.title || "Event",
    circleId,
    circleName: circle?.name || event.hostLabel || "",
    count,
    sum,
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    distribution: { 1: distribution[1], 2: distribution[2], 3: distribution[3], 4: distribution[4], 5: distribution[5] },
    comments,
    updatedAt: Timestamp.now(),
  });
  for (const row of feedback.docs) {
    const rec = await db.doc(`records/${row.id}`).get();
    if (rec.exists && rec.data()?.ask?.eventId === eventId) {
      await db.doc(`records/${row.id}`).set({ ask: null }, { merge: true });
    }
  }
  return { count };
}

function refuse(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function isSA(uid) {
  try {
    const user = await getAuth().getUser(uid);
    return user.customClaims?.sa === true || user.customClaims?.counselor === true;
  } catch {
    return false;
  }
}

/** The organizer of an event: its Circle's Chair, or Student Affairs for an OSA event. */
async function requireOrganizer(eventId, uid) {
  const snap = await db.doc(`events/${eventId}`).get();
  if (!snap.exists) throw refuse(404, "That event is gone.");
  const event = snap.data();
  if (event.hostType === "circle") {
    const circle = await db.doc(`circles/${event.hostId}`).get();
    if (circle.data()?.chairUid !== uid) throw refuse(403, "Only the event’s organizer can do that.");
  } else if (!(await isSA(uid))) {
    throw refuse(403, "Only the event’s organizer can do that.");
  }
  return event;
}

async function eventCodeRoute(body, uid) {
  const eventId = String(body.eventId || "");
  await requireOrganizer(eventId, uid);
  const ref = db.doc(`eventCodes/${eventId}`);
  let code = String((await ref.get()).data()?.code || "");
  if (!code) {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await ref.set({ code, at: Timestamp.now() });
  }
  return { code };
}

/** Attendance is written only here, and only with the code from the organizer's QR. */
async function eventCheckIn(body, uid) {
  const eventId = String(body.eventId || "");
  const snap = await db.doc(`events/${eventId}`).get();
  if (!snap.exists) throw refuse(404, "That event is gone.");
  const event = snap.data();
  const result = { title: String(event.title || "Event"), hostId: String(event.hostId || ""), hostType: String(event.hostType || ""), verified: event.verified !== false, nodeId: String(event.nodeId || "") };
  const row = db.doc(`events/${eventId}/attendance/${uid}`);
  if ((await row.get()).exists) return { ...result, already: true };
  const code = String((await db.doc(`eventCodes/${eventId}`).get()).data()?.code || "");
  if (!code || String(body.code || "").trim().toUpperCase() !== code) throw refuse(403, "Scan the organizer’s QR at the event to check in.");
  if (event.ended === true) throw refuse(409, "This event has ended.");
  if (event.hostType === "circle" && !(await db.doc(`circles/${event.hostId}/members/${uid}`).get()).exists) {
    throw refuse(403, "This check-in is for members of the Circle.");
  }
  const user = (await db.doc(`users/${uid}`).get()).data() || {};
  await row.set({ uid, nickname: String(user.nickname || "Member"), at: Timestamp.now() });
  return { ...result, already: false };
}

async function endEventRoute(body, uid) {
  const eventId = String(body.eventId || "");
  await requireOrganizer(eventId, uid);
  await db.doc(`events/${eventId}`).set({ ended: true }, { merge: true });
  return issueEvent(eventId);
}

async function openMentorChat(requestId, actorUid) {
  const ref = db.doc(`mentorRequests/${requestId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("missing request");
  const data = snap.data();
  if (actorUid && data.toUid !== actorUid) throw new Error("Only the mentor can accept this.");
  if (data.status === "declined") return { chatId: "" };
  const chatId = data.chatId || `mentor-${requestId}`;
  await db.doc(`chats/${chatId}`).set(
    {
      type: "alumni_named",
      members: [data.fromUid, data.toUid],
      anonymous: false,
      nameShares: { [data.fromUid]: true, [data.toUid]: true },
      title: data.toName || "Alumni",
      tag: "Alumni",
      tagOk: true,
      letter: String(data.toName || "A").slice(0, 1),
      timeLabel: "Now",
      inboxRank: 2,
      previewAt: Date.now(),
    },
    { merge: true },
  );
  await ref.set({ status: "accepted", chatId }, { merge: true });
  return { chatId };
}

async function issueEnded() {
  const snap = await db.collection("events").where("endsAt", "<", Timestamp.now()).get();
  for (const row of snap.docs) {
    if (row.data().certificatesIssued || row.data().hostType !== "circle") continue;
    await issueEvent(row.id);
  }
}

const DEFAULT_VENUES = [
  { id: "engineering", name: "Faculty of Engineering node", building: "Faculty of Engineering", nodeId: "engineering" },
  { id: "hall-c", name: "Hall C lab", building: "Hall C", nodeId: "engineering" },
];

async function ensureVenues(db) {
  for (const venue of DEFAULT_VENUES) {
    const ref = db.doc(`venues/${venue.id}`);
    const snap = await ref.get();
    if (!snap.exists) await ref.set({ name: venue.name, building: venue.building, nodeId: venue.nodeId, order: 1 });
  }
}

async function ensureNodeDoc(db, nodeId) {
  const ref = db.doc(`nodes/${nodeId}`);
  const snap = await ref.get();
  if (snap.exists) return;
  const faculty = nodeId === "engineering" ? "Faculty of Engineering" : nodeId;
  await ref.set({
    name: faculty,
    title: nodeId === "engineering" ? "Faculty of Engineering node is awake" : `Hope Node · ${faculty} is awake`,
    place: faculty,
    hours: "Awake now",
    awake: true,
    inboxOrder: Date.now(),
    mode: "normal",
    showOnStaff: true,
    schedule: [],
    createdAt: Timestamp.now(),
  });
}

async function rebuildStaffSchedule(db) {
  const events = await db.collection("events").get();
  const now = new Date();
  const byPlace = new Map();
  for (const row of events.docs) {
    const data = row.data();
    if (!data.startsAt || !data.endsAt) continue;
    const place = String(data.nodeId || data.place || "Campus");
    if (!byPlace.has(place)) byPlace.set(place, []);
    const start = data.startsAt.toDate();
    const end = data.endsAt.toDate();
    const approved = data.venueStatus === "approved";
    const live = approved && start <= now && now < end;
    const list = byPlace.get(place);
    list.push({
      title: String(data.title || "Event"),
      sub: approved ? "Approved" : "Waiting on Student Affairs",
      left: 90 + list.length * 130,
      width: 120,
      tone: live ? "live" : approved ? "ok" : "p",
      href: `/e/${row.id}`,
    });
  }
  const rows = [];
  let top = 8;
  for (const [name, list] of byPlace) {
    rows.push({ name, sub: "Hope Node", top, events: list });
    top += 54;
  }
  await db.doc("staffSchedule/thu").set({
    chip: "Today",
    days: [{ d: "Today", n: String(now.getDate()), on: true }],
    hours: ["9", "11", "1", "3", "5"],
    rows,
    summary: [{ n: String(events.size), label: "events" }],
    nowLabel: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    nowLeft: 200,
  });
}

async function syncNodeSchedule(db, nodeId) {
  if (!nodeId) return;
  await ensureNodeDoc(db, nodeId);
  const events = await db.collection("events").where("nodeId", "==", nodeId).get();
  const schedule = events.docs
    .map((row) => ({ id: row.id, ...row.data() }))
    .filter((event) => event.startsAt && event.endsAt)
    .map((event) => ({
      eventId: event.id,
      title: String(event.title || ""),
      venueStatus: String(event.venueStatus || "pending"),
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    }));
  await db.doc(`nodes/${nodeId}`).set({ schedule, showOnStaff: true }, { merge: true });
  await rebuildStaffSchedule(db);
}

function eventInWindow(data, now) {
  const start = data.startsAt?.toMillis?.() || 0;
  const end = data.endsAt?.toMillis?.() || 0;
  return data.venueStatus === "approved" && start <= now && now < end;
}

async function tickNodes(db) {
  const nodes = await db.collection("nodes").get();
  const now = Date.now();
  for (const node of nodes.docs) {
    const events = await db.collection("events").where("nodeId", "==", node.id).get();
    const data = node.data() || {};
    const lives = events.docs.filter((row) => eventInWindow(row.data(), now));
    const holdId = data.eventHold === "end" ? String(data.holdEventId || "") : "";
    const holdStill = Boolean(holdId && lives.some((row) => row.id === holdId));
    const live = lives.find((row) => row.id !== holdId);
    if (live) {
      if (data.mode !== "event" || data.eventId !== live.id) {
        await node.ref.set({
          mode: "event",
          eventId: live.id,
          eventTitle: String(live.data().title || ""),
          startsAt: live.data().startsAt,
          endsAt: live.data().endsAt,
          eventHold: holdStill ? "end" : "",
          holdEventId: holdStill ? holdId : "",
        }, { merge: true });
      }
    } else if (holdStill) {
      if (data.mode === "event") {
        await node.ref.set({ mode: "normal", eventId: "", eventTitle: "", eventHold: "end", holdEventId: holdId }, { merge: true });
      }
    } else if (data.mode === "event" || data.eventHold) {
      await node.ref.set({ mode: "normal", eventId: "", eventTitle: "", eventHold: "", holdEventId: "" }, { merge: true });
    }
  }
}

async function createEvent(db, uid, body) {
  const circleId = String(body.circleId || "");
  const circle = await db.doc(`circles/${circleId}`).get();
  if (!circle.exists || circle.data()?.chairUid !== uid) throw new Error("Only the Chair can host an event.");
  const title = String(body.title || "").trim().slice(0, 80);
  const nodeId = String(body.nodeId || "engineering");
  const venueId = String(body.venueId || "engineering");
  const startsAt = Timestamp.fromMillis(Number(body.startsAt));
  const endsAt = Timestamp.fromMillis(Number(body.endsAt));
  if (title.length < 2 || !(body.startsAt && body.endsAt) || endsAt.toMillis() <= startsAt.toMillis()) {
    throw new Error("Add a title and a start and end time.");
  }
  await ensureVenues(db);
  await ensureNodeDoc(db, nodeId);
  const eventRef = db.collection("events").doc();
  const when = new Date(Number(body.startsAt)).toLocaleString();
  await eventRef.set({
    title,
    status: "published",
    hostType: "circle",
    hostId: circleId,
    hostLabel: String(circle.data()?.name || "Circle"),
    nodeId,
    venueId,
    place: venueId === "engineering" ? "Faculty of Engineering" : venueId,
    venueStatus: "pending",
    startsAt,
    endsAt,
    when,
    whenLine: when,
    description: String(body.description || "").slice(0, 200),
    createdAt: Timestamp.now(),
    order: Date.now(),
  });
  const user = await db.doc(`users/${uid}`).get();
  const nickname = String(user.data()?.nickname || "Chair");
  await db.collection("venueRequests").add({
    circleId,
    chairUid: uid,
    venueId,
    eventId: eventRef.id,
    nodeId,
    dateOptions: [when],
    memberCount: Number(circle.data()?.memberCount || 1),
    status: "sent",
    createdAt: Timestamp.now(),
    queue: "pitch",
    title,
    circle: String(circle.data()?.name || circleId),
    detail: `${venueId} · ${when}`,
    initial: nickname.slice(0, 1).toUpperCase(),
    chairName: nickname,
    order: Date.now(),
    time: "Just now",
    fast: circle.data()?.verified === true,
    slots: [{ label: when, sub: venueId, ok: true }],
  });
  await syncNodeSchedule(db, nodeId);
  return { id: eventRef.id, title };
}

async function venueDecide(db, uid, body) {
  const caller = await getAuth().getUser(uid);
  if (caller.customClaims?.sa !== true) throw new Error("Student Affairs decides venues.");
  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!["approved", "declined", "suggested"].includes(status)) throw new Error("Pick approve or decline.");
  const req = await db.doc(`venueRequests/${id}`).get();
  if (!req.exists) throw new Error("That request is gone.");
  await req.ref.update({ status, updatedAt: Timestamp.now() });
  const eventId = String(req.data()?.eventId || "");
  let nodeId = String(req.data()?.nodeId || "");
  if (eventId) {
    await db.doc(`events/${eventId}`).set({ venueStatus: status === "approved" ? "approved" : status }, { merge: true });
    const event = await db.doc(`events/${eventId}`).get();
    nodeId = String(event.data()?.nodeId || nodeId);
  }
  const circleId = String(req.data()?.circleId || "");
  const verb = status === "approved" ? "approved" : status === "declined" ? "declined" : "suggested another time for";
  const text = `Student Affairs ${verb} the venue for ${req.data()?.title || "your event"}.`;
  if (circleId) {
    await db.collection(`circles/${circleId}/messages`).add({
      authorUid: uid,
      authorNickname: "Student Affairs",
      text,
      kind: "system",
      createdAt: Timestamp.now(),
    });
  }
  await db.collection("auditLogs").add({
    action: "venue",
    category: "role",
    title: text,
    actor: "Student Affairs",
    actorUid: uid,
    target: circleId,
    when: "Just now",
    at: Timestamp.now(),
  });
  if (nodeId) await syncNodeSchedule(db, nodeId);
  await tickNodes(db);
  return { status };
}

async function createPetition(db, uid, body) {
  const title = String(body.title || "").trim().slice(0, 80);
  const line = String(body.line || "").trim().slice(0, 200);
  if (title.length < 3) throw new Error("Name the change you want.");
  const user = await db.doc(`users/${uid}`).get();
  const ref = db.collection("petitions").doc();
  await ref.set({
    title,
    line,
    status: "pending",
    bucket: "pending",
    by: String(user.data()?.nickname || "A student"),
    topic: "Campus",
    goal: 25,
    signCount: 1,
    authorUid: uid,
    order: Date.now(),
    createdAt: Timestamp.now(),
  });
  await db.doc(`petitionAuthors/${ref.id}`).set({ uid });
  return { id: ref.id };
}

async function verifyAsk(db, uid, body) {
  const circleId = String(body.circleId || "");
  const circle = await db.doc(`circles/${circleId}`).get();
  if (!circle.exists || circle.data()?.chairUid !== uid) throw new Error("Only the Chair can ask.");
  const name = String(circle.data()?.name || circleId);
  await db.doc(`communityReviews/${circleId}`).set({
    name,
    status: "waiting",
    initial: name.slice(0, 1).toUpperCase(),
    sub: `${circle.data()?.memberCount || 1} members · asking to be verified`,
    members: Number(circle.data()?.memberCount || 1),
    order: Date.now(),
  }, { merge: true });
  return { id: circleId };
}

async function verifyDecide(db, uid, body) {
  const caller = await getAuth().getUser(uid);
  if (caller.customClaims?.sa !== true) throw new Error("Student Affairs verifies Circles.");
  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!["verified", "changes", "declined"].includes(status)) throw new Error("Pick a decision.");
  await db.doc(`communityReviews/${id}`).set({ status, reviewedBy: uid, updatedAt: Timestamp.now() }, { merge: true });
  const circle = await db.doc(`circles/${id}`).get();
  if (status === "verified") {
    await db.doc(`circles/${id}`).set({ verified: true }, { merge: true });
    await db.doc(`staffCommunities/${id}`).set({ line: "Verified community", name: circle.data()?.name || id }, { merge: true });
  }
  const text = status === "verified" ? `Student Affairs verified ${circle.data()?.name || "this Circle"}.` : `Student Affairs marked this Circle ${status}.`;
  if (circle.exists) {
    await db.collection(`circles/${id}/messages`).add({
      authorUid: uid,
      authorNickname: "Student Affairs",
      text,
      kind: "system",
      createdAt: Timestamp.now(),
    });
  }
  await db.collection("auditLogs").add({
    action: "verify",
    category: "role",
    title: text,
    actor: "Student Affairs",
    actorUid: uid,
    target: id,
    when: "Just now",
    at: Timestamp.now(),
  });
  return { status };
}

async function setNodeMode(db, uid, body) {
  const nodeId = String(body.nodeId || "");
  const eventId = String(body.eventId || "");
  const action = body.action === "end" ? "end" : "start";
  const event = await db.doc(`events/${eventId}`).get();
  if (!event.exists) throw new Error("That event is gone.");
  const data = event.data();
  const member = await db.doc(`circles/${data.hostId}/members/${uid}`).get();
  const circle = await db.doc(`circles/${data.hostId}`).get();
  const roles = member.data()?.roles || [];
  const board = ["chair", "vice_chair", "events", "logistics", "media", "treasurer", "moderator", "hr"];
  const organizes = circle.data()?.chairUid === uid || roles.some((role) => board.includes(role));
  if (!organizes) throw new Error("Only the Chair or board can change the node.");
  if (data.venueStatus !== "approved") throw new Error("Student Affairs has not approved this venue.");
  if (String(data.nodeId || "") !== nodeId) throw new Error("This event is on another node.");
  const now = Date.now();
  const start = data.startsAt?.toMillis?.() || 0;
  const end = data.endsAt?.toMillis?.() || 0;
  if (now < start || now >= end) throw new Error("The node only switches during the event.");
  if (action === "end") {
    await db.doc(`nodes/${nodeId}`).set({ mode: "normal", eventId: "", eventTitle: "", eventHold: "end", holdEventId: eventId }, { merge: true });
    return { mode: "normal" };
  }
  await db.doc(`nodes/${nodeId}`).set({
    mode: "event",
    eventId,
    eventTitle: String(data.title || ""),
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    eventHold: "",
    holdEventId: "",
  }, { merge: true });
  return { mode: "event" };
}

/**
 * Safety net for `npm run demo`: every minute the emulator hub writes the campus to
 * ./emulator-data, so a hard stop on Windows does not lose the accounts people created.
 */
const exportDir = process.env.NABT_EXPORT_DIR;
let exportWarned = false;
async function exportCampus() {
  const hub = process.env.FIREBASE_EMULATOR_HUB;
  if (!exportDir || !hub) return;
  try {
    const res = await fetch(`http://${hub}/_admin/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: exportDir, initiatedBy: "nabt dev-fn" }),
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    if (!exportWarned) {
      exportWarned = true;
      console.warn("campus export skipped:", String(err?.message || err).slice(0, 120));
    }
  }
}

server.listen(port, "0.0.0.0", () => {
  console.log(`local functions listening on ${port} (auth, check-in, board role, staff, node rewards, records, impact, card reader)`);
  warmReader();
  const beat = () => {
    tickNodes(db).catch((err) => console.warn("node schedule:", String(err?.message || err).slice(0, 160)));
  };
  beat();
  setInterval(beat, 10000);
  if (exportDir) setInterval(() => void exportCampus(), 60000);
  issueEnded().catch(() => undefined);
  setInterval(() => {
    issueEnded().catch(() => undefined);
  }, 30000);
});
