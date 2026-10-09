# 04: Final product spec

## Final product in one page
- **What:** a full working iOS/Android app for UA students, alumni, Chairs, Student Affairs and admins, with the real Firebase backend (07) and on-device AI (05). The phone-only demo stays as a `DEMO_LOCAL` fallback.
- **Join:** UA ID scan (on-device OCR) + `@ua.edu.lb` code + SA approval → random nickname.
- **Belong:** anonymous Circles and Verified communities (Chair, board, roles, join requests, venue+date requests to SA, semester reports, Chair dashboard).
- **Take part:** events with RSVP, reminders, check-in, feedback, certificates with verify codes, and a lifelong co-curricular record.
- **Speak up:** petitions → SA review → personalised "You said, we did". Official announcements.
- **Feel okay:** plant (petals for self-care, roots for helping, animated), mood and voice check-ins (audio deleted), breathing, distress card with "Not now, I'm okay", support requests by nickname.
- **Safe chat:** on-device EN/AR/Arabizi safety model + rules. Kindness cards. Nobody reads chats.
- **SA understands students:** aggregates only (k ≥ 5), "needs care" by nickname only. Everything audited.
- **Alumni:** verified status, mentor profile, mentoring chats.
- **Done means:** 03 checklist all fixed on device, plus the backend tests (07) and the AI acceptance (05) passing.


**Final deliverable: a full working mobile app (iOS + Android) with the real Firebase backend (07) and the on-device AI (05). The phone-only demo is kept as a `DEMO_LOCAL` fallback.**

## Identity and access
- Sign-up: scan the UA ID (camera + torch, on-device OCR prefills ID/name/faculty, all editable) → verify `@ua.edu.lb` email with a code → SA approval → pick a nickname.
- **Nicknames**: random (e.g. "Gentle Olive"), checked against the rules (`src/nickname/rules.mjs`), **never a real name**. The real name is visible only where the user shares it (joining a Verified community, or by consent).
- **Identity vs anonymous chats**: Circles and DMs are anonymous (nickname). A 1:1 reveal needs both people to consent. Verified communities show the real name to Chair and board.
- Onboarding shows only on the first launch. THRIVE loader on every cold start.

## Communities
- **Circle**: student-made, informal, anonymous, by nickname. (UI word is always "Circle", never "group".)
- **Verified community**: official club with a gold Verified badge. SA assigns the **Chair**. The Chair adds the **board and roles**, approves join requests and runs events. **Event requests to SA cover venue + date only.** The Chair dashboard shows members, active, mentors, attendance bars and join requests. **Club semester report** goes to SA.
- Chat has safety built in (05): blocks for harassment/threats/scams/phone numbers/links, with the reason shown. Kindness mini-cards appear under struggling messages (for others, not the sender). The distress support card appears privately to the sender, with a "Not now, I'm okay" option.

## Events
RSVP ("I'll go") → reminders (push) → check-in (organizer QR/list, or Hope Node later) → post-event feedback → **certificate** with a verify code (`/verify/[code]`) → **co-curricular record** (My record), kept for life as alumni.

## Voice and support
- Petitions: create → sign → SA review → "You said, we did" outcome.
- **"You said, we did"**: shows only items the user is involved in (signed, attended, member) plus university-wide items.
- Official announcements from SA. SA impact numbers (hidden 1-4, k-anonymity floor 5).
- Support: "I'd like support" → type (just want to talk, etc.) → appears in the SA safety inbox by nickname. Identity is shared only by choice ("Share with SA").

## Wellbeing layer
- **Plant**: petals for self-care, roots for helping, per-part sway, glow, animated growth (03-A/B). Gold only on the plant.
- Mood check-ins, today's step (Start), voice check-ins (05).
- **Care level**: computed **on the phone**, never shown as a number, never uploaded raw. Only a "needs care" flag by nickname reaches SA, and only above a threshold.
- Breathing exercise (03-A7).

## Alumni
Graduation → verified alumni status (Class of YYYY), lifelong record, mentor profile, mentoring inbox (accept → chat).

## Staff (SA) app
Overview (weekly mood trend with exam weeks, aggregates only), impact, safety/care inbox, reviews (accounts, communities, Chair changes, petitions, venues, reports), announcements, You said we did, certificates. Admin: roles + audit log.

## Hope Node (next step, not v1)
Campus tablet at the Faculty of Engineering (example). Two QR modes: event check-in (switched on by the organizer during the event window) and notes / daily check-in.
