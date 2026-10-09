# Paste to Claude: seed essential demo data (for the pitch deck and the live demo)

Seed just enough realistic data that the deck screenshots and the live demo never look empty. Put all of it in the **demo seed only** (the local-store seed file), loaded through the same data layer as real data. Never hardcode it in screens or components (see 09). "Reset demo data" must restore exactly this seed.

## Keep these rules
- The five demo logins stay the same, password `nabt-demo-local`: Admin `admin@ua.edu.lb`, Student Affairs `201903318@ua.edu.lb`, Student `202212826@ua.edu.lb`, Alumni Nour Saab `201911457@ua.edu.lb`, Robotics Chair Lara Khoury `202148217@ua.edu.lb`.
- Student IDs = year joined (2019 or later) + 5 random digits. Seed people use nicknames in Circles; real names only where the identity rules allow.
- **The demo student starts fresh:** no chats, no memberships, plant at zero. They join and grow during the demo. Everything else around them is populated.
- No "Rohban Hall". No Hope Node data. Say "Circle", never "group". English content; a couple of Arabic or Arabizi posts are fine to show multilingual support.
- All numbers are **stored seed values that the app computes from** (e.g. members = seeded member records), not literals in UI.
- Keep it believable and consistent across accounts (the same event shows the same attendance everywhere).

## What to seed
**Regular Circles (6–8):** e.g. Exam Week Study, First-Year Commuters, Coffee & Calm, Engineering Night Owls, Arabic Poetry, Gym Buddies, Music Corner. Each has 15–80 members and 3–6 posted threads with replies and thanks spread over the past two weeks. No Chair, board or role chips.

**Verified communities (4):**
- **Robotics Society** (Chair Lara Khoury): 20 members (14 active), 5 mentors (3 active), last-five-events attendance, 1 pending join request (Nadine), and **"Robotics Build Night" happening TODAY** that the demo student joins, RSVPs, checks in, gives feedback and gets a certificate. Plus 2 past events and 1 upcoming.
- **Film Club**, **Debate Society**, **Red Cross Youth / Volunteering**: each with a Chair, a board, 25–60 members, 1 upcoming event, 1–2 past events with attendance and feedback, and a club semester report.

**Student Affairs dashboard:**
- **Mood trend:** 8 weeks of aggregate check-ins (about 120–260 per week) with a visible dip in exam weeks and recovery after. Aggregates only, never individuals.
- **Impact numbers (this semester):** about 640 active students, 1,900+ check-ins, 38 events, 1,150 event check-ins, 310 certificates issued, 14 Circles, 4 Verified communities, 27 support requests handled, median first response under 24h, 9 "You said, we did" changes delivered.
- **Pending:** 3 event venue/date requests (one from Robotics), 2 petitions under review, 2 support requests ("I'd like to talk", by nickname), 1 "needs care" signal by nickname (no number shown).
- **Announcements:** 3 official ones (exam schedule, career fair, library extended hours).
- **"You said, we did":** 4 delivered items (e.g. longer library hours, more microwaves at the cafeteria, a quiet study room, a shuttle time change) and 2 in progress.
- **Petitions:** 4 total, with signatures from 40 to 310: 2 under review, 1 delivered, 1 open that the demo student can sign.

**Alumni (Nour Saab, Class of 2024):** mentor profile, a lifelong record with 6 certificates and events, and 1 incoming mentoring request. Add 2–3 other alumni mentors to browse.

**Admin:** a short audit log (role changes, the Chair assignment by Student Affairs, a verified community approval) and the user counts by role.

**Discover / Home for the demo student:** upcoming events across clubs, suggested Circles, the 3 announcements, and today's drop.

## Done means
- [ ] Every role's main screens look full and realistic, with no empty dashboards in the deck.
- [ ] The demo student still starts fresh and the Robotics flow works end to end.
- [ ] Numbers agree across screens and accounts.
- [ ] Reset demo data restores exactly this seed.
- [ ] Retake the 11 deck screenshots (OSA mood trend, OSA impact, OSA support request, student check-in and plant, Circle safety and kindness card, Robotics verified page, event check-in, My record and certificate, alumni mentor, petition and "You said, we did", Chair dashboard) at 390×844 after real demo actions, and list what you seeded.
