# NABT phone demo

The pitch build runs on the phone only. Expo Go talks to Metro. There is no Firebase project, no emulator, and no function server. Everything is stored on the device.

`EXPO_PUBLIC_DEMO_LOCAL=1` is the default (`.env`). Set it to `0` only when you mean to use a real Firebase project.

## Start

```
npm install
npx expo start
```

Scan the QR code in Expo Go. For a browser check: `npx expo start --web`.

## Accounts

Password for every account: `nabt-demo-local`

| Who | Sign in | What you see |
| --- | --- | --- |
| Student | `202212826@ua.edu.lb` | Joined 2022. Picks a nickname on first login. Plant starts at zero. Not in any Circle yet. |
| Student Affairs | `201903318@ua.edu.lb` | Maya Nassar, joined 2019. Mood trend, impact, safety, petitions. |
| Alumni | `201911457@ua.edu.lb` | Nour Saab, Class of 2024, joined 2019. One mentoring request is already waiting. |
| Admin | `admin@ua.edu.lb` | Not a student ID. Audit log and roles. |
| Robotics Chair | `202148217@ua.edu.lb` | Lara Khoury, joined 2021. Chair of Robotics Society. |

A UA ID is the year someone joined, then 5 digits. The year has to be from 2019 through the current year.

## Click path

1. Sign in as the student (pick **Student**, type the ID only; `@ua.edu.lb` is fixed). The nickname is random: tap Reroll until you like one, then Use this name. Below, “Gentle Olive” stands for whichever nickname you kept.
2. Home → Mood check-in → Okay → Save. The plant shows Sprout and one petal.
3. Discover → Circles → Robotics Society. The gold Verified badge is on the About page. Join community.
4. Open Chat. Send `text me 03 123 456` (or `stupid`, or a link). NABT blocks it and shows the reason. Rana’s “I'm stuck on the first exercise” message has a kindness card. Send “You've got this”, then Thanks on Karim’s reply.
5. Open Robotics Build Night (it is always today). Tap I’ll go, Check in, then End event. Home asks how it was. My record shows the certificate and its verify code.
6. Discover → For you. Sign “Later library hours”. “You said, we did” sits on the same page.
7. Me → I'd like support → Just want to talk → Send.
8. Me → Alumni mentors → Nour Saab. Send a short note.
9. Settings → Switch account. Pick **Staff** and sign in as Student Affairs.
   - Overview: weekly mood chart with exam weeks marked, and impact tiles (Check-ins includes Build Night).
   - Safety: the new request is “Gentle Olive · Just want to talk”.
   - Reviews → Petitions: Later library hours shows the new signature count.
   - Announce something short. The student sees it under Announcements.
10. Switch to Nour (pick **Alumni**). Mentor inbox → Accept Gentle Olive. A chat opens.
11. Switch to admin (pick **Staff**, ID `admin`). The audit log and Set a role are on that screen.
12. Switch to Lara. Settings → Chair dashboard. Members, mentors, attendance, and Nadine’s join request are on that screen.

Sign-up stays clickable. Scan your ID card uses the camera, skips reading the photo, and prefills an editable sample (current year, then `48217`, name Lara Haddad, Faculty of Engineering). On the web, Continue does the same without a photo. The demo email code is `482913`. New accounts are students with the same demo password.

## Reset

Settings → Reset demo data, or press and hold the NABT logo on the sign-in screen. That restores the seed, including a Build Night dated today.
