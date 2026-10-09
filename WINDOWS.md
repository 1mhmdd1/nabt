# NABT on a Windows PC + Expo Go (SDK 52, Android)

The phone and the PC join the same Wi-Fi. Expo Go loads the app from the PC. The app then talks to the Firebase emulators and the local function server on that PC. `127.0.0.1` on the phone is the phone itself, so the host below is the PC’s LAN address.

## What you need

- Node.js 20 or newer
- JDK 17 or 21 (the Firestore emulator needs Java)
- Expo Go for **SDK 52** on the Android phone
- This repo, with `npm install` already finished

## 1. Start the campus

In PowerShell or Command Prompt, from the repo folder:

```bat
npm install
npm run demo
```

Leave this window open. `npm run demo` does three things:

1. Starts the Auth emulator (port 9099) and the Firestore emulator (port 8080).
2. Seeds the student campus, voice and safety copy, the Student Affairs staff app, Hope Node rewards, My record and certificates, alumni mentors, and the semester impact numbers. One `node scripts/seed.mjs` is enough; `npm run demo` calls it for you.
3. Starts the local function server on port **5055** (check-in, Chair roles, staff reveal, Hope Node rewards, certificates, feedback, and impact).

Today’s Faculty of Engineering check-in is **not** written by the seed, so a live tap at the Faculty of Engineering node can add a petal. The tablet starts in daily check-in (that QR marks a check-in and opens a note). Robotics Build Night is seeded with an approved Faculty of Engineering venue and a window around now. Cedar, the Chair, turns event mode on from the Robotics Chair screen (Hope Node). The tablet then shows the event name, the organizer’s screen description, the time window, and the event check-in QR. The live count stays on the Chair’s phone. Scanning `event:robotics-build` marks a member present. Ending the event, or reaching its end time, returns the tablet to daily check-in. Plain members never see the switch.

To clear that check-in and try the tap again:

```bat
node scripts/seed/reset-node-checkin.mjs
```

To mark today as already checked instead:

```bat
set SEED_TODAY_CHECKIN=1
node scripts/seed/node-rewards.mjs
```

## 2. Find the PC’s IP

```bat
ipconfig
```

Use the **IPv4 Address** on the Wi-Fi adapter. It looks like `192.168.1.20`. Ignore `127.0.0.1`.

## 3. Allow the ports through Windows Firewall

The first time Windows asks, allow Node.js and Java on **private** networks. If it does not ask, add inbound TCP rules for:

| Port | What it is |
| --- | --- |
| 8081 | Expo Metro (the app bundle) |
| 8080 | Firestore emulator |
| 9099 | Auth emulator |
| 5055 | Local functions (check-in, staff, Hope Node) |

Example, in an **Administrator** Command Prompt (replace the path if `node.exe` lives somewhere else):

```bat
netsh advfirewall firewall add rule name="NABT Metro 8081" dir=in action=allow protocol=TCP localport=8081
netsh advfirewall firewall add rule name="NABT Firestore 8080" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="NABT Auth 9099" dir=in action=allow protocol=TCP localport=9099
netsh advfirewall firewall add rule name="NABT Functions 5055" dir=in action=allow protocol=TCP localport=5055
```

## 4. Start Expo in LAN mode

Open a **second** window. Set the three variables to the IP from step 2, then start Expo:

```bat
set EXPO_PUBLIC_USE_EMULATOR=1
set EXPO_PUBLIC_EMULATOR_HOST=192.168.1.20
set EXPO_PUBLIC_FN_URL=http://192.168.1.20:5055
npx expo start --lan
```

`EXPO_PUBLIC_USE_EMULATOR=1` sends Auth and Firestore to the emulators. `EXPO_PUBLIC_EMULATOR_HOST` is the PC, not the phone. `EXPO_PUBLIC_FN_URL` is the single function server (check-in, staff, and node rewards).

On the phone, open Expo Go (SDK 52) and scan the QR code. If Expo Go offers a connection choice, pick LAN.

For a browser on the same PC you can leave the host as `127.0.0.1` and run `npx expo start --web --port 43123`.

## 5. Demo accounts

Password for every account: `nabt-demo-local`

| Who | Email | How to open it |
| --- | --- | --- |
| Student, Quiet Cedar | cedar@ua.edu.lb | Home and the other student tabs sign this account in for you |
| Alumni, Nour Saab | nour@ua.edu.lb | From Cedar, open `/alumni` and tap “Open as Nour Saab”. Me then shows Alumni · Class of 2024. “Back to Cedar” returns to the student demo |
| Counselor, Rima K. | 199804121@ua.edu.lb | Open `/staff/signin`, then “Send me a sign-in code” |
| Campus admin | admin@ua.edu.lb | Open `/admin/log`, then “Open as admin” |

Cedar stays a current student: Robotics Chair, exam mode, and My record (3 events, 1 training, 1 mentoring, 1 board role). Nour is a separate alumnus and an alumni mentor. Cedar’s accepted request to Nour stays in the chat.

Rima is Student Affairs and a counselor. The admin account is the only one that can read the campus admin log. The staff reveal list (Rima’s own reveals) is a different screen, under Staff → Me.

## Demo paths

| Path | What it shows |
| --- | --- |
| `/record` | Cedar’s My record and certificates |
| `/alumni` | Alumni mentors. “Open as Nour Saab” switches to the alumni account |
| `/alumni/offer` | Nour’s mentoring offer (chat, CV, advice) |
| `/alumni/inbox` | Requests waiting for the signed-in alumnus |
| `/announcements` | Student Affairs and Circle announcements |
| `/c/robotics/report` | Robotics semester report |
| `/c/robotics/announce` | A note for the Robotics Circle only |
| `/e/robotics-build` | Screen description, check-in, and certificates for the Chair |
| `/staff/overview` | Semester impact, including average rating and certificates issued |
| `/staff/announce` | Post an announcement |
| `/staff/you-said` | You said, we did |
| `/verify/UA-KIT26` | Public certificate check |

## Tablet setup

The Faculty of Engineering Hope Node runs in landscape Chrome on a touchscreen Android tablet (a Lenovo around 1280×800 or 1920×1200). The tablet has no NFC. Check-in is the QR code.

The PC and the tablet stay on the same Wi-Fi. Start the campus with `npm run demo`, then in a second window:

```bat
set EXPO_PUBLIC_USE_EMULATOR=1
set EXPO_PUBLIC_EMULATOR_HOST=192.168.1.20
set EXPO_PUBLIC_FN_URL=http://192.168.1.20:5055
npx expo start --web --host lan --port 43123
```

Replace `192.168.1.20` with the PC’s IPv4 address from `ipconfig`. Allow inbound TCP **43123** as well as the ports in the table above.

On the tablet, open Chrome and go to:

```text
http://192.168.1.20:43123/device/engineering
```

Chrome menu → **Add to Home screen**, then open NABT from the home screen so it fills the display. The page keeps the screen awake when the browser allows a Wake Lock. If the screen still dims, tap the page once and turn the tablet’s sleep timer up.

The QR on that page opens `http://<PC-IP>:43123/n/engineering?checkin=1` on a phone. That adds one petal for the day and the tablet switches to the welcome screen on its own. There is nothing to tap on an NFC reader.

Door event mode is the same tablet, one Circle event, landscape, with a large QR, the organizer’s screen description, and the time window:

```text
http://192.168.1.20:43123/device/event/robotics-build
```

A phone that scans it opens `/e/robotics-build/checkin` and is marked present. Cedar, the Robotics Chair, sees the names and the count. The Chair dashboard’s attendance line reads that same list.

## Tunnel fallback

Use this when the phone is on the same Wi-Fi but Expo Go cannot see the PC (guest isolation, or the QR code fails):

```bat
set EXPO_PUBLIC_USE_EMULATOR=1
set EXPO_PUBLIC_EMULATOR_HOST=192.168.1.20
set EXPO_PUBLIC_FN_URL=http://192.168.1.20:5055
npx expo start --tunnel
```

`--tunnel` only carries the JavaScript bundle. Auth, Firestore, and the function server still use `EXPO_PUBLIC_EMULATOR_HOST` and `EXPO_PUBLIC_FN_URL`, so those three ports still have to be reachable at the PC’s LAN address. If the phone is on a different network entirely, the bundle may load and the campus data will not.

## If a port is already taken

Rules tests bind Firestore on 8080. Stop `npm run demo` before `cd tests/rules && npm test`, and stop the tests before starting the demo again.
