import { TextStyle } from "react-native";

export const C = {
  burgundy: "#411516",
  ground: "#411515",
  raised: "#4F1D1E",
  card: "#521C1C",
  deep: "#2F0D0E",
  gold: "#CF9C74",
  goldLight: "#E3BE9A",
  goldDeep: "#A8764E",
  white: "#FFFFFF",
  w80: "rgba(255,255,255,0.80)",
  w70: "rgba(255,255,255,0.70)",
  w64: "rgba(255,255,255,0.64)",
  w40: "rgba(255,255,255,0.40)",
  w16: "rgba(255,255,255,0.16)",
  w10: "rgba(255,255,255,0.10)",
  bubble: "#5A2222",
  scrim: "rgba(36,9,10,0.72)",
  frame: "#2A0B0C",
  hair: "rgba(255,255,255,0.10)",
  hair07: "rgba(255,255,255,0.07)",
};

type Weight = 400 | 500 | 600 | 700;

const nativeFamily: Record<Weight, string> = {
  400: "Montserrat_400Regular",
  500: "Montserrat_500Medium",
  600: "Montserrat_600SemiBold",
  700: "Montserrat_700Bold",
};

export function t(weight: Weight, size: number, line?: number): TextStyle {
  return {
    fontFamily: nativeFamily[weight],
    fontSize: size,
    lineHeight: line ?? Math.round(size * 1.35),
    color: C.white,
  };
}

export const shadow = {
  nav: "0 12px 28px rgba(18,4,5,0.55), 0 2px 6px rgba(18,4,5,0.35)",
  menu: "0 16px 36px rgba(18,4,5,0.6)",
  fab: "0 10px 22px rgba(18,4,5,0.5)",
} as const;
