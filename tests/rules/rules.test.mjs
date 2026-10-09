// NABT Firestore rules tests. Run: npm test  (needs Java 11+; uses the Firestore emulator)
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, getDocs, deleteDoc, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import { registerVoiceSafetyRules } from './voice-safety.rules.test.mjs';
import { registerRecordsRules } from './records.rules.test.mjs';
import { registerImpactRules } from './impact.rules.test.mjs';
import { registerFlowRules } from './flows.rules.test.mjs';

let env;
const T = {
  pending:   { status: 'pending', role: 'student' },
  student:   { status: 'approved', role: 'student' },
  alum:      { status: 'approved', role: 'alumni' },
  sa:        { status: 'approved', role: 'staff', sa: true },
  counselor: { status: 'approved', role: 'staff', sa: true, counselor: true },
  admin:     { status: 'approved', role: 'admin' },
};
const as = (uid, claims) => env.authenticatedContext(uid, claims).firestore();
const anon = () => env.unauthenticatedContext().firestore();
registerVoiceSafetyRules({ getEnv: () => env, as, T, anon });
registerRecordsRules({ getEnv: () => env, as, T, anon });
registerImpactRules({ getEnv: () => env, as, T });
registerFlowRules({ getEnv: () => env, as, T });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-nabt',
    firestore: { rules: readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(async () => { await env?.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const S = (p, d) => setDoc(doc(db, p), d);
    // users: public profiles (nickname only) + private identity
    for (const [uid, nick, status] of [['cedar', 'Quiet Cedar', 'approved'], ['fig', 'Quiet Fig', 'approved'], ['newbie', 'Soft Maple', 'pending'], ['jad', 'Keen Ash', 'approved'], ['lara', 'Bright Olive', 'approved'], ['rana', 'Rana (alum)', 'approved']]) {
      await S(`users/${uid}`, { nickname: nick, status, role: uid === 'rana' ? 'alumni' : 'student' });
      await S(`users_private/${uid}`, { fullName: `Real ${uid}`, idNumber: '202312345', email: '202312345@ua.edu.lb' });
    }
    await S('users/cedar/privacyLog/1', { type: 'reveal', who: 'Student Affairs (counselor)', reason: 'danger_to_self' });
    // verified community A (Robotics): chair = lara, board = jad (events), member = cedar
    await S('circles/robotics', { name: 'Robotics Society', kind: 'community', verified: true, anonymous: false, memberCount: 3, chairUid: 'lara' });
    await S('circles/robotics/members/lara', { nickname: 'Bright Olive', roles: ['chair'], privileges: ['members'] });
    await S('circles/robotics/members/jad', { nickname: 'Keen Ash', roles: ['events'], privileges: [] });
    await S('circles/robotics/members/cedar', { nickname: 'Quiet Cedar', roles: [] });
    await S('circles/robotics/contacts/cedar', { realName: 'Real cedar', uaEmail: '202312345@ua.edu.lb', phone: '+961 70 000 000' });
    await S('circles/robotics/board/ledger-1', { amount: 40, purpose: 'Arduino kits', approvals: [] });
    // verified community B (Debate): jad is only a plain member here
    await S('circles/debate', { name: 'Debate Circle', kind: 'community', verified: true, anonymous: false, memberCount: 2, chairUid: 'fig' });
    await S('circles/debate/members/fig', { nickname: 'Quiet Fig', roles: ['chair'], privileges: ['members'] });
    await S('circles/debate/members/jad', { nickname: 'Keen Ash', roles: [] });
    await S('circles/debate/board/note-1', { text: 'private board note' });
    await S('circles/debate/contacts/jad', { realName: 'Real jad', uaEmail: 'x@ua.edu.lb' });
    // anonymous support Circle
    await S('circles/exam', { name: 'Exam Week', kind: 'support', anonymous: true, memberCount: 2 });
    await S('circles/exam/members/cedar', { nickname: 'Quiet Cedar', roles: [] });
    await S('circles/exam/members/fig', { nickname: 'Quiet Fig', roles: [] });
    await S('circles/exam/messages/m1', { authorUid: 'fig', authorNickname: 'Quiet Fig', text: 'hi', kind: 'text' });
    // chats
    await S('chats/buddy1', { type: 'buddy', members: ['cedar', 'fig'], anonymous: true, nameShares: { cedar: false, fig: false } });
    await S('chats/alum1', { type: 'alumni_named', members: ['cedar', 'rana'], anonymous: false, nameShares: { cedar: true, rana: true } });
    // safety
    await S('cases/c1', { source: 'care_signal', nickname: 'Quiet Fig', careLevel: 'needs_care', ladderStep: 2 });
    await S('casesPrivate/c1', { subjectUid: 'fig' });
    await S('reveals/r1', { caseId: 'c1', counselorUid: 'rima', reason: 'danger_to_self', note: 'x'.repeat(40) });
    await S('safetySignals/s1', { severity: 'concerning', category: 'hopelessness', context: 'circle', anonId: 'a-1', at: 1 });
    await S('events/e1', { title: 'Build night', status: 'published', hostType: 'circle', hostId: 'robotics', access: { stepFree: true, quietRoom: 'Room 204', captions: true } });
    // accessibility: a private accommodation request for the Robotics-hosted event + cedar's settings
    await S('accommodations/a1', { uid: 'cedar', nickname: 'Quiet Cedar', eventId: 'e1', needs: ['quiet_space', 'captions'], status: 'requested', createdAt: 1, deleteAt: 2 });
    await S('users/cedar/settings/main', { quietHours: { on: true }, accessibility: { calmMode: 'system', offerTyping: true } });
    await S('events/e1/attendance/cedar', { at: 1 });
    await S('petitions/p1', { title: 'Library hours', status: 'published', signCount: 250 });
    await S('auditLogs/log1', { actorUid: 'boss', action: 'assign_chair', target: 'circles/robotics', at: 1 });
    await S('petitions/p1/signatures/cedar', { at: 1 });
  });
});

// ---------- anonymity / nickname privacy ----------
test('peers can read nickname profiles but never another student\'s real identity', async () => {
  const db = as('cedar', T.student);
  await assertSucceeds(getDoc(doc(db, 'users/fig')));
  await assertFails(getDoc(doc(db, 'users_private/fig')));
  await assertSucceeds(getDoc(doc(db, 'users_private/cedar')));
});
test('real-identity fields can never be written into public docs or messages', async () => {
  const db = as('cedar', T.student);
  await assertFails(updateDoc(doc(db, 'users/cedar'), { fullName: 'Real cedar' }));
  await assertFails(setDoc(doc(db, 'circles/exam/messages/m2'), { authorUid: 'cedar', authorNickname: 'Quiet Cedar', text: 'hi', kind: 'text', realName: 'Real cedar' }));
  await assertSucceeds(setDoc(doc(db, 'circles/exam/messages/m3'), { authorUid: 'cedar', authorNickname: 'Quiet Cedar', text: 'hi', kind: 'text' }));
});
test('users cannot edit their own role, status or plant', async () => {
  const db = as('cedar', T.student);
  await assertFails(updateDoc(doc(db, 'users/cedar'), { role: 'admin' }));
  await assertFails(updateDoc(doc(db, 'users/cedar'), { status: 'rejected' }));
  await assertFails(updateDoc(doc(as('newbie', T.pending), 'users/newbie'), { status: 'approved' }));
  await assertFails(updateDoc(doc(db, 'users/cedar'), { plant: { petals: 99 } }));
  await assertSucceeds(updateDoc(doc(db, 'users/cedar'), { mode: 'exam' }));
});
test('SA reads real identity only while an account is pending (review); never after approval', async () => {
  const db = as('rima', T.sa);
  await assertSucceeds(getDoc(doc(db, 'users_private/newbie')));
  await assertFails(getDoc(doc(db, 'users_private/cedar')));
  await assertSucceeds(getDoc(doc(as('boss', T.admin), 'users_private/cedar')));
});
test('pending users can read but not post', async () => {
  const db = as('newbie', T.pending);
  await assertFails(addDoc(collection(db, 'nodes/n1/notes'), { authorUid: 'newbie', text: 'hello', status: 'held' }));
  await assertFails(addDoc(collection(db, 'alumniAsks'), { askerUid: 'newbie', question: 'q' }));
});
test('non-members cannot read a Circle\'s messages', async () => {
  await assertFails(getDocs(collection(as('jad', T.student), 'circles/exam/messages')));
  await assertSucceeds(getDocs(collection(as('cedar', T.student), 'circles/exam/messages')));
});

// ---------- 1:1 and alumni chats ----------
test('anonymous buddy chat: no media; each person only flips their own name share', async () => {
  const db = as('cedar', T.student);
  await assertFails(addDoc(collection(db, 'chats/buddy1/messages'), { authorUid: 'cedar', authorNickname: 'Quiet Cedar', kind: 'media', media: 'x.jpg' }));
  await assertSucceeds(addDoc(collection(db, 'chats/buddy1/messages'), { authorUid: 'cedar', authorNickname: 'Quiet Cedar', kind: 'text', text: 'hey' }));
  await assertSucceeds(updateDoc(doc(db, 'chats/buddy1'), { 'nameShares.cedar': true }));
  await assertFails(updateDoc(doc(db, 'chats/buddy1'), { 'nameShares.fig': true }));
  await assertFails(updateDoc(doc(db, 'chats/buddy1'), { anonymous: false }));
});
test('alumni chats are always named: cannot be made anonymous; clients cannot create chats', async () => {
  const db = as('cedar', T.student);
  await assertFails(updateDoc(doc(db, 'chats/alum1'), { anonymous: true }));
  await assertFails(setDoc(doc(db, 'chats/alum2'), { type: 'alumni_named', members: ['cedar', 'rana'], anonymous: true }));
  await assertSucceeds(addDoc(collection(db, 'chats/alum1/messages'), { authorUid: 'cedar', authorNickname: 'Quiet Cedar', kind: 'media', media: 'cv.pdf' }));
  await assertFails(getDoc(doc(as('jad', T.student), 'chats/alum1')));
});
test('alumni chat request intro is limited to 300 characters', async () => {
  const db = as('cedar', T.student);
  await assertSucceeds(addDoc(collection(db, 'chatRequests'), { type: 'alumni', fromUid: 'cedar', toUid: 'rana', intro: 'Hi Rana', status: 'pending' }));
  await assertFails(addDoc(collection(db, 'chatRequests'), { type: 'alumni', fromUid: 'cedar', toUid: 'rana', intro: 'x'.repeat(301), status: 'pending' }));
});

// ---------- communities ----------
test('SA sees community counts only, never members, contacts, chat or board', async () => {
  const db = as('rima', T.sa);
  await assertSucceeds(getDoc(doc(db, 'circles/robotics')));
  await assertFails(getDocs(collection(db, 'circles/robotics/members')));
  await assertFails(getDoc(doc(db, 'circles/robotics/contacts/cedar')));
  await assertFails(getDocs(collection(db, 'circles/robotics/board')));
});
test('join-notice contacts: Chair and members-privileged board only; plain members cannot', async () => {
  await assertSucceeds(getDoc(doc(as('lara', T.student), 'circles/robotics/contacts/cedar')));   // Chair
  await assertFails(getDoc(doc(as('jad', T.student), 'circles/robotics/contacts/cedar')));      // board w/o 'members' privilege
  await assertSucceeds(getDoc(doc(as('cedar', T.student), 'circles/robotics/contacts/cedar')));  // self
});
test('board roles are scoped to their own community', async () => {
  const jad = as('jad', T.student);
  await assertSucceeds(getDocs(collection(jad, 'circles/robotics/board')));  // board in Robotics
  await assertFails(getDocs(collection(jad, 'circles/debate/board')));       // plain member in Debate
  await assertFails(getDoc(doc(jad, 'circles/debate/board/note-1')));
  await assertFails(getDocs(collection(as('cedar', T.student), 'circles/robotics/board'))); // plain member
});
test('board members cannot edit roles or approve ledger items from the client', async () => {
  const jad = as('jad', T.student);
  await assertFails(updateDoc(doc(jad, 'circles/robotics/members/cedar'), { roles: ['treasurer'] }));
  await assertFails(updateDoc(doc(jad, 'circles/robotics/board/ledger-1'), { approvals: ['jad'] }));
});
test('requests to SA: Chair only, venue + 1-3 dates only', async () => {
  const ok = { circleId: 'robotics', chairUid: 'lara', venueId: 'hall-c', dateOptions: ['2026-10-16'], memberCount: 3, status: 'sent' };
  await assertSucceeds(addDoc(collection(as('lara', T.student), 'venueRequests'), ok));
  await assertFails(addDoc(collection(as('jad', T.student), 'venueRequests'), { ...ok, chairUid: 'jad' }));      // board, not Chair
  await assertFails(addDoc(collection(as('lara', T.student), 'venueRequests'), { ...ok, budget: 300 }));          // no budget
  await assertFails(addDoc(collection(as('lara', T.student), 'venueRequests'), { ...ok, dateOptions: ['a', 'b', 'c', 'd'] }));
  await assertFails(addDoc(collection(as('fig', T.student), 'venueRequests'), { ...ok, chairUid: 'fig' }));       // Chair of another Circle
});

// ---------- safety ----------
test('safety signals: anonymous fields only, no text or uid, unreadable by clients', async () => {
  const db = as('cedar', T.student);
  await assertSucceeds(addDoc(collection(db, 'safetySignals'), { severity: 'serious', category: 'hopelessness', context: 'buddy', anonId: 'a-9f2', campus: 'UA', at: 1 }));
  await assertFails(addDoc(collection(db, 'safetySignals'), { severity: 'serious', category: 'x', context: 'buddy', anonId: 'a', at: 1, text: 'I give up' }));
  await assertFails(addDoc(collection(db, 'safetySignals'), { severity: 'serious', category: 'x', context: 'buddy', anonId: 'a', at: 1, uid: 'cedar' }));
  await assertFails(getDocs(collection(as('rima', T.counselor), 'safetySignals')));
});
test('care signals: level word + plain counts only; no score, text or audio', async () => {
  const db = as('fig', T.student);
  const ok = { uid: 'fig', level: 'needs_care', counts: { heavyCheckins: '4 of 6', declinedSupport: 3, lowVoice: 2 }, stepsDone: ['extra_card', 'next_day_checkin'], at: 1 };
  await assertSucceeds(addDoc(collection(db, 'careSignals'), ok));
  await assertFails(addDoc(collection(db, 'careSignals'), { ...ok, score: 82 }));
  await assertFails(addDoc(collection(db, 'careSignals'), { ...ok, transcript: 'I feel...' }));
  await assertFails(addDoc(collection(db, 'careSignals'), { ...ok, counts: { ...ok.counts, moodScore: 2 } }));
  await assertFails(addDoc(collection(db, 'careSignals'), { ...ok, level: 7 }));
  await assertFails(addDoc(collection(db, 'careSignals'), { ...ok, uid: 'cedar' }));
  await assertFails(getDocs(collection(as('rima', T.counselor), 'careSignals')));
});
test('counselors see cases by nickname, never the subject uid', async () => {
  const db = as('rima', T.counselor);
  await assertSucceeds(getDoc(doc(db, 'cases/c1')));
  await assertFails(getDoc(doc(db, 'casesPrivate/c1')));
  await assertFails(getDoc(doc(as('sam', T.sa), 'cases/c1')));   // SA without counselor flag
  await assertFails(getDoc(doc(as('cedar', T.student), 'cases/c1')));
});
test('last-resort reveal requires counselor + serious reason + note >= 30 + confirm; logs are server-only', async () => {
  const db = as('rima', T.counselor);
  const ok = { caseId: 'c1', counselorUid: 'rima', reason: 'danger_to_self', note: 'No reply to outreach for 2 days; message mentions giving up.', confirm: true, at: 1 };
  await assertSucceeds(addDoc(collection(db, 'revealRequests'), ok));
  await assertFails(addDoc(collection(db, 'revealRequests'), { ...ok, note: 'too short' }));
  await assertFails(addDoc(collection(db, 'revealRequests'), { ...ok, reason: 'curious' }));
  await assertFails(addDoc(collection(db, 'revealRequests'), { ...ok, confirm: false }));
  await assertFails(addDoc(collection(as('sam', T.sa), 'revealRequests'), { ...ok, counselorUid: 'sam' }));   // SA without counselor flag
  await assertFails(addDoc(collection(as('cedar', T.student), 'revealRequests'), { ...ok, counselorUid: 'cedar' }));
  await assertFails(setDoc(doc(db, 'reveals/r2'), { caseId: 'c1' }));          // can't write the audit
  await assertFails(getDoc(doc(db, 'reveals/r1')));                             // audit is Admin-only
  await assertSucceeds(getDoc(doc(as('boss', T.admin), 'reveals/r1')));
  await assertFails(setDoc(doc(db, 'users/cedar/privacyLog/2'), { type: 'reveal' }));
  await assertSucceeds(getDoc(doc(as('cedar', T.student), 'users/cedar/privacyLog/1')));  // student sees it
  await assertFails(getDoc(doc(as('fig', T.student), 'users/cedar/privacyLog/1')));
});
test('shared message text reaches SA only with consent', async () => {
  const db = as('fig', T.student);
  await assertSucceeds(addDoc(collection(db, 'sharedItems'), { uid: 'fig', text: 'I can\'t keep doing this', consent: true }));
  await assertFails(addDoc(collection(db, 'sharedItems'), { uid: 'fig', text: 'x', consent: false }));
  await assertFails(addDoc(collection(db, 'sharedItems'), { uid: 'cedar', text: 'x', consent: true }));
});

// ---------- events, petitions, nodes, rewards ----------
test('staff never see who attended an event or who signed a petition', async () => {
  await assertFails(getDoc(doc(as('rima', T.sa), 'events/e1/attendance/cedar')));
  await assertFails(getDoc(doc(as('rima', T.sa), 'petitions/p1/signatures/cedar')));
  await assertFails(setDoc(doc(as('cedar', T.student), 'petitions/p1/signatures/cedar'), { at: 1 })); // signing via Function only
});
test('node notes: nickname only, <=80 chars, start held', async () => {
  const db = as('cedar', T.student);
  await assertSucceeds(addDoc(collection(db, 'nodes/n1/notes'), { authorUid: 'cedar', nickname: 'Quiet Cedar', text: 'You\'re allowed to rest.', status: 'held' }));
  await assertFails(addDoc(collection(db, 'nodes/n1/notes'), { authorUid: 'cedar', nickname: 'Quiet Cedar', text: 'x'.repeat(81), status: 'held' }));
  await assertFails(addDoc(collection(db, 'nodes/n1/notes'), { authorUid: 'cedar', nickname: 'Quiet Cedar', text: 'hi', status: 'approved' }));
});
test('growth, perks and redemptions are server-written only', async () => {
  const db = as('cedar', T.student);
  await assertFails(addDoc(collection(db, 'growthEvents'), { uid: 'cedar', kind: 'petal' }));
  await assertFails(addDoc(collection(db, 'redemptions'), { uid: 'cedar', perkId: 'coffee' }));
  await assertFails(setDoc(doc(db, 'users/cedar/garden/l9'), { n: 9 }));
});
test('signed-out visitors can read nothing private', async () => {
  const db = anon();
  await assertFails(getDoc(doc(db, 'users/cedar')));
  await assertFails(getDoc(doc(db, 'circles/exam/messages/m1')));
});

// ---------- accessibility: accommodations + settings ----------
const okReq = (uid = 'cedar') => ({ uid, nickname: 'Quiet Cedar', eventId: 'e1', needs: ['seat_near_exit', 'other'], note: 'Front row if possible', status: 'requested', createdAt: serverTimestamp() });
test('accommodations: the student creates their own request; whitelisted needs, note <= 140, no reason field', async () => {
  const db = as('cedar', T.student);
  await assertSucceeds(addDoc(collection(db, 'accommodations'), okReq()));
  await assertSucceeds(addDoc(collection(db, 'accommodations'), (({ note, ...r }) => ({ ...r, needs: ['captions'] }))(okReq())));
  await assertFails(addDoc(collection(db, 'accommodations'), okReq('fig')));                                   // for someone else
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), reason: 'diagnosis' }));             // no reason / diagnosis
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), needs: ['wheelchair_user'] }));      // labels, not needs
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), needs: [] }));
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), note: 'x'.repeat(141) }));
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), status: 'arranged' }));
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), deleteAt: 9999999999 }));          // retention is server-set
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), fullName: 'Real cedar' }));
  await assertFails(addDoc(collection(db, 'accommodations'), { ...okReq(), eventId: 'nope' }));               // event must exist
  await assertFails(addDoc(collection(as('newbie', T.pending), 'accommodations'), okReq('newbie')));          // pending: read-only
});
test('accommodations: readable by the student and Student Affairs only; host Chair/board and peers never', async () => {
  await assertSucceeds(getDoc(doc(as('cedar', T.student), 'accommodations/a1')));      // own
  await assertSucceeds(getDoc(doc(as('rima', T.sa), 'accommodations/a1')));            // SA
  await assertSucceeds(getDocs(collection(as('rima', T.sa), 'accommodations')));       // SA queue
  await assertFails(getDoc(doc(as('lara', T.student), 'accommodations/a1')));          // Chair of the host community
  await assertFails(getDoc(doc(as('jad', T.student), 'accommodations/a1')));           // board of the host community
  await assertFails(getDocs(collection(as('lara', T.student), 'accommodations')));
  await assertFails(getDoc(doc(as('fig', T.student), 'accommodations/a1')));           // another student
  await assertFails(getDoc(doc(as('boss', T.admin), 'accommodations/a1')));            // Admin has no access either
  await assertFails(getDoc(doc(anon(), 'accommodations/a1')));
});
test('accommodations: only SA marks arranged (status only); nobody deletes from the client', async () => {
  const sa = as('rima', T.sa);
  await assertFails(updateDoc(doc(as('cedar', T.student), 'accommodations/a1'), { status: 'arranged', arrangedBy: 'cedar', arrangedAt: 1 }));
  await assertFails(updateDoc(doc(as('lara', T.student), 'accommodations/a1'), { status: 'arranged', arrangedBy: 'lara', arrangedAt: 1 }));
  await assertFails(updateDoc(doc(sa, 'accommodations/a1'), { needs: ['extra_time'] }));                       // can't edit the request
  await assertFails(updateDoc(doc(sa, 'accommodations/a1'), { deleteAt: 9999999999 }));                         // can't extend retention
  await assertFails(updateDoc(doc(sa, 'accommodations/a1'), { status: 'arranged', arrangedBy: 'someone_else', arrangedAt: 1 }));
  await assertSucceeds(updateDoc(doc(sa, 'accommodations/a1'), { status: 'arranged', arrangedBy: 'rima', arrangedAt: 1 }));
  await assertFails(deleteDoc(doc(sa, 'accommodations/a1')));
  await assertFails(deleteDoc(doc(as('cedar', T.student), 'accommodations/a1')));
});
test('campus admin log: only admin can read it, and nobody writes it from a client', async () => {
  await assertSucceeds(getDoc(doc(as('boss', T.admin), 'auditLogs/log1')));
  await assertSucceeds(getDocs(collection(as('boss', T.admin), 'auditLogs')));
  await assertFails(getDoc(doc(as('cedar', T.student), 'auditLogs/log1')));
  await assertFails(getDoc(doc(as('lara', T.student), 'auditLogs/log1')));
  await assertFails(getDoc(doc(as('rima', T.sa), 'auditLogs/log1')));
  await assertFails(setDoc(doc(as('boss', T.admin), 'auditLogs/log2'), { action: 'forged' }));
  await assertFails(setDoc(doc(as('cedar', T.student), 'auditLogs/log3'), { action: 'forged' }));
});
test('accessibility settings: owner only, whitelisted keys, no diagnosis or condition fields', async () => {
  const db = as('cedar', T.student);
  const a11y = { calmMode: 'on', plainLanguage: true, quietPresence: true, nodeTakeYourTime: true, offerTyping: true };
  await assertSucceeds(setDoc(doc(db, 'users/cedar/settings/main'), { accessibility: a11y }, { merge: true }));
  await assertSucceeds(getDoc(doc(db, 'users/cedar/settings/main')));
  await assertFails(setDoc(doc(db, 'users/cedar/settings/main'), { accessibility: { ...a11y, condition: 'adhd' } }, { merge: true }));
  await assertFails(setDoc(doc(db, 'users/cedar/settings/main'), { accessibility: { ...a11y, calmMode: 'max' } }, { merge: true }));
  await assertFails(setDoc(doc(db, 'users/cedar/settings/main'), { accessibility: { ...a11y, offerTyping: 'yes' } }, { merge: true }));
  await assertFails(getDoc(doc(as('fig', T.student), 'users/cedar/settings/main')));
  await assertFails(getDoc(doc(as('rima', T.sa), 'users/cedar/settings/main')));
  await assertFails(getDoc(doc(as('lara', T.student), 'users/cedar/settings/main')));  // Chair of cedar's community
  await assertFails(setDoc(doc(as('fig', T.student), 'users/cedar/settings/main'), { accessibility: a11y }));
});

// AREA: staff
async function seedStaff() {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const S = (p, d) => setDoc(doc(db, p), d);
    await S('wellbeingTrends/w40', { note: 'anonymous week' });
    await S('staffOverview/week', { openCases: 4 });
    await S('heldItems/h1', { text: 'kept', status: 'held', topic: 'node' });
    await S('staffProfile/rima', { onCall: true, revealCount: 3 });
    await S('staffProfile/rima/reveals/r1', { reason: 'danger_to_self', when: 'Sep 12', note: 'logged' });
    await S('staffMeetups/m1', { status: 'proposed', title: 'Quiet sit' });
    await S('communityReviews/robotics', { status: 'waiting', charter: 'Build robots.' });
    await S('staffCertificates/cedar', { verified: false, name: 'Quiet Cedar' });
  });
}

test('AREA staff: wellbeing trends and overview are Student Affairs read-only', async () => {
  await seedStaff();
  await assertSucceeds(getDoc(doc(as('rima', T.sa), 'wellbeingTrends/w40')));
  await assertSucceeds(getDoc(doc(as('rima', T.sa), 'staffOverview/week')));
  await assertFails(getDoc(doc(as('cedar', T.student), 'wellbeingTrends/w40')));
  await assertFails(getDoc(doc(as('cedar', T.student), 'staffOverview/week')));
  await assertFails(setDoc(doc(as('rima', T.sa), 'wellbeingTrends/w40'), { note: 'edited' }));
  await assertFails(setDoc(doc(as('rima', T.sa), 'staffOverview/week'), { openCases: 0 }));
});

test('AREA staff: held queue status only, and students cannot read it', async () => {
  await seedStaff();
  const sa = as('rima', T.sa);
  await assertSucceeds(updateDoc(doc(sa, 'heldItems/h1'), { status: 'removed', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(sa, 'heldItems/h1'), { text: 'rewritten' }));
  await assertFails(getDoc(doc(as('cedar', T.student), 'heldItems/h1')));
});

test('AREA staff: account decisions are a logged create, never a self-review or an identity field', async () => {
  await seedStaff();
  const sa = as('rima', T.sa);
  const ok = { uid: 'newbie', reviewerUid: 'rima', decision: 'approve', at: serverTimestamp() };
  await assertSucceeds(addDoc(collection(sa, 'accountDecisions'), ok));
  await assertFails(addDoc(collection(sa, 'accountDecisions'), { ...ok, fullName: 'Real newbie' }));
  await assertFails(addDoc(collection(sa, 'accountDecisions'), { ...ok, decision: 'curious' }));
  await assertFails(addDoc(collection(sa, 'accountDecisions'), { ...ok, uid: 'rima' }));
  await assertFails(addDoc(collection(as('cedar', T.student), 'accountDecisions'), { ...ok, reviewerUid: 'cedar' }));
});

test('AREA staff: chair changes require a reason and cannot be edited', async () => {
  await seedStaff();
  const sa = as('rima', T.sa);
  const ok = { circleId: 'robotics', byUid: 'rima', fromChair: 'Maya', toChair: 'jad', toName: 'Jad', reason: 'new_semester', at: serverTimestamp() };
  const made = await assertSucceeds(addDoc(collection(sa, 'chairChanges'), ok));
  await assertFails(updateDoc(made, { reason: 'other' }));
  await assertFails(addDoc(collection(sa, 'chairChanges'), { ...ok, reason: 'curious' }));
  await assertFails(addDoc(collection(as('cedar', T.student), 'chairChanges'), { ...ok, byUid: 'cedar' }));
});

test('AREA staff: meetup spots are counselor updates; plain staff and students cannot', async () => {
  await seedStaff();
  await assertSucceeds(updateDoc(doc(as('rima', T.counselor), 'staffMeetups/m1'), { status: 'approved', spot: 'Faculty of Engineering lounge', approvedBy: 'rima' }));
  await assertFails(updateDoc(doc(as('lina', T.sa), 'staffMeetups/m1'), { status: 'declined', approvedBy: 'lina' }));
  await assertFails(getDoc(doc(as('cedar', T.student), 'staffMeetups/m1')));
});

test('AREA staff: community review status only, profile on-call only, perks and certificates stay narrow', async () => {
  await seedStaff();
  const sa = as('rima', T.sa);
  const counselor = as('rima', T.counselor);
  await assertSucceeds(updateDoc(doc(sa, 'communityReviews/robotics'), { status: 'verified', reviewedBy: 'rima', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(sa, 'communityReviews/robotics'), { charter: 'rewritten' }));
  await assertSucceeds(updateDoc(doc(counselor, 'staffProfile/rima'), { onCall: false }));
  await assertFails(updateDoc(doc(counselor, 'staffProfile/rima'), { revealCount: 9 }));
  await assertFails(updateDoc(doc(as('lina', T.sa), 'staffProfile/rima'), { onCall: true }));
  await assertFails(getDoc(doc(as('cedar', T.student), 'staffProfile/rima')));
  await assertSucceeds(getDoc(doc(counselor, 'staffProfile/rima/reveals/r1')));
  await assertFails(setDoc(doc(counselor, 'staffProfile/rima/reveals/x'), { reason: 'other', when: 'now', note: 'no' }));
  await assertFails(getDoc(doc(as('rima', T.sa), 'staffProfile/rima/reveals/r1')));
  await assertSucceeds(addDoc(collection(sa, 'staffPerks'), { title: 'Walk', cost: '3', detail: 'Campus', status: 'on', order: 9 }));
  await assertFails(addDoc(collection(sa, 'staffPerks'), { title: 'Walk', cost: '3', detail: 'Campus', status: 'on', order: 9, fullName: 'Real' }));
  await assertSucceeds(updateDoc(doc(sa, 'staffCertificates/cedar'), { verified: true, verifiedBy: 'rima' }));
  await assertFails(getDoc(doc(as('cedar', T.student), 'staffCertificates/cedar')));
});

test('Hope Node event mode: only that event’s Chair or board, and only with an approved venue', async () => {
  const start = Timestamp.fromMillis(Date.now() - 60 * 1000);
  const end = Timestamp.fromMillis(Date.now() + 60 * 60 * 1000);
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const base = {
      title: 'Robotics Build Night',
      status: 'published',
      hostType: 'circle',
      hostId: 'robotics',
      venueId: 'engineering',
      nodeId: 'engineering',
      startsAt: start,
      endsAt: end,
    };
    await setDoc(doc(db, 'events/build'), { ...base, venueStatus: 'approved' });
    await setDoc(doc(db, 'events/pending-venue'), { ...base, title: 'Pending', venueStatus: 'pending' });
    await setDoc(doc(db, 'events/other-node'), { ...base, title: 'Elsewhere', venueStatus: 'approved', nodeId: 'library' });
    await setDoc(doc(db, 'nodes/engineering'), {
      name: 'Faculty of Engineering',
      mode: 'normal',
      eventId: '',
      eventTitle: '',
      presentCount: 0,
    });
    await setDoc(doc(db, 'circles/robotics/members/nabil'), { nickname: 'Quiet Mentor', roles: ['mentor'] });
  });
  const on = {
    mode: 'event',
    eventId: 'build',
    eventTitle: 'Robotics Build Night',
    startsAt: start,
    endsAt: end,
  };
  const node = 'nodes/engineering';
  await assertSucceeds(updateDoc(doc(as('boss', T.admin), node), { name: 'Faculty of Engineering' }));
  await assertFails(updateDoc(doc(as('nabil', T.student), node), on));
  await assertSucceeds(updateDoc(doc(as('lara', T.student), node), on));
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), node), { mode: 'normal', eventId: '', eventTitle: '' });
  });
  await assertSucceeds(updateDoc(doc(as('jad', T.student), node), on));
  await assertFails(updateDoc(doc(as('cedar', T.student), node), { ...on, eventTitle: 'Robotics Build Night' }));
  await assertFails(updateDoc(doc(as('fig', T.student), node), on));
  await assertFails(updateDoc(doc(as('lara', T.student), node), { ...on, eventId: 'pending-venue', eventTitle: 'Pending' }));
  await assertFails(updateDoc(doc(as('lara', T.student), node), { ...on, eventId: 'other-node', eventTitle: 'Elsewhere' }));
  await assertSucceeds(updateDoc(doc(as('jad', T.student), node), { presentCount: increment(1) }));
  await assertFails(setDoc(doc(as('jad', T.student), 'events/build/attendance/jad'), { uid: 'jad', at: serverTimestamp() }));
  await assertSucceeds(setDoc(doc(as('jad', T.student), 'events/build/attendance/jad'), { uid: 'jad', nickname: 'Keen Ash', at: serverTimestamp() }));
  await assertFails(setDoc(doc(as('jad', T.student), 'events/build/attendance/jad'), { uid: 'jad', nickname: 'Keen Ash', at: serverTimestamp() }));
  await assertFails(updateDoc(doc(as('jad', T.student), node), { presentCount: increment(1) }));
  await assertFails(setDoc(doc(as('fig', T.student), 'events/build/attendance/fig'), { uid: 'fig', nickname: 'Quiet Fig', at: serverTimestamp() }));
  await assertFails(setDoc(doc(as('jad', T.student), 'events/build/attendance/cedar'), { uid: 'cedar', nickname: 'Quiet Cedar', at: serverTimestamp() }));
  await assertFails(getDoc(doc(as('rima', T.sa), 'events/build/attendance/jad')));
  await assertFails(getDoc(doc(as('cedar', T.student), 'events/build/attendance/jad')));
  await assertFails(getDoc(doc(as('nabil', T.student), 'events/build/attendance/jad')));
  await assertSucceeds(getDoc(doc(as('lara', T.student), 'events/build/attendance/jad')));
  await assertSucceeds(getDoc(doc(as('jad', T.student), 'events/build/attendance/jad')));
  await assertSucceeds(updateDoc(doc(as('lara', T.student), node), { mode: 'normal', eventId: '', eventTitle: '' }));
  await assertSucceeds(setDoc(doc(as('cedar', T.student), 'events/build/attendance/cedar'), { uid: 'cedar', nickname: 'Quiet Cedar', at: serverTimestamp() }));
  await assertFails(setDoc(doc(as('cedar', T.student), 'events/build/attendance/cedar'), { uid: 'cedar', nickname: 'Quiet Cedar', at: serverTimestamp() }));
  await env.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), node), on);
  });
  await assertFails(updateDoc(doc(as('cedar', T.student), node), { mode: 'normal', eventId: '', eventTitle: '' }));
  const line = 'Build a line-following robot with the team. Mentors on site, all levels welcome.';
  await assertSucceeds(updateDoc(doc(as('lara', T.student), 'events/build'), { screenDescription: line }));
  await assertSucceeds(updateDoc(doc(as('jad', T.student), 'events/build'), { screenDescription: line }));
  await assertFails(updateDoc(doc(as('cedar', T.student), 'events/build'), { screenDescription: line }));
  await assertFails(updateDoc(doc(as('nabil', T.student), 'events/build'), { screenDescription: line }));
  await assertFails(updateDoc(doc(as('fig', T.student), 'events/build'), { screenDescription: line }));
  await assertFails(updateDoc(doc(as('rima', T.sa), 'events/build'), { screenDescription: 'Staff cannot replace the tablet line.' }));
  await assertFails(updateDoc(doc(as('lara', T.student), 'events/build'), { screenDescription: line, title: 'Nope' }));
  await assertFails(updateDoc(doc(as('lara', T.student), 'events/build'), { screenDescription: 'x'.repeat(91) }));
  await assertSucceeds(updateDoc(doc(as('rima', T.sa), 'events/build'), { meta: 'Hall C lab' }));
  await assertFails(setDoc(doc(as('rima', T.sa), 'events/staff-draft'), { title: 'Draft', status: 'published', hostType: 'sa', screenDescription: line }));
});
