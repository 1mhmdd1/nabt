import { create } from "zustand";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { C, t } from "./theme";
import { useNavPad } from "./components/navSpace";

type ToastState = { message: string; show: (message: string) => void; clear: () => void };

export const useToast = create<ToastState>((set) => ({
  message: "",
  show: (message) => set({ message }),
  clear: () => set({ message: "" }),
}));

export function toast(message: string) {
  useToast.getState().show(message);
}

export function ToastHost() {
  const message = useToast((s) => s.message);
  const clear = useToast((s) => s.clear);
  const navPad = useNavPad();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clear, 2200);
    return () => clearTimeout(timer);
  }, [message, clear]);
  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: navPad }]}>
      <View style={styles.pill}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 20, right: 20, zIndex: 80, alignItems: "center" },
  pill: { maxWidth: 360, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: C.gold },
  text: { ...t(600, 14, 18), color: C.burgundy, textAlign: "center" },
});
