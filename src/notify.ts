/** Local reminder. Works in Expo Go. The notification stays on this phone. */
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const REMIND_KEY = "nabt.event.reminder.v1";

/** The scheduled reminder id for an event on this phone, or "" when none is set. */
export async function eventReminder(eventId: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(`${REMIND_KEY}.${eventId}`)) || "";
  } catch {
    return "";
  }
}

/** Set or clear the reminder for an event. It fires 30 minutes before the start, or soon if that has passed. */
export async function toggleEventReminder(eventId: string, title: string, whenLabel?: string): Promise<boolean> {
  const current = await eventReminder(eventId);
  if (current) {
    await cancelReminder(current).catch(() => undefined);
    await AsyncStorage.removeItem(`${REMIND_KEY}.${eventId}`).catch(() => undefined);
    return false;
  }
  const start = reminderWhen(whenLabel);
  const early = new Date(start.getTime() - 30 * 60_000);
  const when = early.getTime() > Date.now() + 60_000 ? early : start;
  const id = await scheduleReminder(title, `Starts ${whenLabel || "soon"}.`, when);
  await AsyncStorage.setItem(`${REMIND_KEY}.${eventId}`, id).catch(() => undefined);
  return true;
}
