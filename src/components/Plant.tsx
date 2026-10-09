import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, SvgXml } from "react-native-svg";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { plantSvg } from "../art/svgs";
import { C, t } from "../theme";
import { useNabt } from "../state";

const DRAW_W = 220;
const DRAW_H = 244;
/** Water line in the rendered box: viewBox y 124, viewBox origin y -40. */
const PIVOT_X = 110;
const PIVOT_Y = 164;
/** Petal base, where a new petal scales from. */
const PETAL_X = 115;
const PETAL_Y = 97;

const NEW_ROOT = "M118 126 C132 142 148 156 164 176";
const PETAL = "M115.2 56.8 C118.6 42 131.6 28.4 150.6 23.4 C153.8 22.6 156.8 22.4 159.6 22.8 C159 32 153.6 42.4 144 49.2 C134.6 55.6 124.6 58 115.2 56.8 Z";

const AnimatedPath = Animated.createAnimatedComponent(Path);

function layers(xml: string) {
  const openEnd = xml.indexOf(">") + 1;
  const open = xml.slice(xml.indexOf("<svg"), openEnd);
  const stemAt = xml.indexOf("<!-- stem + bud");
  const headAt = xml.indexOf('<g transform="translate(114 57)');
  const closeAt = xml.lastIndexOf("</svg>");
  const ground = `${open}${xml.slice(openEnd, stemAt)}</svg>`;
  const stemInner = xml.slice(stemAt, headAt).replace(/^\s*<g>\s*/, "");
  const headInner = xml.slice(headAt, closeAt).replace(/<\/g>\s*<\/g>\s*$/, "");
  return {
    ground,
    stem: `${open}${stemInner}</svg>`,
    head: `${open}${headInner}</svg>`,
  };
}

export function PlantArt({
  badge = null,
  petals = 0,
  roots = 0,
}: {
  badge?: string | null;
  petals?: number;
  roots?: number;
}) {
  const calm = useNabt((s) => s.calmMode);
  const art = useMemo(() => layers(plantSvg), []);
  const bend = useSharedValue(0);
  const trail = useSharedValue(0);
  const petal = useSharedValue(1);
  const rootDraw = useSharedValue(1);
  const [showBadge, setShowBadge] = useState(Boolean(badge));
  const [growingPetal, setGrowingPetal] = useState(false);
  const [growingRoot, setGrowingRoot] = useState(false);
  const seen = useRef<{ petals: number; roots: number } | null>(null);

  useEffect(() => {
    if (calm) {
      bend.value = 0;
      trail.value = 0;
      return;
    }
    bend.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
    trail.value = withDelay(260, withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [calm, bend, trail]);

  useEffect(() => {
    const next = { petals, roots };
    const prev = seen.current;
    seen.current = next;
    if (!prev) {
      setShowBadge(Boolean(badge));
      return;
    }
    const grewPetal = petals > prev.petals;
    const grewRoot = roots > prev.roots;
    if (!grewPetal && !grewRoot) {
      setShowBadge(Boolean(badge));
      return;
    }
    setShowBadge(false);
    const finish = () => setShowBadge(true);
    if (grewPetal) {
      setGrowingPetal(true);
      petal.value = 0.12;
      petal.value = withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done) runOnJS(finish)();
      });
    }
    if (grewRoot) {
      setGrowingRoot(true);
      rootDraw.value = 0;
      rootDraw.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done && !grewPetal) runOnJS(finish)();
      });
    }
  }, [petals, roots, badge, petal, rootDraw]);

  const stemStyle = useAnimatedStyle(() => ({
    transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px`,
    transform: [{ rotate: `${-2.4 + bend.value * 4.8}deg` }],
  }));
  const headStyle = useAnimatedStyle(() => ({
    transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px`,
    transform: [{ rotate: `${-4.2 + trail.value * 8.4}deg` }],
  }));
  const petalStyle = useAnimatedStyle(() => ({
    opacity: petal.value,
    transformOrigin: `${PETAL_X}px ${PETAL_Y}px`,
    transform: [{ scale: 0.15 + petal.value * 0.85 }],
  }));
  const rootProps = useAnimatedProps(() => ({
    strokeDashoffset: 80 * (1 - rootDraw.value),
  }));

  return (
    <View style={styles.art} accessibilityLabel="Your plant. The stem bends from the soil, and the flower follows.">
      <View style={styles.draw}>
        <SvgXml xml={art.ground} width={DRAW_W} height={DRAW_H} />
      </View>
      <Animated.View style={[styles.draw, calm ? undefined : stemStyle]} pointerEvents="none">
        <SvgXml xml={art.stem} width={DRAW_W} height={DRAW_H} />
      </Animated.View>
      <Animated.View style={[styles.draw, calm ? undefined : headStyle]} pointerEvents="none">
        <SvgXml xml={art.head} width={DRAW_W} height={DRAW_H} />
      </Animated.View>
      {growingPetal ? (
        <Animated.View style={[styles.draw, petalStyle]} pointerEvents="none">
          <Svg width={DRAW_W} height={DRAW_H} viewBox="0 -40 220 244">
            <Path d={PETAL} fill="#E3BE9A" />
          </Svg>
        </Animated.View>
      ) : null}
      {growingRoot ? (
        <Svg width={DRAW_W} height={DRAW_H} viewBox="0 -40 220 244" style={styles.draw} pointerEvents="none">
          <AnimatedPath
            d={NEW_ROOT}
            fill="none"
            stroke="#E8C7A3"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="80 80"
            animatedProps={rootProps}
          />
        </Svg>
      ) : null}
      {showBadge && badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  art: { width: DRAW_W, height: 190, overflow: "visible", backgroundColor: "transparent" },
  draw: { position: "absolute", top: -40, left: 0, width: DRAW_W, height: DRAW_H, overflow: "visible", backgroundColor: "transparent" },
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
