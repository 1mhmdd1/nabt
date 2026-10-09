import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = (nodeId: string) => `nabt-node-session:${nodeId}`;
const HALF_HOUR = 30 * 60 * 1000;

export async function openNodeSession(nodeId: string) {
  const until = Date.now() + HALF_HOUR;
  await AsyncStorage.setItem(KEY(nodeId), String(until));
  return until;
}

export async function nodeSessionUntil(nodeId: string) {
  const raw = await AsyncStorage.getItem(KEY(nodeId));
  const until = Number(raw || 0);
  return until > Date.now() ? until : 0;
}
