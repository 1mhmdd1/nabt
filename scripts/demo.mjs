/**
 * npm run demo — the campus with NO seeded data.
 *
 * Starts the Auth + Firestore emulators and the local function server (port 5055).
 * Every account you create on a phone is a real account in this database. Data is saved
 * to ./emulator-data when the emulators stop, and loaded again next time.
 *
 *   npm run demo          empty on the very first run, then whatever you created
 *   npm run reset         wipe ./emulator-data
 *   npm run demo:seeded   the old sample campus (Cedar, Exam Week, Rima…), not saved
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const dataDir = path.resolve("emulator-data");
const hasData = existsSync(path.join(dataDir, "firebase-export-metadata.json"));

const args = [
  "-y",
  "firebase-tools",
  "emulators:exec",
  "--only",
  "auth,firestore",
  "--project",
  "demo-nabt",
  "--export-on-exit",
  dataDir,
];
if (hasData) args.push("--import", dataDir);
args.push(process.platform === "win32" ? '"node scripts/dev-fn.mjs"' : "node scripts/dev-fn.mjs");

console.log(hasData ? `Loading your campus from ${dataDir}` : "Starting an empty campus. Accounts you create are saved to ./emulator-data when you stop.");
const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", args, {
  stdio: "inherit",
  env: { ...process.env, NABT_EXPORT_DIR: dataDir },
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    // let the emulators export before they go
    child.kill(sig);
  });
}
