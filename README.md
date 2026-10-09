# NABT

NABT (“to sprout”) is the student app for Antonine University. Milestone 1 is the student shell: launch, onboarding, UA email sign-up, Home with the plant, daily check-in, Circles (Space and Chat), and Me / Settings / Accessibility.

Campus content is live from the Firestore emulator. The app signs in as the seeded student `cedar@ua.edu.lb` so Home, Chats, Circle Space, Circle Chat, and Me update from listeners. Sending a Circle message writes `circles/{id}/messages` and shows up on any other signed-in client. A check-in keeps the mood on the phone and asks the local growth function to add a petal. Security rules do not let the client write `users.plant`.

The palette is burgundy, gold, and white. Montserrat is the only typeface. Gold is reserved for the plant, a badge, or one main button on a screen.

## Web preview

```bash
npm install
npm run demo
```

`npm run demo` starts the Auth and Firestore emulators, seeds every area (student campus, voice and safety, Student Affairs, Hope Node rewards), and serves the local functions on port 5055. Leave that window open.

In a second terminal:

```bash
npx expo start --web --port 43123
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123). The designed phone is 390×844.

The project id `demo-nabt` talks to the emulators unless `EXPO_PUBLIC_USE_EMULATOR=0`.

Demo accounts (password `nabt-demo-local` for each):

| Who | Email | Where |
| --- | --- | --- |
| Student, Quiet Cedar | cedar@ua.edu.lb | Student routes sign in automatically |
| Counselor, Rima K. | 199804121@ua.edu.lb | `/staff/signin` |
| Campus admin | admin@ua.edu.lb | `/admin/log`, then “Open as admin” |

Today’s Faculty of Engineering check-in is left open so a live node tap can add a petal. `node scripts/seed/reset-node-checkin.mjs` clears it again.

## Windows + Expo Go SDK 52 (Android phone)

Exact steps, firewall ports, and the tunnel fallback are in [WINDOWS.md](WINDOWS.md).

## Checks

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
cd tests/rules && npm install && npm test
```

Rules tests start their own Firestore emulator on port 8080. Stop the app emulator first, or the test run will fail to bind the port.

Two-client chat check (emulators and seed already running):

```bash
node scripts/live-check.mjs
```

## Screens

| Route | What is live |
| --- | --- |
| `/home` | greeting, plant counts, Today card, root note, campus rows |
| `/check-in` | mood stays on device; Save calls the growth function |
| `/chats` | circles, 1:1 chats, chat requests |
| `/circle/exam-week` | members, prompt, answers, Hope Thread, meetup |
| `/circle/exam-week/chat` | messages; Send writes Firestore |
| `/discover` | Hope Thread, events, Circles, places, petitions |
| `/c/robotics` | verified community, Chair dashboard, members, roles, venue request, board audit |
| `/c/film/join` | join notice before a verified Circle can see your name and UA email |
| `/e/breathe` | event detail and RSVP |
| `/me` | nickname, garden line, badges, notes and petitions |
| `/settings`, `/settings/accessibility` | nickname and settings doc |
| `/admin/log` | campus admin log (admin claim only; local sign-in `admin@ua.edu.lb`) |

Launch, onboarding, and sign-up chrome stay as designed copy. Details and nickname fill from the signed-in profile once the emulator is up.
