# NABT phone test (branch fix/demo-checklist)

## Setup (on a laptop on the same Wi-Fi as the phone)
```
git fetch origin
git checkout fix/demo-checklist
echo EXPO_PUBLIC_DEMO_LOCAL=1 > .env
npm install
npx expo start
```
Scan the QR code with **Expo Go (SDK 52)**. If the phone can't connect, try `npx expo start --tunnel`.
Password for every account: `nabt-demo-local`. Start with Settings → Reset demo data if you've used the app before.

## What to check (tick each one and note anything wrong)
**Startup**
- [ ] A4/A6: Close the app fully, then open it. THRIVE fades in, the lotus blooms, and the gold line fills while each little flower lights up, all before the next screen.
- [ ] A5: Settings → "Show the intro again". The sprout draws and the leaves grow on the intro slides.

**Plant (student `202212826@ua.edu.lb`, pick any nickname)**
- [ ] A1: The plant has a soft gold glow behind the flower that slowly pulses.
- [ ] A2: The stem sways from the water line, and the flower bends a bit more and a bit later, like a flexible tip.
- [ ] At 0 petals it is a closed bud.
- [ ] A3/B1: Mood check-in → Okay → Save. Back on Home, a petal grows out with an animation and the caption says 1 petal.
- [ ] B1: Do a second mood check-in. No extra petal (one per day). "Start" (today's step) gives its own petal.
- [ ] B4: Kill the app right after a check-in and reopen it. The petal is still there.
- [ ] B5: Change the mode (Exam / Quiet / Study). The plant doesn't move.

**Support and breathing**
- [ ] A7/C12: Me → I'd like support, or the support card → "Breathe…". The ring grows and shrinks (in 4, hold 2, out 6), and tapping pauses it.
- [ ] The support card shows its text, not "Voice and safety copy is not seeded yet."
- [ ] C14: Me → I'd like support → Just want to talk → Send. Then switch to Student Affairs (`201903318@ua.edu.lb`) → Safety shows it by nickname.

**Events**
- [ ] C13: Discover → an event → "I'll go" → "Remind me". Allow notifications. Leave the screen and come back: it still says "You're going" and "Reminder set".

**Roots**
- [ ] B2: In the Robotics chat, reply "You've got this" to Rana's message (kindness card). Back on Home, a new root draws in.
- [ ] B2: As Nour (`201911457@ua.edu.lb`), Mentor inbox → Accept. Nour's plant gets a root.

**Menu**
- [ ] C15: The center (+) menu no longer has "Leave a node note".

Then walk the full DEMO.md path once across all five logins.
