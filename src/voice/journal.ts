import AsyncStorage from "@react-native-async-storage/async-storage";
import { assessCare, type CareAssessment } from "./care";

const KEY = "nabt.care.journal";

type Journal = {
  heavyAt: number[];
  lowVoice: number;
  declinedSupport: number;
  stepsDone: string[];
};

const empty = (): Journal => ({ heavyAt: [], lowVoice: 0, declinedSupport: 0, stepsDone: [] });

async function read(): Promise<Journal> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Journal;
    return {
      heavyAt: Array.isArray(parsed.heavyAt) ? parsed.heavyAt : [],
      lowVoice: Number(parsed.lowVoice || 0),
      declinedSupport: Number(parsed.declinedSupport || 0),
      stepsDone: Array.isArray(parsed.stepsDone) ? parsed.stepsDone : [],
    };
  } catch {
    return empty();
  }
}

async function write(j: Journal) {
  await AsyncStorage.setItem(KEY, JSON.stringify(j));
}

export async function noteHeavyCheckIn(at = Date.now()) {
  const j = await read();
  j.heavyAt = [...j.heavyAt, at].slice(-14);
  await write(j);
  return assessNow(j);
}

export async function noteLowVoice() {
  const j = await read();
  j.lowVoice += 1;
  await write(j);
  return assessNow(j);
}

export async function noteDeclinedSupport() {
  const j = await read();
  j.declinedSupport += 1;
  await write(j);
  return assessNow(j);
}

export async function noteCareStep(step: "extra_card" | "next_day_checkin") {
  const j = await read();
  if (!j.stepsDone.includes(step)) j.stepsDone.push(step);
  await write(j);
  return assessNow(j);
}

function assessNow(j: Journal, immediateDanger = false): CareAssessment {
  return assessCare({
    now: Date.now(),
    heavyAt: j.heavyAt,
    lowVoice: j.lowVoice,
    declinedSupport: j.declinedSupport,
    stepsDone: j.stepsDone,
    immediateDanger,
  });
}

export async function readCareAssessment(immediateDanger = false) {
  return assessNow(await read(), immediateDanger);
}
