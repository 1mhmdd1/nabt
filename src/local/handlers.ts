import { FnError } from "../fn-error";
import { initialsOf } from "../nickname/rules.mjs";
import { DEMO_CODE, DEMO_PASSWORD } from "./mode";
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

const pending = new Map<string, { fullName: string; faculty: string; mode: string }>();

function uid() {
  const id = sessionUid();
  if (!id) throw new FnError(401, "signed_out", "Sign in first.");
  return id;
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
    pending.set(studentId, { fullName: String(body.fullName || ""), faculty: String(body.faculty || ""), mode });
    return { ok: true, demoCode: DEMO_CODE, expiresIn: 600 };
  }

  if (route === "/auth/verify") {
    const studentId = String(body.studentId || "");
    const code = String(body.code || "");
    if (code !== DEMO_CODE) throw new FnError(400, "bad_code", "That code didn’t work.");
    const existing = findAccount(studentId);
    if (existing) {
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
    const draft = pending.get(studentId);
    if (!draft || draft.mode !== "signup") throw new FnError(404, "unknown_id", "No account for that ID.");
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
    if (!grow(userId, "roots", "thanks")) return { ok: true, grew: false };
    const id = `grow-${Date.now()}`;
    writeDoc(`growthEvents/${id}`, {
      uid: userId,
      kind: "root",
      source: "thanks",
      title: "A new root",
      body: "You thanked someone. A root grew.",
      action: "See the chat",
      badge: "+1",
      circleId: String(body.circleId || ""),
      replyId: String(body.messageId || body.replyId || ""),
    });
    return { ok: true };
  }

  if (route === "/event-check-in") {
    const userId = uid();
    const eventId = String(body.eventId || "");
    const event = readDoc(`events/${eventId}`);
    if (!event) throw new FnError(404, "missing", "That event is not on this phone.");
    const path = `events/${eventId}/attendance/${userId}`;
    if (!readDoc(path)) {
      const user = readDoc(`users/${userId}`) || {};
      writeDoc(path, { uid: userId, nickname: String(user.nickname || user.greetingName || "A student"), at: Date.now() });
      const impact = readDoc("impact/fall-2026");
      if (impact) patchDoc("impact/fall-2026", { checkIns: Number(impact.checkIns || 0) + 1 });
    }
    return { ok: true };
  }

  if (route === "/end-event" || route === "/issue-certificates") {
    const eventId = String(body.eventId || "");
    if (!eventId && body.circleId) return { ok: true, issued: 0 };
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

  return { ok: true };
}
