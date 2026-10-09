/**
 * Phone demo walk. DEMO_LOCAL web only. No Firebase, no emulators.
 * Screenshots are written only when the walk passes.
 *   node scripts/demo-walk.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.NABT_WEB || "http://127.0.0.1:8081";
const SHOTS = "/opt/cursor/artifacts/screens-v2";
const blocked = [];
let nick = "";
const results = [];

function pass(name) {
  results.push(name);
  console.log(`PASS  ${name}`);
}

function shotPath(name) {
  return `${SHOTS}/${name}`;
}

async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: shotPath(name), fullPage: false });
  const stat = fs.statSync(shotPath(name));
  if (stat.size < 5000) throw new Error(`${name} looks empty (${stat.size} bytes)`);
  pass(`shot ${name}`);
}

function findText(page, text) {
  const loc = page.getByText(text);
  return loc.locator("visible=true").first();
}

async function setScroll(page, top) {
  await page.evaluate((y) => {
    for (const node of document.querySelectorAll("div")) {
      const style = getComputedStyle(node);
      if ((style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight + 8) {
        node.scrollTop = y;
      }
    }
  }, top);
  await page.waitForTimeout(250);
}

async function scrollTo(page, text) {
  const loc = findText(page, text);
  await loc.waitFor({ state: "visible", timeout: 20000 });
  await loc.evaluate((node) => {
    let el = node.parentElement;
    while (el) {
      const style = getComputedStyle(el);
      const scrollable = (style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 8;
      if (scrollable) {
        const top = node.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop - 16;
        el.scrollTop = Math.max(0, top);
        return;
      }
      el = el.parentElement;
    }
    node.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(250);
}

async function see(page, text, timeout = 20000) {
  try {
    await findText(page, text).waitFor({ state: "visible", timeout });
  } catch (err) {
    const body = await page.locator("body").innerText().catch(() => "");
    throw new Error(`${err.message}\n--- body ---\n${body.slice(0, 1500)}`);
  }
}

async function login(page, email, urlPart) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("UA ID").waitFor({ timeout: 30000 });
  // No password: the @ua.edu.lb part is fixed, a 6-digit code comes back and the demo shows it.
  await page.getByLabel("UA ID").fill(email.split("@")[0]);
  await page.getByRole("button", { name: "Send me a sign-in code" }).click();
  await page.waitForURL(/\/signup\/email/, { timeout: 20000 });
  const shown = await findText(page, /Demo code: \d{6}/).innerText({ timeout: 20000 });
  await page.getByLabel("Enter the 6-digit code").fill(shown.match(/\d{6}/)[0]);
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL(urlPart, { timeout: 25000 });
}

async function switchTo(page, email, urlPart) {
  await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  await page.getByText("Switch account", { exact: true }).click();
  await page.waitForURL(/\/login/, { timeout: 20000 });
  await login(page, email, urlPart);
}

async function main() {
  fs.rmSync(SHOTS, { recursive: true, force: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(20000);
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (/firestore\.googleapis|identitytoolkit|firebaseio\.com|googleapis\.com|127\.0\.0\.1:5055|localhost:5055|:9099\b|:8080\b/.test(url)) {
      blocked.push(url);
      return route.abort();
    }
    return route.continue();
  });

  let ok = false;
  try {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "domcontentloaded" });
    await login(page, "202212826@ua.edu.lb", /\/signup\/nickname/);
    // Nicknames are random only: reroll once, then keep whatever comes up.
    const label = async () => (await page.getByLabel(/^Nickname /).first().getAttribute("aria-label")).slice("Nickname ".length);
    const first = await label();
    await page.getByLabel("Reroll").click();
    nick = await label();
    if (nick === first) throw new Error("Reroll kept the same nickname");
    await page.getByRole("button", { name: "Use this name" }).click();
    await page.waitForURL(/\/home/, { timeout: 20000 });
    pass("student nickname");

    await page.getByRole("button", { name: "Mood check-in" }).click();
    await page.getByText("Okay", { exact: true }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForURL(/\/home/, { timeout: 20000 });
    await see(page, "Sprout");
    await see(page, "1 petal");
    await shot(page, "04-student-checkin-plant.png");

    await page.getByRole("tab", { name: "Discover" }).click();
    await page.getByText("Circles", { exact: true }).click();
    await see(page, "Robotics Society");
    await see(page, "Film Society");
    await see(page, "Debate Club");
    await see(page, "Quiet Hour");
    await page.getByText("Robotics Society", { exact: true }).click();
    await see(page, "Verified");
    await see(page, "Build nights, wiring help");
    await shot(page, "06-robotics-verified.png");
    pass("robotics about");

    await page.getByRole("button", { name: "Join Circle" }).click();
    await see(page, "This community can see your name");
    await page.getByRole("button", { name: "Join community" }).click();
    await see(page, "Joined");
    await scrollTo(page, "Chat");
    await page.getByRole("button", { name: "Circle chat" }).click();
    await see(page, "I'm stuck on the first exercise");
    await page.getByLabel("Share with your circle").fill("text me 03 123 456");
    await page.getByRole("button", { name: "Send" }).click();
    await see(page, "Phone numbers stay off NABT");
    await scrollTo(page, "Someone here could use a hand with this");
    await see(page, "Phone numbers stay off NABT");
    await shot(page, "05-circle-safety-kindness.png");
    await page.getByRole("button", { name: "You've got this" }).click();
    await scrollTo(page, "Thanks");
    await page.getByText("Thanks", { exact: true }).click();
    pass("circle chat");

    await page.goto(`${BASE}/c/robotics`, { waitUntil: "domcontentloaded" });
    await see(page, "Robotics Build Night");
    await page.getByText("Robotics Build Night", { exact: true }).click();
    await see(page, "Robotics Build Night");
    await scrollTo(page, "I’ll go");
    await page.getByText("I’ll go").click();
    await see(page, "You’re going. See you there.");
    await page.goto(`${BASE}/e/build-night`, { waitUntil: "domcontentloaded" });
    await scrollTo(page, "Can’t make it");
    await see(page, "You’re going");
    // A student can only RSVP and set a reminder here. Check-in, End event and certificates belong to the organizer.
    for (const word of ["Scan QR", "End event", "Event check-in", "Issue certificates"]) {
      if (await page.getByText(word, { exact: true }).count()) throw new Error(`Student sees organizer control: ${word}`);
    }
    await page.goto(`${BASE}/e/build-night/checkin`, { waitUntil: "domcontentloaded" });
    await see(page, "Scan the organizer’s QR at the event to check in.");
    pass("student has no self check-in");

    // The Chair shows the QR; the student scans it (the QR opens this link with the code).
    await switchTo(page, "202148217@ua.edu.lb", /\/home/);
    await page.goto(`${BASE}/e/build-night/checkin`, { waitUntil: "domcontentloaded" });
    await see(page, /code [A-Z0-9]{6}/);
    const code = (await findText(page, /code [A-Z0-9]{6}/).innerText()).match(/code ([A-Z0-9]{6})/)[1];
    await switchTo(page, "202212826@ua.edu.lb", /\/home/);
    await page.goto(`${BASE}/e/build-night/checkin?code=${code}`, { waitUntil: "domcontentloaded" });
    await see(page, "You’re on the list for this event.");
    await shot(page, "07-event-checkin.png");
    await switchTo(page, "202148217@ua.edu.lb", /\/home/);
    await page.goto(`${BASE}/e/build-night/checkin`, { waitUntil: "domcontentloaded" });
    await see(page, nick);
    await page.getByRole("button", { name: "End event" }).click();
    await see(page, /Event ended/);
    await switchTo(page, "202212826@ua.edu.lb", /\/home/);
    pass("build night");

    await page.goto(`${BASE}/record`, { waitUntil: "domcontentloaded" });
    await see(page, "Robotics Build Night");
    await see(page, /NB-/);
    await shot(page, "08-my-record-certificate.png");

    await page.goto(`${BASE}/discover`, { waitUntil: "domcontentloaded" });
    await see(page, "You said, we did");
    await see(page, "Later library hours");
    await page.getByRole("button", { name: "Sign Later library hours" }).click();
    await see(page, "25 signatures");
    await scrollTo(page, "You said, we did");
    await see(page, "Quiet rooms during exams");
    await shot(page, "10-petition-you-said.png");
    pass("petition");

    await page.goto(`${BASE}/me`, { waitUntil: "domcontentloaded" });
    await page.getByText("I'd like support", { exact: true }).click();
    await page.getByRole("button", { name: "Just want to talk" }).click();
    await page.getByRole("button", { name: "Send support request" }).click();
    await page.waitForURL(/\/home/, { timeout: 20000 });
    pass("support request");

    await page.goto(`${BASE}/alumni`, { waitUntil: "domcontentloaded" });
    await page.getByText("Nour Saab", { exact: true }).click();
    await see(page, "Class of 2024");
    await see(page, "Joined 2019");
    await page.getByLabel("Message to the mentor").fill("A short chat about a first job");
    await page.getByText("Send request", { exact: true }).click();
    await see(page, "Sent");
    await shot(page, "09-alumni-mentor.png");
    pass("mentor request");

    await switchTo(page, "201903318@ua.edu.lb", /\/staff\/overview/);
    await see(page, "Check-ins");
    await see(page, "49");
    await setScroll(page, 0);
    await shot(page, "02-osa-impact.png");
    await setScroll(page, 9999);
    await see(page, "Exam");
    await shot(page, "01-osa-mood-trends.png");
    pass("osa impact");

    await page.getByRole("tab", { name: "Safety" }).click();
    await see(page, `${nick} · Just want to talk`);
    await scrollTo(page, `${nick} · Just want to talk`);
    await shot(page, "03-osa-support-request.png");
    pass("osa safety");

    await page.goto(`${BASE}/staff/reviews/petitions`, { waitUntil: "domcontentloaded" });
    await see(page, "Later library hours");
    await see(page, "25 signatures");
    pass("osa petition count");

    await page.goto(`${BASE}/staff/announce`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("Title").fill("Library stays open");
    await page.getByLabel("Short note").fill("Until 10 tonight.");
    await page.getByRole("button", { name: "Publish" }).click();
    await see(page, "Library stays open");
    pass("announcement posted");

    await switchTo(page, "202212826@ua.edu.lb", /\/home/);
    await page.goto(`${BASE}/announcements`, { waitUntil: "domcontentloaded" });
    await see(page, "Library stays open");
    pass("student sees announcement");

    await switchTo(page, "201911457@ua.edu.lb", /\/home/);
    await page.goto(`${BASE}/alumni/inbox`, { waitUntil: "domcontentloaded" });
    await see(page, nick);
    await page.getByRole("button", { name: `Accept ${nick}` }).click();
    await page.waitForURL(/\/dm\//, { timeout: 20000 });
    pass("alumni accept");

    await switchTo(page, "admin@ua.edu.lb", /\/admin\/log/);
    await see(page, "Audit");
    await see(page, "Set a role");
    pass("admin");

    await switchTo(page, "202148217@ua.edu.lb", /\/home/);
    await see(page, "Bloom");
    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
    await see(page, "Chair dashboard");
    await page.getByText("Chair dashboard", { exact: true }).click();
    await see(page, "Hi Lara");
    await see(page, "CHAIR");
    await see(page, "Nadine asked to join");
    await scrollTo(page, "Nadine asked to join");
    await see(page, "Mentors");
    await see(page, "Attendance");
    await see(page, "14");
    await shot(page, "11-chair-dashboard.png");
    pass("chair dashboard");

    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
    await page.getByText("Reset demo data", { exact: true }).click();
    await page.waitForURL(/\/login/, { timeout: 20000 });
    await login(page, "202212826@ua.edu.lb", /\/signup\/nickname/);
    pass("reset");

    const body = await page.locator("body").innerText();
    if (/Rohban/i.test(body)) throw new Error("Rohban appeared on screen");
    if (blocked.length) throw new Error(`Network calls leaked: ${blocked.slice(0, 5).join(" | ")}`);
    const expected = [
      "01-osa-mood-trends.png",
      "02-osa-impact.png",
      "03-osa-support-request.png",
      "04-student-checkin-plant.png",
      "05-circle-safety-kindness.png",
      "06-robotics-verified.png",
      "07-event-checkin.png",
      "08-my-record-certificate.png",
      "09-alumni-mentor.png",
      "10-petition-you-said.png",
      "11-chair-dashboard.png",
    ];
    for (const name of expected) {
      const file = shotPath(name);
      if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
    }
    ok = true;
    console.log(`OK  ${results.length} checks, 0 blocked network calls`);
  } finally {
    await browser.close();
    if (!ok) fs.rmSync(SHOTS, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
