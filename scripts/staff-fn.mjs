/**
 * Local stand-in for Student Affairs Functions (Admin SDK).
 * Clients cannot write auditLogs, privacyLog, reveals, or users.status.
 * Imported by scripts/dev-fn.mjs at POST /staff/*.
 */
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const REASONS = ["danger_to_self", "danger_to_others", "legal_requirement", "other"];

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function json(res, code, body) {
  res.statusCode = code;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

async function requireStaff(actorUid) {
  if (!actorUid) {
    const error = new Error("Sign in first.");
    error.status = 401;
    throw error;
  }
  const actor = await getAuth().getUser(actorUid);
  if (actor.customClaims?.sa !== true) {
    const error = new Error("Student Affairs only.");
    error.status = 403;
    throw error;
  }
  return actor;
}

function audit(db, fields) {
  return db.collection("auditLogs").add({
    ...fields,
    when: fields.when || "Just now",
    at: Timestamp.now(),
  });
}

export async function handleStaffRequest(req, res, db, actorUid) {
  const body = await readBody(req);
  const url = req.url || "";
  try {
    const actor = await requireStaff(actorUid);
    if (url === "/staff/roster") {
      const circleId = String(body.circleId || "");
      if (!circleId) {
        json(res, 400, { ok: false, error: "Missing community." });
        return;
      }
      const circle = await db.doc(`circles/${circleId}`).get();
      const chairUid = String(circle.data()?.chairUid || "");
      const members = await db.collection(`circles/${circleId}/members`).get();
      json(res, 200, {
        ok: true,
        members: members.docs.map((row) => {
          const roles = Array.isArray(row.data().roles) ? row.data().roles : [];
          const current = row.id === chairUid;
          return {
            id: row.id,
            name: String(row.data().nickname || "Member"),
            sub: current ? "Current Chair" : roles.length ? roles.join(", ") : "Member",
            current,
          };
        }),
      });
      return;
    }
    if (url === "/staff/find") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email.includes("@")) {
        json(res, 400, { ok: false, error: "Use a UA email." });
        return;
      }
      const found = await getAuth().getUserByEmail(email);
      const profile = (await db.doc(`users/${found.uid}`).get()).data() || {};
      json(res, 200, { ok: true, uid: found.uid, name: String(profile.nickname || profile.greetingName || "Member") });
      return;
    }
    if (url === "/staff/counselors") {
      const listed = await getAuth().listUsers(200);
      const counselors = listed.users
        .filter((user) => user.customClaims?.counselor === true || user.customClaims?.sa === true)
        .map((user) => ({
          uid: user.uid,
          name: user.displayName || user.email || "Staff",
          email: user.email || "",
        }));
      json(res, 200, { ok: true, counselors });
      return;
    }
    if (url === "/staff/assign") {
      const caseId = String(body.caseId || "");
      const counselorUid = String(body.counselorUid || "");
      if (!caseId || !counselorUid) {
        json(res, 400, { ok: false, error: "Pick a counselor." });
        return;
      }
      const target = await getAuth().getUser(counselorUid);
      if (target.customClaims?.sa !== true && target.customClaims?.counselor !== true) {
        json(res, 400, { ok: false, error: "That account is not staff." });
        return;
      }
      const name = target.displayName || target.email || "Counselor";
      await db.doc(`cases/${caseId}`).set({ assignedUid: counselorUid, assignedName: name }, { merge: true });
      await audit(db, { action: "assign", caseId, counselorUid, who: name, actorUid: actor.uid });
      json(res, 200, { ok: true, name });
      return;
    }
    if (url === "/staff/reveal") {
      if (!body.confirm || !REASONS.includes(body.reason) || typeof body.note !== "string" || body.note.length < 30) {
        json(res, 400, { ok: false, error: "A serious reason and a note of at least 30 characters are required." });
        return;
      }
      const priv = await db.doc(`casesPrivate/${body.caseId}`).get();
      const uid = priv.data()?.subjectUid;
      if (!uid) {
        json(res, 404, { ok: false, error: "This case has no linked student." });
        return;
      }
      const identity = (await db.doc(`users_private/${uid}`).get()).data() || {};
      const id = db.collection("reveals").doc().id;
      const now = Timestamp.now();
      const batch = db.batch();
      batch.set(db.doc(`reveals/${id}`), {
        caseId: body.caseId,
        counselorUid: actor.uid,
        reason: body.reason,
        note: body.note,
        at: now,
      });
      batch.set(db.doc(`auditLogs/${id}`), {
        type: "reveal",
        area: "staff",
        category: "reveal",
        action: "Identity reveal",
        title: "Identity reveal",
        detail: String(body.reason || ""),
        actor: "Student Affairs",
        actorUid: actor.uid,
        target: String(body.caseId || ""),
        when: "Just now",
        counselor: "Student Affairs",
        caseId: body.caseId,
        counselorUid: actor.uid,
        reason: body.reason,
        note: body.note,
        at: now,
      });
      batch.set(db.doc(`users/${uid}/privacyLog/${id}`), {
        type: "reveal",
        who: "Student Affairs (counselor)",
        reason: body.reason,
        at: now,
      });
      batch.set(db.doc(`revealResults/${id}`), {
        counselorUid: actor.uid,
        caseId: body.caseId,
        fullName: identity.fullName || "",
        studentId: identity.studentId || "",
        reason: body.reason,
      });
      batch.set(db.doc(`staffProfile/${actor.uid}/reveals/${id}`), {
        reason: body.reason,
        when: "Just now",
        note: body.note,
        caseId: body.caseId,
        order: id,
      });
      batch.set(db.doc(`staffProfile/${actor.uid}`), { revealCount: FieldValue.increment(1) }, { merge: true });
      batch.set(db.doc(`cases/${body.caseId}`), { ladderStep: 4, revealed: true, stepLabel: "Step 4 of 4" }, { merge: true });
      await batch.commit();
      json(res, 200, { ok: true, id });
      return;
    }
    if (url === "/staff/chair") {
      if (!body.circleId || !body.toChair || !body.reason) {
        json(res, 400, { ok: false, error: "Choose a Chair and a reason." });
        return;
      }
      const now = Timestamp.now();
      const batch = db.batch();
      batch.set(db.doc(`circles/${body.circleId}`), { chairUid: body.toChair, chairName: body.toName }, { merge: true });
      batch.set(
        db.doc(`staffCommunities/${body.circleId}`),
        { chair: body.toName, since: "Today" },
        { merge: true },
      );
      batch.set(db.collection("auditLogs").doc(), {
        type: "chair_change",
        area: "staff",
        category: "role",
        action: "Chair change",
        title: `Chair set to ${body.toName || "a member"}`,
        detail: String(body.reason || ""),
        actor: "Student Affairs",
        actorUid: actor.uid,
        target: `circles/${body.circleId}`,
        when: "Just now",
        circleId: body.circleId,
        fromChair: body.fromChair || "",
        toChair: body.toChair,
        toName: body.toName || "",
        reason: body.reason,
        byUid: actor.uid,
        at: now,
      });
      await batch.commit();
      json(res, 200, { ok: true });
      return;
    }
    if (url === "/staff/account") {
      const status = body.decision === "approve" ? "approved" : body.decision === "reject" ? "rejected" : "pending";
      if (!body.uid || !body.decision) {
        json(res, 400, { ok: false });
        return;
      }
      await db.doc(`users/${body.uid}`).set({ status, role: "student", roleLabel: "Student" }, { merge: true });
      // The token carries the status; rules read it from there.
      try {
        const user = await getAuth().getUser(body.uid);
        await getAuth().setCustomUserClaims(body.uid, { ...(user.customClaims || {}), status, role: user.customClaims?.role || "student" });
      } catch {
        /* no Auth record (seeded uid): the profile status still changes */
      }
      await db.doc(`accountQueue/${body.uid}`).set(
        { status, chip: status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending", chipOn: status === "pending", filter: status, updatedAt: Timestamp.now() },
        { merge: true },
      );
      await audit(db, {
        type: "account_review",
        area: "staff",
        category: "role",
        action: `Account ${body.decision}`,
        title: `Account ${status}`,
        detail: body.uid,
        actor: "Student Affairs",
        actorUid: actor.uid,
        target: `users/${body.uid}`,
        uid: body.uid,
        decision: body.decision,
        reviewerUid: actor.uid,
      });
      json(res, 200, { ok: true });
      return;
    }
    if (url === "/staff/case") {
      if (!body.caseId) {
        json(res, 400, { ok: false });
        return;
      }
      await db.doc(`cases/${body.caseId}`).set(
        {
          ladderStep: body.ladderStep,
          stepLabel: body.stepLabel || "",
          open: body.open !== false,
          status: body.status || "open",
        },
        { merge: true },
      );
      json(res, 200, { ok: true });
      return;
    }
    json(res, 404, { ok: false });
  } catch (err) {
    json(res, err.status || 500, { ok: false, error: String(err.message || err) });
  }
}
