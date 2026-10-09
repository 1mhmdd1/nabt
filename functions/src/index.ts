/**
 * Cloud Functions skeleton (europe-west1).
 * Milestone 1 runs the UI against local demo data and the Firestore emulator.
 * These names match TECH_STACK so a later deploy does not rename the surface.
 */
export const region = "europe-west1";

export const functionsPlanned = [
  "sendLoginCode",
  "verifyLoginCode",
  "approveStudent",
  "approveStaff",
  "recordGrowth",
  "redeemPerk",
  "nodeCheckIn",
  "ingestSafetySignal",
] as const;
