# 03: Known issues and fixes

How each status was checked: by reading the code in `ed031b3` (the zip). Nothing here was run on a phone. **Every row must be re-checked on a real device** (README hard rule).
Legend: **Fixed** = the code exists and looks right · **Partial** = present but incomplete, or likely broken on device · **Broken/Missing** = absent or known to fail.

---
## A. TOP PRIORITY: Restore animations
The user confirms animations broke in the base on device. The code is mostly still there, so the likely causes are platform rendering issues, not deleted code. Check each one on Android in Expo Go.

| # | Animation | Files | Status in base | Fix approach |
|---|---|---|---|---|
| A1 | **Plant glow** | `src/components/Plant.tsx`, `src/art/svgs.ts` (`plantSvg`, filters `sapGlow`, `rootGlow`, about 20 filter/gradient refs) | **Partial/broken.** The glow exists only as SVG `<filter>` (feGaussianBlur/feMerge) inside the XML passed to `SvgXml`. react-native-svg filter support is limited and inconsistent, so it renders flat on device. `Plant.tsx` has no glow layer of its own. An earlier transcript (agent bc-0d1f1d78) committed "fix: the home plant glow soft and the bud unclipped". That commit is in the history before `ed031b3`, but the zip has no `.git`, so get it from the origin repo `main` history (`git log -S sapGlow` / `--grep glow`). | Don't depend on SVG filters. Add a separate glow layer behind the plant: a pre-rendered soft PNG, or an `Svg` `RadialGradient` circle with opacity stops (gradients are supported), as its own `Animated.View`, with a slow opacity/scale pulse (Reanimated `withRepeat`, about 3 s). Remove `filter=` attributes from the native XML, or keep them for web only. Gold is allowed here (it is the plant). |
| A2 | **Per-part flexible sway** (head separate from stem) | `Plant.tsx` lines ~60-120: `bend`, `trail` shared values; `stemStyle`, `headStyle` with `transformOrigin` | **Partial.** Stem and head are separate layers with separate timing (head is 260 ms delayed, ±4.2° vs ±2.4°). Both rotate around the **same pivot** (`PIVOT_X/Y`, the soil), so the head doesn't flex on its own. String `transformOrigin` with `px` on an `Animated.View` wrapping `SvgXml` is unreliable on RN 0.76 Android. Sway is off when Calm mode is on (correct). | Implement the pivot by hand: `translate(pivot) → rotate → translate(-pivot)` in the transform array instead of `transformOrigin`. Give the head a **second pivot at the stem tip**, and put the head's own rotation on top of the stem's rotation (nest the head view inside the stem view) so it bends like a flexible stem. Consider splitting the leaves too. |
| A3 | **Animated petal and root growth** | `Plant.tsx` (`petal`, `rootDraw`, `growingPetal`, `growingRoot`) | **Partial.** A new petal scales and fades in at `PETAL_X/Y` (720 ms), and a new root draws by `strokeDashoffset` (900 ms). It only runs when the count goes up **while Home is mounted** (`seen` ref). Gains made on other screens (chat Thanks, check-in) mostly happen while Home is unmounted, so the first render starts with the new value and **no animation plays**. Also, after the animation the overlay unmounts, and the static art doesn't show the accumulated petals/roots (art doesn't scale with the count). | Save `lastSeenPlant {petals, roots}` in AsyncStorage. On Home focus (`useFocusEffect`) compare it with the current values and animate each gain, then save. Render N petals and M roots from data (the petal path rotated per index, root paths from a list) so growth stays visible. Use the same transform-origin fix as A2. |
| A4 | **THRIVE loader sequence** | `app/index.tsx`, `src/art/thriveParts.ts` | **Partial.** The full RN `Animated` sequence is there: word fades in → drops under the lotus → petals in waves → flame → flower bar → sparkles. It uses `scaleAbout` transforms on SVG layers and `useNativeDriver` on native. The leave timer (`LEAVE`) can cut it short, and the route may skip it for returning users. | Check on device. Swap the `scaleAbout` origin trick for explicit translate/rotate/translate. Make sure the loader shows on **every cold start**, plays to completion before `leave()`, and only then routes (first launch → onboarding, else login/home). |
| A5 | **Startup plant art animations** (onboarding) | `app/onboarding.tsx`, `src/art/onboardingParts.ts`, `src/intro.ts` | **Partial.** Uses RN `Animated` with `progress` and `scaleAbout`. Onboarding is first-launch only (`intro.ts`: `seen ? "/login" : "/onboarding"`), so it's easy to think it's broken when it was just already seen. | Same transform fix as A4. Add a dev-only "Replay intro" in Settings. Check that Reset demo data also clears the intro flag (or not, depending on what the demo wants; currently decide and document). |
| A6 | **Flower loading bar** | `app/index.tsx` (`bar`, `BAR_START`, `BAR_MS`, `FLOWER_SPOTS`, `glint`, `twinkle`) | **Partial.** Each flower lights up when the line reaches it. The bar width is animated. Check whether `scaleX` with the native driver on an SVG layer works on Android. | If it doesn't render, animate a clipped `View` width (JS driver) or Reanimated `useAnimatedProps` on an SVG `Rect width`. |
| A7 | **Breathing animation** | `src/components/NodeChrome.tsx` (only breathing component, Hope Node kiosk, hidden in demo); `app/support/index.tsx`, `app/voice/support.tsx` (show `breatheTitle`/`breatheSub` text only) | **Broken/Missing.** The support and distress card "breathe" option has no breathing animation screen. This matches the earlier "frozen breathe" report. | Build a reusable `BreathingLotus` component (inhale 4 s scale up / hold / exhale 6 s, with text "Breathe in… out", Reanimated `withRepeat`, stops in Calm mode and becomes a static text guide). Use it from the support breathe row and from the distress card. Pause/resume on tap. |

General: test with Calm mode **off** (`src/state.ts` default `calmMode:false`, good). Add a hidden debug screen listing every animation with a Replay button to test them quickly.

---
## B. PRIORITY: Plant logic
Rule: **petals = self-care** (mood check-ins, Start today's step / tasks, voice check-in). **Roots = helping others** (giving Thanks, answering a kindness card, Thank them back, mentoring).

| # | Item | Status | Evidence / fix |
|---|---|---|---|
| B1 | Petals from self-care | **Partial** | `src/local/handlers.ts`: `/check-in` and `/task-done` → `grow(petals)`. Check that voice check-in "calm" also calls `/check-in`. Add a per-day cap so spamming doesn't farm petals. |
| B2 | Roots from helping | **Partial** | `/thanks` → `grow(roots)` + `growthEvents`. Check that a kindness-card chip reply and "Thank them back" both hit `/thanks` (the transcript says the Playwright walk verified the chip reply earns a root). Mentor accept should also give a root. |
| B3 | Animated growth on every gain | **Partial** | See A3. |
| B4 | State persists | **Fixed (demo)** | `users/{uid}.plant {petals, roots, stage}` in the AsyncStorage store (`src/local/store.ts`, debounced persist). Stage: 0 Seed, 1-2 Sprout, 3+ Bloom. Make sure the debounced write is flushed on app background (`AppState`) or it can be lost. |
| B5 | Mode dropdown must not shift the plant | **Partial / verify** | `app/home.tsx`: mode list opens as an absolute `scrim` overlay (`setModes`). The mode label pill above the plant changes width/lines with the label → it can push the plant. Fix: give the mode row a fixed height and a single line (`numberOfLines={1}`), and put `PlantArt` in a fixed-size container. |

---
## C. MASTER CHECKLIST: every reported issue
The user's earlier issue lists (#1-#15 and the later batches) live in the parent agent's memory, which this pack couldn't open directly. Below are the items it named, each checked against the code. **Before you start, ask the user or parent for the original numbered list and map it to these rows.**

| # | Issue | Status in base | Where / notes |
|---|---|---|---|
| C1 | Status bar (style/colour on burgundy) | Fixed (verify) | `expo-status-bar` in `app/_layout.tsx`, `Chrome.tsx`, `Signup.tsx`. Check it's light on every screen, including staff. |
| C2 | Gold lotus (logo/plant art) | Fixed (verify) | `src/components/LotusArt.tsx`, `src/art/lotusSvg.ts`. Gold allowed only on plant/lotus. |
| C3 | Loader (THRIVE) | Partial | See A4/A6. |
| C4 | Onboarding first launch only | Fixed | `src/intro.ts`. Animations: A5. |
| C5 | ID scan: camera opens | Fixed (demo) | `app/signup/scan.tsx` uses `expo-camera`. OCR skipped, sample prefilled. |
| C6 | ID scan: torch | Partial | `enableTorch` is in `scan.tsx`. Test the toggle on Android. |
| C7 | Editable sign-up fields | Fixed (verify) | `app/signup/details.tsx`, prefilled sample, editable. |
| C8 | Empty email code | Fixed (demo) | Code `482913` shown on screen (`app/signup/email.tsx`, local `/auth/send-code`). Real mode: see 07. |
| C9 | Nickname rules | Fixed | `src/nickname/rules.mjs` (random, no real names, variant/blocklist). `/auth/nickname-check`. |
| C10 | Start must not go to daily check-in | Fixed | `home.tsx` Start → `/task` (today's step); Mood check-in → `/check-in`. |
| C11 | Save (check-in Save returns Home) | Fixed (verify) | Walk-verified on web per transcript. |
| C12 | Frozen breathe | **Broken** | No breathing animation outside the Hope Node. See A7. |
| C13 | "I'll be there" and "Remind me" stuck | Partial | Buttons live on `app/n/[nodeId].tsx` (Hope Node drops, hidden in demo) and `app/e/[eventId]/index.tsx` (Remind via `src/notify.ts`, mock notifications in Expo Go). Check that the toggle state persists and shows. Real push: 07. |
| C14 | Share with SA | Partial | Strings in `src/voice/copy.ts`, `app/circle/[id]/chat.tsx`, `app/support/share.tsx`. Check that it creates a `supportRequests` doc that OSA sees (demo path: Me → I'd like support, verified). |
| C15 | Dead buttons | Partial | No `onPress={() => {}}` found. Hidden Hope Node entries still visible: `src/components/Nav.tsx` "Leave a node note" → `/n/engineering`, and the `home.tsx` awake-nodes area. **Hide them in demo.** Safety case "assign to counselor" is still "Coming soon" per `docs/PRODUCT_GAPS.md`. Tap every pressable. |
| C16 | Thanks and "Thank them back" | Partial | `/thanks` gives a root. No literal "Thank them back" label in the code: check the inline/Home thanks flow matches the copy. |
| C17 | Organizer-only description | Fixed (verify) | `app/e/[eventId]/index.tsx` organizer-only blocks (walk-verified member vs Chair). |
| C18 | Personalised "You said, we did" | Fixed (verify) | Shows only items the user is involved in, plus university-wide ones. Walk-verified hidden from a non-member. |
| C19 | Inline thread replies | Fixed (verify) | Walk-verified on web. |
| C20 | Going / Join | Fixed (verify) | Discover Going toggle walk-verified. Check Join community → member state. |
| C21 | Remove "Open map" | Fixed | `rg "Open map"` = 0 hits. |
| C22 | Join Circle and message rules | Fixed | `app/c/[circleId]/join.tsx` (shares only name+contact, "Never your plant, mood, Hope Node, DMs or other Circles"). Outgoing checks in `src/moderation/outgoing.ts`. |
| C23 | Kindness cards | Fixed (verify) | Shown to others, not the sender, and a chip reply earns a root (walk-verified). |
| C24 | Plant glow / sway / growth | Partial | Sections A1-A3. |
| C25 | Mode dropdown shifts plant | Partial | B5. |

## D. Other real leftovers found
1. **Two moderation engines**: `src/moderation/*` (severity ladder, EN/AR/Arabizi) and `src/ml/moderation.ts` (older ok/caution/high). Merge them into one.
2. Hope Node entry points are still reachable in the demo (Nav, Home). Hide them behind a flag.
3. `functions/src/index.ts` is a 17-line stub. All "function" logic is in `src/local/handlers.ts` (demo) and `scripts/*-fn.mjs` (old emulator server). The real backend has to be written (07).
4. `tesseract.js` dependency unused. `expo-dev-client` is installed but the demo targets Expo Go.
5. Debounced AsyncStorage persist may drop the last write if the app is killed (B4).
6. Never run on a physical phone. Playwright was web only.
7. From `docs/PRODUCT_GAPS.md`: meetups/live boards/perk logs show empty lists only. Counselor assignment "Coming soon". The 1:1 consent reveal flow isn't covered by a script.

## E. Acceptance checklist (device)
- [ ] A1 glow visible and pulsing on Android + iOS
- [ ] A2 head sways separately from the stem, from its own pivot
- [ ] A3 petal and root grow with animation after each gain, even when earned on another screen
- [ ] A4 THRIVE sequence plays fully on cold start
- [ ] A5 onboarding art animates on first launch
- [ ] A6 flower bar fills and lights each flower
- [ ] A7 breathing animation runs from support and the distress card, and pauses on tap
- [ ] B1-B5 plant logic, persistence after kill/restart, plant doesn't move when the mode changes
- [ ] C1-C25 each re-checked and marked fixed
- [ ] Full `DEMO.md` click path on one phone across all five logins, then Reset works
