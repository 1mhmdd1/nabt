/**
 * Side-by-side app vs mockup captures for Hope Node and rewards.
 *   node scripts/capture-compare.mjs http://127.0.0.1:43123
 */
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:43123";
const handoff = "/tmp/nabt-handoff/nabt-handoff";
const phone = { width: 390, height: 844 };
const kiosk = { width: 800, height: 480 };

const shots = [
  ["N-01-idle", `${base}/device/engineering?screen=idle&static=1`, `${handoff}/device/screens/N-01-idle.png`, "kiosk-idle", kiosk],
  ["N-02-checkin", `${base}/device/engineering?screen=checkin&static=1`, `${handoff}/device/screens/N-02-checkin.png`, "kiosk-checkin", kiosk],
  ["N-03-photo-hold", `${base}/device/engineering?screen=photo&static=1`, `${handoff}/device/screens/N-03-photo-hold.png`, "kiosk-photo", kiosk],
  ["N-04-breathing", `${base}/device/engineering?screen=breathing&static=1`, `${handoff}/device/screens/N-04-breathing.png`, "kiosk-breathing", kiosk],
  ["N-05-phone", `${base}/device/engineering?screen=phone&static=1`, `${handoff}/device/screens/N-05-phone.png`, "kiosk-phone", kiosk],
  ["N-06-bloom-pulse", `${base}/device/engineering?screen=bloom&static=1`, `${handoff}/device/screens/N-06-bloom-pulse.png`, "kiosk-bloom", kiosk],
  ["N-07-offline", `${base}/device/engineering?screen=offline&static=1`, `${handoff}/device/screens/N-07-offline.png`, "kiosk-offline", kiosk],
  ["N-08-already-checked", `${base}/device/engineering?screen=already&static=1`, `${handoff}/device/screens/N-08-already-checked.png`, "kiosk-already", kiosk],
  ["N-09-unknown-tag", `${base}/device/engineering?screen=unknown&static=1`, `${handoff}/device/screens/N-09-unknown-tag.png`, "kiosk-unknown", kiosk],
  ["N-10-empty-queue", `${base}/device/engineering?screen=empty&static=1`, `${handoff}/device/screens/N-10-empty-queue.png`, "kiosk-empty", kiosk],
  ["12a-node-checkin", `${base}/n/engineering?static=1`, `${handoff}/screens/01-student/12-hope-node-phone/12a-node-checkin.png`, "phone-12a", phone],
  ["12b-node-drop", `${base}/n/engineering?view=drop&static=1`, `${handoff}/screens/01-student/12-hope-node-phone/12b-node-drop.png`, "phone-12b", phone],
  ["12c-leave-note", `${base}/n/engineering?view=note&static=1`, `${handoff}/screens/01-student/12-hope-node-phone/12c-leave-note.png`, "phone-12c", phone],
  ["12d-note-live", `${base}/n/engineering?view=live&static=1`, `${handoff}/screens/01-student/12-hope-node-phone/12d-note-live.png`, "phone-12d", phone],
  ["12e-node-offline", `${base}/n/engineering?view=offline&static=1`, `${handoff}/screens/01-student/12-hope-node-phone/12e-node-offline.png`, "phone-12e", phone],
  ["11a-bloom-moment", `${base}/rewards/bloom?static=1`, `${handoff}/screens/01-student/11-rewards/11a-bloom-moment.png`, "phone-11a", phone],
  ["11b-dedicate", `${base}/rewards/dedicate?static=1`, `${handoff}/screens/01-student/11-rewards/11b-dedicate.png`, "phone-11b", phone],
  ["11c-garden", `${base}/garden?static=1`, `${handoff}/screens/01-student/11-rewards/11c-garden.png`, "phone-11c", phone],
  ["11d-redeem-qr", `${base}/rewards/redeem?static=1`, `${handoff}/screens/01-student/11-rewards/11d-redeem-qr.png`, "phone-11d", phone],
  ["11e-campus-goal", `${base}/campus-goal?static=1`, `${handoff}/screens/01-student/11-rewards/11e-campus-goal.png`, "phone-11e", phone],
  ["11f-vendor-scan", `${base}/rewards/vendor?static=1`, `${handoff}/screens/01-student/11-rewards/11f-vendor-scan.png`, "phone-11f", phone],
  ["11f2-vendor-used", `${base}/rewards/vendor?view=used&static=1`, `${handoff}/screens/01-student/11-rewards/11f2-vendor-used.png`, "phone-11f2", phone],
  ["S-42-name-bloom", `${base}/rewards/name?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-42-name-bloom.png`, "phone-s42", phone],
  ["S-43-badges-sheet", `${base}/badges?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-43-badges-sheet.png`, "phone-s43", phone],
  ["S-44-badge-detail", `${base}/badges/october-bloom?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-44-badge-detail.png`, "phone-s44", phone],
  ["S-45-story-card", `${base}/story?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-45-story-card.png`, "phone-s45", phone],
  ["S-54-nfc-landing", `${base}/n/engineering?view=tap&static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-54-nfc-landing.png`, "phone-s54", phone],
  ["S-58-qr-scanner", `${base}/scan?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-58-qr-scanner.png`, "phone-s58", phone],
  ["S-59-my-notes", `${base}/notes?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-59-my-notes.png`, "phone-s59", phone],
  ["S-60-drop-badge", `${base}/rewards/drop-badge?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-60-drop-badge.png`, "phone-s60", phone],
  ["S-125-lotus-story", `${base}/garden/l3?static=1`, `${handoff}/screens/01-student/18-modes-circles-alumni-safety/S-125-lotus-story.png`, "phone-s125", phone],
  ["01-home", `${base}/home`, `${handoff}/screens/01-student/01-home-core/01-home.png`, "home", phone],
];

const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });

for (const [name, url, mock, screen, view] of shots) {
  const page = await browser.newPage({ viewport: view, deviceScaleFactor: 2 });
  page.setDefaultTimeout(45000);
  const appPath = `/tmp/nabt-app-${name}.png`;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 45000 });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    await page.waitForFunction((expected) => document.body?.dataset.screen === expected || (expected === "home" && document.documentElement.dataset.nabt === "ready"), screen, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: appPath, fullPage: false });
    writeFileSync(`/tmp/nabt-shot-${name}.json`, JSON.stringify({ name, mock, app: appPath }));
    console.log("shot", name);
  } catch (err) {
    console.error("fail", name, err instanceof Error ? err.message : err);
  } finally {
    await page.close();
  }
}

await browser.close();
const composed = spawnSync("python3", ["scripts/composite-compare.py"], { stdio: "inherit" });
if (composed.status) process.exit(composed.status);
