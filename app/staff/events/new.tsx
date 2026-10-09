import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { GoldButton, StaffFrame } from "../../../src/components/staff/StaffChrome";
import { C, t } from "../../../src/theme";
import { publishEvent } from "../../../src/live/staff";
import { ScreenDescription } from "../../../src/components/ScreenDescription";

const COVERS = ["rings", "hills", "leaf"] as const;

export default function NewSimple() {
  const [cover, setCover] = useState<(typeof COVERS)[number]>("rings");
  const [screen, setScreen] = useState("Short guided meditation before finals.");
  return (
    <StaffFrame title="New event" back="/staff/me" goldQuiet>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={styles.fl}>Title</Text>
        <View style={[styles.in, styles.focus]}><Text style={t(500, 14, 18)}>Breathe before finals</Text></View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fl}>Date & time</Text>
            <View style={styles.in}><Text style={t(500, 14, 18)}>Thu, Dec 4 · 12:30</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fl}>Place</Text>
            <View style={styles.in}><Text style={t(500, 14, 18)}>Faculty of Engineering</Text></View>
          </View>
        </View>
        <Text style={[styles.fl, { marginTop: 10 }]}>Cover</Text>
        <View style={styles.covers}>
          {COVERS.map((id) => (
            <Pressable key={id} onPress={() => setCover(id)} style={[styles.cv, cover === id && styles.cvOn]}>
              <CoverArt kind={id} />
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 12 }}>
          <ScreenDescription value={screen} onChange={setScreen} />
        </View>
        <Text style={[styles.fl, { marginTop: 12 }]}>Preview in Discover</Text>
        <View style={styles.card}>
          <View style={styles.preview}><CoverArt kind={cover} wide /></View>
          <View style={{ padding: 12 }}>
            <Text style={[t(600, 11.5, 14), { color: C.w70 }]}>Student Affairs ✓</Text>
            <Text style={[t(600, 16, 20), { marginTop: 6 }]}>Breathe before finals</Text>
            <Text style={[t(500, 13, 17), { color: C.w64, marginTop: 4 }]}>Short guided meditation · Thu 12:30 · Faculty of Engineering</Text>
          </View>
        </View>
        <View style={{ marginTop: 14 }}>
          <GoldButton label="Publish to Discover" onPress={() => publishEvent("Breathe before finals", "Thu, Dec 4 · 12:30", "Faculty of Engineering", screen)} />
        </View>
      </ScrollView>
    </StaffFrame>
  );
}

function CoverArt({ kind, wide }: { kind: string; wide?: boolean }) {
  const h = wide ? 74 : 56;
  if (kind === "hills") {
    return (
      <Svg width="100%" height={h} viewBox="0 0 80 56">
        <Path d="M10 46 30 22 44 36 54 28 70 46z" fill="#fff" fillOpacity={0.35} />
        <Circle cx={58} cy={16} r={6} fill="#fff" fillOpacity={0.6} />
      </Svg>
    );
  }
  if (kind === "leaf") {
    return (
      <Svg width="100%" height={h} viewBox="0 0 80 56">
        <Path d="M40 44c-8-6-10-16 0-28 10 12 8 22 0 28zM40 44c-10 0-18-5-21-14 10 0 18 5 21 14zM40 44c10 0 18-5 21-14-10 0-18 5-21 14z" fill="none" stroke="#fff" strokeWidth={1.8} />
      </Svg>
    );
  }
  return (
    <Svg width="100%" height={h} viewBox="0 0 80 56">
      <Circle cx={40} cy={30} r={16} fill="none" stroke="#fff" strokeWidth={2} />
      <Circle cx={40} cy={30} r={9} fill="#fff" fillOpacity={0.3} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64 },
  in: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: C.card },
  focus: { borderWidth: 1.5, borderColor: C.white },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
  covers: { flexDirection: "row", gap: 8, marginTop: 8 },
  cv: { flex: 1, height: 56, borderRadius: 12, backgroundColor: C.deep, overflow: "hidden", borderWidth: 1, borderColor: "transparent" },
  cvOn: { borderColor: C.white },
  card: { marginTop: 6, borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  preview: { height: 74, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
});
