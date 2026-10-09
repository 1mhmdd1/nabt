# 07: Real backend (Firebase)

**The final deliverable is a full working app: backend + AI + this UI.** The demo store is only a fallback.

## Current state
- `docs/firestore.rules` (879 lines, rules tests passed 54/54 in the emulator era): **reuse and extend it**.
- `functions/src/index.ts` is a stub. The function logic exists twice: `src/local/handlers.ts` (demo, routes listed below) and `scripts/{dev,auth,staff,ocr,node}-fn.mjs` (old Express server on :5055). **Port these into real Cloud Functions.**
- `src/fn.ts` calls routes by name. In demo mode, `src/local/mode.ts` sends them to `handlers.ts`, and `src/local/shims/*` stand in for `firebase/firestore` and `firebase/auth`.

## Swap plan (same interfaces)
1. Keep every screen using `src/live*.ts` hooks and `src/fn.ts` only. Grep for direct `firebase/*` imports in `app/` and move them into `src/live`.
2. `src/firebase.ts`: if `EXPO_PUBLIC_DEMO_LOCAL=1` → shims, else the real SDK (`initializeAuth` with AsyncStorage persistence, Firestore with offline cache).
3. `src/fn.ts`: real mode → `httpsCallable(functions, name)`, using the same route → function-name map.
4. Run the same Playwright/Detox walk in both modes.

## Auth
- Email/password + **email-code verification restricted to `@ua.edu.lb`** (callable `sendCode` / `verifyCode`, codes in `loginCodes` with a hash, 10 min TTL, 5 tries). A `beforeUserCreated` blocking function rejects other domains.
- Custom claims: `role: student|alumni|osa|admin`, `chairOf: [communityId]`. Set only by `setRole` (admin) and `assignChair` (osa). Audited.
- Account status `pending → approved` by SA (`accountQueue`, `accountDecisions`).

## Firestore schema (main collections; full list from the rules)
| Collection | Key fields | Who reads/writes |
|---|---|---|
| `users/{uid}` | nickname, role, status, plant{petals,roots,stage}, faculty, joinYear, alumni{classOf} | owner; functions write role/plant |
| `nicknames/{nick}` | uid | uniqueness, function only |
| `circles/{id}` (+ `members`, `messages`, `thread`, `replies`) | kind circle/verified, chairUid, board, verified | members; **staff cannot read messages** |
| `chats/{id}/messages`, `chatRequests`, `identityShares`, `revealRequests` | 1:1 anonymous + consent reveal | participants |
| `joinRequests`, `board`, `chairChanges`, `communityReviews`, `staffCommunities` | community governance | Chair/osa |
| `events/{id}` (+ `rsvps`, `attendance`), `venueRequests`, `venues` | event, venue+date request | members / Chair / osa |
| `checkins`, `growthEvents`, `thanks`, `microActions` | plant gains | function writes |
| `certificates`, `certificatePublic`, `records` | verify code, co-curricular record | owner; public verify by code |
| `petitions`, `signatures`, `petitionAuthors`, `youSaid` | petition flow | students / osa |
| `announcements`, `activityReports` (semester) | SA / Chair | |
| `supportRequests`, `cases`, `casesPrivate`, `careSignals`, `careInbox`, `safetySignals`, `voiceSafety` | support + anonymous signals | osa only; no message text |
| `alumniMentors`, `mentorRequests`, `alumniAsks` | mentors | alumni/students |
| `impact`, `wellbeingTrends`, `feedbackAggregates`, `certificateAggregates`, `staffOverview` | **aggregates only**, written by functions | osa |
| `audit`, `auditLogs`, `privacyLog` | append-only | admin read |
| `notes`, `nodes`, `nfcStickers`, `perks`, `drops`, … | Hope Node / rewards (later) | |

## Cloud Functions (TypeScript, v2, region europe-west1 or me-central1)
| Function | Port from `handlers.ts` route |
|---|---|
| sendCode / verifyCode / pickNickname / checkNickname | `/auth/*` |
| setRole (admin), assignChair, listCounselors | `/admin/role`, `/staff/assign`, `/staff/counselors` |
| createCircle, joinCommunity, approveJoin | `/create-circle` |
| dailyCheckIn, taskDone, giveThanks (plant: petals/roots with a daily cap) | `/check-in`, `/task-done`, `/thanks` |
| rsvp, eventCheckIn (organizer QR, signed token), endEvent | `/event-check-in`, `/end-event` |
| submitFeedback, feedbackTally (k ≥ 5) | `/feedback-tally` |
| issueCertificates (on endEvent: attendance → certificate + record + verify code) | `/issue-certificates` |
| signPetition, reviewPetition, publishYouSaid | |
| openSupport, careSignal (accepts only {needsCare, nickname}) | `/support-open` |
| mentorRespond | `/mentor-respond` |
| moderateOnWrite (Firestore trigger on messages: rules re-check, delete/flag, no text stored in flags) | |
| aggregates (scheduled hourly: wellbeingTrends, impact, with k-anonymity) | |
| graduate (sets alumni claim) | |

## Real-time chat
Firestore `onSnapshot` on `circles/{id}/messages` ordered by ts, paginated at 50. Typing/presence is optional (RTDB). The client-side safety check runs before the write. `moderateOnWrite` is the backstop.

## Storage
Firebase Storage only for: community logos, announcement images, certificate PDFs. **Never ID photos or voice audio.** Rules: auth, size < 5 MB, image MIME types.

## Push notifications
`expo-notifications` + Expo push tokens in `users/{uid}/devices`. Functions send: event reminders, join approved, mentor reply, announcements, petition outcome. Needs a dev build for full behaviour.

## Deploy
```
firebase use <project>
firebase deploy --only firestore:rules,firestore:indexes,functions,storage
eas build --profile development   # then preview/production
```
Set `EXPO_PUBLIC_DEMO_LOCAL=0` + the Firebase config in EAS secrets. Keep `demo-nabt` + the emulators for CI.

## Backend acceptance tests
- [ ] Rules unit tests (`@firebase/rules-unit-testing`): staff can't read any `messages`; a student can't read another's `users` doc, `careSignals` or `cases`; only functions write plant/roles/aggregates
- [ ] Non-`@ua.edu.lb` sign-up is rejected. A wrong code 5× locks it
- [ ] Full DEMO.md path against the emulators, then against staging, with 5 roles
- [ ] Aggregates hide 1-4. Care signal payload contains no score or text
- [ ] Certificate verify code resolves publicly with name + event only
- [ ] Push arrives for an event reminder on Android + iOS
- [ ] `DEMO_LOCAL=1` build still passes the same walk offline
