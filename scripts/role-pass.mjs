/**
 * Role pass. DEMO_LOCAL web only. Signs in as student, alumni, Chair and Student Affairs and checks
 * that controls which change status, verify, assign a Chair, end an event, issue certificates or
 * write attendance show only to the role that owns them. The server side is covered by npm run test:permissions.
 *   CHROME=/path/to/chrome node scripts/role-pass.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.NABT_WEB || "http://127.0.0.1:8081";
const fails = [];

async function login(page, id, urlPart) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("UA ID").waitFor({ timeout: 30000 });
  await page.getByLabel("UA ID").fill(id);
  await page.getByRole("button", { name: "Send me a sign-in code" }).click();
  await page.waitForURL(/\/signup\/email/, { timeout: 20000 });
  const shown = await page.getByText(/Demo code: \d{6}/).first().innerText({ timeout: 20000 });
  await page.getByLabel("Enter the 6-digit code").fill(shown.match(/\d{6}/)[0]);
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL(urlPart, { timeout: 25000 });
  if (/nickname/.test(page.url())) {
    await page.getByRole("button", { name: /Use this name/ }).click();
    await page.waitForURL(/\/home/, { timeout: 25000 }).catch(() => {});
  }
}

async function text(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  return { url: page.url(), body: await page.locator("body").innerText() };
}

const ORGANIZER = ["End event", "Issue certificates"];
const CHAIR_PAGES = ["/c/robotics/chair", "/c/robotics/announce", "/c/robotics/report", "/c/robotics/host", "/c/robotics/audit", "/c/robotics/roles", "/c/robotics/venue"];
const STAFF_PAGES = ["/staff/overview", "/staff/reviews", "/staff/certificates", "/staff/events/live"];

function expect(cond, msg) {
  if (cond) console.log(`PASS  ${msg}`);
  else { console.log(`FAIL  ${msg}`); fails.push(msg); }
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(20000);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });

  const users = [
    { who: "student", id: "202212826", url: /\/(home|signup\/nickname)/, chair: false, sa: false },
    { who: "alumni", id: "201911457", url: /\/(home|signup\/nickname)/, chair: false, sa: false },
    { who: "chair", id: "202148217", url: /\/home/, chair: true, sa: false },
    { who: "sa", id: "201903318", url: /\/staff/, chair: false, sa: true },
  ];
  for (const u of users) {
    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/auth|session|user/i.test(k)) localStorage.removeItem(k); }).catch(() => {});
    await login(page, u.id, u.url);

    const me = await text(page, "/me");
    expect(!/I’ve graduated|I've graduated/.test(me.body), `${u.who}: no self-graduate on Me`);
    expect(/Offer mentoring/.test(me.body) === (u.who === "alumni"), `${u.who}: Offer mentoring only for alumni`);

    const ev = await text(page, "/e/build-night");
    for (const w of [...ORGANIZER, "Check in", "Scan QR"]) expect(!ev.body.includes(w), `${u.who}: event page has no "${w}"`);

    const ci = await text(page, "/e/build-night/checkin");
    for (const w of ORGANIZER) expect(ci.body.includes(w) === u.chair, `${u.who}: check-in "${w}" ${u.chair ? "shown" : "hidden"}`);

    for (const p of CHAIR_PAGES) {
      const r = await text(page, p);
      const locked = /Student Affairs assigns the Chair\./.test(r.body) || /Only the Chair can assign roles/.test(r.body) || !r.url.includes(p);
      expect(locked === !u.chair , `${u.who}: ${p} ${u.chair ? "open" : "locked"}`);
    }
    for (const p of STAFF_PAGES) {
      const r = await text(page, p);
      expect(r.url.includes("/staff") === u.sa || (!u.sa && !r.url.includes(p)), `${u.who}: ${p} ${u.sa ? "open" : "redirected"}`);
    }

  }
  await browser.close();
  console.log(fails.length ? `FAILED ${fails.length}` : "OK role pass");
  process.exit(fails.length ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
