/** Local reminder. Works in Expo Go. The notification stays on this phone. */
import * as Notifications from "expo-notifications";

export async function scheduleReminder(title: string, body: string, when: Date) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  const perm = await Notifications.requestPermissionsAsync();
  if (perm.status !== "granted") throw new Error("Notifications are off for NABT.");
  const delay = Math.max(5, Math.round((when.getTime() - Date.now()) / 1000));
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delay },
  });
  return id;
}

export async function cancelReminder(id: string) {
  if (!id) return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

/** Next 1:00 PM, or one minute from now if that hour has passed and no clock was given. */
export function reminderWhen(label?: string) {
  const match = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(label || "");
  const now = new Date();
  if (!match) {
    const soon = new Date(now.getTime() + 60_000);
    return soon;
  }
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const ampm = (match[3] || "").toLowerCase();
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  if (!ampm && hour <= 7) hour += 12;
  const at = new Date(now);
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= now.getTime() + 15_000) at.setDate(at.getDate() + 1);
  return at;
}
