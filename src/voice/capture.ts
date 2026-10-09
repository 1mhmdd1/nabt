import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";
import { VOICE_THRESHOLDS, dbFromTimeDomain } from "./signals";

export type VoiceCapture = {
  samples: number[];
  durationMs: number;
  /** True only after the file is gone, or when no file was written (web). */
  deleted: boolean;
};

export type CaptureHandle = {
  stop: () => Promise<VoiceCapture>;
  cancel: () => Promise<void>;
};

export class VoiceCaptureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceCaptureError";
  }
}

/**
 * Record tone levels for at most 30 seconds.
 * Phone: expo-av metering (dB) about every 100 ms. The file is deleted
 * before this returns. It is never uploaded.
 * Web: AnalyserNode only. No MediaRecorder, so there is no audio file.
 */
export async function startVoiceCapture(onLevel: (db: number) => void): Promise<CaptureHandle> {
  if (Platform.OS === "web") return startWeb(onLevel);
  return startNative(onLevel);
}

async function deleteFile(uri: string | null) {
  if (!uri) return true;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    const info = await FileSystem.getInfoAsync(uri);
    return !info.exists;
  } catch {
    return false;
  }
}

async function startWeb(onLevel: (db: number) => void): Promise<CaptureHandle> {
  const media = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  if (!media?.getUserMedia) {
    throw new VoiceCaptureError("This browser has no microphone. You can type instead.");
  }
  let stream: MediaStream;
  try {
    stream = await media.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
  } catch {
    throw new VoiceCaptureError("The microphone is off. You can type instead.");
  }
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) {
    stream.getTracks().forEach((track) => track.stop());
    throw new VoiceCaptureError("This browser can't read a live level. You can type instead.");
  }
  const ctx = new Ctx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);
  const frame = new Float32Array(analyser.fftSize);
  const samples: number[] = [];
  const started = Date.now();
  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(frame);
    const db = dbFromTimeDomain(frame);
    samples.push(db);
    onLevel(db);
  }, VOICE_THRESHOLDS.sampleMs);

  let closed = false;
  async function teardown(keep: boolean): Promise<VoiceCapture> {
    if (closed) return { samples: [], durationMs: 0, deleted: true };
    closed = true;
    clearInterval(timer);
    stream.getTracks().forEach((track) => track.stop());
    try {
      source.disconnect();
    } catch {
      /* already disconnected */
    }
    await ctx.close().catch(() => undefined);
    const kept = keep ? samples.slice() : [];
    samples.length = 0;
    frame.fill(0);
    return { samples: kept, durationMs: Date.now() - started, deleted: true };
  }

  return {
    stop: () => teardown(true),
    cancel: async () => {
      await teardown(false);
    },
  };
}

async function startNative(onLevel: (db: number) => void): Promise<CaptureHandle> {
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) throw new VoiceCaptureError("The microphone is off. You can type instead.");
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  const recording = new Audio.Recording();
  const samples: number[] = [];
  const started = Date.now();
  const preset = Audio.RecordingOptionsPresets.HIGH_QUALITY;
  await recording.prepareToRecordAsync({ ...preset, isMeteringEnabled: true });
  recording.setProgressUpdateInterval(VOICE_THRESHOLDS.sampleMs);
  recording.setOnRecordingStatusUpdate((status) => {
    if (typeof status.metering !== "number" || !Number.isFinite(status.metering)) return;
    samples.push(status.metering);
    onLevel(status.metering);
  });
  await recording.startAsync();

  let closed = false;
  async function teardown(keep: boolean): Promise<VoiceCapture> {
    if (closed) return { samples: [], durationMs: 0, deleted: true };
    closed = true;
    let uri: string | null = null;
    try {
      uri = recording.getURI();
      await recording.stopAndUnloadAsync();
    } catch {
      uri = recording.getURI();
    }
    const deleted = await deleteFile(uri);
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch {
      /* the file is already deleted or was never kept */
    }
    const kept = keep ? samples.slice() : [];
    samples.length = 0;
    return { samples: kept, durationMs: Date.now() - started, deleted };
  }

  return {
    stop: () => teardown(true),
    cancel: async () => {
      await teardown(false);
    },
  };
}
