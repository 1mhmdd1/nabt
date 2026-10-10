import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop, SvgXml } from "react-native-svg";
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { plantSvg } from "../art/svgs";
import { C, t } from "../theme";
import { useNabt } from "../state";

const DRAW_W = 220;
const DRAW_H = 244;
const VIEW_BOX = "0 -40 220 244";
/** Water line in the rendered box (viewBox y 124, origin y -40). The stem bends from here. */
const STEM_X = 110;
const STEM_Y = 164;
/** Stem tip, where the head sits. The head bends again from here, so the stem looks flexible. */
const TIP_X = 114;
const TIP_Y = 97;
/** Petal base in the rendered box, after the head's 1.2 scale about (114, 57). */
const PETAL_X = 115.4;
const PETAL_Y = 96.8;

/** The open petal, drawn in head coordinates. Extra petals are this shape turned about its base. */
const PETAL = "M115.2 56.8 C118.6 42 131.6 28.4 150.6 23.4 C153.8 22.6 156.8 22.4 159.6 22.8 C159 32 153.6 42.4 144 49.2 C134.6 55.6 124.6 58 115.2 56.8 Z";
const PETAL_TURNS = [0, -104, 20, -124, -52];
/** Root 1 is in the art. Each later root is one of these, drawn from the soil. */
const ROOT_PATHS = [
  "M118 126 C132 142 148 156 164 176",
  "M104 128 C94 144 88 160 84 182",
  "M113 130 C121 148 127 164 130 188",
  "M107 131 C99 150 97 166 93 186",
];
const ROOT_LEN = 80;
const HEAD_GROUP = "translate(114 57) scale(1.2) translate(-114 -57)";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Layers = { ground: string; stem: string; head: string };

/**
 * Split the plant into ground, stem and head. Each layer keeps the shared <defs>,
 * otherwise its gradient fills point at nothing and the layer renders empty.
 * SVG filters are web only; react-native-svg draws them flat or not at all.
 */
function layers(xml: string, petals: number, roots: number): Layers {
  let src = xml;
  if (Platform.OS !== "web") src = src.replace(/\sfilter="url\(#\w+\)"/g, "");
  // The flower glow is its own animated layer now.
  src = src.replace(/<circle cx="128" cy="36" r="46" fill="url\(#flowerGlow\)"\/>/, "");
  if (roots < 1)
    src = src
      .replace(/<g stroke="#E3BE9A" stroke-opacity="\.5"[^>]*>[\s\S]*?<\/g>/, "")
      .replace(/<g stroke="#E8C7A3">[\s\S]*?<\/g>/, "")
      .replace(/<circle cx="152" cy="159"[^>]*\/>/g, "");
  const openEnd = src.indexOf(">") + 1;
  const open = src.slice(src.indexOf("<svg"), openEnd);
  const defs = src.slice(src.indexOf("<defs>"), src.indexOf("</defs>") + "</defs>".length);
  const stemAt = src.indexOf("<!-- stem + bud");
  const headAt = src.indexOf('<g transform="translate(114 57)');
  const closeAt = src.lastIndexOf("</svg>");
  const ground = `${open}${src.slice(openEnd, stemAt)}</svg>`;
  const stemInner = src
    .slice(stemAt, headAt)
    .replace(/<!--[\s\S]*?-->/, "")
    .replace(/^\s*<g>\s*/, "");
  // Drop only the outer stem group's closing tag; the head group keeps its own.
  let headInner = src.slice(headAt, closeAt).replace(/<\/g>\s*$/, "");
  const firstPetal = /<!-- the first petal[\s\S]*?(?=<!-- the seed)/;
  if (petals < 1) headInner = headInner.replace(firstPetal, "");
  const extra = PETAL_TURNS.slice(1, Math.max(1, Math.min(petals, PETAL_TURNS.length)))
    .map((turn) => `<path d="${PETAL}" fill="url(#petalOpen)" transform="rotate(${turn} 115.2 56.8)"/>`)
    .join("");
  headInner = headInner.replace("<!-- the closed bud", `${extra}<!-- the closed bud`);
  return {
    ground,
    stem: `${open}${defs}${stemInner}</svg>`,
    head: `${open}${defs}${headInner}</svg>`,
  };
}

let instances = 0;

/**
 * Give gradient ids a per-plant, per-layer prefix. On web every SvgXml shares one document, so a
 * plain id="stem" resolves to whichever copy came first; if that copy is on a hidden screen,
 * Chrome paints the fill as nothing.
 */
function scopeIds(xml: string, prefix: string) {
  return xml.replace(/id="([\w-]+)"/g, `id="${prefix}$1"`).replace(/url\(#([\w-]+)\)/g, `url(#${prefix}$1)`);
}

/** Rotate about a point in the drawing box. RN rotates about the view centre, so move there and back. */
function about(x: number, y: number, deg: number) {
  "worklet";
  const dx = x - DRAW_W / 2;
  const dy = y - DRAW_H / 2;
  return [{ translateX: dx }, { translateY: dy }, { rotate: `${deg}deg` }, { translateX: -dx }, { translateY: -dy }];
}

function scaleAt(x: number, y: number, s: number) {
  "worklet";
  const dx = x - DRAW_W / 2;
  const dy = y - DRAW_H / 2;
  return [{ translateX: dx }, { translateY: dy }, { scale: s }, { translateX: -dx }, { translateY: -dy }];
}

const SEEN_KEY = "nabt.plant.seen.v1";

/** Last plant the person actually saw, so gains earned on other screens still animate on Home. */
async function readSeen(owner: string) {
  try {
    const raw = await AsyncStorage.getItem(`${SEEN_KEY}.${owner}`);
    if (!raw) return null;
    const v = JSON.parse(raw) as { petals?: number; roots?: number };
    return { petals: Number(v.petals) || 0, roots: Number(v.roots) || 0 };
  } catch {
    return null;
  }
}

function writeSeen(owner: string, v: { petals: number; roots: number }) {
  void AsyncStorage.setItem(`${SEEN_KEY}.${owner}`, JSON.stringify(v)).catch(() => undefined);
}

export function PlantArt({
  badge = null,
  petals = 0,
  roots = 0,
  owner = "me",
  active = true,
}: {
  badge?: string | null;
  petals?: number;
  roots?: number;
  /** Who the plant belongs to, so a second login on the phone doesn't replay someone else's growth. */
  owner?: string;
  /** False while Home is covered by another screen, so growth waits until the person can see it. */
  active?: boolean;
}) {
  const calm = useNabt((s) => s.calmMode);
  const bend = useSharedValue(0);
  const trail = useSharedValue(0);
  // 0 at rest. One soft pulse plays after a new petal or root grows in, then everything is still.
  const glow = useSharedValue(0);
  const rootGlow = useSharedValue(0);
  const petal = useSharedValue(1);
  const rootDraw = useSharedValue(1);
  const [showBadge, setShowBadge] = useState(false);
  const [growingPetal, setGrowingPetal] = useState(false);
  const [growingRoot, setGrowingRoot] = useState(false);
  const seen = useRef<{ petals: number; roots: number } | null>(null);
  const loaded = useRef(false);

  // While a petal or root grows, the static art holds the previous count and the overlay draws the new one.
  const artPetals = growingPetal ? petals - 1 : petals;
  const artRoots = growingRoot ? roots - 1 : roots;
  const scope = useRef(`p${(instances += 1)}`).current;
  const art = useMemo(() => {
    const raw = layers(plantSvg, artPetals, artRoots);
    return {
      ground: scopeIds(raw.ground, `${scope}g-`),
      stem: scopeIds(raw.stem, `${scope}s-`),
      head: scopeIds(raw.head, `${scope}h-`),
    };
  }, [artPetals, artRoots, scope]);

  useEffect(() => {
    // Only the head and stem sway. Petals and roots never loop.
    if (calm) {
      bend.value = 0;
      trail.value = 0;
      return;
    }
    const sway = { duration: 3200, easing: Easing.inOut(Easing.sin) };
    bend.value = withRepeat(withTiming(1, sway), -1, true);
    trail.value = withDelay(420, withRepeat(withTiming(1, sway), -1, true));
  }, [calm, bend, trail]);

  useEffect(
    () => () => {
      cancelAnimation(glow);
      cancelAnimation(rootGlow);
      cancelAnimation(petal);
      cancelAnimation(rootDraw);
    },
    [glow, rootGlow, petal, rootDraw],
  );

  useEffect(() => {
    if (!active) return;
    let live = true;
    const next = { petals, roots };
    const grow = (prev: { petals: number; roots: number }) => {
      const grewPetal = petals > prev.petals && petals <= PETAL_TURNS.length;
      const grewRoot = roots > prev.roots && roots >= 2 && roots - 2 < ROOT_PATHS.length;
      seen.current = next;
      writeSeen(owner, next);
      if (!grewPetal && !grewRoot) {
        setShowBadge(Boolean(badge));
        return;
      }
      setShowBadge(false);
      const finishPetal = () => {
        setGrowingPetal(false);
        setShowBadge(true);
      };
      const finishRoot = () => {
        setGrowingRoot(false);
        if (!grewPetal) setShowBadge(true);
      };
      if (grewPetal) {
        setGrowingPetal(true);
        petal.value = 0;
        petal.value = withDelay(
          250,
          withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }, (done) => {
            if (done) runOnJS(finishPetal)();
          }),
        );
        glow.value = withDelay(
          250 + 900,
          withSequence(withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })),
        );
      }
      if (grewRoot) {
        setGrowingRoot(true);
        rootDraw.value = 0;
        rootDraw.value = withDelay(
          250,
          withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        );
        // One glow pulse as the last part of the grow, then the root is static.
        rootGlow.value = 0;
        rootGlow.value = withDelay(
          250 + 900,
          withSequence(
            withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) }, (done) => {
              if (done) runOnJS(finishRoot)();
            }),
          ),
        );
      }
    };
    if (!loaded.current) {
      loaded.current = true;
      void readSeen(owner).then((stored) => {
        if (!live) return;
        grow(stored ?? next);
      });
    } else if (seen.current) {
      grow(seen.current);
    }
    return () => {
      live = false;
    };
    // badge only changes what shows after growth; owner is stable per login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petals, roots, active]);

  useEffect(() => {
    if (!growingPetal && !growingRoot) setShowBadge(Boolean(badge));
  }, [badge, growingPetal, growingRoot]);

  const stemStyle = useAnimatedStyle(() => ({
    transform: about(STEM_X, STEM_Y, -2.4 + bend.value * 4.8),
  }));
  // Nested inside the stem view, so this turn adds to the stem's and the head lags like a flexible tip.
  const headStyle = useAnimatedStyle(() => ({
    transform: about(TIP_X, TIP_Y, -3.2 + trail.value * 6.4),
  }));
  // The soft glow behind the flower stays still at rest and swells once on a new petal.
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + glow.value * 0.4,
    transform: scaleAt(128, 76, 0.96 + glow.value * 0.1),
  }));
  const petalStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, petal.value * 1.6),
    transform: scaleAt(PETAL_X, PETAL_Y, 0.12 + petal.value * 0.88),
  }));
  const rootProps = useAnimatedProps(() => ({
    strokeDashoffset: ROOT_LEN * (1 - rootDraw.value),
  }));
  const rootGlowProps = useAnimatedProps(() => ({
    strokeOpacity: rootGlow.value * 0.45,
  }));

  const newPetalTurn = PETAL_TURNS[Math.max(0, Math.min(petals, PETAL_TURNS.length) - 1)];
  const newRoot = ROOT_PATHS[Math.max(0, Math.min(roots - 2, ROOT_PATHS.length - 1))];
  const steadyRoots = ROOT_PATHS.slice(0, Math.max(0, Math.min(artRoots - 1, ROOT_PATHS.length)));

  // The first petal opens in front of the bud; later ones open behind it.
  const newPetal = (
    <Animated.View style={[styles.fill, petalStyle]} pointerEvents="none">
      <Svg width={DRAW_W} height={DRAW_H} viewBox={VIEW_BOX}>
        <G transform={HEAD_GROUP}>
          <Path d={PETAL} fill="#E3BE9A" transform={`rotate(${newPetalTurn} 115.2 56.8)`} />
        </G>
      </Svg>
    </Animated.View>
  );

  return (
    <View style={styles.art} accessibilityLabel="Your plant. The stem bends from the soil, and the flower follows.">
      <View style={styles.draw}>
        <SvgXml xml={art.ground} width={DRAW_W} height={DRAW_H} />
      </View>
      <Svg width={DRAW_W} height={DRAW_H} viewBox={VIEW_BOX} style={styles.draw} pointerEvents="none">
        {steadyRoots.map((d) => (
          <Path key={d} d={d} fill="none" stroke="#E8C7A3" strokeWidth={1.6} strokeLinecap="round" strokeOpacity={0.85} />
        ))}
        {growingRoot ? (
          <AnimatedPath d={newRoot} fill="none" stroke="#E3BE9A" strokeWidth={6} strokeLinecap="round" animatedProps={rootGlowProps} />
        ) : null}
        {growingRoot ? (
          <AnimatedPath
            d={newRoot}
            fill="none"
            stroke="#E8C7A3"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeDasharray={`${ROOT_LEN} ${ROOT_LEN}`}
            animatedProps={rootProps}
          />
        ) : null}
      </Svg>
      <Animated.View style={[styles.draw, stemStyle]} pointerEvents="none">
        <SvgXml xml={art.stem} width={DRAW_W} height={DRAW_H} />
        <Animated.View style={[styles.fill, headStyle]} pointerEvents="none">
          <Animated.View style={[styles.fill, glowStyle]} pointerEvents="none">
            <Svg width={DRAW_W} height={DRAW_H} viewBox={VIEW_BOX}>
              <Defs>
                <RadialGradient id={`${scope}glow`} cx="128" cy="36" r="58" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#E3BE9A" stopOpacity={0.42} />
                  <Stop offset="0.55" stopColor="#E3BE9A" stopOpacity={0.12} />
                  <Stop offset="1" stopColor="#E3BE9A" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx="128" cy="36" r="58" fill={`url(#${scope}glow)`} />
            </Svg>
          </Animated.View>
          {growingPetal && newPetalTurn !== 0 ? newPetal : null}
          <SvgXml xml={art.head} width={DRAW_W} height={DRAW_H} />
          {growingPetal && newPetalTurn === 0 ? newPetal : null}
        </Animated.View>
      </Animated.View>
      {showBadge && badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  art: {
    width: DRAW_W,
    height: 190,
    overflow: "visible",
    backgroundColor: "transparent",
  },
  draw: {
    position: "absolute",
    top: -40,
    left: 0,
    width: DRAW_W,
    height: DRAW_H,
    overflow: "visible",
    backgroundColor: "transparent",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    width: DRAW_W,
    height: DRAW_H,
    overflow: "visible",
  },
  badge: {
    position: "absolute",
    left: 158,
    top: 140,
    height: 20,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: C.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...t(700, 11, 11), color: C.burgundy, letterSpacing: 0.1 },
});
