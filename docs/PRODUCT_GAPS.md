# Product gaps

Empty-database pass across student, Chair, mentor, alumni, Student Affairs, admin, and the Hope Node. Screens were not redesigned. Expo SDK 52 is unchanged.

## Fixed

- Student Affairs no longer waits on a seeded overview, profile, or case list. A missing office opens with zeros and empty copy.
- Overview counts (open support, venue requests, accounts waiting) come from live collections.
- Impact tiles hide counts from 1 to 4. Zero stays zero. Average rating and certificate totals stay hidden until at least five responses or certificates.
- Creating a community also writes the Student Affairs community card, including the Chair as a candidate.
- Chair assignment loads the real member list through the function server (Student Affairs cannot read member documents) and can find another person by UA email.
- Account approval, Chair changes, verification, and identity reveals write audit rows the admin log can filter.
- An admin can set Student Affairs or admin on a UA email from the audit screen. `make-role.mjs` still does the same from the terminal.
- Staff routes require a Student Affairs token. Role changes require an admin token. Graduation confirms only the signed-in account, with a class year, and is not a client write.
- A student can switch to alumni from Me, then save a mentor profile. Mentor lines and requests go through the same outgoing check as chat.
- Announcements, “You said, we did”, and semester-report highlights are length-checked and moderated before they post. Toasts confirm those actions and the Student Affairs decisions.
- Hard-coded office numbers are gone: the events KPI, perk goal fallback (412 / 500), staff “2 live” and “3 reveals”, the petition id `library-hours`, and the outreach name “Quiet Fig”.
- Empty copy is in place for accounts, communities, reports, petitions, announcements, You said, safety cases, support, reports, perks with no goal, and Hope Nodes.

## Still open

- The Hope Node camera scan is still a typed node code on web. A phone with Expo Go is what reads the tablet QR.
- Home plant sway, the mode sheet, the Start timer, check-in Save, drop reminders, thanks-from-Home, Discover Going, and the personal “You said, we did” reason were not re-walked in this pass.
- Decline paths exist for venues, join requests, and petitions. The last empty-database walk exercised approve, publish, and verify.
- Some staff screens (meetups, live room boards, perk redemption log, certificate issue from the staff list) still render only when those collections have documents. They show an empty list rather than a second layout. Creating those objects is not part of the student or Chair path yet.
- 1:1 chats stay anonymous until both people consent. That consent flow was already in the rules and was not given a new browser script here.
- Assigning a safety case to a named counselor is still “Coming soon”.
- Embrace 1564 stays on the staff profile as Lebanon’s lifeline, not as campus data.
