# Paste to Claude: what changed from the design screens

The design zips (showcase PNGs, screens by role, HTML mockups, design system, designer assets) are the **visual reference**: layout, colors, type, spacing, art and animations. Match them closely. But several product decisions came **after** those designs. Where a design and this list disagree, **this list and the claude-handoff docs win**. Check every screen against this list before calling it done.

## Removed or changed
1. **Hope Node is out of the app demo.** Ignore the Hope Node phone and campus-screen designs (07, 08) and hide every entry point (menu "Leave a node note", the awake-nodes area on Home, the node scan). It's mentioned only in the pitch as a future concept.
2. **Never write "Rohban Hall"** anywhere. Faculty of Engineering appears only in Hope Node examples.
3. **Remove the "Open map" button.** Ignore the 07-map-on-hold folder.
4. **No drawn-in status bar.** The mockups show a fake time/wifi/battery bar; use the phone's real status bar with SafeArea.
5. **The lotus logo is gold**, never black (startup, loader, sign-in, ID scan).
6. **Framing:** NABT is UA's verified student-life platform that connects students to the university and its services. Wellbeing is one layer, not the headline. No copy that sells it as social media or "monitored" chat; say "safety built in".
7. **Counters → descriptions:** where a design shows a counter on an event or node, show a short description set by the event organizer instead.
8. **Rewards (09):** keep only what supports the plant, badges and certificates. Don't build a perks economy beyond what the docs list.

## Flows that must behave differently than a static mockup suggests
9. **Onboarding** (Understand yourself, Support students, Find your circle) shows only on the very first launch. After that the app goes straight to sign-in or Home.
10. **THRIVE loader** on every launch: THRIVE in the middle → turns into the gold lotus with THRIVE under it → flower loading bar. It stays up long enough for the full animation (match the designer videos).
11. **Sign-up:** the ID scan opens the real camera and the torch works. Name and ID fields stay editable after the scan. The email code boxes start empty, with a random demo code shown underneath. Nickname: random suggestion, 3–20 characters, never a real name, ID, contact or offensive word.
12. **Home plant:** head, stem, petals and roots move as separate parts (the head bends from the stem tip), with a soft glow that renders on the phone (not SVG blur only). Every petal (self-care) and root (helping) gain grows in with an animation, even if it was earned on another screen. The mode dropdown is an overlay and never moves the plant.
13. **Start** opens the 3-minute task, not the daily check-in. **Save** on check-in works. **Breathe** is a real animated breathing exercise.
14. **"I'll be there" / "Remind me"** on Today's drop confirm and return the user; nothing leaves them stuck. Add "Can't make it".
15. **Share with Student Affairs** sends a support request ("I'd like to talk"), never a chat transcript.
16. **Thanks / +root / Thank them back** work inline where they are; nothing jumps to the Circle. Thread replies open inline and the user can reply there.
17. **Event description** can only be set by the Chair or organizer who created the event, not by normal members.
18. **"You said, we did"** shows only items the user was involved in (their petitions, their event requests) plus university-wide updates.
19. **Going / Join** buttons work and are aligned. Joining a Circle actually joins it.
20. **Chat:** on-device safety checks on every message (harassment, bullying, hate, threats, scams, sharing numbers or links) in English, Arabic and Arabizi. Kindness mini-cards appear to others when someone writes they're stuck or need help ("Say something kind" / "Someone here needs help with…"). The distress card always has "Not now, I'm okay".
21. **No dead buttons.** Every button goes somewhere real or shows a clear "Coming soon".

## Added after the designs (build these even though there's no mockup)
22. Certificates and the **co-curricular record** (My record), lifelong for alumni.
23. Post-event **feedback**, then a certificate after check-in.
24. **Student Affairs impact numbers**, official **announcements**, **club semester reports**.
25. **Petitions** with status that feeds "You said, we did".
26. **Alumni:** verified alumni status, mentor profile, mentoring requests.
27. **Chair dashboard** (11, 12): members, mentors, attendance, join requests. Only Verified communities have a Chair, board and role chips; regular Circles have none. Student Affairs assigns the Chair. Event requests to Student Affairs cover only the venue and date.
28. **Care level:** never shown as a number. Only "needs care" reaches the counselor, by nickname.
29. **Settings:** Reset demo data. Five demo logins, password `nabt-demo-local`.

## Design rules (always)
Burgundy, gold and white only. Gold only on the plant, a badge or one main button. Muted white text at least 64% opacity. Say "Circle", never "group". English UI (users may type Arabic or Arabizi). Mobile only.

When done, list every screen in the design zips and mark it: matches design / changed per this list / removed.
