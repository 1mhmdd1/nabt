import { useEffect, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { SvgXml } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { router } from "expo-router";
import { voiceLotusXml } from "../../art/voiceLotus";
import { useVoiceSafety } from "../../live/voiceSafety";
import { IconBack, IconChevronRight } from "../Icons";
import { Screen } from "../Chrome";
import { C, t } from "../../theme";

export function useScreen<T>(id: string): T | null {
  return useVoiceSafety((s) => {
    const block = s.bundle?.screens?.[id];
    return (block as T) || null;
  });
}

export function Gate({ children }: { children: ReactNode }) {
  const ready = useVoiceSafety((s) => s.ready);
  const error = useVoiceSafety((s) => s.error);
  if (!ready) {
    return (
      <Screen bg={C.ground}>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen bg={C.ground}>
        <Text style={[t(500, 15, 20), { color: C.white, padding: 24 }]}>{error}</Text>
      </Screen>
    );
  }
  return <>{children}</>;
}

export function Top({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.top}>
      <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}>
        <IconBack />
      </Pressable>
      <Text style={styles.h} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function Gold({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.gold}>
      <Text style={[t(700, 16, 16), { color: C.burgundy }]}>{label}</Text>
    </Pressable>
  );
}

export function Outline({ label, onPress, ghost }: { label: string; onPress?: () => void; ghost?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.outline, ghost && styles.ghost]}>
      <Text style={t(600, ghost ? 14 : 15, ghost ? 18 : 18)}>{label}</Text>
    </Pressable>
  );
}

export function WhiteBtn({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={[styles.white, disabled && { opacity: 0.4 }]}
    >
      <Text style={[t(700, 15, 18), { color: C.burgundy }]}>{label}</Text>
    </Pressable>
  );
}

export function PlantLotus({ width = 92, height = 64 }: { width?: number; height?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SvgXml xml={voiceLotusXml} width={width} height={height} />
    </View>
  );
}

export function LockLine({ children }: { children: string }) {
  return (
    <View style={styles.lock}>
      <LockIcon />
      <Text style={styles.lockText}>{children}</Text>
    </View>
  );
}

export function MicIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke="#fff" strokeWidth={1.6} />
      <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="9" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function InfoIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} />
      <Path d="M12 11v5.5M12 7.8v.1" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

const FACES: Record<string, string> = {
  Heavy: "M8.5 16.5c1-1.3 2.2-2 3.5-2s2.5.7 3.5 2M8 9.5l2 .8M16 9.5l-2 .8",
  Tired: "M8 11h2.6M13.4 11H16M9.5 15.5h5",
  Okay: "M9 15h6",
  Lighter: "M9 14.5c.8.8 1.8 1.2 3 1.2s2.2-.4 3-1.2",
  Good: "M8.3 10.5c.4-.7.9-1 1.4-1s1 .3 1.4 1M12.9 10.5c.4-.7.9-1 1.4-1s1 .3 1.4 1M8 13.8c1 1.6 2.3 2.4 4 2.4s3-.8 4-2.4",
};

export function Face({ mood, color = "#fff" }: { mood: string; color?: string }) {
  const d = FACES[mood] || FACES.Okay;
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
      <Path d={d} stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {mood === "Heavy" || mood === "Okay" || mood === "Lighter" ? (
        <>
          <Circle cx="9.3" cy={mood === "Heavy" ? 11.5 : 10.5} r={0.7} fill={color} />
          <Circle cx="14.7" cy={mood === "Heavy" ? 11.5 : 10.5} r={0.7} fill={color} />
        </>
      ) : null}
    </Svg>
  );
}

export function Ripples({ calm }: { calm: boolean }) {
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  const c = useSharedValue(0);
  const calmSv = useSharedValue(calm ? 1 : 0);
  useEffect(() => {
    calmSv.value = calm ? 1 : 0;
    if (calm) {
      a.value = 0;
      b.value = 0;
      c.value = 0;
      return;
    }
    const spin = { duration: 3600, easing: Easing.out(Easing.cubic) };
    a.value = withRepeat(withTiming(1, spin), -1, false);
    const t1 = setTimeout(() => {
      b.value = withRepeat(withTiming(1, spin), -1, false);
    }, 1200);
    const t2 = setTimeout(() => {
      c.value = withRepeat(withTiming(1, spin), -1, false);
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [a, b, c, calm, calmSv]);
  const s1 = useAnimatedStyle(() => ({
    opacity: calmSv.value ? 0.35 : a.value < 0.15 ? a.value * 3 : 0.55 * (1 - a.value),
    transform: [{ scale: calmSv.value ? 1 : 0.75 + a.value * 0.7 }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: calmSv.value ? 0.35 : b.value < 0.15 ? b.value * 3 : 0.55 * (1 - b.value),
    transform: [{ scale: calmSv.value ? 1 : 0.75 + b.value * 0.7 }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: calmSv.value ? 0.35 : c.value < 0.15 ? c.value * 3 : 0.55 * (1 - c.value),
    transform: [{ scale: calmSv.value ? 1 : 0.75 + c.value * 0.7 }],
  }));
  return (
    <>
      <Animated.View style={[styles.rip, s1]} />
      <Animated.View style={[styles.rip, s2]} />
      <Animated.View style={[styles.rip, s3]} />
    </>
  );
}

export function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.sheet} accessibilityRole="summary" accessibilityLabel={title}>
      <View style={styles.grab} />
      <Text style={styles.sheetTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function Chevron() {
  return <IconChevronRight />;
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 8, paddingRight: 12, gap: 6 },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  h: { flex: 1, ...t(600, 17, 22), color: C.white },
  gold: { alignSelf: "stretch", width: "100%", height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  outline: {
    alignSelf: "stretch",
    width: "100%",
    height: 50,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: { borderWidth: 0, height: 40 },
  white: { alignSelf: "stretch", width: "100%", height: 46, borderRadius: 999, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  lock: { marginTop: 14, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  lockText: { flexShrink: 1, ...t(500, 12, 16), color: "rgba(255,255,255,0.7)", textAlign: "center" },
  rip: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: C.card,
  },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginBottom: 14 },
  sheetTitle: { ...t(700, 20, 26), color: C.white },
});
