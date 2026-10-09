# 02: Base version

**Base:** `nabt-app-main.zip` = `main` @ **`ed031b3`** ("feat: run the campus demo on the phone"), sha256 `86f9826e…a61c`.
This is the most stable build: phone-only, so there is no backend to fail, and the coding agent's Playwright walk on web passed end to end. **It hasn't been run on a real phone yet**, and the user says animations are broken on device (see 03-A).

## Stack
Expo SDK 52, React Native 0.76, expo-router 4, Reanimated 3, react-native-svg 15, zustand, AsyncStorage. `firebase` 11 is still a dependency for the real mode. `tesseract.js` is a leftover from the OCR experiment and is unused in demo mode.

## Run
```
npm install
npx expo start        # scan with Expo Go (SDK 52)
npx expo start --web  # browser check
```
`EXPO_PUBLIC_DEMO_LOCAL=1` (in `.env`) means no Firebase, no emulators, no function server. `WINDOWS.md` and `npm run demo` describe the **older emulator mode** (Firebase emulators + function server on :5055). Keep it as a reference for the real backend.

## Demo logins (password `nabt-demo-local`)
| Who | Email |
|---|---|
| Admin | `admin@ua.edu.lb` |
| Student Affairs (Maya Nassar) | `201903318@ua.edu.lb` |
| Student (fresh: plant 0, no Circles) | `202212826@ua.edu.lb` |
| Alumni Nour Saab, Class of 2024 | `201911457@ua.edu.lb` |
| Robotics Chair Lara Khoury | `202148217@ua.edu.lb` |

UA ID = join year (2019 to now) + 5 digits. Sign-up: the camera opens, OCR is skipped and an editable sample is prefilled, demo email code `482913`. Reset: Settings → Reset demo data, or long-press the logo on the login screen. The full click path is in `DEMO.md`.

## Code map
- `app/`: expo-router screens (student, `staff/*` for SA, `c/[circleId]/*` for Chair/community, `alumni/*`, `e/[eventId]`, `signup/*`, `voice/*`, `support/*`, `care/*`).
- `src/local/`: demo data layer. `store.ts` (AsyncStorage doc store), `shims/{firestore,auth,app}.ts` (Firestore/Auth API shims), `handlers.ts` (stand-ins for the Cloud Functions, e.g. `/check-in`, `/thanks`), `seed.ts`, `mode.ts`.
- `src/live.ts`, `src/live/*`: data hooks per area (communities, events, impact, records, alumni, staff, voiceSafety).
- `src/moderation/*`: on-device outgoing message rules (lexicons EN/AR/Arabizi, normalize, classify, outgoing). `src/ml/moderation.ts` is a **second, older** lexicon classifier. Merge the two into one.
- `src/voice/*`: capture, `signals.ts` (loudness/pause features → calm/low/tense), `care.ts` (care level), retention (audio deletion).
- `src/nickname/rules.mjs`: nickname rules. `src/components/Plant.tsx`: home plant. `app/index.tsx` + `src/art/thriveParts.ts`: THRIVE loader. `src/intro.ts` + `app/onboarding.tsx`: first-launch onboarding.
- `docs/firestore.rules` (879 lines, tested), `functions/src/index.ts`, `docs/PRODUCT_GAPS.md`.
- Tests: `npm run test:voice` (moderation + voice), `npm run typecheck`. Rules tests and Playwright walks are in `scripts/` and `tests/`.
