import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/Chrome";
import { IconBack, IconChevronRight, IconLock } from "../../src/components/Icons";
import { resetIntro } from "../../src/intro";
import { signOutEverywhere } from "../../src/auth";
import { me, useCampus } from "../../src/live";
import { idYear } from "../../src/local/ids";
import { resetDemo } from "../../src/local/store";
import { C, t } from "../../src/theme";
import { useNabt } from "../../src/state";

export default function Settings() {
  const nickname = useNabt((s) => s.nickname);
  const id = useNabt((s) => s.studentId);
  const calm = useNabt((s) => s.calmMode);
  const hide = useNabt((s) => s.hideGarden);
  const setHide = useNabt((s) => s.setHideGarden);
  const roleLabel = useCampus((s) => s.roleLabel);
  const role = useCampus((s) => s.role);
  const alumni = useCampus((s) => s.alumni);
  const status = useCampus((s) => s.status);
  const email = useCampus((s) => s.email);
  const joined = idYear(id);
  // The Circle this account chairs, if any. Student Affairs assigns the Chair.
  const chaired = useCampus((s) => Object.values(s.circles).find((c) => c.chairUid && c.chairUid === me()));

  return (
    <Screen bg={C.ground}>
      <View style={styles.top}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.icon}>
          <IconBack />
        </Pressable>
        <Text style={styles.h1}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>
        <Text style={styles.k}>Account</Text>
        <View style={styles.list}>
          <View style={styles.it}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Nickname</Text>
              <Text style={styles.small}>{nickname || "Not set yet"}</Text>
            </View>
            <IconLock size={14} color={C.w70} />
          </View>
          <View style={styles.it}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>UA email</Text>
              <Text style={styles.small}>{email || (id ? `${id}@ua.edu.lb` : "Not set yet")}</Text>
            </View>
            <IconLock size={14} color={C.w70} />
          </View>
          {joined ? (
            <View style={styles.it}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Joined</Text>
                <Text style={styles.small}>Joined {joined}</Text>
              </View>
              <IconLock size={14} color={C.w70} />
            </View>
          ) : null}
          <View style={styles.it}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Role</Text>
              <Text style={styles.small}>{status === "pending" ? "Awaiting Student Affairs review" : "Set from your ID card"}</Text>
            </View>
            <Text style={styles.v}>{roleLabel || "Student"}</Text>
            <IconLock size={14} color={C.w70} />
          </View>
        </View>
        <Text style={styles.k}>Privacy</Text>
        <View style={styles.list}>
          <Line title="Privacy log" sub="Every time someone saw your name" />
          {/* AREA: voice-safety-a11y — care ladder explainer and the voice opt-in sheet. */}
          <Line title="How care signals work" sub="On your phone · never a score" onPress={() => router.push("/care/explainer" as never)} />
          <Line title="Voice check-ins" sub="Offered when a day feels heavy" onPress={() => router.push("/settings/voice" as never)} />
          <View style={styles.it}>
            <Text style={[styles.label, { flex: 1 }]}>Hide garden count</Text>
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: hide }} onPress={() => setHide(!hide)} style={[styles.tg, hide && styles.tgOn]}>
              <View style={[styles.knob, hide && { marginLeft: 18 }]} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.k}>App</Text>
        <View style={styles.list}>
          <Line title="Language" value="English" />
          <Pressable style={styles.it} onPress={() => router.push("/settings/accessibility" as never)}>
            <Text style={[styles.label, { flex: 1 }]}>Accessibility</Text>
            <Text style={styles.v}>{calm ? "Calm mode on" : "Calm mode off"}</Text>
            <IconChevronRight />
          </Pressable>
          <Line title="Help & crisis lines" sub="Embrace 1564 · 24/7" onPress={() => void Linking.openURL("tel:1564")} />
          <Line
            title="Show the intro again"
            sub="Dev · replays the first-launch pages"
            onPress={() => void resetIntro().then(() => router.replace("/" as never))}
          />
          {role === "staff" ? <Line title="Student Affairs" sub="Mood, safety, petitions" onPress={() => router.push("/staff/overview" as never)} /> : null}
          {alumni ? <Line title="Mentor inbox" sub="Requests from students" onPress={() => router.push("/alumni/inbox" as never)} /> : null}
          {chaired ? <Line title="Chair dashboard" sub={chaired.name} onPress={() => router.push(`/c/${chaired.id}/chair` as never)} /> : null}
          <Line title="Switch account" sub="Sign out and pick another demo account" onPress={() => { void signOutEverywhere().finally(() => router.replace("/login" as never)); }} />
          <Line
            title="Reset demo data"
            sub="Restores the demo accounts and today’s events"
            onPress={() => {
              void resetDemo().then(() => signOutEverywhere()).finally(() => router.replace("/login" as never));
            }}
          />
          <Pressable style={styles.it} onPress={() => router.push("/admin/log" as never)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Campus admin log</Text>
              <Text style={styles.small}>Admin only · role changes and approvals</Text>
            </View>
            <IconLock size={14} color={C.w70} />
          </Pressable>
        </View>
        <Pressable
          style={styles.logout}
          onPress={() => {
            void signOutEverywhere().finally(() => router.replace("/login" as never));
          }}
        >
          <Text style={t(600, 15, 15)}>Log out</Text>
        </Pressable>
        <Text style={styles.fine}>Alumni see “Mentoring with real name” here (opt-in).</Text>
      </ScrollView>
    </Screen>
  );
}

function Line({ title, sub, value, onPress }: { title: string; sub?: string; value?: string; onPress?: () => void }) {
  const body = (
    <>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{title}</Text>
        {sub ? <Text style={styles.small}>{sub}</Text> : null}
      </View>
      {value ? <Text style={styles.v}>{value}</Text> : null}
      {onPress ? <IconChevronRight /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.it}>
        {body}
      </Pressable>
    );
  }
  return (
    <View style={styles.it}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { height: 50, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 8, paddingRight: 12 },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  h1: { ...t(600, 17, 17), color: C.white },
  k: { marginTop: 8, marginBottom: 4, marginHorizontal: 4, ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  list: { borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { minHeight: 44, paddingVertical: 5, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, borderTopColor: "transparent" },
  label: { ...t(600, 14.5, 18), color: C.white },
  small: { marginTop: 2, ...t(500, 12, 16), color: C.w64 },
  v: { ...t(500, 13.5, 16), color: C.w70 },
  act: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.2, borderColor: "rgba(255,255,255,0.5)" },
  tg: { width: 44, height: 26, borderRadius: 13, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", paddingLeft: 3 },
  tgOn: { backgroundColor: C.white },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.white },
  logout: { marginTop: 14, height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  fine: { marginTop: 10, textAlign: "center", ...t(500, 12, 16), color: C.w64 },
});
