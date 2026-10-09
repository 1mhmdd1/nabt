import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SvgXml } from "react-native-svg";
import { budSvg } from "../../src/art/svgs";
import { SignupScreen } from "../../src/components/Signup";
import { GoldButton } from "../../src/components/Chrome";
import { IconCheck, IconLock } from "../../src/components/Icons";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";

export default function Pending() {
  const setPending = useNabt((s) => s.setPending);
  return (
    <SignupScreen step="5 of 5" onBack={() => router.replace("/signup/nickname" as never)}>
      <View style={{ alignItems: "center" }}>
        <SvgXml xml={budSvg} width={120} height={90} />
        <Text style={[styles.h1, { textAlign: "center", marginTop: 8 }]}>Almost there</Text>
        <Text style={[styles.lead, { textAlign: "center" }]}>
          Student Affairs is checking your card.{"\n"}Usually within a day.
        </Text>
      </View>
      <View style={styles.lists}>
        <Col title="You can now" items={["Read Discover", "Grow your lotus"]} ok />
        <Col title="After approval" items={["Circles", "1:1 chats", "Node notes"]} />
      </View>
      <View style={styles.staff}>
        <IconLock size={12} color={C.w64} />
        <Text style={[t(500, 12, 12), { color: C.w80 }]}>Staff accounts: awaiting Admin approval</Text>
      </View>
      <View style={styles.foot}>
        <GoldButton
          white
          label="Explore while you wait"
          onPress={() => {
            setPending(true);
            router.replace("/home" as never);
          }}
        />
      </View>
    </SignupScreen>
  );
}

function Col({ title, items, ok }: { title: string; items: string[]; ok?: boolean }) {
  return (
    <View style={styles.col}>
      <Text style={styles.k}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.li}>
          <View style={[styles.ic, ok && { backgroundColor: C.white }]}>
            <IconCheck size={12} color={ok ? C.burgundy : C.white} />
          </View>
          <Text style={[t(600, 14, 17), { color: C.white }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...t(600, 26, 31), color: C.white, letterSpacing: -0.26 },
  lead: { marginTop: 8, ...t(400, 15, 22), color: C.w80 },
  lists: { marginTop: 24, flexDirection: "row", gap: 10 },
  col: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: C.card, gap: 10 },
  k: { ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  li: { flexDirection: "row", alignItems: "center", gap: 8 },
  ic: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.w16,
  },
  staff: {
    marginTop: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.w16,
  },
  foot: { marginTop: "auto", paddingBottom: 40 },
});
