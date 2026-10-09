import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { IconBack } from "../components/Icons";
import { C, t } from "../theme";

/** Gold chip for Verified only: Student Affairs verified this community. Small caps, burgundy on gold. */
export function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function SubHead({ title, onBack, chip, chipGold = true }: { title: string; onBack?: () => void; chip?: string; chipGold?: boolean }) {
  return (
    <View style={styles.top}>
      <Pressable accessibilityLabel="Back" onPress={onBack || (() => router.back())} style={styles.icon}>
        <IconBack />
      </Pressable>
      <Text style={styles.h} numberOfLines={1}>{title}</Text>
      {chip ? (chipGold ? <View style={{ marginRight: 16 }}><Badge label={chip.replace(/^✓\s*/, "")} /></View> : (
        <View style={styles.chipLine}>
          <Text style={[t(700, 10, 12), { color: C.white }]}>{chip}</Text>
        </View>
      )) : null}
    </View>
  );
}

export function Card({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  if (onPress) {
    return <Pressable onPress={onPress} style={styles.card}>{children}</Pressable>;
  }
  return <View style={styles.card}>{children}</View>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.k}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function WhiteButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.white}>
      <Text style={[t(700, 13.5, 16), { color: C.burgundy }]}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ letter, small }: { letter: string; small?: boolean }) {
  return (
    <View style={[styles.av, small && styles.avSm]}>
      <Text style={[t(600, small ? 10 : 14, small ? 12 : 16), { color: C.gold }]}>{letter}</Text>
    </View>
  );
}

export const ui = StyleSheet.create({
  pad: { paddingHorizontal: 20, paddingBottom: 48, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.w40,
  },
});

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 8, gap: 4 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  h: { ...t(600, 17, 22), color: C.white, flex: 1 },
  badge: {
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...t(700, 10, 12), letterSpacing: 0.6, textTransform: "uppercase", color: C.burgundy },
  chipGold: {
    marginRight: 16,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLine: {
    marginRight: 16,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: { backgroundColor: C.raised, borderRadius: 22, padding: 16 },
  k: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  muted: { ...t(500, 12.5, 17), color: C.w64 },
  white: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  av: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.deep,
    borderWidth: 1,
    borderColor: C.w16,
    alignItems: "center",
    justifyContent: "center",
  },
  avSm: { width: 24, height: 24, borderRadius: 12 },
});
