import * as ImageManipulator from "expo-image-manipulator";
import { postFn } from "./fn";
import type { CardRead } from "./signup";

/** Shrinks the photo so the upload is quick and the text reader gets a sensible size. */
export async function shrinkForUpload(uri: string): Promise<string> {
  const out = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1400 } }], {
    compress: 0.82,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!out.base64) throw new Error("Could not prepare the photo.");
  return out.base64;
}

/**
 * Sends the card photo to the local function server, which reads the printed text and
 * discards the image. Returns empty fields when nothing could be read.
 */
export async function readCard(base64: string): Promise<CardRead & { ok: boolean }> {
  const res = await postFn<{ ok?: boolean; fullName?: string; studentId?: string; faculty?: string }>(
    "/ocr-id",
    { image: base64 },
    { timeoutMs: 90000 },
  );
  const read = { fullName: res.fullName || "", studentId: res.studentId || "", faculty: res.faculty || "" };
  return { ...read, ok: Boolean(res.ok) && Boolean(read.fullName || read.studentId) };
}
