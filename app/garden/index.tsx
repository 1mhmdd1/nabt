import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Screen } from "../../src/components/Chrome";
import { FloatingNav } from "../../src/components/Nav";
import { IconCheck, IconLock } from "../../src/components/Icons";
import { LotusArt, SPROUT_VIEWBOX } from "../../src/components/LotusArt";
import { Kicker, useScreenReady, WhiteChip } from "../../src/components/NodeChrome";
import { C, t } from "../../src/theme";
import { saveHideGarden } from "../../src/live";
import { useNodeRewards } from "../../src/live/nodeRewards";
import { useNabt } from "../../src/state";

const SPOTS = [
  { left: 46, top: 66, w: 78, h: 54 },
  { left: 140, top: 14, w: 84, h: 58 },
  { left: 228, top: 82, w: 70, h: 49 },
];

export default function Garden() {
  const [open, setOpen] = useState(false);
  const rewards = useNodeRewards();
  const hide = useNabt((s) => s.hideGarden);
  useScreenReady("phone-11c", rewards.ready);
  const count = rewards.lotuses.length;
  const goal = rewards.goal;
  const ratio = goal && goal.target ? Math.min(1, goal.current / goal.target) : 0;
  if (!rewards.ready) {
    return (
      <Screen>
        <Text style={[t(500, 15, 20), { padding: 24 }]}>Opening your campus…</Text>
      </Screen>
    );
  }
  return (
    <Screen>
      <View style={styles.head}>
        <Text style={t(700, 30, 30)}>Your garden</Text>
        <Pressable
          accessibilityLabel="Hide count"
          onPress={() => saveHideGarden(!hide)}
          style={styles.hide}
        >
          <EyeSlash />
          <Text style={[t(600, 11.5, 12), { color: C.white }]}>{hide ? "Show count" : "Hide count"}</Text>
        </Pressable>
      </View>
      <View style={styles.pad}>
        <Text style={[t(600, 15, 18), { marginTop: 6 }]}>
          {hide ? "Garden count hidden" : `${count} lotuses`}
          <Text style={{ color: C.w64, fontWeight: "500" }}> · {rewards.sproutLabel || "4th sprouting"}</Text>
        </Text>
        <View style={styles.pond}>
          <Pond />
          {rewards.lotuses.slice(0, 3).map((lotus, i) => {
            const spot = SPOTS[i];
            if (!spot) return null;
            return (
              <Pressable
                key={lotus.id}
                accessibilityLabel={lotus.name}
                onPress={() => router.push(`/garden/${lotus.id}` as never)}
                style={{ position: "absolute", left: spot.left, top: spot.top }}
              >
                <LotusArt width={spot.w} height={spot.h} />
              </Pressable>
            );
          })}
          <View style={{ position: "absolute", left: 196, top: 118 }} accessibilityLabel="Sprout">
            <LotusArt width={20} height={38} viewBox={SPROUT_VIEWBOX} />
          </View>
        </View>
        <Text style={[t(500, 13, 18), { textAlign: "center", color: C.w80, marginTop: 4 }]}>Never spent, never lost. Each bloom stays here.</Text>
        <View style={{ marginTop: 20 }}>
          <Kicker>Perks</Kicker>
        </View>
        <View style={{ gap: 6, marginTop: 8 }}>
          {rewards.perks.map((perk) => {
            const unlocked = count >= perk.tier;
            return (
              <View key={perk.id} style={[styles.rung, !unlocked && styles.rungOff]}>
                <View style={[styles.num, !unlocked && styles.numOff]}>
                  <Text style={[t(700, 14, 14), { color: unlocked ? C.gold : C.w64 }]}>{perk.tier}</Text>
                  {unlocked ? (
                    <View style={styles.tick}>
                      <IconCheck color={C.burgundy} size={9} />
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[t(600, 13.5, 17), { color: unlocked ? C.white : C.w70 }]}>{perk.title}</Text>
                  {perk.partnerLine ? <Text style={[t(500, 11, 14), { color: C.w64, marginTop: 2 }]}>{perk.partnerLine}</Text> : null}
                </View>
                {unlocked && perk.tier === 1 ? <Text style={[t(600, 11.5, 14), styles.chip]}>Unlocked</Text> : null}
                {unlocked && perk.tier > 1 ? <WhiteChip label="Use perk" onPress={() => router.push("/rewards/redeem" as never)} /> : null}
                {!unlocked ? (
                  <View style={styles.chipRow}>
                    <IconLock size={11} color={C.w64} />
                    <Text style={[t(600, 11.5, 14), { color: C.w64 }]}>{perk.remainingLabel || `${perk.tier - count} to go`}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
        <Pressable style={styles.goal} onPress={() => router.push("/campus-goal" as never)}>
          <View>
            <Text style={t(600, 13.5, 16)}>{goal?.title || "UA garden"}</Text>
            <Text style={[t(500, 11.5, 15), { color: C.w64 }]}>{goal?.barLabel}</Text>
          </View>
          <View style={styles.bar}>
            <View style={{ width: `${Math.round(ratio * 100)}%`, height: 6, borderRadius: 3, backgroundColor: C.white }} />
          </View>
        </Pressable>
      </View>
      <FloatingNav active="me" open={open} onToggle={() => setOpen((v) => !v)} />
    </Screen>
  );
}

function EyeSlash() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth={1.7} />
      <Path d="M4 20 20 4" stroke="#fff" strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function Pond() {
  return (
    <Svg width={342} height={230} viewBox="0 0 342 230">
      <Ellipse cx="171" cy="125" rx="168" ry="98" fill="#521C1C" />
      <Ellipse cx="171" cy="125" rx="168" ry="98" fill="none" stroke="rgba(255,255,255,0.12)" />
      <Path
        d="M40 120q20 -5 40 0M250 160q20 -5 40 0M120 195q20 -5 40 0M210 70q16 -4 32 0"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M41,150 a44,18.48 0 1,0 88,0 a44,18.48 0 0,0 -39.6,-17.6 L85,150 Z" fill="#6A2A2A" />
      <Path d="M132,105 a48,20.16 0 1,0 96,0 a48,20.16 0 0,0 -43.2,-19.2 L180,105 Z" fill="#6A2A2A" />
      <Path d="M222,160 a40,16.8 0 1,0 80,0 a40,16.8 0 0,0 -36,-16 L262,160 Z" fill="#6A2A2A" />
      <Path d="M179,190 a26,10.92 0 1,0 52,0 a26,10.92 0 0,0 -23.4,-10.4 L205,190 Z" fill="#6A2A2A" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: -28, paddingTop: 10, paddingHorizontal: 24 },
  hide: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: C.w40, flexDirection: "row", alignItems: "center", gap: 5 },
  pad: { paddingHorizontal: 24 },
  pond: { height: 230, marginTop: 10, overflow: "visible" },
  rung: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.card },
  rungOff: { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" },
  num: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center" },
  numOff: { borderColor: "rgba(255,255,255,0.35)" },
  tick: { position: "absolute", right: -3, bottom: -3, width: 15, height: 15, borderRadius: 8, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  chip: { height: 24, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: C.w40, textAlignVertical: "center", overflow: "hidden" },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 4, height: 24, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: C.w40 },
  goal: { marginTop: 10, borderRadius: 18, backgroundColor: C.card, paddingVertical: 11, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 14 },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
});
