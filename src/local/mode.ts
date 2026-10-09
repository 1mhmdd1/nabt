/** Phone demo is the default. Set EXPO_PUBLIC_DEMO_LOCAL=0 to use Firebase again. */
export function demoLocal() {
  return process.env.EXPO_PUBLIC_DEMO_LOCAL !== "0";
}

export const DEMO_PASSWORD = "nabt-demo-local";
export const DEMO_CODE = "482913";
