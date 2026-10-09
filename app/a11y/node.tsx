import { useWindowDimensions, StyleSheet, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { Gate, PlantLotus, useScreen } from "../../src/components/voice/Kit";
import { C, t } from "../../src/theme";

type Copy = { place: string; kicker: string; quote: string; author: string; hint: string; take: string; skip: string; clock: string };

/** Hope Node kiosk photo step. Take your time removes the countdown. */
export default function NodePhoto() {
  return (
    <Gate>
      <Body />
    </Gate>
  );
}

function Body() {
  const copy = useScreen<Copy>("nodePhoto");
  const { width, height } = useWindowDimensions();
  if (!copy) return null;
  const scale = Math.min(width / 800, height / 480);
  return (
    <View style={styles.page}>
      <View style={[styles.kiosk, { transform: [{ scale }] }]}>
        <View style={styles.bar}>
          <Text style={styles.brand}>
            NABT <Text style={{ color: "rgba(255,255,255,0.7)" }}>· {copy.place}</Text>
          </Text>
          <Text style={t(600, 16, 20)}>{copy.clock}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.k}>{copy.kicker}</Text>
          <Text style={styles.quote}>“{copy.quote}”</Text>
          <Text style={styles.author}>— {copy.author}</Text>
        </View>
        <Pressable accessibilityLabel={copy.skip} onPress={() => router.back()} style={styles.skip}>
          <Text style={t(600, 16, 20)}>{copy.skip}</Text>
        </Pressable>
        <View style={styles.takeRow}>
          <Text style={styles.hint}>{copy.hint}</Text>
          <Pressable accessibilityLabel="Take photo when ready" onPress={() => router.back()} style={styles.take}>
            <Text style={[t(700, 16, 20), { color: C.burgundy }]}>{copy.take}</Text>
          </Pressable>
        </View>
        <View style={styles.lotus}>
          <PlantLotus width={72} height={50} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.frame, alignItems: "center", justifyContent: "center" },
  kiosk: { width: 800, height: 480, backgroundColor: C.ground },
  bar: { height: 56, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { ...t(700, 16, 20), letterSpacing: 1.4, color: C.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  k: { ...t(600, 14, 18), color: C.white },
  quote: { marginTop: 20, maxWidth: 620, textAlign: "center", ...t(700, 36, 46), color: C.white },
  author: { marginTop: 18, ...t(600, 18, 22), color: "rgba(255,255,255,0.75)" },
  skip: { position: "absolute", left: 26, top: 70, minHeight: 44, justifyContent: "center" },
  takeRow: { position: "absolute", right: 26, bottom: 24, flexDirection: "row", alignItems: "center", gap: 10 },
  hint: { ...t(600, 15, 20), color: "rgba(255,255,255,0.78)", textAlign: "right" },
  take: { height: 64, paddingHorizontal: 22, borderRadius: 32, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  lotus: { position: "absolute", left: 28, bottom: 28 },
});
