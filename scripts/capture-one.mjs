import { chromium } from "playwright";

const url = process.argv[2];
const out = process.argv[3];
if (!url || !out) {
  console.error("usage: capture-one.mjs <url> <outfile>");
  process.exit(2);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--disable-dev-shm-usage", "--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
page.setDefaultTimeout(45000);
try {
  await page.goto(url, { waitUntil: "load", timeout: 45000 });
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });
  await page
    .waitForFunction(() => document.documentElement.dataset.nabt === "ready", { timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: out, fullPage: false });
  console.log("ok", out);
} finally {
  await browser.close();
}
