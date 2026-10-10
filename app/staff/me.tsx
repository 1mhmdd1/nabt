import { NavSpacer } from "../../src/components/navSpace";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path, Rect } from "react-native-svg";
import { Avatar, Chevron, OutlineButton, StaffFrame } from "../../src/components/staff/StaffChrome";
import { C, t } from "../../src/theme";
import { logoutStaff, toggleOnCall, useStaff } from "../../src/live/staff";

export default function StaffMe() {
  const profile = useStaff((s) => s.profile);
  const certs = useStaff((s) => s.certs);
  const perks = useStaff((s) => s.perks);
  const reveals = useStaff((s) => s.reveals);
  const eventCount = useStaff((s) => s.eventCount);
  const ready = certs.filter((c) => c.verified).length;
  const onCall = profile?.onCall === true;
  const name = String(profile?.name || profile?.displayName || "Student Affairs");
  const initial = String(profile?.initial || name.slice(0, 1) || "·");
  return (
    <StaffFrame title="Me" tab="none" me>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <View style={styles.who}>
          <Avatar letter={initial} size={60} />
          <View>
            <Text style={t(700, 20, 24)}>{name}</Text>
            <View style={styles.role}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <Rect x={5} y={10.5} width={14} height={9.5} rx={2.5} stroke="#fff" strokeWidth={1.6} />
                <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
              </Svg>
              <Text style={t(600, 11, 14)}>{String(profile?.roleLabel || "Counselor")}</Text>
            </View>
          </View>
        </View>
        <Text style={[t(500, 12, 16), { color: C.w64, marginTop: 10 }]}>{String(profile?.roleNote || "Staff role set by the Admin.")}</Text>
        <Text style={styles.fl}>Manage</Text>
        <View style={styles.list}>
          <Item label="Events" sub={eventCount ? `${eventCount} on the calendar` : "None yet"} href="/staff/events/new" />
          <Item label="Perks & campus goal" sub={perks.length ? `${perks.length} perks` : "None yet"} href="/staff/perks" />
          <Item label="Semester certificates" sub={ready ? `${ready} ready to issue` : "None waiting"} href="/staff/certificates" />
        </View>
        <Text style={styles.fl}>Accountability</Text>
        <View style={styles.list}>
          <Item label="My identity reveals" sub={reveals.length ? `${reveals.length} this semester · visible to the Admin` : "None this semester"} href="/staff/reveals" />
          <Pressable style={styles.it} onPress={() => toggleOnCall(!onCall)}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>On call</Text>
              <Text style={styles.sub}>Get High signals as a push</Text>
            </View>
            <View style={[styles.tg, onCall && styles.tgOn]}><View style={[styles.knob, onCall && styles.knobOn]} /></View>
          </Pressable>
          <Pressable style={styles.it} onPress={() => Linking.openURL("tel:1564")}>
            <View style={{ flex: 1 }}>
              <Text style={t(600, 14, 18)}>{String(profile?.embrace || "Embrace 1564")}</Text>
              <Text style={styles.sub}>{String(profile?.embraceSub || "Lebanon’s 24/7 lifeline")}</Text>
            </View>
            <Text style={[t(600, 13, 16), { color: C.w70 }]}>Call</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: 16 }}>
          <OutlineButton label="Log out" onPress={() => logoutStaff().then(() => router.replace("/staff/signin" as never))} />
        </View>
        <NavSpacer />
      </ScrollView>
    </StaffFrame>
  );
}

function Item({ label, sub, href }: { label: string; sub: string; href: string }) {
  return (
    <Pressable style={styles.it} onPress={() => router.push(href as never)}>
      <View style={{ flex: 1 }}>
        <Text style={t(600, 14, 18)}>{label}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <Chevron />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  who: { flexDirection: "row", gap: 14, alignItems: "center", marginTop: 14 },
  role: { marginTop: 6, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, height: 22, paddingHorizontal: 9, borderRadius: 11, borderWidth: 1, borderColor: C.w40 },
  fl: { ...t(600, 11, 14), letterSpacing: 1.2, textTransform: "uppercase", color: C.w64, marginTop: 16, marginBottom: 8 },
  list: { borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)" },
  sub: { ...t(500, 12, 16), color: C.w64, marginTop: 2 },
  tg: { width: 42, height: 26, borderRadius: 13, backgroundColor: C.deep, padding: 3 },
  tgOn: { backgroundColor: C.white },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.white },
  knobOn: { marginLeft: "auto", backgroundColor: C.burgundy },
});
