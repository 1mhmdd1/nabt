import { useEffect } from "react";
import { Platform } from "react-native";

type Sentinel = { release: () => Promise<void> };

/** Keep a door tablet awake. Browsers may wait for a tap before the lock is granted. */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || Platform.OS !== "web" || typeof navigator === "undefined" || typeof document === "undefined") return;
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<Sentinel> } };
    if (!nav.wakeLock) return;
    let stop = false;
    let current: Sentinel | null = null;
    const arm = () => {
      if (stop || document.visibilityState === "hidden") return;
      void nav.wakeLock!.request("screen")
        .then((lock) => {
          if (stop) void lock.release();
          else current = lock;
        })
        .catch(() => undefined);
    };
    arm();
    const onVis = () => {
      if (document.visibilityState === "visible") arm();
    };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("pointerdown", arm);
    return () => {
      stop = true;
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("pointerdown", arm);
      void current?.release();
    };
  }, [active]);
}
