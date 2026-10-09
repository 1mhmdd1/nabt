# Paste to Claude: read the designs as components, never hardcode their content

The design screens show **examples of real data**, not content to copy. Every name, message, thread, event, number, mood chart, petition, member and date in a mockup is **sample data** showing how the component looks when filled. Earlier, another tool hardcoded mockup content straight into screens (fixed chat messages, fixed threads, fixed names). That must never happen again.

## How to read every screen
For each design screen:
1. **Identify the components.** A Circle Space with posted threads = a `ThreadList` of `ThreadCard`s (author nickname, time, text, thanks/root counts, reply count, inline replies). A chat = a `MessageList` of `MessageBubble`s, plus `KindnessCard` and `DistressCard` variants. An events page = an `EventCard` list. A Student Affairs overview = `StatCard`, `MoodTrendChart`, `PendingList` and so on.
2. **Build the component once**, styled exactly like the design, taking props/data.
3. **Feed it from the data layer** (`src/live/*`: the local store in demo mode, Firebase later), never from literals in the screen file.
4. **Handle every state:** empty (a friendly empty message, e.g. "No threads yet, start one"), loading, one item, many items, long text, Arabic/Arabizi text, and errors.
5. **Make it live:** when a user posts, joins, thanks, RSVPs or checks in, the new item appears through the data layer, and other accounts see it where they should.

## Rules
- **No hardcoded user content in screens or components.** No sample messages, threads, names, counts, dates or chart values inside `app/` or `src/components/`. Grep for mockup strings before finishing.
- **Seed data lives only in the demo seed** (the local-store seed file) and goes through the same data layer as real data. A fresh student account has no chats and no memberships; content comes from what the user does.
- **Numbers are computed** (members, attendance, impact numbers, mood trends, petal and root counts) from stored data, never typed in.
- **Lists are lists:** map over data and never duplicate JSX per item.
- **Text that is UI copy** (labels, buttons, headings, empty states) may be written in code. Text that is **user or university data** may not.
- **Reuse:** one `ThreadCard` is used in every Circle, one `EventCard` everywhere events appear, one `Avatar`/`NicknameChip` across the app.
- **Roles decide what renders:** the same component shows organizer-only controls only to the Chair/organizer, and staff views only to Student Affairs/admin.

## Check before you call it done
- [ ] Wiping demo data gives empty, working screens (no leftover mockup content).
- [ ] Creating a new account and posting/joining/messaging makes the content appear, saved and visible to the right accounts.
- [ ] A grep for mockup sample strings in `app/` and `src/components/` finds none.
- [ ] Every list screen has an empty state and handles long and Arabic text.
- [ ] Report a table: design screen → components used → data source.
