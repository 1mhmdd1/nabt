# 05: AI integration

Principle: **raw data stays on the phone**. Models run on the device. Only small anonymous signals (category + severity, or "needs care" + nickname) go to the backend. The existing rules (`src/moderation/*`, `src/voice/signals.ts`, `src/voice/care.ts`) stay as the **fallback** when a model isn't available or isn't sure.

**Expo Go can't load native ML runtimes.** Real models need an **EAS dev build** (`expo-dev-client` is already a dependency). Keep the Expo Go demo running with rules only.

All model and library names below are **candidates to verify** (licence, size, RN support, Arabic/Arabizi quality) before you commit to them.

## 1. Message safety (outgoing, before send)
- Categories: harassment, bullying, hate, threats, scams, sharing phone numbers/links/handles, sexual content, self-harm (→ distress flow, not a block).
- Pipeline: `normalize` (Arabic letter forms, Arabizi digits 3/7/2, leetspeak) → regex (phones `03 123 456`, +961, URLs, @handles) → lexicons → **multilingual classifier** → decision (allow / soft warn / block with reason).
- Candidate models: a distilled multilingual toxicity model (e.g. `unitary/multilingual-toxic-xlm-roberta` distilled, or an XLM-R/mMiniLM fine-tune) quantized to int8 ONNX/TFLite. For Arabic/Arabizi, fine-tune on Arabic offensive-language datasets (e.g. OSACT/L-HSAB Levantine) plus a small hand-labelled Arabizi set (extend `src/moderation/labelled.test.ts`).
- Runtime candidates: `onnxruntime-react-native`, `react-native-fast-tflite`, or `react-native-executorch`.
- Target: < 50 ms per message on a mid-range Android, model < 30 MB.
- Server side: Cloud Function re-check on write (rules-only + optional Perspective API / Gemini moderation, **candidate**) for clients that skip the check. Only the verdict is stored.

## 2. Distress detection
- Same classifier with a self-harm/distress head, plus the severity ladder in `src/moderation/classify.ts` (`needs_attention` → private support card only; `concerning`+ → anonymous counted signal; `immediate_danger` → immediate card with Embrace lifeline 1564 and SA contact).
- The card always has **"Not now, I'm okay"**. The message is never uploaded.

## 3. Voice check-in
- Today: `src/voice/signals.ts` computes loudness, steadiness, pause ratio, longest pause and speech/silence → calm/low/tense + confidence (tests 18/18). Audio is deleted after analysis (`retention.ts`).
- Upgrade: on-device speech-emotion/prosody model (candidates: wav2vec2/HuBERT-base SER distilled, or openSMILE eGeMAPS features + a small classifier) via ONNX/TFLite. Optional on-device ASR (whisper.cpp tiny via `whisper.rn`, candidate) for keyword distress. The transcript is discarded too.
- Needs a dev build for raw PCM (candidates: `react-native-audio-api`, `expo-audio` with metering). **Audio is deleted right after analysis and never uploaded.**

## 4. Behavior / care signal
- Inputs (on the phone only): check-in moods, voice readings, distress hits, activity drop-off, late-night use patterns (opt-in).
- `src/voice/care.ts` → care level. Upgrade to a small logistic/GBM model with on-device weights. **Never shown as a number.** Uploads only `{nickname, needsCare: true, ts}` when the threshold is crossed, at most once per window.
- SA sees aggregates (k ≥ 5) plus the opt-in "needs care" list by nickname. Identity is revealed only by the student's choice or the formal reveal process (audited).

## 5. ID OCR
On-device text recognition (candidates: `@react-native-ml-kit/text-recognition` or `react-native-vision-camera` + ML Kit plugin, Latin + Arabic). Parse the ID (year 2019+ + 5 digits), name and faculty. The image is never uploaded and gets deleted. The fields stay editable.

## Privacy guarantees (must hold)
1. Nobody, staff included, can read Circle/DM messages. Rules deny staff read on `messages`.
2. Raw text, audio, images and care scores never leave the phone.
3. Aggregates are hidden below 5.
4. Every identity reveal and role change is audited (`audit`, `privacyLog`).
5. Real names are never shown in anonymous spaces.

## Milestones
- **M0 (now):** 03 sections A-C fixed on device.
- **M1:** Real backend (07) behind `src/live`. `DEMO_LOCAL` fallback still passes.
- **M2:** EAS dev build. On-device OCR.
- **M3:** Message safety model + distress (EN/AR/Arabizi). Rules fallback.
- **M4:** Voice model. Care model.
- **M5:** Push notifications, certificates PDF/verify, alumni.
- **M6:** Hardening: rules tests, load test, privacy review, store builds.

## Acceptance
- [ ] Safety model ≥ 0.9 recall on the labelled set for threats/phones/links, ≤ 5% false blocks on the normal-chat set, in all 3 languages
- [ ] Airplane mode: safety and voice still work (fallback)
- [ ] Network inspector: no message text, audio or care score leaves the device
- [ ] Distress card shows within 1 s. "Not now, I'm okay" dismisses it
- [ ] Voice clip file is gone after the result
- [ ] OCR prefills a real UA ID ≥ 90% of the time and stays editable
