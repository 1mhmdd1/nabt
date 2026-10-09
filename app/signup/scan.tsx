import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { SvgXml } from "react-native-svg";
import { SignupScreen } from "../../src/components/Signup";
import { GoldButton } from "../../src/components/Chrome";
import { IconLock } from "../../src/components/Icons";
import { sampleSignup } from "../../src/local/ids";
import { useSignup } from "../../src/signup";
import { C, t } from "../../src/theme";

const web = Platform.OS === "web";

/** Placeholder card shown on the web, where a photo is chosen instead of taken. */
const idCard = `<svg viewBox="0 0 182 290" xmlns="http://www.w3.org/2000/svg">
  <rect width="182" height="290" rx="14" fill="#F3ECE6"/>
  <rect width="182" height="44" rx="14" fill="#5A2222"/><rect y="28" width="182" height="16" fill="#5A2222"/>
  <rect x="46" y="15" width="90" height="6" rx="3" fill="#fff" opacity=".85"/><rect x="63" y="26" width="56" height="4" rx="2" fill="#fff" opacity=".5"/>
  <rect x="51" y="60" width="80" height="98" rx="10" fill="#D9CCC3"/>
  <circle cx="91" cy="96" r="16" fill="#C9B8AD"/><path d="M63 156c3-20 15-29 28-29s25 9 28 29z" fill="#C9B8AD"/>
  <rect x="31" y="174" width="120" height="9" rx="4.5" fill="#411515" opacity=".75"/>
  <rect x="49" y="191" width="84" height="7" rx="3.5" fill="#411515" opacity=".35"/>
  <rect x="41" y="210" width="100" height="9" rx="4.5" fill="#411515" opacity=".7"/>
  <rect x="56" y="226" width="70" height="6" rx="3" fill="#411515" opacity=".3"/>
</svg>`;

const torchIcon = (on: boolean) =>
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5 2.5h7v3l-2 3v9h-3v-9l-2-3z" stroke="${on ? "#411516" : "#fff"}" stroke-width="1.5" stroke-linejoin="round"/><path d="M8.5 11.5h3" stroke="${on ? "#411516" : "#fff"}" stroke-width="1.5" stroke-linecap="round"/></svg>`;

type Phase = "camera" | "reading";

export default function Scan() {
  const [perm, requestPerm] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [phase, setPhase] = useState<Phase>("camera");
  const [cameraReady, setCameraReady] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const cam = useRef<CameraView>(null);
  const busy = useRef(false);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!perm || perm.granted || web) return;
    if (perm.canAskAgain) void requestPerm();
  }, [perm, requestPerm]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: !web }),
        Animated.timing(sweep, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: !web }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  function prefillSample() {
    useSignup.getState().setRead(sampleSignup(), "done");
    router.replace("/signup/details" as never);
  }

  async function handleImage(_uri: string) {
    setPhase("reading");
    useSignup.getState().setReading("reading");
    prefillSample();
  }

  async function capture() {
    if (busy.current || !cam.current || !cameraReady) return;
    busy.current = true;
    setNote(null);
    try {
      const photo = await cam.current.takePictureAsync({ quality: 0.75 });
      if (!photo?.uri) throw new Error("no photo");
      await handleImage(photo.uri);
    } catch {
      setNote("The photo did not come through. Try again, or use a photo from your gallery.");
      setPhase("camera");
    } finally {
      busy.current = false;
    }
  }

  async function pick() {
    if (busy.current) return;
    busy.current = true;
    setNote(null);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
      const uri = res.canceled ? null : res.assets?.[0]?.uri;
      if (uri) await handleImage(uri);
    } catch {
      setNote("That photo could not be opened.");
    } finally {
      busy.current = false;
    }
  }

  const granted = Boolean(perm?.granted);
  const reading = phase === "reading";

  return (
    <SignupScreen step="1 of 5" bg="#1F0809" onBack={() => router.replace("/onboarding?step=3" as never)}>
      <Text style={styles.h1}>Fit your UA card in the frame</Text>
      <Text style={styles.lead}>Hold it upright · front side, flat, in good light.</Text>

      <View style={styles.frameWrap}>
        <View style={styles.frame}>
          {web ? (
            <View style={styles.webCard}>
              <SvgXml xml={idCard} width={160} height={255} />
            </View>
          ) : granted ? (
            <CameraView
              ref={cam}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              onCameraReady={() => setCameraReady(true)}
              animateShutter={false}
            />
          ) : (
            <View style={styles.permission}>
              <Text style={[t(600, 15, 20), { color: C.white, textAlign: "center" }]}>NABT needs the camera to read your card.</Text>
              <Text style={[t(400, 13, 18), { color: C.w64, textAlign: "center", marginTop: 8 }]}>
                {perm && !perm.canAskAgain ? "Allow the camera for Expo Go in your phone settings, or use a photo instead." : "The photo is read once and then deleted."}
              </Text>
              {perm?.canAskAgain !== false ? (
                <Pressable style={styles.allow} onPress={() => void requestPerm()} accessibilityRole="button">
                  <Text style={[t(600, 14, 14), { color: C.white }]}>Allow camera</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          <Corner style={{ top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 }} />
          <Corner style={{ top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 }} />
          <Corner style={{ bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 }} />
          <Corner style={{ bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 }} />
          {granted && !web && !reading ? (
            <Animated.View
              style={[
                styles.sweep,
                { transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [-140, 140] }) }] },
              ]}
            />
          ) : null}
          {reading ? (
            <View style={styles.readingCard}>
              <ActivityIndicator color={C.gold} />
              <Text style={[t(600, 14, 18), { color: C.white, marginTop: 10 }]}>Reading your card…</Text>
              <Text style={[t(400, 12, 16), { color: C.w64, marginTop: 4, textAlign: "center" }]}>A few seconds. The photo is deleted right after.</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.status}>
        {reading
          ? "Reading your card…"
          : note
            ? note
            : web
              ? "Choose a photo of the front of your card."
              : granted
                ? "Line the card up, then take the photo."
                : "Waiting for camera access."}
      </Text>

      <View style={styles.foot}>
        {web ? (
          <GoldButton label="Continue" onPress={() => prefillSample()} />
        ) : (
          <GoldButton label="Take photo" onPress={() => void capture()} />
        )}
        {web ? (
          <Pressable disabled={reading} onPress={() => void pick()} style={styles.alt} accessibilityRole="button">
            <Text style={[t(600, 13.5, 14), { color: C.w80, textDecorationLine: "underline" }]}>Choose a photo</Text>
          </Pressable>
        ) : null}
        <View style={styles.row}>
          {!web ? (
            <Pressable
              accessibilityLabel="Torch"
              accessibilityRole="switch"
              accessibilityState={{ checked: torch }}
              disabled={!granted || reading}
              onPress={() => setTorch((v) => !v)}
              style={[styles.torch, torch && styles.torchOn, (!granted || reading) && { opacity: 0.5 }]}
            >
              <SvgXml xml={torchIcon(torch)} width={20} height={20} />
              <Text style={[t(600, 13.5, 14), { color: torch ? C.burgundy : C.white }]}>{torch ? "Torch on" : "Torch"}</Text>
            </Pressable>
          ) : null}
          {!web ? (
            <Pressable disabled={reading} onPress={() => void pick()} style={styles.alt} accessibilityRole="button">
              <Text style={[t(600, 13.5, 14), { color: C.w80, textDecorationLine: "underline" }]}>Use a photo instead</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.note}>
          <IconLock size={14} color={C.w64} />
          <Text style={[t(500, 12, 16), { color: C.w64 }]}>Only a staff reviewer sees your ID card.</Text>
        </View>
      </View>
    </SignupScreen>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[styles.corner, style]} />;
}

const styles = StyleSheet.create({
  h1: { ...t(600, 26, 31), color: C.white, letterSpacing: -0.26, textAlign: "center" },
  lead: { marginTop: 8, ...t(400, 15, 22), color: C.w80, textAlign: "center" },
  frameWrap: { marginTop: 18, alignItems: "center" },
  frame: {
    width: 222,
    height: 336,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#120405",
  },
  webCard: { transform: [{ rotate: "-2deg" }] },
  permission: { paddingHorizontal: 18, alignItems: "center" },
  allow: {
    marginTop: 14,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.w80,
    alignItems: "center",
    justifyContent: "center",
  },
  corner: { position: "absolute", width: 30, height: 30, borderColor: C.white },
  sweep: { position: "absolute", left: 14, right: 14, top: "50%", height: 1.5, backgroundColor: "rgba(255,255,255,0.55)" },
  readingCard: {
    position: "absolute",
    left: 16,
    right: 16,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(36,9,10,0.92)",
    alignItems: "center",
  },
  status: { marginTop: 16, ...t(500, 13, 18), color: C.w80, textAlign: "center", minHeight: 36 },
  foot: { marginTop: "auto", paddingBottom: 40, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
  torch: {
    height: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.w40,
    alignItems: "center",
    justifyContent: "center",
  },
  torchOn: { backgroundColor: C.white, borderColor: C.white },
  alt: { height: 40, justifyContent: "center" },
  note: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
});
