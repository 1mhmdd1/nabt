// AREA: records and AREA: alumni
import { test } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';

const past = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);

function cert(uid = 'cedar') {
  return {
    uid,
    code: 'UA-E1X',
    fullName: `Real ${uid}`,
    eventId: 'e1',
    eventTitle: 'Build night',
    circleId: 'robotics',
    circleName: 'Robotics Society',
    role: 'attendee',
    dateLabel: 'Oct 1',
    semester: 'Fall 2026',
    kind: 'event',
    issuedAt: serverTimestamp(),
  };
}

export function registerRecordsRules({ getEnv, as, T, anon }) {
  test('AREA records: only the owner reads their record', async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'records/cedar'), { uid: 'cedar', fullName: 'Real cedar', totals: { events: 1, trainings: 0, mentoring: 0, board: 0 }, items: [] });
    });
    await assertSucceeds(getDoc(doc(as('cedar', T.student), 'records/cedar')));
    await assertSucceeds(getDoc(doc(as('cedar', T.alum), 'records/cedar')));
    await assertFails(getDoc(doc(as('fig', T.student), 'records/cedar')));
    await assertFails(getDoc(doc(as('rima', T.sa), 'records/cedar')));
    await assertFails(setDoc(doc(as('cedar', T.student), 'records/cedar'), { uid: 'cedar' }));
  });

  test('AREA records: Chair and board issue certificates for their own event only', async () => {
    const env = getEnv();
    const lara = as('lara', T.student);
    await assertSucceeds(setDoc(doc(lara, 'certificates/e1_cedar'), cert()));
    await assertSucceeds(getDoc(doc(as('cedar', T.student), 'certificates/e1_cedar')));
    await assertFails(getDoc(doc(lara, 'certificates/e1_cedar')));
    await assertFails(updateDoc(doc(as('cedar', T.student), 'certificates/e1_cedar'), { role: 'mentor' }));
    await assertSucceeds(setDoc(doc(as('jad', T.student), 'certificates/e1_cedar_b'), { ...cert(), code: 'UA-E1B' }));
    await assertFails(setDoc(doc(as('cedar', T.student), 'certificates/e1_self'), cert()));
    await assertFails(setDoc(doc(as('fig', T.student), 'certificates/e1_fig'), cert('fig')));
    await assertFails(setDoc(doc(lara, 'certificates/e1_missing'), cert('fig')));
  });

  test('AREA records: feedback is one write by an attendee; organizers see the aggregate only', async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'events/e1'), { endsAt: past });
      await setDoc(doc(ctx.firestore(), 'feedbackAggregates/e1'), { eventId: 'e1', count: 2, average: 4, distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }, comments: ['Clear steps.'] });
    });
    const body = { uid: 'cedar', rating: 5, comment: 'Glad I stayed.', at: serverTimestamp() };
    const cedar = as('cedar', T.student);
    await assertFails(setDoc(doc(cedar, 'events/e1/feedback/cedar'), { ...body, comment: 'x'.repeat(201) }));
    await assertFails(setDoc(doc(cedar, 'events/e1/feedback/cedar'), { ...body, rating: 6 }));
    await assertSucceeds(setDoc(doc(cedar, 'events/e1/feedback/cedar'), body));
    await assertFails(setDoc(doc(cedar, 'events/e1/feedback/cedar'), { ...body, rating: 4 }));
    await assertFails(updateDoc(doc(cedar, 'events/e1/feedback/cedar'), { rating: 3 }));
    await assertFails(setDoc(doc(as('fig', T.student), 'events/e1/feedback/fig'), { uid: 'fig', rating: 4, comment: '', at: serverTimestamp() }));
    await assertFails(getDoc(doc(as('lara', T.student), 'events/e1/feedback/cedar')));
    await assertFails(getDocs(collection(as('lara', T.student), 'events/e1/feedback')));
    await assertFails(getDoc(doc(as('rima', T.sa), 'events/e1/feedback/cedar')));
    await assertSucceeds(getDoc(doc(as('lara', T.student), 'feedbackAggregates/e1')));
    await assertSucceeds(getDoc(doc(as('rima', T.sa), 'feedbackAggregates/e1')));
    await assertFails(getDoc(doc(cedar, 'feedbackAggregates/e1')));
    await assertFails(setDoc(doc(as('lara', T.student), 'feedbackAggregates/e1'), { count: 9 }));
    await assertSucceeds(getDoc(doc(anon(), 'certificatePublic/missing')));
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'certificatePublic/UA-OK'), { fullName: 'Real cedar', eventTitle: 'Build night', dateLabel: 'Oct 1', valid: true });
    });
    await assertSucceeds(getDoc(doc(anon(), 'certificatePublic/UA-OK')));
    await assertFails(setDoc(doc(anon(), 'certificatePublic/UA-NO'), { fullName: 'Nope', eventTitle: 'X', dateLabel: 'Oct 1', valid: true }));
  });

  test('AREA alumni: only alumni create mentor profiles; a request is private to the two people', async () => {
    const env = getEnv();
    const profile = { uid: 'rana', fullName: 'Rana Haddad', field: 'Engineering', line: 'Happy to talk.', offers: ['chat'], initial: 'R', classYear: 2020 };
    await assertFails(setDoc(doc(as('cedar', T.student), 'alumniMentors/cedar'), { ...profile, uid: 'cedar' }));
    await assertSucceeds(setDoc(doc(as('rana', T.alum), 'alumniMentors/rana'), profile));
    await assertSucceeds(getDoc(doc(as('cedar', T.student), 'alumniMentors/rana')));
    await assertFails(getDoc(doc(as('newbie', T.pending), 'alumniMentors/rana')));
    await assertFails(updateDoc(doc(as('cedar', T.alum), 'users/cedar'), { classYear: 2024, alumni: true }));
    const request = { fromUid: 'cedar', toUid: 'rana', fromName: 'Cedar Haddad', toName: 'Rana Haddad', message: 'Could we talk about internships?', status: 'pending', createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(as('cedar', T.student), 'mentorRequests/ask-1'), request));
    await assertSucceeds(getDoc(doc(as('cedar', T.student), 'mentorRequests/ask-1')));
    await assertSucceeds(getDoc(doc(as('rana', T.alum), 'mentorRequests/ask-1')));
    await assertFails(getDoc(doc(as('fig', T.student), 'mentorRequests/ask-1')));
    await assertFails(getDoc(doc(as('lara', T.student), 'mentorRequests/ask-1')));
    await assertFails(getDocs(collection(as('cedar', T.student), 'mentorRequests')));
    await assertFails(updateDoc(doc(as('cedar', T.student), 'mentorRequests/ask-1'), { status: 'accepted' }));
    await assertSucceeds(updateDoc(doc(as('rana', T.alum), 'mentorRequests/ask-1'), { status: 'accepted' }));
    await assertSucceeds(getDocs(collection(as('cedar', T.alum), 'circles/exam/messages')));
  });
}
