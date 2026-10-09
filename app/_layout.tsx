import "react-native-gesture-handler";
import { useEffect } from "react";
import { Text, TextInput, View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { C } from "../src/theme";
import { startVoiceSafety } from "../src/live/voiceSafety";
import { bootNabt } from "../src/live/staff";
import { startNodeRewards } from "../src/live/nodeRewards";
import { startImpact } from "../src/live/impact";
import { ToastHost } from "../src/toast";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const TextWithDefault = Text as typeof Text & { defaultProps?: { style?: object } };
TextWithDefault.defaultProps = {
  ...TextWithDefault.defaultProps,
  style: [{ color: C.white }, TextWithDefault.defaultProps?.style],
};
const InputWithDefault = TextInput as typeof TextInput & { defaultProps?: { style?: object } };
InputWithDefault.defaultProps = {
  ...InputWithDefault.defaultProps,
  style: [{ color: C.white }, InputWithDefault.defaultProps?.style],
};

export default function RootLayout() {
  const [ready] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });
  const path = usePathname();
  // STAFF HOOK: /staff (except the sign-in screen) signs in the counselor seed.
  const staffArea = path.startsWith("/staff") && path !== "/staff/signin";

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
      // Staff routes sign in the counselor seed. Other routes boot the student campus.
      bootNabt(path);
      // AREA: voice-safety-a11y — screen copy, care inbox, voice setting.
      startVoiceSafety();
      // AREA: node-rewards — lotuses, perks, node notes. Does not replace a counselor session.
      startNodeRewards();
      // AREA: impact — aggregates, announcements, reports, You said we did.
      startImpact();
    }
  }, [ready, staffArea, path]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: C.ground }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.ground }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: C.ground },
          }}
        />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
