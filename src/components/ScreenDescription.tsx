import { Text, TextInput, View } from "react-native";
import { C, t } from "../theme";
import { SCREEN_DESC_MAX } from "../live/eventCheckin";

/** Ninety-character tablet line, with a live count. Gold stays off this field. */
export function ScreenDescription({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <Text style={[t(600, 11, 14), { letterSpacing: 1.1, textTransform: "uppercase", color: C.w64 }]}>Screen description</Text>
      <TextInput
        value={value}
        onChangeText={(next) => onChange(next.slice(0, SCREEN_DESC_MAX))}
        maxLength={SCREEN_DESC_MAX}
        multiline
        placeholder="One or two lines for the tablet"
        placeholderTextColor={C.w64}
        accessibilityLabel="Screen description"
        style={{
          marginTop: 6,
          minHeight: 72,
          borderRadius: 14,
          backgroundColor: C.card,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: C.white,
          ...t(500, 15, 21),
        }}
      />
      <Text style={[t(500, 12, 16), { marginTop: 6, color: C.w64, textAlign: "right" }]}>{value.length}/90</Text>
    </View>
  );
}
