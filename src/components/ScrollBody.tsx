import { ScrollView, type StyleProp, type ViewStyle } from "react-native";

/** Vertical scroll for screen content that may not fit a small phone. Fills the screen when it does fit. */
export function ScrollBody({
  children,
  style,
  contentContainerStyle,
  nav,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  nav?: boolean;
}) {
  return (
    <ScrollView
      style={[{ flex: 1 }, style]}
      contentContainerStyle={[{ flexGrow: 1 }, nav ? { paddingBottom: 120 } : null, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
