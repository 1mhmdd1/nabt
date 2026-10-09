/**
 * Final empty-database walk. No screenshots.
 * Requires emulators, the function server, and Expo web.
 *   node scripts/final-walk.mjs
 */
import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const BASE = process.env.NABT_WEB || "http://127.0.0.1:8081";
const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`PASS  ${name}`);
}
function fail(name, err, page) {
  const where = page ? ` @ ${page.url()}` : "";
  results.push({ name, ok: false, err: String(err?.message || err) });
  console.log(`FAIL  ${name}: ${err?.message || err}${where}`);
}

async function codeFrom(page) {
  const demo = page.getByText(/Demo code:/);
  await demo.waitFor({ timeout: 20000 });
  const text = await demo.innerText();
  const code = text.replace(/\D/g, "");
  if (code.length < 6) throw new Error(`No demo code in "${text}"`);
  return code.slice(0, 6);
}

async function signup(page, id, name) {
  await page.goto(`${BASE}/signup/details`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("Edit Full name").first().click();
  await page.getByRole("textbox", { name: "Full name", exact: true }).fill(name);
  await page.getByLabel("Done editing Full name").click();
  await page.getByLabel("Edit ID number").first().click();
  await page.getByRole("textbox", { name: "ID number", exact: true }).fill(id);
  await page.getByLabel("Done editing ID number").click();
  await page.getByRole("button", { name: "Looks right" }).click();
  const code = await codeFrom(page);
  await page.getByLabel("Enter the 6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL(/\/signup\/nickname/, { timeout: 20000 });
  const explore = page.getByRole("button", { name: "Explore while you wait" });
  const useName = page.getByRole("button", { name: "Use this name" });
  const nickDeadline = Date.now() + 25000;
  while (Date.now() < nickDeadline) {
    if (await explore.count()) {
      await explore.click();
      break;
    }
    const notice = page.getByLabel("Nickname notice");
    if (await notice.count()) {
      const text = await notice.innerText();
      if (/real name|already has that name|kinder|student ID|UA email/i.test(text)) {
        await page.getByRole("button", { name: "Reroll" }).click({ timeout: 3000 });
        await page.waitForTimeout(200);
        continue;
      }
      throw new Error(text);
    }
    if ((await useName.count()) && (await useName.getAttribute("aria-disabled")) !== "true") {
      await useName.click();
    }
    await page.waitForTimeout(400);
  }
  await page.waitForURL(/\/home/, { timeout: 20000 });
}

async function promote(email, role) {
  await exec("node", ["scripts/make-role.mjs", email, role], { cwd: "/workspace" });
}

async function logout(page) {
  await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  await page.getByText("Log out", { exact: true }).click();
  await page.waitForURL(/\/login/, { timeout: 20000 });
}

async function login(page, id) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("UA ID").fill(id);
  await page.getByRole("button", { name: "Send me a sign-in code" }).click();
  const code = await codeFrom(page);
  await page.getByLabel("Enter the 6-digit code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  await page.waitForURL(/\/(home|staff|admin)/, { timeout: 20000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(20000);
  const chairId = "202610001";
  const memberId = "202610002";
  const staffId = "202610003";
  const adminId = "202610004";
  const joinerId = "202610005";
  const counselorId = "202610006";
  let robotics = "";
  let quiet = "";
  let gate = "";
  let eventUrl = "";
  let personalPosted = false;

  try {
    await signup(page, chairId, "Lara Chair");
    await promote(`${chairId}@ua.edu.lb`, "student");
    await logout(page);
    await login(page, chairId);
    await page.getByTestId("plant-stem").waitFor({ timeout: 20000 });
    const first = (await page.getByTestId("plant-stem").getAttribute("data-sway")) || (await page.getByTestId("plant-stem").getAttribute("aria-label"));
    await page.waitForFunction((start) => {
      const el = document.querySelector("[data-testid='plant-stem']");
      if (!el) return false;
      const now = el.getAttribute("data-sway") || el.getAttribute("aria-label");
      return Boolean(now && now !== start && now !== "still" && !String(now).includes("still"));
    }, first, { timeout: 5000 });
    pass("Home plant sway");
  } catch (err) {
    fail("Home plant sway", err, page);
  }

  try {
    await page.getByRole("button", { name: /tap to switch mode/ }).click();
    await page.getByLabel("Campus modes").waitFor();
    await page.getByRole("button", { name: "Quiet mode", exact: true }).click();
    await page.getByRole("button", { name: /Quiet mode, tap to switch mode/ }).waitFor();
    pass("Home mode sheet");
  } catch (err) {
    fail("Home mode sheet", err, page);
  }

  try {
    await page.evaluate(() => {
      window.__nabtFocusSeconds = 1;
    });
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.waitForURL(/\/focus/, { timeout: 15000 });
    await page.waitForFunction(() => {
      const btn = [...document.querySelectorAll("[role=button]")].find((el) => (el.textContent || "").trim() === "Done");
      return btn && btn.getAttribute("aria-disabled") !== "true";
    }, null, { timeout: 8000 });
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.waitForURL(/\/home/, { timeout: 15000 });
    await page.waitForFunction(() => {
      const el = document.querySelector("[data-testid='plant-count']");
      return Boolean(el && (el.textContent || "").includes("1 petal"));
    }, null, { timeout: 15000 });
    pass("Start timer to Done earning a petal");
  } catch (err) {
    fail("Start timer to Done earning a petal", err, page);
  }

  try {
    await page.goto(`${BASE}/check-in`);
    const save = page.getByRole("button", { name: "Save", exact: true });
    await save.waitFor();
    if ((await save.getAttribute("aria-disabled")) !== "true") throw new Error("Save started enabled");
    await page.getByRole("button", { name: "Okay", exact: true }).click();
    await save.click();
    await page.getByRole("button", { name: "Saved", exact: true }).waitFor();
    await page.waitForURL(/\/home/, { timeout: 15000 });
    if (page.url().includes("/voice") || page.url().includes("/support")) throw new Error(page.url());
    pass("check-in Save to Home");
  } catch (err) {
    fail("check-in Save to Home", err, page);
  }

  try {
    await page.goto(`${BASE}/circle/new`);
    await page.getByLabel("Circle name").fill("Robotics Lab");
    await page.getByRole("button", { name: "Community", exact: true }).click();
    await page.getByRole("button", { name: "Create Circle" }).click();
    await page.waitForURL(/\/c\//, { timeout: 20000 });
    robotics = new URL(page.url()).pathname.split("/")[2];
    await page.goto(`${BASE}/circle/new`);
    await page.getByLabel("Circle name").fill("Quiet Hour");
    await page.getByRole("button", { name: "Circle", exact: true }).click();
    await page.getByRole("button", { name: "Create Circle" }).click();
    await page.waitForURL(/\/circle\/.+\/chat/, { timeout: 20000 });
    quiet = new URL(page.url()).pathname.split("/")[2];
    await page.goto(`${BASE}/circle/new`);
    await page.getByLabel("Circle name").fill("Gate Club");
    await page.getByRole("button", { name: "Community", exact: true }).click();
    await page.getByRole("button", { name: "Require approval" }).click();
    await page.getByRole("button", { name: "Create Circle" }).click();
    await page.waitForURL(/\/c\//, { timeout: 20000 });
    gate = new URL(page.url()).pathname.split("/")[2];
    await page.goto(`${BASE}/c/${robotics}/host`);
    await page.getByLabel("Event title").fill("Build night");
    await page.getByLabel("Window seconds").fill("600");
    await page.getByRole("button", { name: "Faculty of Engineering node" }).first().click();
    await page.getByRole("button", { name: "Send venue request" }).click();
    await page.getByText("Sent to Student Affairs").waitFor();
    await page.goto(`${BASE}/petition/new`);
    await page.getByLabel("Petition title").fill("Later library hours");
    await page.getByLabel("Petition line").fill("Keep the library open during exams");
    await page.getByRole("button", { name: "Send petition" }).click();
    await page.getByText("Sent to Student Affairs").waitFor();
    await page.goto(`${BASE}/c/${robotics}/chair`);
    await page.getByLabel("Today's prompt").fill("What helps you start?");
    await page.getByRole("button", { name: "Save prompt" }).click();
    await page.getByText("Prompt saved.").waitFor();
    await page.getByRole("button", { name: "Ask to be verified" }).click();
    await page.getByText("Verification request sent.").waitFor();
    pass("setup circles, event, petition, prompt");
  } catch (err) {
    fail("setup circles, event, petition, prompt", err, page);
  }

  try {
    await page.goto(`${BASE}/home`);
    await page.getByText("Faculty of Engineering node is awake").first().waitFor({ timeout: 20000 });
    await page.goto(`${BASE}/n/engineering?view=drop&static=1`);
    await page.getByRole("button", { name: /I.ll be there/ }).click();
    await page.getByText("You're going. See you there.").waitFor();
    await page.getByRole("button", { name: /Can.t make it/ }).waitFor();
    await page.getByRole("button", { name: /Can.t make it/ }).click();
    await page.getByRole("button", { name: /I.ll be there/ }).waitFor();
    await page.getByRole("button", { name: /I.ll be there/ }).click();
    await page.getByRole("button", { name: "Remind me" }).click();
    await page.getByText("Reminder set.").waitFor();
    const reminded = await page.evaluate(() => (window.__nabtReminders || []).length);
    if (!reminded) throw new Error("No mock reminder");
    await page.getByRole("button", { name: "Cancel reminder" }).click();
    await page.getByRole("button", { name: "Remind me" }).waitFor();
    const left = await page.evaluate(() => (window.__nabtReminders || []).length);
    if (left !== 0) throw new Error(`Reminder still stored (${left})`);
    if (!page.url().includes("view=drop")) throw new Error("Drop left the page");
    await page.goto(`${BASE}/home`);
    await page.getByText("You're going").first().waitFor({ timeout: 15000 });
    pass("drop I'll be there / Can't make it and Remind / Cancel");
  } catch (err) {
    fail("drop I'll be there / Can't make it and Remind / Cancel", err, page);
  }

  try {
    await signup(page, memberId, "Fig Member");
    await promote(`${memberId}@ua.edu.lb`, "student");
    await logout(page);
    await login(page, memberId);
    await page.goto(`${BASE}/c/${robotics}/join`);
    await page.getByRole("button", { name: "Join community" }).click();
    await page.getByText("Joined", { exact: true }).first().waitFor({ timeout: 20000 });
    await page.goto(`${BASE}/c/${gate}/join`);
    await page.getByRole("button", { name: "Join community" }).click();
    await page.getByText("Requested. The Chair will approve or decline.").waitFor();
    await page.goto(`${BASE}/circle/${quiet}`);
    await page.getByRole("button", { name: "Join Circle" }).click();
    await page.getByText("Joined", { exact: true }).first().waitFor();
    pass("member joins");
  } catch (err) {
    fail("member joins", err, page);
  }

  try {
    await page.goto(`${BASE}/discover?pill=Events`);
    await page.getByRole("button", { name: "Build night" }).click();
    await page.waitForURL(/\/e\//, { timeout: 15000 });
    eventUrl = page.url();
    await page.getByText("Event check-in").waitFor({ state: "detached", timeout: 3000 }).catch(() => undefined);
    if (await page.getByText("Event check-in").count()) throw new Error("Member sees Event check-in");
    if (await page.getByText("Screen description").count()) throw new Error("Member sees Screen description");
    if (await page.getByText("Issue certificates").count()) throw new Error("Member sees Issue certificates");
    pass("organizer blocks hidden for a member");
  } catch (err) {
    fail("organizer blocks hidden for a member", err, page);
  }

  try {
    await page.goto(`${BASE}/discover?pill=Events`);
    const buildNight = page.getByRole("button", { name: "Build night" });
    try {
      await buildNight.waitFor({ timeout: 8000 });
    } catch {
      await page.goto(`${BASE}/discover?pill=Events`);
      await buildNight.waitFor({ timeout: 15000 });
    }
    await page.getByRole("button", { name: "Going", exact: true }).click();
    await page.getByRole("button", { name: "You're going", exact: true }).waitFor();
    await page.getByRole("button", { name: "You're going", exact: true }).click();
    await page.getByRole("button", { name: "Stop going", exact: true }).click();
    await page.getByRole("button", { name: "Going", exact: true }).waitFor();
    await page.goto(`${BASE}/discover`);
    await page.getByText("What helps you start?").waitFor();
    await page.getByRole("textbox", { name: "Answer" }).fill("A short list");
    await page.getByRole("button", { name: "Post answer" }).click();
    await page.getByText("A short list").waitFor();
    pass("Discover Going toggle and Answer box");
  } catch (err) {
    fail("Discover Going toggle and Answer box", err, page);
  }

  try {
    await page.goto(`${BASE}/circle/${quiet}/chat`);
    await page.getByLabel("Share with your circle").fill("I'm stuck on the first exercise");
    await page.getByLabel("Send").click();
    await page.getByText("I'm stuck on the first exercise").waitFor();
    if (await page.getByText("Someone here could use a hand with this").count()) throw new Error("Sender sees the kindness card");
    await page.goto(`${BASE}/circle/${quiet}`);
    await page.getByLabel("Start a Hope Thread").fill("Need a study buddy");
    await page.waitForFunction(() => {
      const input = document.querySelector("[aria-label='Start a Hope Thread']");
      return input instanceof HTMLInputElement && input.value === "Need a study buddy";
    });
    await page.getByRole("button", { name: "Post thread" }).click();
    const threadPosted = () => {
      const input = document.querySelector("[aria-label='Start a Hope Thread']");
      const composerGone = !(input instanceof HTMLInputElement) || input.value === "";
      return composerGone && (document.body.innerText || "").includes("Need a study buddy");
    };
    try {
      await page.waitForFunction(threadPosted, null, { timeout: 5000 });
    } catch {
      const input = page.getByLabel("Start a Hope Thread");
      if (await input.count()) {
        await input.fill("Need a study buddy");
        await page.getByRole("button", { name: "Post thread" }).click();
      }
      await page.waitForFunction(threadPosted, null, { timeout: 15000 });
    }
    pass("kindness hidden from sender and thread posted");
  } catch (err) {
    fail("kindness hidden from sender and thread posted", err, page);
  }

  try {
    await logout(page);
    await login(page, chairId);
    if (!eventUrl) throw new Error("No event url");
    await page.goto(eventUrl);
    await page.getByText("Event check-in", { exact: true }).waitFor();
    await page.getByText("Screen description", { exact: true }).waitFor();
    await page.getByText("Issue certificates", { exact: true }).waitFor();
    pass("organizer blocks shown for the Chair");
  } catch (err) {
    fail("organizer blocks shown for the Chair", err, page);
  }

  try {
    await page.goto(`${BASE}/circle/${quiet}/chat`);
    await page.getByText("I'm stuck on the first exercise").waitFor();
    await page.getByText("Someone here could use a hand with this").waitFor();
    await page.getByRole("button", { name: "You've got this" }).click();
    await page.getByText("You've got this").waitFor();
    await page.goto(`${BASE}/circle/${quiet}`);
    await page.waitForFunction(() => (document.body.innerText || "").includes("Need a study buddy"), null, { timeout: 15000 });
    await page.getByLabel("Add your reply").fill("I can sit with you");
    await page.waitForFunction(() => {
      const input = document.querySelector("[aria-label='Add your reply']");
      return input instanceof HTMLInputElement && input.value === "I can sit with you";
    });
    await page.getByRole("button", { name: "Post reply" }).click();
    await page.waitForFunction(() => {
      const input = document.querySelector("[aria-label='Add your reply']");
      const cleared = input instanceof HTMLInputElement && input.value === "";
      return cleared && (document.body.innerText || "").includes("I can sit with you");
    }, null, { timeout: 15000 });
    pass("kindness chip and inline thread reply");
  } catch (err) {
    fail("kindness chip and inline thread reply", err, page);
  }

  try {
    await page.goto(`${BASE}/c/${robotics}/members`);
    await page.getByRole("button", { name: /^Member / }).first().waitFor({ timeout: 20000 });
    const members = page.getByRole("button", { name: /^Member / });
    const count = await members.count();
    let opened = false;
    for (let i = 0; i < count; i += 1) {
      await page.goto(`${BASE}/c/${robotics}/members`);
      await page.getByRole("button", { name: /^Member / }).nth(i).click();
      await page.getByRole("button", { name: "Message" }).click();
      try {
        await page.waitForURL(/\/dm\//, { timeout: 5000 });
        opened = true;
        break;
      } catch {
        opened = false;
      }
    }
    if (!opened) throw new Error("Could not open a DM");
    await page.getByRole("textbox", { name: "Message" }).fill("text me 03 123 456");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await page.getByLabel("Message held").filter({ hasText: "Phone numbers stay off NABT" }).waitFor();
    if (await page.getByText("03 123 456").count()) throw new Error("Phone number landed in the thread");
    pass("DM safety blocks a phone number");
  } catch (err) {
    fail("DM safety blocks a phone number", err, page);
  }

  try {
    await logout(page);
    await login(page, memberId);
    await page.goto(`${BASE}/circle/${quiet}/chat`);
    await page.getByText("You've got this").waitFor();
    if (await page.getByText("Someone here could use a hand with this").count()) throw new Error("Card still shown after the reply");
    await page.getByText("Thanks", { exact: true }).click();
    await page.goto(`${BASE}/home`);
    await page.getByText("1 root").first().waitFor({ timeout: 15000 });
    pass("chip reply Thanks earns the sender a root");
  } catch (err) {
    fail("chip reply Thanks earns the sender a root", err, page);
  }

  try {
    await logout(page);
    await login(page, chairId);
    await page.goto(`${BASE}/home`);
    await page.getByText("Someone thanked you").waitFor({ timeout: 15000 });
    await page.getByText("View thread").waitFor();
    await page.getByText("1 root").first().waitFor();
    await page.getByText("View thread").click();
    await page.waitForURL(/\/circle\/.+\/chat/, { timeout: 15000 });
    pass("Thanks from Home with a root for the author");
  } catch (err) {
    fail("Thanks from Home with a root for the author", err, page);
  }

  try {
    await signup(page, staffId, "Rima Affairs");
    await promote(`${staffId}@ua.edu.lb`, "staff");
    await signup(page, counselorId, "Maya Counsel");
    await promote(`${counselorId}@ua.edu.lb`, "staff");
    await logout(page);
    await login(page, staffId);
    await page.goto(`${BASE}/staff/events/venues`);
    await page.getByText("Build night").first().click();
    await page.getByRole("button", { name: "Decline", exact: true }).click();
    await page.getByLabel("Venue notice").filter({ hasText: "Venue declined" }).waitFor();
    pass("SA declines a venue");
  } catch (err) {
    fail("SA declines a venue", err, page);
  }

  try {
    await page.goto(`${BASE}/staff/reviews/communities`);
    await page.getByText(/asked to join Gate Club/).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Decline request" }).click();
    await page.getByLabel("Join notice").filter({ hasText: "Join request declined." }).waitFor();
    pass("SA declines a join request");
  } catch (err) {
    fail("SA declines a join request", err, page);
  }

  try {
    await page.goto(`${BASE}/staff/reviews/petitions`);
    await page.getByText("Later library hours").waitFor();
    await page.getByRole("button", { name: "Decline", exact: true }).click();
    await page.getByLabel("Petition notice").filter({ hasText: "Petition declined." }).waitFor();
    pass("SA declines a petition");
  } catch (err) {
    fail("SA declines a petition", err, page);
  }

  try {
    await page.goto(`${BASE}/staff/you-said`);
    await page.getByLabel("Title").fill("Library lights");
    await page.getByLabel("One line").fill("The library lights stay on later");
    await page.getByLabel("Date · Oct 8").fill("Oct 9");
    await page.getByRole("button", { name: "Post update" }).click();
    await page.getByText("Library lights", { exact: true }).waitFor();
    await page.waitForFunction(() => {
      const input = document.querySelector("[aria-label='Title']");
      return input instanceof HTMLInputElement && input.value === "";
    }, null, { timeout: 10000 });
    await page.getByRole("button", { name: "For everyone" }).click();
    await page.getByLabel("Title").fill("Lab hours moved");
    await page.getByLabel("One line").fill("Robotics lab opens earlier");
    await page.getByLabel("Date · Oct 8").fill("Oct 9");
    await page.getByLabel("Circle id").fill(robotics);
    await page.getByLabel("Reason").fill("Robotics members");
    await page.waitForFunction(() => {
      const title = document.querySelector("[aria-label='Title']");
      const line = document.querySelector("[aria-label='One line']");
      const date = document.querySelector("[aria-label='Date · Oct 8']");
      const circle = document.querySelector("[aria-label='Circle id']");
      return title instanceof HTMLInputElement && title.value === "Lab hours moved"
        && line instanceof HTMLInputElement && line.value === "Robotics lab opens earlier"
        && date instanceof HTMLInputElement && date.value === "Oct 9"
        && circle instanceof HTMLInputElement && circle.value.length > 0;
    }, null, { timeout: 10000 });
    await page.getByRole("button", { name: "Post update" }).click();
    await page.waitForFunction(() => {
      const body = document.body?.innerText || "";
      return body.includes("Lab hours moved") || body.includes("Name the Circle") || body.includes("Add a title") || body.includes("Could not post") || body.includes("Sign in first");
    }, null, { timeout: 15000 });
    const posted = await page.locator("body").innerText();
    if (!posted.includes("Lab hours moved")) throw new Error(posted.slice(0, 500));
    personalPosted = true;
    await page.goto(`${BASE}/staff/reviews/verify`);
    await page.getByText("Robotics Lab").click();
    await page.getByRole("button", { name: "Verify Circle" }).click();
    await page.getByLabel("Verify notice").filter({ hasText: "Circle verified." }).waitFor();
    pass("You said posts and Verified");
  } catch (err) {
    fail("You said posts and Verified", err, page);
  }

  try {
    await logout(page);
    await login(page, memberId);
    await page.goto(`${BASE}/discover`);
    await page.getByText("Library lights", { exact: true }).waitFor({ timeout: 20000 });
    await page.getByText("Lab hours moved", { exact: true }).waitFor();
    await page.getByText("Robotics members").waitFor();
    await page.goto(`${BASE}/discover?pill=Circles`);
    await page.getByText("Verified", { exact: true }).first().waitFor();
    const bg = await page.getByText("Verified", { exact: true }).first().evaluate((el) => getComputedStyle(el.parentElement).backgroundColor);
    if (!bg.includes("207") || !bg.includes("156")) throw new Error(`Badge color ${bg}`);
    await page.goto(`${BASE}/discover?pill=Places`);
    await page.getByText("The map shows places, never people.").waitFor();
    if (await page.getByText("Open map").count()) throw new Error("Open map is still there");
    pass("personal You said, gold Verified badge, no Open map");
  } catch (err) {
    fail("personal You said, gold Verified badge, no Open map", err, page);
  }

  try {
    await signup(page, adminId, "Nabil Admin");
    await promote(`${adminId}@ua.edu.lb`, "admin");
    await logout(page);
    await login(page, adminId);
    if (!personalPosted) throw new Error("Personal update was never posted");
    await page.goto(`${BASE}/discover`);
    await page.getByText("Library lights", { exact: true }).waitFor({ timeout: 20000 });
    await page.waitForTimeout(1500);
    if (await page.getByText("Lab hours moved", { exact: true }).count()) throw new Error("Non-member sees the personal update");
    pass("personal You said hidden from a non-member");
  } catch (err) {
    fail("personal You said hidden from a non-member", err, page);
  }

  try {
    await logout(page);
    await login(page, memberId);
    await page.goto(`${BASE}/support/share`);
    await page.getByRole("button", { name: "Just want to talk" }).click();
    await page.getByRole("button", { name: "Send support request" }).click();
    await page.waitForURL(/\/home/, { timeout: 20000 });
    await logout(page);
    await login(page, staffId);
    await page.goto(`${BASE}/staff/safety`);
    await page.getByRole("button", { name: "Open chat" }).click();
    await page.getByText("Support request").first().waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Assign", exact: true }).first().click();
    await page.getByRole("button", { name: "Assign Maya Counsel" }).click();
    await page.getByLabel("Safety notice").filter({ hasText: "Assigned to Maya Counsel." }).waitFor();
    pass("Assign to counselor");
  } catch (err) {
    fail("Assign to counselor", err, page);
  }

  const bad = results.filter((row) => !row.ok);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  await browser.close();
  if (bad.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
