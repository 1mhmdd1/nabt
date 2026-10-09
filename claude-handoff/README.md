# NABT (نبت) handoff pack: start here

This pack is for an AI coding agent taking NABT from a phone-only pitch demo to a finished, real product.

Owner: Mohamad Ibrahim. Event: UA Hackathon 2026 pitch, **Saturday 10 Oct 2026**.

## Files
| File | What it covers |
|---|---|
| `nabt-app-main.zip` | Base code: `main` @ `ed031b3` (git archive, so no `.git` history inside) |
| `01-PROJECT.md` | What NABT is, roles, framing, what it is NOT |
| `02-BASE-VERSION.md` | Why this version, how to run it, code map, demo logins |
| `03-KNOWN-ISSUES-AND-FIXES.md` | **Read this first.** Priority fixes (animations, plant logic) and the master checklist of every reported issue |
| `04-FINAL-PRODUCT-SPEC.md` | Full feature spec of the finished product |
| `05-AI-INTEGRATION.md` | On-device and backend AI plan, the real backend, privacy guarantees, milestones, acceptance |
| `06-RULES-AND-DESIGN.md` | Design and copy rules you must not break |
| `07-BACKEND.md` | Full Firebase backend spec: auth, schema, rules, functions, chat, storage, push, deploy, tests |

## HARD RULE
**Nothing counts as done until every item in the master checklist in `03-KNOWN-ISSUES-AND-FIXES.md` (section C) has been checked on a real phone (Expo Go or a dev build) and marked fixed.** That includes Section A (Restore animations) and Section B (Plant logic). Check each item against the code and on the device, fix it, and write down how you checked it. "It passed on web" or "the code looks right" doesn't count. Start new features or AI work only after that.

## Order of work
1. Unzip, `npm install`, `npx expo start`, open in Expo Go (SDK 52). Log in with the demo accounts (02).
2. Fix 03 sections A, B and C. Don't let the demo regress: the pitch demo must keep working phone-only (`EXPO_PUBLIC_DEMO_LOCAL=1`).
3. Build the real backend (07) and the AI (05), following milestones M1 to M6. **The final deliverable is the full app with backend and AI.**

## Ground rules
- Keep the phone-only demo mode working as a build flag, even after the real backend is in.
- Don't redesign screens. Follow 06.
- Privacy: no real student data in the repo. The only survey fact you may use is the aggregate "28-student survey". Never add a contact column or any personal data from it.
- `.env` in the zip only contains `EXPO_PUBLIC_DEMO_LOCAL=1`. Never commit real Firebase keys.
