# NABT phone test (branch fix/demo-checklist)

## Setup (on a laptop on the same Wi-Fi as the phone)
```
git fetch origin
git checkout fix/demo-checklist && git pull
echo EXPO_PUBLIC_DEMO_LOCAL=1 > .env
npm install
npx expo start
```
Scan the QR code with **Expo Go (SDK 52)**. If the phone can't connect, try `npx expo start --tunnel`.
Start with Settings → Reset demo data (or hold the logo on the sign-in screen) if you've used the app before.

**Signing in:** type the UA ID only, tap Send me a sign-in code, then type the 6-digit code the demo shows under the boxes. There is no password.
Student `202212826` · Chair Lara `202148217` · Alumni Nour `201911457` · Student Affairs `201903318` · Admin `admin`.

## What to check (tick each one and note anything wrong)
**Startup and sign-in**
- [ ] Close the app fully, then open it. THRIVE and the lotus play before the next screen, every launch.
- [ ] The intro shows only on the first launch (Settings → "Show the intro again" brings it back).
- [ ] The sign-in screen matches the design: UA ID with a fixed `@ua.edu.lb`, "Send me a sign-in code", no password, no account-type tabs. The code is different each time.
- [ ] New here? Scan your ID card opens the camera and the torch works. Name and ID stay editable after the scan.

**Plant (student)**
- [ ] Soft glow behind the flower; stem sways, the head bends a bit later.
- [ ] Mood check-in → Okay → Save. A petal grows in on Home. A second check-in the same day adds nothing.
- [ ] Kill the app and reopen. The petal is still there. Changing the mode doesn't move the plant.

**Roles (the server refuses, not just the screen)**
- [ ] Me has no "I've graduated". Only Nour (alumni) sees "Offer mentoring".
- [ ] As the student, an event shows only the description, I'll go, Can't make it and Remind me. No Check in, Scan QR, End event or Issue certificates.
- [ ] I'll go and Can't make it each confirm with a short message and take you back.
- [ ] Chair badges are white. Gold is only on Verified (and the plant, badges and one main button).
- [ ] As the student, Robotics → chair dashboard, announce, report, host, venue: each says "Chair only".

**Event check-in (organizer QR only)**
- [ ] As Lara: Settings → Chair dashboard → Live now · Robotics Build Night. The QR and its code show, with who is here.
- [ ] As the student (Robotics member): center + → Event check-in. Scan Lara's QR from another phone, or type the code. "You're on the list for this event."
- [ ] As Lara: the student's nickname is on the list. End event. The student's My record shows the certificate.

**Exam week Space**
- [ ] Discover → Circles → Exam week opens filled: "Circle · 5 members", member initials, the counselor line, today's prompt with lines, the Hope thread with replies, and Propose a meetup.
- [ ] Before joining you can read everything; Join sits at the bottom and doesn't replace the cards.
- [ ] After joining: post a line, reply in the thread, tap Thanks, pick a time and Talk / Quiet sit / Short meditation, tap Propose a meetup. Leave and come back: all still there.
- [ ] As Student Affairs: Reviews → Meetups shows the request. Approve it; the student's Space shows "Approved by Student Affairs".

**Chat**
- [ ] Robotics chat: `text me 03 123 456`, a link or `stupid` is blocked with the reason. Rana's message has the kindness card.
- [ ] The + button: Photo or video, Poll (votes count), Document. Each one really sends.

**Home and Discover**
- [ ] "Thank them back" on Home works on the spot with a short message (no jump to Chats).
- [ ] "You said, we did" shows only campus-wide updates and things you took part in.
- [ ] Sign "Later library hours"; Student Affairs → Reviews → Petitions shows the new count.

**Support**
- [ ] Breathe: the ring grows and shrinks (in 4, hold 2, out 6), and tapping pauses it.
- [ ] Me → I'd like support → Just want to talk → Send. Student Affairs → Safety shows it by nickname, never a transcript.

**Scrolling**
- [ ] Me, Chats, Discover, Settings, sign-up, login and the support screens scroll all the way down on the phone.

Then walk the full DEMO.md path once across all five logins.
