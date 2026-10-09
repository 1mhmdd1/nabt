/**
 * Empty-database walk. No screenshots. Requires emulators, functions, and Expo web.
 *   node scripts/empty-walk.mjs
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
function fail(name, err) {
  results.push({ name, ok: false, err: String(err?.message || err) });
  console.log(`FAIL  ${name}: ${err?.message || err}`);
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
  await page.getByRole("button", { name: "Use this name" }).click({ timeout: 20000 });
  await page.getByRole("button", { name: "Explore while you wait" }).click();
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
  let circleId = "";
  let supportId = "";

  try {
    await signup(page, chairId, "Lara Chair");
    pass("create account");
  } catch (err) {
    fail("create account", err);
  }

  try {
    await promote(`${chairId}@ua.edu.lb`, "student");
    await logout(page);
    await login(page, chairId);
    if (!page.url().includes("/home")) throw new Error(page.url());
    pass("approve student and sign in");
  } catch (err) {
    fail("approve student and sign in", err);
  }

  try {
    await page.goto(`${BASE}/circle/new`);
    await page.getByLabel("Circle name").fill("Robotics Lab");
    await page.getByRole("button", { name: "Community", exact: true }).click();
    await page.getByRole("button", { name: "Create Circle" }).click();
    await page.waitForURL(/\/c\//, { timeout: 20000 });
    circleId = new URL(page.url()).pathname.split("/")[2];
    if (!circleId) throw new Error(page.url());
    await page.getByText("Joined", { exact: true }).first().waitFor();
    pass("create community");
  } catch (err) {
    fail("create community", err);
  }

  try {
    await page.goto(`${BASE}/circle/new`);
    await page.getByLabel("Circle name").fill("Quiet Hour");
    await page.getByRole("button", { name: "Circle", exact: true }).click();
    await page.getByRole("button", { name: "Create Circle" }).click();
    await page.waitForURL(/\/circle\/.+\/chat/, { timeout: 20000 });
    await page.getByText("Joined", { exact: true }).first().waitFor();
    const supportPath = new URL(page.url()).pathname;
    supportId = supportPath.split("/")[2];
    const composer = page.getByLabel("Share with your circle");
    await composer.fill("Hello from the Chair");
    await page.getByLabel("Send").click();
    await page.waitForFunction(() => {
      const field = document.querySelector("[aria-label='Share with your circle']");
      return field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement ? field.value === "" : false;
    }, null, { timeout: 20000 });
    await page.getByText("Hello from the Chair").waitFor();
    pass("create Circle and chat");
  } catch (err) {
    fail("create Circle and chat", err);
  }

  try {
    await page.goto(`${BASE}/c/${circleId}/host`);
    await page.getByLabel("Event title").fill("Build night");
    await page.getByLabel("Window seconds").fill("600");
    await page.getByRole("button", { name: "Faculty of Engineering node" }).first().click();
    await page.getByRole("button", { name: "Send venue request" }).click();
    await page.getByText("Sent to Student Affairs").waitFor();
    pass("create event and send venue request");
  } catch (err) {
    fail("create event and send venue request", err);
  }

  try {
    await page.goto(`${BASE}/petition/new`);
    await page.getByLabel("Petition title").fill("Later library hours");
    await page.getByLabel("Petition line").fill("Keep the library open during exams");
    await page.getByRole("button", { name: "Send petition" }).click();
    await page.getByText("Sent to Student Affairs").waitFor();
    pass("create petition");
  } catch (err) {
    fail("create petition", err);
  }

  try {
    await page.goto(`${BASE}/c/${circleId}/chair`);
    await page.getByRole("button", { name: "Ask to be verified" }).click();
    await page.getByText("Verification request sent.").waitFor();
    pass("ask for verification");
  } catch (err) {
    fail("ask for verification", err);
  }

  try {
    await signup(page, memberId, "Fig Member");
    await promote(`${memberId}@ua.edu.lb`, "student");
    await logout(page);
    await login(page, memberId);
    await page.getByLabel(/Your profile, (?!you$)/).waitFor({ timeout: 20000 });
    await page.goto(`${BASE}/c/${circleId}/join`);
    await page.getByText("This community can see your name, UA email and contact info, and your training attendance").waitFor();
    await page.getByRole("button", { name: "Join community" }).click();
    await page.getByText("Joined", { exact: true }).first().waitFor({ timeout: 20000 });
    pass("join community");
  } catch (err) {
    fail("join community", err);
  }

  try {
    await page.goto(`${BASE}/circle/${supportId}`);
    await page.getByRole("button", { name: "Join Circle" }).click();
    await page.getByText("Joined", { exact: true }).first().waitFor();
    await page.getByLabel("Share with your circle").fill("I'm stuck on the first exercise");
    await page.getByLabel("Send").click();
    await page.getByText("I'm stuck on the first exercise").waitFor();
    pass("member chat");
  } catch (err) {
    fail("member chat", err);
  }

  try {
    await logout(page);
    await login(page, chairId);
    await page.goto(`${BASE}/c/${circleId}/roles`);
    await page.waitForFunction(() => {
      const known = ["Vice-Chair", "Events Lead", "Moderator", "Logistics/Tech", "HR/Secretary", "Media", "Treasurer", "Add as mentor", "Save · logged for the board"];
      return [...document.querySelectorAll("[role=button]")].some((button) => {
        const name = (button.textContent || "").trim();
        return name.includes(" ") && !known.some((label) => name.startsWith(label));
      });
    }, null, { timeout: 20000 });
    const chips = page.getByRole("button");
    const count = await chips.count();
    let picked = false;
    for (let i = 0; i < count; i += 1) {
      const name = (await chips.nth(i).innerText()).trim();
      if (name.includes(" ") && !name.startsWith("Save") && !name.startsWith("Add") && !name.startsWith("Events") && !name.startsWith("Vice")) {
        await chips.nth(i).click();
        picked = true;
        break;
      }
    }
    if (!picked) throw new Error("No member to assign");
    await page.getByRole("button", { name: "Events Lead" }).click();
    await page.getByRole("button", { name: "Save roles" }).click();
    await page.getByText("Saved. The board audit log has the change.").waitFor();
    await page.getByRole("button", { name: "Add as mentor" }).click();
    await page.getByText("Mentor added.").waitFor();
    pass("add board role and mentor");
  } catch (err) {
    fail("add board role and mentor", err);
  }

  try {
    await signup(page, staffId, "Rima Affairs");
    await promote(`${staffId}@ua.edu.lb`, "staff");
    await logout(page);
    await login(page, staffId);
    if (!page.url().includes("/staff")) throw new Error(`staff landed on ${page.url()}`);
    await page.goto(`${BASE}/staff/events`);
    await page.getByText("Build night").first().waitFor({ timeout: 20000 });
    pass("node schedule lists the event");
  } catch (err) {
    fail("node schedule lists the event", err);
  }

  try {
    await page.goto(`${BASE}/staff/events/venues`);
    await page.getByText("Build night").first().click();
    await page.getByRole("button", { name: /Approve/ }).click();
    await page.getByText("Venue approved. The Chair is notified.").waitFor();
    await page.getByLabel("Venue reply").fill("Hall is yours.");
    await page.getByRole("button", { name: "Send reply" }).click();
    await page.getByText("Reply sent to the Chair.").waitFor();
    pass("SA approves venue and replies");
  } catch (err) {
    fail("SA approves venue and replies", err);
  }

  try {
    await page.goto(`${BASE}/staff/reviews/petitions`);
    await page.getByText("Later library hours").waitFor();
    await page.getByText("Publish", { exact: true }).click();
    pass("SA publishes petition");
  } catch (err) {
    fail("SA publishes petition", err);
  }

  try {
    await page.goto(`${BASE}/staff/reviews/verify`);
    await page.getByText("Robotics Lab").click();
    await page.getByRole("button", { name: "Verify Circle" }).click();
    await page.getByText("Circle verified.").waitFor();
    pass("SA verifies community");
  } catch (err) {
    fail("SA verifies community", err);
  }

  try {
    await logout(page);
    await login(page, chairId);
    await page.goto(`${BASE}/c/${circleId}/chair`);
    await page.getByLabel("Venue approved").waitFor({ timeout: 20000 });
    await page.goto(`${BASE}/circle/${circleId}/chat`);
    await page.getByText(/Student Affairs approved the venue/).waitFor({ timeout: 20000 });
    pass("Chair is notified");
  } catch (err) {
    fail("Chair is notified", err);
  }

  try {
    await page.goto(`${BASE}/device/engineering`);
    await page.getByLabel("Event mode").waitFor({ timeout: 20000 });
    await page.getByLabel("Node schedule").waitFor();
    const codeLabel = page.getByLabel(/Node code /);
    await codeLabel.waitFor();
    const token = ((await codeLabel.getAttribute("aria-label")) || "").replace("Node code ", "");
    pass("node enters event mode inside the window");
    await page.goto(`${BASE}/c/${circleId}/node`);
    await page.getByRole("button", { name: "End event mode" }).click();
    await page.goto(`${BASE}/device/engineering`);
    await page.getByLabel("Hope Node").waitFor({ timeout: 20000 });
    pass("Chair ends event mode inside the window");
    await page.goto(`${BASE}/c/${circleId}/node`);
    await page.getByRole("button", { name: "Show on the node" }).first().click();
    await page.goto(`${BASE}/device/engineering`);
    await page.getByLabel("Event mode").waitFor({ timeout: 20000 });
    pass("Chair starts event mode inside the window");
    await page.goto(`${BASE}/c/${circleId}/node`);
    await page.getByRole("button", { name: "End event mode" }).click();
    await page.goto(`${BASE}/device/engineering`);
    await page.getByLabel("Hope Node").waitFor({ timeout: 20000 });
    globalThis.__token = token;
  } catch (err) {
    fail("node event mode window", err);
  }

  try {
    await page.goto(`${BASE}/c/${circleId}/host`);
    await page.getByLabel("Event title").fill("Short lab");
    await page.getByLabel("Window seconds").fill("20");
    await page.getByRole("button", { name: "Send venue request" }).click();
    await page.getByText("Sent to Student Affairs").waitFor();
    await logout(page);
    await login(page, staffId);
    await page.goto(`${BASE}/staff/events/venues`);
    await page.getByText("Short lab").first().click();
    await page.getByRole("button", { name: /Approve/ }).click();
    await page.getByText("Venue approved").waitFor();
    await logout(page);
    await login(page, chairId);
    await page.goto(`${BASE}/device/engineering`);
    await page.getByLabel("Event mode").waitFor({ timeout: 25000 });
    await page.getByLabel("Hope Node").waitFor({ timeout: 45000 });
    const fresh = page.getByLabel(/Node code /);
    await fresh.waitFor();
    globalThis.__token = ((await fresh.getAttribute("aria-label")) || "").replace("Node code ", "");
    pass("node returns to Hope Node after the window");
  } catch (err) {
    fail("node returns to Hope Node after the window", err);
  }

  try {
    const token = globalThis.__token;
    if (!token) throw new Error("No node code");
    await page.goto(`${BASE}/n/engineering`);
    await page.getByText("Scan the node").first().waitFor();
    await page.getByLabel("Node code").fill(token);
    await page.getByRole("button", { name: "Check in" }).click();
    await page.getByText("Checked in at Faculty of Engineering").first().waitFor({ timeout: 20000 });
    await page.getByText("Leave a note").click();
    await page.getByLabel("Node note, up to 80 characters").fill("The lab is calm today");
    await page.getByRole("button", { name: "Send to the node" }).click();
    await page.getByText("“The lab is calm today”").waitFor();
    pass("check in and leave a note");
  } catch (err) {
    fail("check in and leave a note", err);
  }

  try {
    await page.goto(`${BASE}/support/share`);
    await page.getByRole("button", { name: "Stress or exams" }).click();
    await page.getByLabel("Support note").fill("Could use a quiet talk");
    await page.getByLabel("Preview request").click();
    await page.getByLabel("Support preview").waitFor();
    await page.getByRole("button", { name: "Send support request" }).click();
    await page.waitForURL(/\/home/, { timeout: 20000 });
    await logout(page);
    await login(page, staffId);
    await page.goto(`${BASE}/staff/safety`);
    await page.getByLabel(/Support stress/).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Open chat" }).click();
    await page.getByLabel("Support reply").fill("We can talk whenever you are ready.");
    await page.getByRole("button", { name: "Send reply" }).click();
    await page.getByText("Reply sent.").waitFor();
    pass("support request and SA reply");
  } catch (err) {
    fail("support request and SA reply", err);
  }

  try {
    await logout(page);
    await login(page, memberId);
    await page.goto(`${BASE}/circle/${supportId}/chat`);
    await page.getByText("Hello from the Chair").waitFor();
    await page.getByRole("button", { name: "Report message" }).click();
    await page.getByText("Report sent").waitFor();
    await logout(page);
    await login(page, staffId);
    await page.goto(`${BASE}/staff/safety`);
    await page.getByLabel("Report").first().waitFor({ timeout: 20000 });
    pass("report reaches Student Affairs");
  } catch (err) {
    fail("report reaches Student Affairs", err);
  }

  try {
    await signup(page, adminId, "Nabil Admin");
    await promote(`${adminId}@ua.edu.lb`, "admin");
    await logout(page);
    await login(page, adminId);
    if (!page.url().includes("/admin/log")) throw new Error(page.url());
    await page.getByRole("button", { name: "Role changes" }).click();
    await page.getByText(/Role set to admin/).waitFor();
    await page.getByRole("button", { name: "Identity reveals" }).click();
    await page.getByText("No entries yet").waitFor();
    pass("admin audit log");
  } catch (err) {
    fail("admin audit log", err);
  }

  await browser.close();
  const bad = results.filter((row) => !row.ok);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  if (bad.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
