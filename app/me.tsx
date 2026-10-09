import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { SvgXml } from "react-native-svg";
import { Screen } from "../src/components/Chrome";
import { FloatingNav } from "../src/components/Nav";
import { IconBadgeBloom, IconBadgeLeaf, IconBadgeLink, IconChevronRight, IconGear, IconLock } from "../src/components/Icons";
import { markSvg } from "../src/art/svgs";
import { C, t } from "../src/theme";
import { useCampus } from "../src/live";
import { useNodeRewards } from "../src/live/nodeRewards";
import { totalsLine, useMyRecord } from "../src/live/records";
import { demoLocal } from "../src/local/mode";

const budSvg = markSvg.replace('viewBox="100 338 190 132"', 'viewBox="158 338 64 126"');

function badgeIcon(id: string) {
  if (id === "engineering-regular") return <IconBadgeLeaf />;
  if (id === "circle-helper") return <IconBadgeLink />;
  return <IconBadgeBloom />;
}

export default function Me() {
  const [open, setOpen] = useState(false);
  const campus = useCampus();
  const rewards = useNodeRewards();
  const pinned = rewards.earned
    .filter((badge) => badge.pinned)
    .sort((a, b) => a.groupOrder - b.groupOrder || a.order - b.order);
  const badges = rewards.ready ? pinned : campus.badges;
  const record = useMyRecord();
  const nickname = campus.nickname;
  const initial = campus.initial;
  const hide = campus.hideGarden;
  return (
    <Screen>
      <View style={styles.mh}>
        <Text style={styles.h1}>Me</Text>
        <Pressable accessibilityLabel="Settings" onPress={() => router.push("/settings" as never)} style={styles.icon}>
          <IconGear />
        </Pressable>
      </View>
      <View style={styles.pad}>
        <View style={styles.prof}>
          <View style={styles.big}>
            <Text style={[t(600, 30, 30), { color: C.gold }]}>{initial || "·"}</Text>
          </View>
          <View>
            <Text style={t(700, 22, 24)}>{nickname || "Your nickname"}</Text>
            {campus.alumni && campus.classYear ? (
              <View style={styles.alum}>
                <Text style={[t(700, 11, 13), { color: C.burgundy }]}>Alumni · Class of {campus.classYear}</Text>
              </View>
            ) : (
              <View style={styles.chip}>
                <IconLock size={12} color="rgba(255,255,255,0.85)" />
                <Text style={[t(600, 11.5, 12), { color: "rgba(255,255,255,0.85)" }]}>
                  {campus.status === "pending" ? "Student · awaiting review" : campus.roleLabel || "Student"}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.fine}>
          <IconLock size={12} color={C.w64} />
          <Text style={[t(500, 12, 16), { color: C.w64 }]}>Real name visible only to people you share it with</Text>
        </View>
        {/* AREA: node-rewards — garden count opens the lotus garden. */}
        <Pressable style={styles.card} onPress={() => router.push("/garden" as never)}>
          <SvgXml xml={markSvg} width={64} height={44} />
          <View style={{ flex: 1 }}>
            <Text style={t(600, 15, 18)}>{hide ? "Garden count hidden" : campus.gardenLine || "No blooms yet"}</Text>
            <Text style={styles.small}>{campus.gardenSub || "Your first lotus blooms after a few check-ins."}</Text>
          </View>
          <IconChevronRight />
        </Pressable>
        <View style={styles.two}>
          <Pressable style={styles.mini} onPress={() => router.push("/home" as never)}>
            <SvgXml xml={budSvg} width={14} height={27} />
            <Text style={t(600, 13, 13)}>Today’s plant</Text>
          </Pressable>
          <Pressable style={styles.mini} onPress={() => router.push("/garden" as never)}>
            <SvgXml xml={markSvg} width={28} height={19} />
            <Text style={t(600, 13, 13)}>Open garden</Text>
          </Pressable>
        </View>
        <Text style={styles.k}>Pinned badges</Text>
        <Pressable accessibilityLabel="Pinned badges" onPress={() => router.push("/badges" as never)} style={styles.bds}>
          {badges.length === 0 ? (
            <View style={[styles.bd, { alignItems: "flex-start", paddingHorizontal: 14 }]}>
              <Text style={t(600, 13.5, 17)}>No badges yet.</Text>
              <Text style={styles.small}>Check in or help in a Circle to earn one.</Text>
            </View>
          ) : null}
          {badges.map((b) => (
            <View key={b.id} style={styles.bd}>
              <View style={styles.ring}>
                {badgeIcon(b.id)}
              </View>
              <Text style={[t(600, 11.5, 14), { textAlign: "center" }]}>{b.name}</Text>
            </View>
          ))}
        </Pressable>
        <Text style={styles.k}>Mine</Text>
        <View style={styles.list}>
          <Row title="My record" sub={record ? totalsLine(record.totals) : "Events, training, and roles"} onPress={() => router.push("/record" as never)} />
          <Row title="I'd like support" sub="A private request to Student Affairs" onPress={() => router.push("/support/share" as never)} />
          {/* Node notes belong to the Hope Node, which is the next step and not in the demo. */}
          {demoLocal() ? null : (
            <Row title="My notes" sub={campus.notesSummary || "Nothing left at a node yet"} onPress={() => router.push("/notes" as never)} />
          )}
          <Row title="My petitions" sub={campus.petitionsSummary || "None signed yet"} onPress={() => router.push("/petition/new" as never)} />
          <Row title={campus.alumni ? "Offer mentoring" : "I've graduated"} sub={campus.alumni ? "A chat, a CV, or advice" : "Switch this account to alumni"} onPress={() => router.push((campus.alumni ? "/alumni/offer" : "/alumni/graduate") as never)} />
          <Row title="Alumni mentors" sub="Browse alumni" onPress={() => router.push("/alumni" as never)} />
        </View>
      </View>
      <FloatingNav active="me" open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

function Row({ title, sub, onPress }: { title: string; sub: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.it} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={t(600, 14.5, 18)}>{title}</Text>
        <Text style={styles.small}>{sub}</Text>
      </View>
      <IconChevronRight />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mh: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingRight: 14, paddingLeft: 24 },
  h1: { ...t(700, 30, 30), color: C.white },
  icon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  pad: { paddingHorizontal: 24 },
  prof: { marginTop: 14, flexDirection: "row", gap: 16, alignItems: "center" },
  big: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  alum: { marginTop: 8, alignSelf: "flex-start", height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: C.gold, justifyContent: "center" },
  chip: {
    marginTop: 8,
    alignSelf: "flex-start",
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.w40,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  fine: { marginTop: 10, flexDirection: "row", gap: 6, alignItems: "center" },
  card: { marginTop: 16, borderRadius: 18, backgroundColor: C.card, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  small: { marginTop: 3, ...t(500, 12.5, 16), color: C.w64 },
  two: { marginTop: 8, flexDirection: "row", gap: 8 },
  mini: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  k: { marginTop: 16, marginBottom: 8, marginHorizontal: 4, ...t(600, 11, 13), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  bds: { flexDirection: "row", gap: 8 },
  bd: { flex: 1, alignItems: "center", paddingVertical: 12, paddingHorizontal: 6, borderRadius: 16, backgroundColor: C.card },
  ring: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  list: { borderRadius: 18, backgroundColor: C.card, overflow: "hidden" },
  it: { minHeight: 52, paddingVertical: 10, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 0 },
});
