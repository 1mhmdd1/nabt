import { useEffect, useState } from "react";
import { Keyboard, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Height of the floating bottom nav (student and Student Affairs). */
export const NAV_HEIGHT = 64;
/** Gap between the nav and the bottom edge, above the phone's own safe area. */
export const NAV_GAP = 12;

/** Where the nav bar sits: above the gesture bar or home indicator. */
export function useNavBottom() {
  return useSafeAreaInsets().bottom + NAV_GAP;
}

/** Bottom space a scrolling screen needs so its last row clears the nav bar: bar + safe area + 16. */
export function useNavPad() {
  return NAV_HEIGHT + useNavBottom() + 16;
}

/** Put this last inside a vertical ScrollView so the last item can scroll fully above the nav bar. */
export function NavSpacer() {
  return <View style={{ height: useNavPad() }} />;
}

/** True while the keyboard is up. The nav hides then so it never covers a text field. */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setOpen(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}
