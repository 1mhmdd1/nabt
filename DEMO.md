# NABT phone demo

The pitch build runs on the phone only. Expo Go talks to Metro. There is no Firebase project, no emulator, and no function server. Everything is stored on the device.

`EXPO_PUBLIC_DEMO_LOCAL=1` is the default (`.env`). Set it to `0` only when you mean to use a real Firebase project.

## Start

```
npm install
npx expo start
```

Scan the QR code in Expo Go. For a browser check: `npx expo start --web`.

## Signing in

There is no password. Type the UA ID (the `@ua.edu.lb` part is fixed), tap **Send me a sign-in code**, and the demo shows a new 6-digit code under the boxes ("Demo code: 123456"). Type it and tap Verify. The account type (student, alumni, Chair, Student Affairs) comes from the account, not from the sign-in screen.

| Who | UA ID | What you see |
| --- | --- | --- |
| Student | `202212826` | Joined 2022. Gets a random nickname on first sign-in. Plant starts at zero. Not in any Circle yet. |
| Robotics Chair | `202148217` | Lara Khoury. Student Affairs made her Chair of Robotics Society. She runs its events. |
| Alumni | `201911457` | Nour Saab, Class of 2024. Student Affairs graduated her. One mentoring request is waiting. |
| Student Affairs | `201903318` | Maya Nassar. Mood trend, impact, safety, petitions, Circles, accounts. |
| Admin | `admin` | Audit log and roles. |

A UA ID is the year someone joined, then 5 digits.

## Who can do what

- **Student:** reads an event, taps I’ll go or Can’t make it, sets Remind me. Is marked present only by scanning the organizer’s QR at the event. Posts in Circles they joined.
- **Chair** (of their own Circle only): shows the check-in QR, sees who is here, ends the event, issues certificates, writes the event description, assigns board roles, asks Student Affairs to verify the Circle, requests a venue.
- **Student Affairs:** verifies Circles (the gold Verified badge), assigns the Chair, changes account status, graduates a student to alumni with a class year, and runs OSA events like a Chair.
- **Alumni:** offers mentoring and answers mentor requests.

Nobody can change their own role, status, alumni flag or class year. The demo store and the local handlers refuse these writes, not just hide the buttons (`npm run test:permissions`).

## Click path

1. Sign in as the student. Tap Reroll until you like the nickname, then Use this name. Below, “Gentle Olive” stands for whichever nickname you kept.
2. Home → Mood check-in → Okay → Save. The plant grows a petal.
3. Discover → Circles → Exam week. The Space is already filled: today’s prompt with lines, the Hope thread with replies, and Propose a meetup. You can read it before joining. Join at the bottom, then post a line, reply to the thread, tap Thanks, pick a time and a kind (Talk, Quiet sit, Short meditation) and tap Propose a meetup.
4. Discover → Circles → Robotics Society. The gold Verified badge is on the About page. Join community.
5. Open Chat. Send `text me 03 123 456` (or `stupid`, or a link). NABT blocks it and shows the reason. Rana’s “I'm stuck on the first exercise” message has a kindness card. Send “You've got this”, then Thanks on Karim’s reply. The + button sends a photo or video, a poll, or a document.
6. Open Robotics Build Night (it is always today). Tap I’ll go. The student has no Check in, Scan QR or End event.
7. Settings → Switch account → Lara (`202148217`). Settings → Chair dashboard → Live now · Robotics Build Night. The check-in QR and its code are on screen.
8. Switch back to the student. Center + → Event check-in. Scan Lara’s QR from a second phone, or type the code under the QR and tap Check in. “You’re on the list for this event.”
9. Switch to Lara. The check-in screen shows the student’s nickname. Tap End event (certificates go out), or Issue certificates. The student’s My record shows the certificate and its verify code.
10. As the student: Discover → For you. Sign “Later library hours”. “You said, we did” shows that petition and campus-wide updates.
11. Me → I'd like support → Just want to talk → Send.
12. Me → Alumni mentors → Nour Saab. Send a short note.
13. Switch to Student Affairs (`201903318`).
    - Overview: weekly mood chart and impact tiles.
    - Safety: the new request is “Gentle Olive · Just want to talk”.
    - Reviews → Petitions: Later library hours shows the new signature count.
    - Reviews → Meetups: the Exam week request is waiting. Approve it, and the Space shows “Approved by Student Affairs”.
    - Announce something short. The student sees it under Announcements.
14. Switch to Nour (`201911457`). Mentor inbox → Accept Gentle Olive. A chat opens.
15. Switch to `admin`. The audit log and Set a role are on that screen.
16. Switch to Lara. Settings → Chair dashboard: members, attendance, and Nadine’s join request.

Sign-up: New here? Scan your ID card opens the camera (with the torch). The photo is shrunk, sent to the function server’s `/ocr-id` (the one call that leaves the phone in demo mode), read with tesseract.js, and deleted. Check your details shows the printed name (two lines of capitals joined), the 9-digit ID and the UA email that follows it. Faculty stays empty because the cards don’t print one. Name and ID stay editable, and Edited shows only after a change. If the card can’t be read, the fields are empty and the screen says so. On the web, Continue opens empty fields to type. The email code is random and shown under the empty boxes.

For the card read, run the function server on the laptop (`node scripts/dev-fn.mjs`) and set `EXPO_PUBLIC_FN_URL=http://<laptop LAN IP>:5055` in `.env`. The first run downloads the English language file into `.tess-cache/`, so do it once with internet.

## Checks

```
npm run test:permissions
npm run test:ocr
CHROME=/path/to/chrome node scripts/demo-walk.mjs
CHROME=/path/to/chrome node scripts/role-pass.mjs
```

The two walks need `npx expo start --web --port 8081` running.

## Reset

Settings → Reset demo data, or press and hold the NABT logo on the sign-in screen. That restores the seed, including a Build Night dated today and the filled Exam week Space.
