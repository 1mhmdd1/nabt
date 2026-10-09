import { getFirebase } from "./firebase";
import { FnError } from "./fn-error";
import { handleFn } from "./local/handlers";
import { demoLocal } from "./local/mode";

export { FnError };

/** Base URL of the local function server (scripts/dev-fn.mjs). On a phone this is the PC's LAN address. */
export function fnUrl() {
  return process.env.EXPO_PUBLIC_FN_URL || "http://127.0.0.1:5055";
}

/**
 * POST JSON to the function server. Sends the signed-in user's ID token when there is one,
 * so the server can tell who is asking. Throws FnError with the server's code and message.
 */
export async function postFn<T = Record<string, unknown>>(path: string, body: unknown, opts: { timeoutMs?: number } = {}): Promise<T> {
  // The card read is the one call that leaves the phone in demo mode: the text reader runs on the function server.
  if (demoLocal() && path !== "/ocr-id") {
    return handleFn(path, body) as Promise<T>;
  }
  const headers: Record<string, string> = { "content-type": "application/json" };
  try {
    const { auth } = getFirebase();
    const token = await auth.currentUser?.getIdToken();
    if (token) headers.authorization = `Bearer ${token}`;
  } catch {
    /* not signed in */
  }
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000) : null;
  let res: Response;
  try {
    res = await fetch(`${fnUrl()}${path}`, { method: "POST", headers, body: JSON.stringify(body), signal: controller?.signal });
  } catch (err) {
    throw new FnError(0, "offline", err instanceof Error ? err.message : "Could not reach the server.");
  } finally {
    if (timer) clearTimeout(timer);
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    throw new FnError(res.status, String(data.code || "error"), String(data.message || data.error || text || `Request failed (${res.status})`));
  }
  return data as T;
}
