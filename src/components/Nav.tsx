import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { C, shadow, t } from "../theme";
import { demoLocal } from "../local/mode";
import {
  IconCalendar,
  IconChat,
  IconClose,
  IconCompose,
  IconDiscover,
  IconDoc,
  IconHeart,
  IconHome,
  IconLotus,
  IconMe,
} from "./Icons";

export type TabId = "home" | "discover" | "chats" | "me";

const SLOTS: Record<TabId, number> = { home: 0, discover: 1, chats: 3, me: 4 };

const ITEMS = [
  { title: "Post a thread", sub: "Ask your Circle, kindly", icon: <IconCompose />, href: "/circle/exam-week" },
  { title: "Propose a meetup", sub: "A counselor approves the spot", icon: <IconCalendar />, href: "/circle/exam-week" },
  { title: "Leave a node note", sub: "Shows on a Hope Node screen", icon: <IconHeart />, href: "/n/engineering", node: true },
  { title: "Start a petition", sub: "Ask Student Affairs for a change", icon: <IconDoc />, href: "/discover" },
].filter((item) => !(item.node && demoLocal())); // Hope Node is the next step, not part of the demo.

export function FloatingNav({
  active,
  quiet,
  open,
  onToggle,
  showDot = true,
}: {
  active: TabId;
  quiet?: boolean;
  open: boolean;
  onToggle: () => void;
  showDot?: boolean;
}) {
  const slot = SLOTS[active];
  const go = (href: string) => {
    onToggle();
    router.push(href as never);
  };
  return (
    <>
      {open ? (
        <Pressable style={styles.scrim} onPress={onToggle} accessibilityLabel="Close create menu" />
      ) : null}
      <View style={[styles.wrap, { pointerEvents: "box-none" }]}>
        {open ? (
          <View style={styles.menu} accessibilityRole="menu" accessibilityLabel="Create">
            {ITEMS.map((item) => (
              <Pressable key={item.title} style={styles.menuItem} onPress={() => go(item.href)} accessibilityRole="menuitem">
                <View style={styles.mi}>{item.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text style={[t(600, 15, 18), { color: C.white }]}>{item.title}</Text>
                  <Text style={[t(400, 12, 16), { color: C.w64, marginTop: 2 }]}>{item.sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.bar}>
          <View
            style={[
              styles.pill,
              { left: `${(slot + 0.5) * 20}%`, marginLeft: -26, pointerEvents: "none" },
            ]}
          />
          <Tab label="Home" on={active === "home"} icon={<IconHome />} onPress={() => router.push("/home" as never)} />
          <Tab label="Discover" on={active === "discover"} icon={<IconDiscover />} onPress={() => router.push("/discover" as never)} />
          <View style={styles.fabSlot}>
            <Pressable
              accessibilityLabel="Create"
              accessibilityState={{ expanded: open }}
              onPress={onToggle}
              style={[styles.fabRing]}
            >
              <View style={[styles.fab, quiet ? styles.fabQuiet : styles.fabGold]}>
                {open ? (
                  <IconClose color={quiet ? C.gold : C.burgundy} />
                ) : (
                  <IconLotus size={30} color={quiet ? C.gold : C.burgundy} />
                )}
              </View>
            </Pressable>
          </View>
          <Tab
            label="Chats"
            on={active === "chats"}
            icon={<IconChat />}
            dot={showDot}
            onPress={() => router.push("/chats" as never)}
          />
          <Tab label="Me" on={active === "me"} icon={<IconMe />} onPress={() => router.push("/me" as never)} />
        </View>
      </View>
    </>
  );
}

function Tab({
  label,
  on,
  icon,
  onPress,
  dot,
}: {
  label: string;
  on: boolean;
  icon: React.ReactNode;
  onPress: () => void;
  dot?: boolean;
}) {
  return (
    <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: on }} onPress={onPress} style={styles.tab}>
      <View style={{ transform: [{ translateY: on ? -1 : 0 }], opacity: on ? 1 : 0.55 }}>{icon}</View>
      {dot ? <View style={styles.dot} accessibilityLabel="Unread" /> : null}
      {on ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: C.scrim, zIndex: 29 },
  wrap: { position: "absolute", left: 12, right: 12, bottom: 24, height: 64, zIndex: 30 },
  bar: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: C.raised,
    borderWidth: 1,
    borderColor: C.w10,
    boxShadow: shadow.nav,
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    top: 9,
    width: 52,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tab: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center" },
  label: { ...t(600, 10.5, 11), color: C.white, marginTop: 3 },
  dot: {
    position: "absolute",
    top: 12,
    marginLeft: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.white,
    borderWidth: 2,
    borderColor: C.raised,
  },
  fabSlot: { flex: 1, height: "100%" },
  fabRing: {
    position: "absolute",
    left: "50%",
    marginLeft: -30,
    top: -16,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 0 0 5px ${C.burgundy}, ${shadow.fab}`,
  },
  fab: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  fabGold: { backgroundColor: C.gold },
  fabQuiet: { backgroundColor: C.deep, borderWidth: 1, borderColor: C.w16 },
  menu: {
    position: "absolute",
    left: "50%",
    marginLeft: -135,
    bottom: 84,
    width: 270,
    padding: 8,
    borderRadius: 24,
    backgroundColor: C.raised,
    borderWidth: 1,
    borderColor: C.w10,
    boxShadow: shadow.menu,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 16 },
  mi: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.w16,
  },
});
