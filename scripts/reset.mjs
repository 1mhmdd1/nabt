/**
 * npm run reset — deletes the saved campus (./emulator-data). The next `npm run demo` starts empty.
 * Stop `npm run demo` first, or the running emulators will write the data back on exit.
 */
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const dataDir = path.resolve("emulator-data");
if (!existsSync(dataDir)) {
  console.log("Nothing saved yet. The next npm run demo starts empty.");
} else {
  rmSync(dataDir, { recursive: true, force: true });
  console.log(`Removed ${dataDir}. The next npm run demo starts empty.`);
}
