// AREA: voice-safety-a11y — rules for screen copy, the care inbox, and identity consent.
import { test } from 'node:test';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export function registerVoiceSafetyRules({ getEnv, as, T }) {
  test('voice-safety copy is readable by an approved student and not writable', async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'voiceSafety/bundle'), { screens: { offer: { title: 'Daily check-in' } } });
    });
    await assertSucceeds(getDoc(doc(as('cedar', T.student), 'voiceSafety/bundle')));
    await assertFails(setDoc(doc(as('cedar', T.student), 'voiceSafety/bundle'), { screens: {} }));
    await assertFails(getDoc(doc(as('newbie', T.pending), 'voiceSafety/bundle')));
  });

  test('care inbox: the student reads their thread and can reply, without a name', async () => {
    const env = getEnv();
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'careInbox/cedar/messages/note'), { from: 'counselor', text: 'Hi', at: 1 });
    });
    const db = as('cedar', T.student);
    await assertSucceeds(getDoc(doc(db, 'careInbox/cedar/messages/note')));
    await assertFails(getDoc(doc(as('fig', T.student), 'careInbox/cedar/messages/note')));
    await assertSucceeds(addDoc(collection(db, 'careInbox/cedar/messages'), { from: 'student', text: 'Thanks', at: serverTimestamp() }));
    await assertFails(addDoc(collection(db, 'careInbox/cedar/messages'), { from: 'counselor', text: 'Hi', at: serverTimestamp() }));
    await assertFails(addDoc(collection(db, 'careInbox/cedar/messages'), { from: 'student', text: 'Hi', at: serverTimestamp(), fullName: 'Real cedar' }));
    await assertSucceeds(getDoc(doc(as('rima', T.counselor), 'careInbox/cedar/messages/note')));
  });

  test('identity share is consent only; the client cannot write a name', async () => {
    const db = as('cedar', T.student);
    await assertSucceeds(addDoc(collection(db, 'identityShares'), { uid: 'cedar', consent: true, at: serverTimestamp() }));
    await assertFails(addDoc(collection(db, 'identityShares'), { uid: 'cedar', consent: true, at: serverTimestamp(), fullName: 'Real cedar' }));
    await assertFails(addDoc(collection(db, 'identityShares'), { uid: 'fig', consent: true, at: serverTimestamp() }));
    await assertFails(addDoc(collection(db, 'identityShares'), { uid: 'cedar', consent: false, at: serverTimestamp() }));
  });
}
