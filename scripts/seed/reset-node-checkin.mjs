/**
 * Clear today's Faculty of Engineering check-in for the demo user.
 * The next live tap can add a petal again. Plant progress is left as it is.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed/reset-node-checkin.mjs
 *
 * To mark today already checked instead:
 *   SEED_TODAY_CHECKIN=1 node scripts/seed/node-rewards.mjs
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-nabt" });
const db = getFirestore();

const day = process.env.CHECKIN_DAY || new Date().toISOString().slice(0, 10);
const id = `checkins/cedar_engineering_${day}`;

await db.doc(id).delete();
console.log(`Cleared ${id}. A tap at Faculty of Engineering can add a petal.`);
