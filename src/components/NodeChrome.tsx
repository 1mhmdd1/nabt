import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { IconBack } from "./Icons";
import { C, t } from "../theme";
import { useNabt } from "../state";

export function useScreenReady(name: string, ready = true) {
  useEffect(() => {
    if (!ready || Platform.OS !== "web") return;
    const doc = globalThis.document;
    if (!doc) return;
    doc.documentElement.dataset.nabt = "ready";
    if (doc.body) doc.body.dataset.screen = name;
  }, [name, ready]);
}

export function BackBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.top}>
      <Pressable accessibilityLabel="Back" onPress={onBack || (() => router.back())} style={styles.icon}>
        <IconBack />
      </Pressable>
      <Text style={t(600, 17, 17)}>{title}</Text>
    </View>
  );
}

export function Kicker({ children }: { children: string }) {
  return <Text style={styles.k}>{children}</Text>;
}

export function GhostButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.ghost}>
      <Text style={[t(600, 15, 15), { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}

export function WhiteChip({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.whiteChip}>
      <Text style={[t(700, 13, 13), { color: C.burgundy }]}>{label}</Text>
    </Pressable>
  );
}

export function OutlineChip({ label }: { label: string }) {
  return (
    <View style={styles.outlineChip}>
      <Text style={[t(600, 11.5, 12), { color: C.white }]}>{label}</Text>
    </View>
  );
}

const BREATH = [
  { label: "Breathe in", ms: 4000, scale: 1 },
  { label: "Hold", ms: 2000, scale: 1 },
  { label: "Breathe out", ms: 6000, scale: 0.72 },
] as const;

/** One breath: grow 4s, hold 2s, shrink 6s. Tap to pause. The words stay inside the ring. */
export function BreathRing({
  size,
  label,
  frozen,
  rings = 2,
}: {
  size: number;
  label?: string;
  frozen?: boolean;
  /** 1 keeps only the outer thin ring. The kiosk breath screen uses that. */
  rings?: 1 | 2;
}) {
  const calm = useNabt((s) => s.calmMode);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<(typeof BREATH)[number]["label"]>("Breathe in");
  const scale = useSharedValue(0.72);
  const pulse = useSharedValue(0);
  const still = frozen || calm;
  useEffect(() => {
    if (still || paused) return;
    pulse.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [paused, pulse, still]);
  useEffect(() => {
    if (still) {
      scale.value = 1;
      return;
    }
    if (paused) return;
    let stop = false;
    let step = 0;
    const run = () => {
      if (stop) return;
      const beat = BREATH[step % BREATH.length];
      setPhase(beat.label);
      scale.value = withTiming(beat.scale, { duration: beat.ms, easing: Easing.inOut(Easing.ease) });
      step += 1;
      const timer = setTimeout(run, beat.ms);
      timers.push(timer);
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    run();
    return () => {
      stop = true;
      timers.forEach(clearTimeout);
    };
  }, [paused, scale, still]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.65, transform: [{ scale: 0.92 + pulse.value * 0.12 }] }));
  const words = label === "" ? "" : phase;
  const font = Math.max(12, Math.min(20, Math.round(size * 0.09)));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={paused ? "Paused. Tap to breathe." : words || "Breathing"}
      onPress={() => {
        if (!still) setPaused((v) => !v);
      }}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View style={[{ position: "absolute", width: size, height: size }, still || paused ? undefined : halo]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          {rings === 2 ? <Circle cx="100" cy="100" r="92" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} /> : null}
          <Circle cx="100" cy="100" r="74" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: "absolute", width: size, height: size }, anim]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Circle cx="100" cy="100" r="56" fill="rgba(255,255,255,0.08)" stroke="#fff" strokeWidth={2.5} />
        </Svg>
      </Animated.View>
      {words ? (
        <Text style={[t(600, font, font + 2), styles.ringLabel, { maxWidth: size * 0.5 }]} numberOfLines={2}>
          {paused ? "Paused" : words}
        </Text>
      ) : null}
    </Pressable>
  );
}

export async function shareCard(title: string) {
  const nav = globalThis.navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
  if (!nav?.share) return;
  try {
    await nav.share({ title: "NABT", text: title });
  } catch {
    /* The sheet was dismissed. */
  }
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 8, gap: 6 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  k: { ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  ghost: {
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  whiteChip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineChip: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.w40,
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabel: { position: "absolute", color: C.white, textAlign: "center" },
});
