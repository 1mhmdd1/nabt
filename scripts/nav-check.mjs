/**
 * Bottom-nav check. DEMO_LOCAL web only. For each role, opens every screen that has the floating nav,
 * scrolls to the bottom and checks that the last piece of content ends above the nav bar.
 *   CHROME=/path/to/chrome node scripts/nav-check.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.NABT_WEB || "http://127.0.0.1:8081";
const fails = [];

async function login(page, id) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("UA ID").waitFor({ timeout: 30000 });
  await page.getByLabel("UA ID").fill(id);
  await page.getByRole("button", { name: "Send me a sign-in code" }).click();
  await page.waitForURL(/\/signup\/email/, { timeout: 20000 });
  const shown = await page.getByText(/Demo code: \d{6}/).first().innerText({ timeout: 20000 });
  await page.getByLabel("Enter the 6-digit code").fill(shown.match(/\d{6}/)[0]);
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForTimeout(3000);
  if (/nickname/.test(page.url())) {
    await page.getByRole("button", { name: /Use this name/ }).click();
    await page.waitForTimeout(2500);
  }
}

/** Scrolls every vertical scroller to the end, then compares the last visible content with the nav bar's top. */
async function check(page, who, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    // The bar is the first ancestor of the Create button that is about as tall as the nav (64px).
    const nav = [...document.querySelectorAll('[aria-label="Create"]')].map((el) => {
      let bar = el;
      while (bar.parentElement && bar.getBoundingClientRect().height < 60) bar = bar.parentElement;
      return bar.getBoundingClientRect();
    }).filter((b) => b.height > 0 && b.height < 90)[0];
    if (!nav) return { skip: true };
    const scrollers = [...document.querySelectorAll("div")].filter((el) => {
      const s = getComputedStyle(el);
      return (s.overflowY === "auto" || s.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 4;
    });
    for (const el of scrollers) el.scrollTop = el.scrollHeight;
    let lowest = 0;
    let what = "";
    const navEl = document.querySelector('[aria-label="Create"]');
    let navWrap = navEl;
    while (navWrap.parentElement && navWrap.getBoundingClientRect().height < 60) navWrap = navWrap.parentElement;
    for (const node of document.querySelectorAll("div,span,input,textarea")) {
      if (node.children.length && node.tagName === "DIV") continue;
      if (navWrap.contains(node) || node.closest('[role="tab"],[role="tablist"],[aria-label="Create"]')) continue;
      const nb = node.getBoundingClientRect();
      if (nb.top >= nav.top && nb.bottom <= nav.bottom && nb.left >= nav.left && nb.right <= nav.right) continue;
      const style = getComputedStyle(node);
      if (style.visibility === "hidden" || style.opacity === "0") continue;
      const b = node.getBoundingClientRect();
      if (!b.height || b.top >= window.innerHeight || b.bottom <= 0) continue;
      // Content clipped by a scroller is not on screen.
      let clipped = false;
      for (let el = node.parentElement; el; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (cs.overflowY === "auto" || cs.overflowY === "scroll" || cs.overflow === "hidden") {
          const box = el.getBoundingClientRect();
          if (b.top >= box.bottom || b.bottom <= box.top) { clipped = true; break; }
        }
      }
      if (clipped) continue;
      const text = (node.innerText || node.getAttribute("aria-label") || node.getAttribute("placeholder") || "").trim();
      if (!text) continue;
      if (b.bottom > lowest) {
        lowest = Math.min(b.bottom, window.innerHeight);
        what = text.slice(0, 40);
      }
    }
    return { navTop: nav.top, lowest, what, scrollers: scrollers.length };
  });
  if (r.skip) return console.log(`SKIP  ${who} ${path} (no nav)`);
  const ok = r.lowest <= r.navTop;
  console.log(`${ok ? "PASS" : "FAIL"}  ${who} ${path}  last "${r.what}" ends ${Math.round(r.lowest)}, nav top ${Math.round(r.navTop)}`);
  if (!ok) fails.push(`${who} ${path}`);
}

const ROUTES = {
  "202212826": ["/home", "/discover", "/chats", "/me", "/announcements", "/alumni", "/circle/exam-week", "/garden", "/care/gentle"],
  "202148217": ["/home", "/c/robotics/chair", "/c/robotics/venue", "/discover", "/me"],
  "201911457": ["/home", "/me", "/alumni"],
  "201903318": [
    "/staff/overview", "/staff/safety", "/staff/safety/care", "/staff/safety/held", "/staff/reviews", "/staff/reviews/petitions",
    "/staff/reviews/meetups", "/staff/reviews/communities", "/staff/reviews/verify", "/staff/events", "/staff/events/requests",
    "/staff/events/venues", "/staff/events/spaces", "/staff/me", "/staff/accommodations", "/staff/you-said", "/staff/certificates",
  ],
};

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(20000);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  for (const [id, routes] of Object.entries(ROUTES)) {
    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await login(page, id);
    for (const path of routes) await check(page, id, path);
  }
  await browser.close();
  console.log(fails.length ? `FAILED ${fails.length}` : "OK nav check");
  process.exit(fails.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
