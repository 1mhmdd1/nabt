import { ReactNode, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Svg, { G, Path, Rect } from "react-native-svg";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import { nabtMarkSvg } from "../../art/nabtMarkSvg";
import { Screen } from "../Chrome";
import { IconClose, IconLotus } from "../Icons";
import { C, shadow, t } from "../../theme";
import { NAV_HEIGHT, useKeyboardOpen, useNavBottom } from "../navSpace";

export type StaffTab = "overview" | "events" | "safety" | "reviews" | "none";

/** Solid golds for the real petal paths. The source SVG’s gradients and unclosed group do not paint on web. */
const PETAL_FILL: Record<string, string> = {
  "url(#Lg0)": "#E3BE9A",
  "url(#Lg1)": "#D4A574",
  "url(#Lg2)": "#C99562",
  "url(#Lg3)": "#D4A574",
  "url(#Lg4)": "#C99562",
  "#fff": "#ffffff",
};

type MarkPath = { d: string; fill: string; opacity?: number; stem?: boolean };

function lotusPaths(xml: string): MarkPath[] {
  const out: MarkPath[] = [];
  for (const match of xml.matchAll(/<path\b([^>]*?)\/>/g)) {
    const attrs = match[1];
    const d = attrs.match(/d="([^"]+)"/)?.[1];
    const fill = attrs.match(/fill="([^"]+)"/)?.[1] || "#CF9C74";
    const opacity = attrs.match(/fill-opacity="([^"]+)"/)?.[1];
    const transform = attrs.match(/transform="([^"]+)"/)?.[1];
    if (!d || transform) continue;
    out.push({ d, fill: PETAL_FILL[fill] || "#CF9C74", opacity: opacity ? Number(opacity) : undefined, stem: fill === "#fff" });
  }
  return out;
}

const LOTUS = lotusPaths(nabtMarkSvg);

export function StaffMark({ width = 26, height = 18 }: { width?: number; height?: number }) {
  const petals = LOTUS.filter((p) => !p.stem);
  const stem = LOTUS.find((p) => p.stem);
  return (
    <Svg width={width} height={height} viewBox="100 338 190 132">
      {petals.map((p) => (
        <Path key={p.d.slice(0, 24)} d={p.d} fill={p.fill} />
      ))}
      {stem ? (
        <G transform="translate(195 371)">
          <Path d={stem.d} fill={stem.fill} fillOpacity={stem.opacity ?? 0.89} />
        </G>
      ) : null}
    </Svg>
  );
}

export function Brand({ on = false }: { on?: boolean }) {
  return (
    <View style={styles.brand}>
      <StaffMark />
      <Text style={[t(600, 12, 14), { color: C.w70, letterSpacing: 0.4 }]}>
        <Text style={{ color: C.white, letterSpacing: 1.2 }}>NABT</Text>
        {"  ·  Student Affairs"}
      </Text>
      <Pressable
        accessibilityLabel="Me"
        onPress={() => router.push("/staff/me" as never)}
        style={[styles.me, on && styles.meOn]}
      >
        <Text style={[t(600, 12, 12), { color: C.gold }]}>R</Text>
      </Pressable>
    </View>
  );
}

export function PageTitle({ title, chip }: { title: string; chip?: string }) {
  return (
    <View style={styles.hd}>
      <Text style={styles.h1}>{title}</Text>
      {chip ? <Chip label={chip} /> : <View />}
    </View>
  );
}

export function TopBar({ title, chip, chipOn, back }: { title: string; chip?: string; chipOn?: boolean; back: string }) {
  return (
    <View style={styles.top}>
      <Pressable accessibilityLabel="Back" onPress={() => router.push(back as never)} style={styles.iconBtn}>
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Path d="M13.5 4.5 7 11l6.5 6.5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      <Text style={[t(600, 17, 20), { flex: 1 }]}>{title}</Text>
      {chip ? <Chip label={chip} on={chipOn} /> : null}
    </View>
  );
}

export function Chip({ label, on, gold }: { label: string; on?: boolean; gold?: boolean }) {
  return (
    <View style={[styles.chip, on && styles.chipOn]}>
      {gold ? <Text style={[t(600, 11, 12), { color: on ? C.burgundy : C.gold }]}>{label}</Text> : <Text style={[t(600, 11, 12), { color: on ? C.burgundy : C.white }]}>{label}</Text>}
    </View>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.fl}>{children}</Text>;
}

export function Sev({ level }: { level: string }) {
  const dots = level === "high" ? 3 : level === "medium" ? 2 : 1;
  const label = level === "high" ? "High" : level === "medium" ? "Medium" : level === "care" ? "Care" : "Low";
  if (level === "care") return null;
  return (
    <View style={[styles.sev, level === "high" && styles.sevHi, level === "medium" && styles.sevMd, level === "low" && styles.sevLo]}>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.sevDot, i >= dots && styles.sevDotOff, level === "high" && { backgroundColor: i < dots ? C.burgundy : "transparent", borderColor: C.burgundy }]} />
        ))}
      </View>
      <Text style={[t(700, 10.5, 12), { color: level === "high" ? C.burgundy : level === "low" ? C.w80 : C.white, letterSpacing: 0.6 }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function Avatar({ letter, size = 36 }: { letter: string; size?: number }) {
  return (
    <View style={[styles.av, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[t(600, size > 40 ? 17 : 14, size > 40 ? 18 : 16), { color: C.gold }]}>{letter}</Text>
    </View>
  );
}

export function Seg({
  items,
}: {
  items: { label: string; count?: number; on?: boolean; href: string }[];
}) {
  return (
    <View style={styles.seg}>
      {items.map((item) => (
        <Pressable key={item.label} onPress={() => router.push(item.href as never)} style={[styles.segBtn, item.on && styles.segOn]}>
          <Text style={[t(600, 13, 15), { color: item.on ? C.burgundy : C.w70 }]}>{item.label}</Text>
          {item.count != null ? (
            <Text style={[t(600, 11, 13), { color: item.on ? C.burgundy : C.w70, opacity: 0.7 }]}>{item.count}</Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export function Pills({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
      {items.map((item) => {
        const on = item === value || item.startsWith(value);
        return (
          <Pressable key={item} onPress={() => onChange(item)} style={[styles.pill, on && styles.pillOn]}>
            <Text style={[t(600, 12.5, 16), { color: on ? C.burgundy : C.white }]}>{item}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function GoldButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.gold}>
      <Text style={[t(700, 16, 18), { color: C.burgundy }]}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, compact }: { label: string; onPress?: () => void; compact?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.outline, compact && { height: 42 }]}>
      <Text style={[t(600, compact ? 13 : 14, 16), { color: C.white }]}>{label}</Text>
    </Pressable>
  );
}

export function WhiteButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.whiteBtn}>
      <Text style={[t(700, 14.5, 16), { color: C.burgundy }]}>{label}</Text>
    </Pressable>
  );
}

export function SmallButton({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.sm, on && styles.smOn]}>
      <Text style={[t(600, 12.5, 14), { color: on ? C.burgundy : C.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Sheet({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.sheetWrap}>
      <View style={styles.scrim} />
      <Animated.View entering={SlideInDown.duration(420)} style={styles.sheet} accessibilityRole="summary" accessibilityLabel={title}>
        <View style={styles.grab} />
        <Text style={t(700, 20, 24)}>{title}</Text>
        {children}
      </Animated.View>
    </View>
  );
}

export function StaffFrame({
  title,
  chip,
  tab,
  back,
  me,
  children,
  goldQuiet,
  chipOn,
}: {
  title: string;
  chip?: string;
  chipOn?: boolean;
  tab?: StaffTab;
  back?: string;
  me?: boolean;
  children: ReactNode;
  goldQuiet?: boolean;
}) {
  const params = useLocalSearchParams<{ menu?: string }>();
  return (
    <Screen bg={C.ground}>
      {back ? <TopBar title={title} chip={chip} chipOn={chipOn} back={back} /> : (
        <>
          <Brand on={me} />
          <PageTitle title={title} chip={chip} />
        </>
      )}
      <View style={styles.main}>{children}</View>
      {tab && tab !== "none" ? <StaffNav active={tab} quiet={goldQuiet} initialOpen={params.menu === "1"} /> : null}
      {me && tab === "none" ? <StaffNav active="none" initialOpen={params.menu === "1"} /> : null}
    </Screen>
  );
}

const MENU = [
  { title: "New event", sub: "Venue, time, check-in, petals", href: "/staff/events/create", icon: "plus" },
  { title: "Book a space", sub: "See what’s free right now", href: "/staff/events/spaces", icon: "grid" },
  { title: "Event requests", sub: "3 from Circles & clubs", href: "/staff/events/requests", icon: "check" },
  { title: "Go live", sub: "Breathe before finals · 12:30", href: "/staff/events/live", icon: "live" },
];

export function StaffNav({ active, quiet, initialOpen }: { active: StaffTab; quiet?: boolean; initialOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(initialOpen));
  const order: StaffTab[] = ["overview", "events", "safety", "reviews"];
  const slot = Math.max(0, order.indexOf(active));
  const lefts = ["10%", "30%", "70%", "90%"] as const;
  const bottom = useNavBottom();
  if (useKeyboardOpen()) return null;
  return (
    <>
      {open ? <Pressable style={styles.navScrim} onPress={() => setOpen(false)} accessibilityLabel="Close create menu" /> : null}
      <View style={[styles.navWrap, { bottom, pointerEvents: "box-none" }]}>
        {open ? (
          <Animated.View entering={FadeInDown.duration(380)} style={styles.menu} accessibilityRole="menu">
            {MENU.map((item, i) => (
              <Animated.View key={item.title} entering={FadeIn.delay(40 * i).duration(280)}>
                <Pressable
                  style={styles.menuItem}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    setOpen(false);
                    router.push(item.href as never);
                  }}
                >
                  <View style={styles.mi}>
                    <MenuIcon kind={item.icon} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={t(600, 15, 18)}>{item.title}</Text>
                    <Text style={[t(400, 12, 16), { color: C.w64, marginTop: 2 }]}>{item.sub}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        ) : null}
        <View style={styles.bar}>
          {active !== "none" ? <View style={[styles.pillBg, { left: lefts[slot], pointerEvents: "none" }]} /> : null}
          <NavTab label="Overview" on={active === "overview"} icon={<GridIcon />} onPress={() => router.push("/staff/overview" as never)} />
          <NavTab label="Events" on={active === "events"} icon={<CalIcon />} onPress={() => router.push("/staff/events" as never)} />
          <View style={styles.fabSlot}>
            <Pressable accessibilityLabel="Create" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={styles.fabRing}>
              <View style={[styles.fab, quiet ? styles.fabQuiet : styles.fabGold]}>
                {open ? <IconClose color={quiet ? C.gold : C.burgundy} /> : <IconLotus size={30} color={quiet ? C.gold : C.burgundy} />}
              </View>
            </Pressable>
          </View>
          <NavTab label="Safety" on={active === "safety"} icon={<ShieldIcon />} onPress={() => router.push("/staff/safety" as never)} />
          <NavTab label="Reviews" on={active === "reviews"} icon={<ReviewIcon />} onPress={() => router.push("/staff/reviews" as never)} />
        </View>
      </View>
    </>
  );
}

function NavTab({ label, on, icon, onPress }: { label: string; on: boolean; icon: ReactNode; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label} onPress={onPress} style={styles.tab}>
      <View style={{ opacity: on ? 1 : 0.55, transform: [{ translateY: on ? -1 : 0 }] }}>{icon}</View>
      {on ? <Text style={styles.tabLabel}>{label}</Text> : null}
    </Pressable>
  );
}

function GridIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="#fff" strokeWidth={1.6} />
      <Rect x="13.5" y="3.5" width="7" height="7" rx="2" stroke="#fff" strokeWidth={1.6} />
      <Rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke="#fff" strokeWidth={1.6} />
      <Rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="#fff" strokeWidth={1.6} />
    </Svg>
  );
}
function CalIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="15" rx="3" stroke="#fff" strokeWidth={1.6} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
function ShieldIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3 5 5.6v5.6c0 4.4 3 7.8 7 9.3 4-1.5 7-4.9 7-9.3V5.6z" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}
function ReviewIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4.5h14v15H5z" stroke="#fff" strokeWidth={1.6} />
      <Path d="m8.5 12 2.5 2.5 4.5-5" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function MenuIcon({ kind }: { kind: string }) {
  if (kind === "plus") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    );
  }
  if (kind === "check") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="m6 12 4 4 8-8" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (kind === "live") {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" stroke="#fff" strokeWidth={1.6} />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke="#fff" strokeWidth={1.6} />
      <Path d="M4 10h16M10 10v10" stroke="#fff" strokeWidth={1.6} />
    </Svg>
  );
}

export function Chevron() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="m9.5 6 6 6-6 6" stroke="rgba(255,255,255,0.7)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LockIcon({ size = 13 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="10.5" width="14" height="9.5" rx="2.5" stroke="currentColor" strokeWidth={1.6} />
      <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  brand: { height: 28, marginTop: 2, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 8 },
  me: { marginLeft: "auto", width: 30, height: 30, borderRadius: 15, backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  meOn: { borderWidth: 2, borderColor: C.white },
  hd: { paddingHorizontal: 20, paddingTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { ...t(700, 28, 32), color: C.white },
  top: { height: 50, flexDirection: "row", alignItems: "center", paddingRight: 12, paddingLeft: 4, gap: 4 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  main: { flex: 1, overflow: "hidden" },
  chip: { height: 22, paddingHorizontal: 9, borderRadius: 11, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: C.white, borderColor: C.white },
  fl: { ...t(600, 11, 14), letterSpacing: 1.3, textTransform: "uppercase", color: C.w64 },
  sev: { height: 22, paddingHorizontal: 9, borderRadius: 11, flexDirection: "row", alignItems: "center", gap: 5 },
  sevHi: { backgroundColor: C.white },
  sevMd: { borderWidth: 2, borderColor: C.white },
  sevLo: { borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" },
  sevDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.white },
  sevDotOff: { backgroundColor: "transparent", borderWidth: 1, borderColor: "currentColor" },
  av: { backgroundColor: C.deep, alignItems: "center", justifyContent: "center" },
  seg: { marginHorizontal: 20, marginTop: 8, flexDirection: "row", backgroundColor: C.deep, borderRadius: 14, padding: 3 },
  segBtn: { flex: 1, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: C.white },
  pills: { paddingHorizontal: 20, paddingTop: 8, gap: 6 },
  pill: { height: 32, paddingHorizontal: 13, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", alignItems: "center", justifyContent: "center" },
  pillOn: { backgroundColor: C.white, borderColor: C.white },
  gold: { height: 52, borderRadius: 999, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" },
  outline: { height: 46, borderRadius: 999, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center", flex: 1 },
  whiteBtn: { height: 46, borderRadius: 999, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  sm: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.2, borderColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center", flex: 1 },
  smOn: { backgroundColor: C.white, borderColor: C.white },
  sheetWrap: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,4,5,0.62)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: C.card, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", alignSelf: "center", marginBottom: 14 },
  navScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: C.scrim, zIndex: 29 },
  navWrap: { position: "absolute", left: 12, right: 12, height: NAV_HEIGHT, zIndex: 30, overflow: "visible" },
  bar: { ...StyleSheet.absoluteFillObject, borderRadius: 999, backgroundColor: C.raised, borderWidth: 1, borderColor: C.w10, boxShadow: shadow.nav, flexDirection: "row", alignItems: "center", overflow: "visible" },
  pillBg: { position: "absolute", top: 9, width: 52, height: 30, marginLeft: -26, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  tabLabel: { ...t(600, 10.5, 12), color: C.white, marginTop: 2 },
  fabSlot: { flex: 1, height: "100%" },
  fabRing: { position: "absolute", left: "50%", marginLeft: -30, top: -16, width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 5px ${C.ground}, ${shadow.fab}` },
  fab: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  fabGold: { backgroundColor: C.gold },
  fabQuiet: { backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16 },
  menu: { position: "absolute", left: "50%", marginLeft: -135, bottom: 84, width: 270, padding: 8, borderRadius: 24, backgroundColor: C.raised, borderWidth: 1, borderColor: C.w10, boxShadow: shadow.menu },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 16 },
  mi: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.w16 },
});
