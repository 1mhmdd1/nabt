import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, t } from "../theme";

/**
 * Space for the phone's own status bar. The system draws the time, signal and
 * battery; this only keeps content below them. Renders nothing when the inset is 0.
 */
export function StatusBarChrome() {
  const insets = useSafeAreaInsets();
  if (!insets.top) return null;
  return <View style={{ height: insets.top }} />;
}

export function HomeIndicator() {
  if (Platform.OS !== "web") return null;
  return <View style={[styles.indicator, { pointerEvents: "none" }]} />;
}

export function Screen({
  children,
  bg = C.burgundy,
  paddedTop = true,
}: {
  children: React.ReactNode;
  bg?: string;
  paddedTop?: boolean;
}) {
  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {paddedTop ? <StatusBarChrome /> : null}
      <View style={styles.body}>{children}</View>
      <HomeIndicator />
    </View>
  );
}

export function Avatar({
  letter,
  size = 42,
  font = 17,
}: {
  letter: string;
  size?: number;
  font?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.deep,
        borderWidth: 1,
        borderColor: C.w16,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityRole="image"
      accessibilityLabel={letter}
    >
      <Text style={[t(600, font, font), { color: C.gold }]}>{letter}</Text>
    </View>
  );
}

export function GoldButton({
  label,
  onPress,
  icon,
  white,
  disabled,
  block,
}: {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  white?: boolean;
  disabled?: boolean;
  block?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.gold,
        block && { alignSelf: "stretch", width: "100%" },
        white && { backgroundColor: C.white },
        disabled && { opacity: 0.4 },
        pressed && !disabled && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={[t(700, 16, 16), { color: C.burgundy, letterSpacing: 0.16 }]}>{label}</Text>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.burgundy },
  body: { flex: 1, overflow: "visible" },
  indicator: {
    position: "absolute",
    left: "50%",
    marginLeft: -67,
    bottom: 8,
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.white,
    zIndex: 40,
  },
  gold: {
    height: 52,
    borderRadius: 999,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
});
