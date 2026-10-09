# 01: What NABT is (full explanation)

**NABT (نبت, "sprout")** is Antonine University's (UA) verified digital student-life platform, run under the **Office of Student Affairs (SA/OSA)**. It is for UA students and alumni. It goes to the **UA Hackathon 2026 pitch on Saturday 10 Oct 2026**.

---
## 1. The problem at UA
- **Students are disconnected from the university and its services.** Clubs, events, support, petitions and official news are scattered across WhatsApp groups, Instagram pages, posters and word of mouth. Many students don't know what exists, how to join, or how to ask for help. Their extracurricular work leaves no official record.
- **Student Affairs can't understand students without exposing them.** SA needs to know how students are doing (stress around exams, what they want changed, which services work). The only tools are surveys, which are slow and small, or personal conversations, which identify the student. Students don't share honestly when they can be identified.
- **Evidence:** a **28-student survey** run by the team (aggregate results only; no individual answers or contact details are used anywhere).

## 2. The solution and pitch framing
NABT is **one verified place that connects every student to the university and its services**, and lets the university **understand its students through privacy-safe aggregates**, without exposing anyone.

How we say it:
- It's a **student-life platform under SA**, verified with the UA ID and `@ua.edu.lb` email. It is **not social media**: no public feed, no followers, no likes race.
- It is **not monitored chat**. Chats have **"safety built in"**: checks run on the student's phone. **Nobody reads chats**, not even SA. At most an anonymous safety signal leaves the phone, never the message.
- **Wellbeing is one built-in layer** (the plant, check-ins, support), not the headline.

## 3. Roles
| Role | What they do |
|---|---|
| **Student** | Signs up with the UA ID + email, gets a random nickname, grows a plant, checks in, joins Circles and Verified communities, attends events, earns certificates, signs petitions, asks for support, contacts alumni mentors |
| **Student Affairs (OSA)** | Approves accounts and communities, assigns Chairs, approves venue/date requests, reads **aggregates** (mood trend, impact numbers), handles support requests that students chose to send, posts announcements and "You said, we did", issues certificates |
| **Chair** | Leads a Verified community: board and roles, join requests, members, events, attendance, semester report, Chair dashboard |
| **Alumni** | Verified alumni status, lifelong record, mentor profile, accepts mentoring requests |
| **Admin** | Sets SA/admin roles, reads the audit log |

## 4. Features: why each exists and how it works
**Sign-up and identity.** *Why:* only real UA students, and no one judged by name in open spaces. *How:* scan the ID (camera, OCR prefills, all editable) → `@ua.edu.lb` code → SA approval → a **random nickname** that follows the rules (never a real name). The UA ID is the join year (2019 or later) + 5 digits.

**Onboarding + THRIVE loader + gold lotus.** *Why:* a warm first impression and a clear identity. *How:* three intro slides on the **first launch only**. The animated THRIVE loader (word, lotus petals, flame, flower bar) plays on start. The gold lotus is the mark.

**Circles.** *Why:* low-pressure belonging (study, interests, quiet hours). *How:* student-made, anonymous by nickname. Always called "Circle", never "group".

**Verified communities.** *Why:* official clubs need structure and accountability. *How:* gold Verified badge. SA assigns the Chair. The Chair builds the board and roles and approves join requests (members share name + contact only, never plant, mood, DMs or other Circles). Event requests to SA cover **venue + date only**. The Chair dashboard shows members, mentors, attendance and requests.

**Chat with safety built in.** *Why:* safe spaces without surveillance. *How:* before a message is sent, the phone checks for harassment, bullying, hate, threats, scams and phone numbers/links (EN/Arabic/Arabizi), blocks it and shows the reason. **Kindness mini-cards** under a struggling message invite others to help (sender doesn't see it). Helping earns roots.

**Distress support card.** *Why:* reach someone in a hard moment without reporting them. *How:* if a message or check-in signals distress, a private card offers breathing, talking to SA or a lifeline, and always **"Not now, I'm okay"**.

**Plant, check-ins and today's step.** *Why:* a gentle, visual reason to care for yourself and others. *How:* **petals** come from self-care (mood check-in, today's step, voice check-in). **Roots** come from helping (thanks, kindness replies, mentoring). Each part sways on its own, it glows, and growth is animated. Gold appears only on the plant.

**Voice check-in.** *Why:* some people would rather talk than tap. *How:* the phone measures tone (loudness, pauses, steadiness) → calm/low/tense. **The audio is deleted right after**, never uploaded.

**Care level.** *Why:* SA should notice who may need care, without scores or spying. *How:* computed **on the phone**, never shown as a number. Only "needs care" + nickname can reach SA.

**Support requests and Share with SA.** *Why:* an easy door to help. *How:* Me → I'd like support → choose a type → SA sees it by nickname. The real identity is shared only if the student chooses.

**Events → certificates → co-curricular record.** *Why:* participation should count. *How:* RSVP → reminder → check-in → feedback → certificate with a verify code → My record (kept for life).

**Petitions and "You said, we did".** *Why:* students' voice with visible outcomes. *How:* create/sign → SA review → outcome posted. Each student sees only the items they were involved in, plus university-wide ones.

**Announcements, club semester reports, SA impact numbers.** *Why:* official communication and proof of value. *How:* SA posts announcements. Chairs submit semester reports. Impact tiles (check-ins, events, certificates) hide counts of 1-4.

**Alumni mentors + verified alumni status.** *Why:* lifelong connection and guidance. *How:* graduation → Class of YYYY, record kept. Mentor profile. Students send a request, the mentor accepts, and a chat opens.

**Admin roles + audit log.** *Why:* trust. *How:* every role change, Chair change, verification and identity reveal is logged.

## 5. Privacy model
1. Nobody reads chats. Staff have no read access to messages.
2. Raw text, audio, ID photos and care scores stay on the phone.
3. SA sees **aggregates** only, hidden below 5 people.
4. Identity is shown only by the student's choice (support share, 1:1 consent reveal, joining a Verified community). Reveals are audited.
5. Nicknames are never real names. The care level is never a number.
6. Survey: only the aggregate "28-student survey".

## 6. Hackathon demo vs final product
| | Hackathon demo (base `ed031b3`) | Final product |
|---|---|---|
| Data | Phone-only, AsyncStorage, `EXPO_PUBLIC_DEMO_LOCAL=1` | Firebase Auth/Firestore/Functions/Storage/push (07). Demo kept as a fallback |
| Accounts | 5 seeded logins, password `nabt-demo-local` | Real sign-up, `@ua.edu.lb` verified, SA approval |
| ID scan | Camera opens, OCR skipped, sample prefilled | On-device OCR |
| Safety | Rules/lexicons on the phone | On-device multilingual model + rules fallback |
| Voice | Loudness/pause rules | On-device prosody/emotion model (dev build) |
| Push | Mock in Expo Go | Real push |
| Story | Student joins Robotics, attends **Robotics Build Night** (today), gets a certificate. SA sees the request and petition. Alumni accepts a mentee. Chair sees the dashboard | All flows live for the whole campus |

Demo logins: Admin `admin@ua.edu.lb` · SA `201903318@ua.edu.lb` · Student `202212826@ua.edu.lb` · Alumni Nour Saab `201911457@ua.edu.lb` · Robotics Chair Lara Khoury `202148217@ua.edu.lb`.

## 7. Hope Node (future concept, not in the demo)
A campus tablet station. It has two QR modes: **event check-in**, switched on by the organizer during the event window, and **notes / daily check-in**, where students scan to check in and leave an anonymous note. Examples use the **Faculty of Engineering** only. Never write "Rohban Hall". It's presented as the next step.
