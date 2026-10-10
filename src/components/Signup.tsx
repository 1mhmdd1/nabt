import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SvgXml } from "react-native-svg";
import { markSvg } from "../art/svgs";
import { HomeIndicator, StatusBarChrome } from "./Chrome";
import { IconBack } from "./Icons";
import { C, t } from "../theme";

export function SignupScreen({
  step,
  children,
  onBack,
  hideMark,
  bg,
}: {
  step?: string;
  children: React.ReactNode;
  onBack?: () => void;
  hideMark?: boolean;
  bg?: string;
}) {
  const n = step ? Number(step[0]) : 0;
  return (
    <View style={[styles.screen, bg ? { backgroundColor: bg } : null]}>
      <StatusBarChrome />
      <View style={styles.topnav}>
        {onBack ? (
          <Pressable accessibilityLabel="Back" onPress={onBack} style={styles.icon}>
            <IconBack />
          </Pressable>
        ) : (
          <View style={styles.icon} />
        )}
        {hideMark ? <View /> : <SvgXml xml={markSvg} width={36} height={25} />}
        <Text style={styles.step}>{step ?? ""}</Text>
      </View>
      {step ? (
        <View style={styles.progress} accessibilityLabel={`Step ${n} of 5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.bar, i < n && styles.barOn]} />
          ))}
        </View>
      ) : null}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.main}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      <HomeIndicator />
    </View>
  );
}

export function back(href: string) {
  return () => router.replace(href as never);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ground },
  topnav: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  step: { ...t(600, 12, 12), color: C.w64, width: 64, textAlign: "right", paddingRight: 10 },
  progress: { flexDirection: "row", gap: 5, paddingHorizontal: 20, paddingTop: 2 },
  bar: { flex: 1, height: 2, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" },
  barOn: { backgroundColor: C.white },
  main: { flexGrow: 1, paddingTop: 26, paddingHorizontal: 20 },
});
