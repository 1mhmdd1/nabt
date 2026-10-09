# Paste this as your first message to the agent

You are taking over NABT, a React Native + Expo app for Antonine University (UA) students, run under Student Affairs. Everything you need is in this folder.

1. Read these in order: README.md, then 01-PROJECT.md, 02-BASE-VERSION.md, 03-KNOWN-ISSUES-AND-FIXES.md, 04-FINAL-PRODUCT-SPEC.md, 05-AI-INTEGRATION.md, 06-RULES-AND-DESIGN.md, 07-BACKEND.md.
2. Unzip nabt-app-main.zip. It is the base version (commit ed031b3). Run it first exactly as 02 describes.
3. Work in this order:
   a. Fix every item in 03 section C (the master checklist) and confirm each one works on a real phone, not only on web.
   b. Restore the animations in 03 section A and fix the plant logic in section B.
   c. Build the real backend described in 07, behind the existing src/live interfaces. Keep the phone-only demo mode (EXPO_PUBLIC_DEMO_LOCAL=1) working as a fallback.
   d. Integrate the AI from 05: chat safety, voice check-in and the care signal, all keeping the privacy guarantees.
4. Follow 06 strictly: burgundy, gold and white only; "Circle", never "group"; mobile only.
5. After each milestone, report what you changed, what you tested on a phone, and anything still broken. Never call something done until it passes the acceptance checklist in 03 section E.

Before writing any code, confirm you've read all eight docs and send me a short plan.
