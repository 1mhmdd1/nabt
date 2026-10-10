import { FnError } from "../fn-error";
import { initialsOf } from "../nickname/rules.mjs";
import { DEMO_PASSWORD } from "./mode";
import {
  accounts,
  childDocs,
  currentAccount,
  findAccount,
  patchDoc,
  readDoc,
  sessionUid,
  setSession,
  upsertAccount,
  whenReady,
  writeDoc,
} from "./store";

type Body = Record<string, unknown>;

const pending = new Map<string, { fullName: string; faculty: string; mode: string; code: string }>();

/** A fresh 6-digit code per request. The phone demo shows it under the boxes instead of emailing it. */
function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function uid() {
  const id = sessionUid();
  if (!id) throw new FnError(401, "signed_out", "Sign in first.");
  return id;
}

function claims() {
  return (currentAccount()?.claims || {}) as Record<string, unknown>;
}

/** Student Affairs (and counselors) own account status, verification, Chairs and OSA events. */
function isSA() {
  const c = claims();
  return c.sa === true || c.counselor === true;
}

function requireSA(message = "Only Student Affairs can do that.") {
  uid();
  if (!isSA()) throw new FnError(403, "forbidden", message);
}

function isChairOf(circleId: string, userId: string) {
  return Boolean(circleId) && String(readDoc(`circles/${circleId}`)?.chairUid || "") === userId;
}

/** The organizer of an event: its Circle's Chair, or Student Affairs for an OSA event. */
function organizes(event: Record<string, unknown>, userId: string) {
  if (event.hostType === "circle") return isChairOf(String(event.hostId || ""), userId);
  return isSA();
}

function requireOrganizer(eventId: string) {
  const userId = uid();
  const event = readDoc(`events/${eventId}`);
  if (!event) throw new FnError(404, "missing", "That event is not on this phone.");
  if (!organizes(event, userId)) throw new FnError(403, "forbidden", "Only the event’s organizer can do that.");
  return { userId, event };
}

function audit(fields: Record<string, unknown>) {
  writeDoc(`auditLogs/log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, { when: "Just now", at: Date.now(), ...fields });
}

function systemLine(circleId: string, text: string) {
  writeDoc(`circles/${circleId}/messages/sys-${Date.now()}`, {
    authorUid: sessionUid() || "",
    authorNickname: "Student Affairs",
    text,
    kind: "system",
    createdAt: Date.now(),
  });
}

function stage(petals: number) {
  if (petals >= 3) return "Bloom";
  if (petals >= 1) return "Sprout";
  return "Seed";
}

/** Per-day caps so tapping the same thing again doesn't farm the plant. Each source counts on its own. */
const DAILY_CAP: Record<string, number> = { mood: 1, voice: 1, task: 1, thanks: 3, kindness: 3, mentor: 5 };

function grow(userId: string, which: "petals" | "roots", source: keyof typeof DAILY_CAP) {
  const user = readDoc(`users/${userId}`) || {};
  const today = new Date().toDateString();
  const prior = (user.growthDay || {}) as Record<string, unknown>;
  const counts = (prior.day === today ? prior.counts || {} : {}) as Record<string, number>;
  const used = Number(counts[source] || 0);
  if (used >= DAILY_CAP[source]) return false;
  patchDoc(`users/${userId}`, { growthDay: { day: today, counts: { ...counts, [source]: used + 1 } } });
  const plant = (user.plant || {}) as Record<string, unknown>;
  const petals = Number(plant.petals || 0) + (which === "petals" ? 1 : 0);
  const roots = Number(plant.roots || 0) + (which === "roots" ? 1 : 0);
  patchDoc(`users/${userId}`, { plant: { petals, roots, stage: stage(petals) } });
  return true;
}

function requireUserDoc(userId: string) {
  if (!readDoc(`users/${userId}`)) writeDoc(`users/${userId}`, { status: "approved", role: "student", roleLabel: "Student", plant: { petals: 0, roots: 0, stage: "Seed" } });
}

function certCode(userId: string, eventId: string) {
  let n = 0;
  const s = `${userId}:${eventId}`;
  for (let i = 0; i < s.length; i += 1) n = (n * 33 + s.charCodeAt(i)) % 10000;
  return `NB-${String(n).padStart(4, "0")}`;
}

function issueForEvent(eventId: string) {
  const event = readDoc(`events/${eventId}`);
  if (!event) throw new FnError(404, "missing", "That event is not on this phone.");
  const title = String(event.title || "Campus event");
  const circleName = String(event.hostLabel || "Circle");
  const dateLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  let issued = 0;
  for (const row of childDocs(`events/${eventId}/attendance`)) {
    const userId = String(row.data.uid || row.id);
    const certId = `cert-${userId}-${eventId}`;
    if (readDoc(`certificates/${certId}`)) continue;
    const priv = readDoc(`users_private/${userId}`) || {};
    const user = readDoc(`users/${userId}`) || {};
    const fullName = String(priv.fullName || user.nickname || user.greetingName || "UA student");
    const code = certCode(userId, eventId);
    writeDoc(`certificates/${certId}`, {
      uid: userId,
      code,
      fullName,
      eventId,
      eventTitle: title,
      circleId: String(event.hostId || ""),
      circleName,
      role: "attendee",
      dateLabel,
      semester: "Fall 2026",
      kind: "event",
    });
    writeDoc(`certificatePublic/${code}`, { fullName, eventTitle: title, dateLabel, valid: true });
    const record = readDoc(`records/${userId}`) || { totals: {}, items: [] };
    const totals = (record.totals || {}) as Record<string, unknown>;
    const items = Array.isArray(record.items) ? [...record.items] : [];
    items.push({
      id: certId,
      kind: "event",
      title,
      circle: circleName,
      dateLabel,
      role: "attendee",
      semester: "Fall 2026",
      certificateId: certId,
      code,
    });
    writeDoc(`records/${userId}`, {
      ...record,
      fullName: fullName || String(record.fullName || ""),
      totals: {
        events: Number(totals.events || 0) + 1,
        trainings: Number(totals.trainings || 0),
        mentoring: Number(totals.mentoring || 0),
        board: Number(totals.board || 0),
      },
      items,
      ask: { eventId, title },
    });
    issued += 1;
  }
  patchDoc(`events/${eventId}`, { ended: true });
  return issued;
}

export async function handleFn(path: string, raw: unknown) {
  await whenReady();
  const body = (raw && typeof raw === "object" ? raw : {}) as Body;
  const route = path.startsWith("/") ? path : `/${path}`;

  if (route === "/auth/send-code") {
    const studentId = String(body.studentId || "");
    const mode = String(body.mode || "login");
    const account = findAccount(studentId);
    if (mode === "login" && !account) throw new FnError(404, "unknown_id", "No account for that ID.");
    if (mode === "signup" && account) throw new FnError(409, "exists", "That ID already has an account. Sign in instead.");
    const code = newCode();
    pending.set(studentId, { fullName: String(body.fullName || ""), faculty: String(body.faculty || ""), mode, code });
    return { ok: true, demoCode: code, expiresIn: 600 };
  }

  if (route === "/auth/verify") {
    const studentId = String(body.studentId || "");
    const code = String(body.code || "");
    const draft = pending.get(studentId);
    if (!draft || code !== draft.code) throw new FnError(400, "bad_code", "That code didn’t work. Send a new one if it expired.");
    const existing = findAccount(studentId);
    if (existing) {
      pending.delete(studentId);
      setSession(existing.uid);
      const user = readDoc(`users/${existing.uid}`) || {};
      return {
        ok: true,
        customToken: existing.uid,
        uid: existing.uid,
        isNew: false,
        status: String(user.status || "approved"),
        nickname: String(user.nickname || ""),
      };
    }
    if (draft.mode !== "signup") throw new FnError(404, "unknown_id", "No account for that ID.");
    const id = `uid-${studentId}`;
    const email = `${studentId}@ua.edu.lb`;
    upsertAccount({
      email,
      password: DEMO_PASSWORD,
      uid: id,
      claims: { role: "student", status: "approved", sa: false },
    });
    writeDoc(`users/${id}`, {
      nickname: "",
      greetingName: "",
      initial: "",
      role: "student",
      roleLabel: "Student",
      status: "approved",
      faculty: draft.faculty,
      plant: { petals: 0, roots: 0, stage: "Seed" },
    });
    writeDoc(`users_private/${id}`, { fullName: draft.fullName, studentId, email });
    writeDoc(`users/${id}/settings/main`, { hideGardenCount: false, dropGoing: false, accessibility: { offerTyping: true, quietPresence: true } });
    writeDoc(`records/${id}`, { fullName: draft.fullName, totals: { events: 0, trainings: 0, mentoring: 0, board: 0 }, items: [], ask: null });
    setSession(id);
    return { ok: true, customToken: id, uid: id, isNew: true, status: "approved", nickname: "" };
  }

  if (route === "/auth/nickname-check") {
    const nickname = String(body.nickname || "").trim().toLowerCase();
    const taken = childDocs("users").some((row) => nickname.length > 0 && String(row.data.nickname || "").trim().toLowerCase() === nickname && row.id !== sessionUid());
    return { ok: true, problem: taken ? "That nickname is taken." : null };
  }

  if (route === "/auth/nickname") {
    const userId = uid();
    const nickname = String(body.nickname || "").trim();
    const user = readDoc(`users/${userId}`) || {};
    patchDoc(`users/${userId}`, {
      nickname,
      greetingName: nickname,
      initial: initialsOf(nickname),
    });
    return { ok: true, nickname, status: String(user.status || "approved") };
  }

  if (route === "/check-in" || route === "/task-done") {
    const userId = uid();
    requireUserDoc(userId);
    const source = route === "/task-done" ? "task" : body.source === "voice" ? "voice" : "mood";
    const grew = grow(userId, "petals", source);
    return { ok: true, grew };
  }

  if (route === "/kindness-reply") {
    const userId = uid();
    requireUserDoc(userId);
    const grew = grow(userId, "roots", "kindness");
    if (grew) {
      writeDoc(`growthEvents/grow-${Date.now()}`, {
        uid: userId,
        kind: "root",
        source: "kindness",
        title: "A new root",
        body: "You answered someone who needed a hand. A root grew.",
        action: "",
        badge: "+1",
        circleId: String(body.circleId || ""),
        replyId: String(body.messageId || ""),
      });
    }
    return { ok: true, grew };
  }

  if (route === "/thanks") {
    const userId = uid();
    requireUserDoc(userId);
    const circleId = String(body.circleId || "");
    const threadId = String(body.threadId || "");
    const replyId = String(body.replyId || "");
    const messageId = String(body.messageId || "");
    let authorUid = "";
    if (threadId && replyId) {
      // A Hope thread reply: the thanks is stored on the reply, so it is still there after leaving.
      const path = `circles/${circleId}/threads/${threadId}/replies/${replyId}`;
      const reply = readDoc(path);
      if (!reply) throw new FnError(404, "missing", "That reply is gone.");
      authorUid = String(reply.authorUid || "");
      if (!authorUid || authorUid === userId) throw new FnError(400, "own_reply", "You can’t thank your own reply.");
      const thankedBy = Array.isArray(reply.thankedBy) ? (reply.thankedBy as string[]) : [];
      if (thankedBy.includes(userId)) return { ok: true, already: true };
      patchDoc(path, { thankedBy: [...thankedBy, userId] });
    } else if (messageId) {
      const msg = readDoc(`circles/${circleId}/messages/${messageId}`);
      if (!msg) throw new FnError(404, "missing", "That reply is gone.");
      authorUid = String(msg.authorUid || "");
      if (authorUid === userId) throw new FnError(400, "own_reply", "You can’t thank your own reply.");
      const thankedBy = Array.isArray(msg.thankedBy) ? (msg.thankedBy as string[]) : [];
      if (thankedBy.includes(userId)) return { ok: true, already: true };
      patchDoc(`circles/${circleId}/messages/${messageId}`, { thankedBy: [...thankedBy, userId] });
    }
    // Thanks grows a root for both people, and the author can thank them back from Home.
    const grew = grow(userId, "roots", "thanks");
    if (authorUid && readDoc(`users/${authorUid}`)) {
      grow(authorUid, "roots", "thanks");
      const me = readDoc(`users/${userId}`) || {};
      writeDoc(`growthEvents/thanked-${Date.now()}`, {
        uid: authorUid,
        fromUid: userId,
        kind: "root",
        source: "thanks",
        title: `${String(me.nickname || "Someone")} thanked you`,
        body: "Your reply helped. A root grew for both of you.",
        action: "Thank them back",
        badge: "+1 root",
        circleId,
        replyId: messageId || replyId,
        at: Date.now(),
      });
    }
    if (!grew) return { ok: true, grew: false };
    writeDoc(`growthEvents/grow-${Date.now()}`, {
      uid: userId,
      kind: "root",
      source: "thanks",
      title: "A new root",
      body: "You thanked someone. A root grew.",
      action: "",
      badge: "+1",
      circleId,
      replyId: messageId || replyId,
      at: Date.now(),
    });
    return { ok: true, grew: true };
  }

  if (route === "/thanks-back") {
    const userId = uid();
    const id = String(body.eventId || "");
    const note = readDoc(`growthEvents/${id}`);
    if (!note || note.uid !== userId || !note.fromUid) throw new FnError(404, "missing", "That note is gone.");
    if (note.thankedBack === true) return { ok: true, already: true };
    patchDoc(`growthEvents/${id}`, { thankedBack: true, action: "" });
    grow(userId, "roots", "thanks");
    const from = String(note.fromUid);
    if (readDoc(`users/${from}`)) grow(from, "roots", "thanks");
    return { ok: true };
  }

  if (route === "/event-code") {
    // Only the organizer gets the code that goes in the check-in QR.
    const eventId = String(body.eventId || "");
    requireOrganizer(eventId);
    const path = `eventCodes/${eventId}`;
    let code = String(readDoc(path)?.code || "");
    if (!code) {
      code = Math.random().toString(36).slice(2, 8).toUpperCase();
      writeDoc(path, { code });
    }
    return { ok: true, code };
  }

  if (route === "/event-by-code") {
    // The typed code under the organizer's QR, for when the camera can't scan. Writes nothing.
    uid();
    const code = String(body.code || "").trim().toUpperCase();
    const hit = code ? childDocs("eventCodes").find((row) => String(row.data.code || "") === code) : undefined;
    if (!hit) throw new FnError(404, "bad_code", "That code doesn’t match an event. Check the code under the QR.");
    return { ok: true, eventId: hit.id };
  }

  if (route === "/event-check-in") {
    // Attendance is written only here, and only with the code from the organizer's QR.
    const userId = uid();
    const eventId = String(body.eventId || "");
    const event = readDoc(`events/${eventId}`);
    if (!event) throw new FnError(404, "missing", "That event is not on this phone.");
    const result = {
      ok: true,
      already: false,
      title: String(event.title || "Event"),
      hostId: String(event.hostId || ""),
      hostType: String(event.hostType || ""),
      verified: event.verified !== false,
      nodeId: String(event.nodeId || ""),
    };
    const path = `events/${eventId}/attendance/${userId}`;
    if (readDoc(path)) return { ...result, already: true };
    const code = String(readDoc(`eventCodes/${eventId}`)?.code || "");
    if (!code || String(body.code || "").trim().toUpperCase() !== code) {
      throw new FnError(403, "bad_code", "Scan the organizer’s QR at the event to check in.");
    }
    if (event.ended === true) throw new FnError(409, "ended", "This event has ended.");
    if (event.hostType === "circle" && !readDoc(`circles/${String(event.hostId || "")}/members/${userId}`)) {
      throw new FnError(403, "not_member", "This check-in is for members of the Circle.");
    }
    const user = readDoc(`users/${userId}`) || {};
    writeDoc(path, { uid: userId, nickname: String(user.nickname || user.greetingName || "A student"), at: Date.now() });
    const impact = readDoc("impact/fall-2026");
    if (impact) patchDoc("impact/fall-2026", { checkIns: Number(impact.checkIns || 0) + 1 });
    return result;
  }

  if (route === "/end-event" || route === "/issue-certificates") {
    const eventId = String(body.eventId || "");
    if (!eventId) {
      // The Chair's dashboard issues for every ended event of their Circle.
      const circleId = String(body.circleId || "");
      if (!isChairOf(circleId, uid())) throw new FnError(403, "forbidden", "Only the Chair can issue certificates.");
      let issued = 0;
      for (const row of childDocs("events")) {
        if (row.data.hostType !== "circle" || row.data.hostId !== circleId) continue;
        if (row.data.ended === true || Number(row.data.endsAt || 0) <= Date.now()) issued += issueForEvent(row.id);
      }
      return { ok: true, issued };
    }
    requireOrganizer(eventId);
    const issued = issueForEvent(eventId);
    return { ok: true, issued };
  }

  if (route === "/feedback-tally") {
    const eventId = String(body.eventId || "");
    const rows = childDocs(`events/${eventId}/feedback`);
    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    let sum = 0;
    const comments: string[] = [];
    for (const row of rows) {
      const rating = String(row.data.rating || "");
      if (distribution[rating] != null) distribution[rating] += 1;
      sum += Number(row.data.rating || 0);
      if (row.data.comment) comments.push(String(row.data.comment));
    }
    const event = readDoc(`events/${eventId}`) || {};
    writeDoc(`feedbackAggregates/${eventId}`, {
      eventId,
      eventTitle: String(event.title || ""),
      circleId: String(event.hostId || ""),
      circleName: String(event.hostLabel || ""),
      count: rows.length,
      sum,
      average: rows.length ? Math.round((sum / rows.length) * 10) / 10 : 0,
      distribution,
      comments,
    });
    return { ok: true };
  }

  if (route === "/support-open") {
    const me = uid();
    const claims = currentAccount()?.claims || {};
    if (claims.sa !== true && claims.counselor !== true) throw new FnError(403, "forbidden", "Student Affairs opens this chat.");
    const id = String(body.id || "");
    const req = readDoc(`supportRequests/${id}`);
    if (!req) throw new FnError(404, "missing", "That request is gone.");
    const chatId = `support-${id}`;
    const studentUid = String(req.uid || "");
    writeDoc(`chats/${chatId}`, {
      members: [studentUid, me],
      title: String(req.nickname || "Support"),
      tag: "Support",
      letter: String(req.nickname || "S").slice(0, 1),
      inboxRank: 1,
      timeLabel: "Now",
    });
    patchDoc(`supportRequests/${id}`, { chatId, status: "open" });
    writeDoc(`cases/${chatId}`, {
      kind: "shared",
      kindLabel: "Shared by student",
      filter: "shared",
      nickname: String(req.nickname || "A student"),
      initial: String(req.nickname || "S").slice(0, 1),
      severity: "low",
      where: "Support request",
      topic: String(req.reason || ""),
      title: `${String(req.nickname || "A student")} · support`,
      time: "Now",
      rank: 1,
      open: true,
      excerpt: String(req.note || ""),
    });
    return { ok: true, chatId };
  }

  if (route === "/staff/counselors") {
    requireSA();
    const people: { uid: string; name: string }[] = [];
    for (const account of accounts()) {
      if (account.claims.sa !== true && account.claims.counselor !== true) continue;
      const profile = readDoc(`staffProfile/${account.uid}`) || {};
      const priv = readDoc(`users_private/${account.uid}`) || {};
      people.push({ uid: account.uid, name: String(profile.name || priv.fullName || account.email) });
    }
    return { counselors: people };
  }

  if (route === "/staff/assign") {
    requireSA();
    const caseId = String(body.caseId || "");
    const counselorUid = String(body.counselorUid || "");
    const profile = readDoc(`staffProfile/${counselorUid}`) || {};
    const priv = readDoc(`users_private/${counselorUid}`) || {};
    const name = String(profile.name || priv.fullName || "Student Affairs");
    if (readDoc(`cases/${caseId}`)) patchDoc(`cases/${caseId}`, { assignedUid: counselorUid, assignedName: name });
    return { ok: true, name };
  }

  if (route === "/mentor-respond") {
    const id = String(body.requestId || "");
    const req = readDoc(`mentorRequests/${id}`);
    if (!req) throw new FnError(404, "missing", "That request is gone.");
    if (String(req.toUid || "") !== uid() || claims().alumni !== true) throw new FnError(403, "forbidden", "Only the alum it was sent to can answer.");
    const chatId = `mentor-${id}`;
    writeDoc(`chats/${chatId}`, {
      members: [String(req.fromUid || ""), String(req.toUid || "")],
      title: String(req.fromName || "Student"),
      tag: "Mentor",
      letter: String(req.fromName || "S").slice(0, 1),
      inboxRank: 2,
      timeLabel: "Now",
    });
    patchDoc(`mentorRequests/${id}`, { status: "accepted", chatId });
    // Mentoring is helping, so the mentor's plant grows a root.
    const mentorUid = uid();
    requireUserDoc(mentorUid);
    grow(mentorUid, "roots", "mentor");
    return { chatId };
  }

  if (route === "/admin/role") {
    const me = uid();
    if (currentAccount()?.claims.admin !== true) throw new FnError(403, "forbidden", "Only the campus admin can set a role.");
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "student");
    const account = findAccount(email);
    if (!account) throw new FnError(404, "missing", "No account for that email.");
    const claims =
      role === "admin"
        ? { role: "admin", admin: true, sa: false, status: "approved" }
        : role === "staff"
          ? { role: "staff", sa: true, counselor: true, admin: false, status: "approved" }
          : { role: "student", sa: false, admin: false, status: "approved" };
    upsertAccount({ ...account, claims });
    const label = role === "admin" ? "Admin" : role === "staff" ? "Student Affairs" : "Student";
    if (readDoc(`users/${account.uid}`)) patchDoc(`users/${account.uid}`, { role: role === "staff" ? "staff" : role, roleLabel: label });
    writeDoc(`auditLogs/log-${Date.now()}`, {
      action: "Role change",
      actor: "Campus Admin",
      actorUid: me,
      target: email,
      when: "Just now",
      category: "role",
      chip: label,
      title: `Role set to ${label}`,
      detail: email,
      counselor: "",
    });
    return { ok: true };
  }

  if (route === "/join-decide") {
    const me = uid();
    const circleId = String(body.circleId || "");
    const target = String(body.uid || "");
    const status = body.status === "approved" ? "approved" : body.status === "declined" ? "declined" : "";
    if (!circleId || !target || !status) throw new FnError(400, "bad_request", "Missing request.");
    if (!isChairOf(circleId, me)) throw new FnError(403, "forbidden", "Only the Chair can decide.");
    const reqPath = `circles/${circleId}/joinRequests/${target}`;
    const request = readDoc(reqPath);
    if (!request || request.status !== "pending") throw new FnError(409, "closed", "That request is closed.");
    patchDoc(reqPath, { status });
    if (status === "approved" && !readDoc(`circles/${circleId}/members/${target}`)) {
      const nickname = String(request.nickname || "A student");
      writeDoc(`circles/${circleId}/members/${target}`, { nickname, displayName: nickname, initial: nickname.slice(0, 1).toUpperCase(), roles: [], order: Date.now() });
      const circle = readDoc(`circles/${circleId}`) || {};
      patchDoc(`circles/${circleId}`, { memberCount: Number(circle.memberCount || 0) + 1 });
    }
    return { ok: true, status };
  }

  if (route === "/board-role") {
    // The Chair sets board roles inside their own Circle. Only Student Affairs assigns the Chair.
    const me = uid();
    const circleId = String(body.circleId || "");
    const targetUid = String(body.targetUid || "");
    const allowed = new Set(["vice_chair", "events", "moderator", "logistics", "hr", "media", "treasurer", "mentor"]);
    const roles = Array.isArray(body.roles) ? body.roles.map(String).slice(0, 2) : [];
    if (!circleId || !targetUid || roles.some((r) => !allowed.has(r))) throw new FnError(400, "bad_role", "That role can’t be set here.");
    if (!isChairOf(circleId, me)) throw new FnError(403, "forbidden", "Only the Chair sets board roles.");
    const path = `circles/${circleId}/members/${targetUid}`;
    if (!readDoc(path)) throw new FnError(404, "missing", "That member left the Circle.");
    patchDoc(path, { roles });
    writeDoc(`circles/${circleId}/audit/a-${Date.now()}`, { actorUid: me, actor: "Chair", action: `Set roles to ${roles.join(", ") || "member"}`, target: targetUid, when: "Just now", order: Date.now() });
    return { ok: true };
  }

  if (route === "/verify-ask") {
    const me = uid();
    const circleId = String(body.circleId || "");
    if (!isChairOf(circleId, me)) throw new FnError(403, "forbidden", "Only the Chair can ask.");
    const circle = readDoc(`circles/${circleId}`) || {};
    const name = String(circle.name || circleId);
    writeDoc(`communityReviews/${circleId}`, { name, status: "waiting", initial: name.slice(0, 1).toUpperCase(), sub: `${circle.memberCount || 1} members · asking to be verified`, members: Number(circle.memberCount || 1), order: Date.now() }, true);
    return { ok: true, id: circleId };
  }

  if (route === "/verify-decide") {
    // The gold Verified badge means Student Affairs verified the community. Nobody else can set it.
    requireSA("Student Affairs verifies Circles.");
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!["verified", "changes", "declined"].includes(status)) throw new FnError(400, "bad_request", "Pick a decision.");
    writeDoc(`communityReviews/${id}`, { status, reviewedBy: sessionUid() }, true);
    const circle = readDoc(`circles/${id}`);
    if (circle) {
      patchDoc(`circles/${id}`, { verified: status === "verified", officialLine: status === "verified" ? "Verified by Student Affairs" : "Not verified yet" });
      systemLine(id, status === "verified" ? `Student Affairs verified ${String(circle.name || "this Circle")}.` : `Student Affairs marked this Circle ${status}.`);
    }
    audit({ action: "verify", category: "role", title: `Circle ${status}`, actor: "Student Affairs", actorUid: sessionUid(), target: id });
    return { ok: true, status };
  }

  if (route === "/venue-decide") {
    requireSA("Student Affairs decides venues.");
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!["approved", "declined", "suggested", "discussion", "changes"].includes(status)) throw new FnError(400, "bad_request", "Pick a decision.");
    const req = readDoc(`venueRequests/${id}`);
    if (!req) throw new FnError(404, "missing", "That request is gone.");
    patchDoc(`venueRequests/${id}`, { status });
    const eventId = String(req.eventId || "");
    if (eventId && readDoc(`events/${eventId}`)) patchDoc(`events/${eventId}`, { venueStatus: status });
    const circleId = String(req.circleId || "");
    if (circleId && readDoc(`circles/${circleId}`)) systemLine(circleId, `Student Affairs ${status === "approved" ? "approved" : status === "declined" ? "declined" : "replied about"} the venue for ${String(req.title || "your event")}.`);
    return { ok: true, status };
  }

  if (route === "/create-event") {
    const me = uid();
    const circleId = String(body.circleId || "");
    if (!isChairOf(circleId, me)) throw new FnError(403, "forbidden", "Only the Chair can host an event.");
    const title = String(body.title || "").trim().slice(0, 80);
    const startsAt = Number(body.startsAt || 0);
    const endsAt = Number(body.endsAt || 0);
    if (title.length < 2 || !startsAt || endsAt <= startsAt) throw new FnError(400, "bad_request", "Add a title and a start and end time.");
    const circle = readDoc(`circles/${circleId}`) || {};
    const id = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24) || "event"}-${Date.now().toString(36)}`;
    const when = new Date(startsAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    writeDoc(`events/${id}`, {
      title,
      status: "published",
      hostType: "circle",
      hostId: circleId,
      hostLabel: String(circle.name || "Circle"),
      verified: circle.verified === true,
      venueId: String(body.venueId || "engineering"),
      venueStatus: "pending",
      startsAt,
      endsAt,
      whenLine: when,
      meta: when,
      placeLine: "Faculty of Engineering",
      description: String(body.description || "").slice(0, 200),
      blurb: String(body.description || "").slice(0, 200),
      order: Date.now(),
      ended: false,
    });
    writeDoc(`venueRequests/vr-${id}`, { circleId, chairUid: me, eventId: id, title, circle: String(circle.name || circleId), status: "sent", queue: "pitch", detail: when, dateOptions: [when], time: "Just now", order: Date.now() });
    return { ok: true, id, title };
  }

  if (route === "/create-petition") {
    const me = uid();
    const title = String(body.title || "").trim().slice(0, 80);
    if (title.length < 3) throw new FnError(400, "bad_request", "Name the change you want.");
    const user = readDoc(`users/${me}`) || {};
    const id = `p-${Date.now().toString(36)}`;
    writeDoc(`petitions/${id}`, { title, text: String(body.line || "").slice(0, 200), line: String(body.line || "").slice(0, 200), status: "pending", bucket: "pending", by: String(user.nickname || "A student"), topic: "Campus", goal: 25, signCount: 1, order: Date.now() });
    writeDoc(`petitions/${id}/signatures/${me}`, { uid: me, at: Date.now() });
    return { ok: true, id };
  }

  if (route === "/staff/roster") {
    requireSA();
    const circleId = String(body.circleId || "");
    const chairUid = String(readDoc(`circles/${circleId}`)?.chairUid || "");
    const members = childDocs(`circles/${circleId}/members`).map((row) => {
      const roles = Array.isArray(row.data.roles) ? (row.data.roles as string[]) : [];
      const current = row.id === chairUid;
      return { id: row.id, name: String(row.data.nickname || "Member"), sub: current ? "Current Chair" : roles.length ? roles.join(", ") : "Member", current };
    });
    return { ok: true, members };
  }

  if (route === "/staff/find") {
    requireSA();
    const account = findAccount(String(body.email || "").trim().toLowerCase());
    if (!account) throw new FnError(404, "missing", "No account for that UA email.");
    const profile = readDoc(`users/${account.uid}`) || {};
    return { ok: true, uid: account.uid, name: String(profile.nickname || profile.greetingName || "Member") };
  }

  if (route === "/staff/chair") {
    // Student Affairs assigns the Chair. A Chair can't hand it on, and can't grant the Verified badge.
    requireSA("Only Student Affairs assigns a Chair.");
    const circleId = String(body.circleId || "");
    const toChair = String(body.toChair || "");
    const toName = String(body.toName || "");
    if (!circleId || !toChair || !body.reason) throw new FnError(400, "bad_request", "Choose a Chair and a reason.");
    const circle = readDoc(`circles/${circleId}`);
    if (!circle) throw new FnError(404, "missing", "That community is gone.");
    const before = String(circle.chairUid || "");
    patchDoc(`circles/${circleId}`, { chairUid: toChair, chairName: toName });
    if (before && readDoc(`circles/${circleId}/members/${before}`)) {
      const roles = (readDoc(`circles/${circleId}/members/${before}`)?.roles || []) as string[];
      patchDoc(`circles/${circleId}/members/${before}`, { roles: roles.filter((r) => r !== "chair") });
    }
    if (readDoc(`circles/${circleId}/members/${toChair}`)) patchDoc(`circles/${circleId}/members/${toChair}`, { roles: ["chair"] });
    audit({ action: "Chair change", category: "role", title: `Chair set to ${toName || "a member"}`, detail: String(body.reason || ""), actor: "Student Affairs", actorUid: sessionUid(), target: `circles/${circleId}`, chip: "Chair" });
    return { ok: true };
  }

  if (route === "/staff/account" || route === "/staff/graduate") {
    // Only Student Affairs changes an account's status, including graduating someone to alumni.
    requireSA("Only Student Affairs changes an account’s status.");
    const target = String(body.uid || "");
    const account = accounts().find((a) => a.uid === target);
    if (route === "/staff/graduate") {
      const year = Number(body.classYear);
      if (!target || !Number.isInteger(year) || year < 1990 || year > new Date().getFullYear() + 1) throw new FnError(400, "bad_request", "Pick the account and a class year.");
      if (account) upsertAccount({ ...account, claims: { ...account.claims, role: "alumni", alumni: true } });
      patchDoc(`users/${target}`, { role: "alumni", roleLabel: "Alumni", alumni: true, classYear: year });
      audit({ action: "Graduated to alumni", category: "role", title: `Class of ${year}`, detail: target, actor: "Student Affairs", actorUid: sessionUid(), target: `users/${target}`, chip: "Alumni" });
      return { ok: true, classYear: year };
    }
    const status = body.decision === "approve" ? "approved" : body.decision === "reject" ? "rejected" : "pending";
    if (!target) throw new FnError(400, "bad_request", "Pick an account.");
    if (account) upsertAccount({ ...account, claims: { ...account.claims, status } });
    if (readDoc(`users/${target}`)) patchDoc(`users/${target}`, { status });
    audit({ action: `Account ${String(body.decision || "")}`, category: "role", title: `Account ${status}`, detail: target, actor: "Student Affairs", actorUid: sessionUid(), target: `users/${target}` });
    return { ok: true };
  }

  if (route === "/staff/case") {
    requireSA();
    const caseId = String(body.caseId || "");
    if (!caseId) throw new FnError(400, "bad_request", "Missing case.");
    writeDoc(`cases/${caseId}`, { ladderStep: body.ladderStep, stepLabel: String(body.stepLabel || ""), open: body.open !== false, status: String(body.status || "open") }, true);
    return { ok: true };
  }

  if (route === "/staff/reveal") {
    requireSA();
    const reasons = ["danger_to_self", "danger_to_others", "legal_requirement", "other"];
    const caseId = String(body.caseId || "");
    if (!body.confirm || !reasons.includes(String(body.reason)) || String(body.note || "").length < 30) {
      throw new FnError(400, "bad_request", "A serious reason and a note of at least 30 characters are required.");
    }
    const id = `rv-${Date.now()}`;
    writeDoc(`staffProfile/${sessionUid()}/reveals/${id}`, { reason: String(body.reason), when: "Just now", note: String(body.note), caseId, order: id });
    writeDoc(`cases/${caseId}`, { ladderStep: 4, revealed: true, stepLabel: "Step 4 of 4" }, true);
    audit({ type: "reveal", category: "reveal", action: "Identity reveal", title: "Identity reveal", detail: String(body.reason), actor: "Student Affairs", actorUid: sessionUid(), target: caseId, counselor: "Student Affairs" });
    return { ok: true, id };
  }

  if (route === "/create-circle") {
    const id = String(body.name || "circle").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "circle";
    writeDoc(`circles/${id}`, {
      name: String(body.name || "Circle"),
      kind: body.kind === "community" ? "community" : "support",
      verified: false,
      memberCount: 1,
      chairUid: sessionUid() || "",
      charter: "",
    });
    return { id, name: String(body.name || "Circle") };
  }

  throw new FnError(501, "not_on_phone", "That action isn’t available on this phone yet.");
}
