import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SvgXml } from "react-native-svg";
import { lotusDefs } from "../src/art/svgs";
import {
  BAR_X1,
  BAR_X2,
  BAR_Y,
  FLOWER_PETAL_D,
  FLOWER_SPOTS,
  SPARKLE_D,
  SPARKLE_DOTS,
  SPARKLES,
  THRIVE_DOT_D,
  THRIVE_FLAME_D,
  THRIVE_PETALS,
} from "../src/art/thriveParts";
import { HomeIndicator } from "../src/components/Chrome";
import { resolveLaunchRoute } from "../src/intro";
import { C, t } from "../src/theme";
import { useNabt } from "../src/state";

const W = 390;
const H = 844;
const CX = W / 2;
const CY = H / 2;

// Timeline (ms). The whole loader plays on every launch; tap skips it.
const WORD_IN = 0; //      THRIVE alone, centred
const MORPH = 650; //      the word settles down while the lotus blooms above it
const BAR_START = 1500; // the flower bar fills, flower by flower
const BAR_MS = 1250;
const LEAVE = 3000;
const CALM_LEAVE = 900;

const native = Platform.OS !== "web";
const stage = (inner: string) => `<svg viewBox="0 0 ${W} ${H}">${lotusDefs}${inner}</svg>`;

const PETAL_XML = THRIVE_PETALS.map((p) => stage(`<path d="${p.d}" fill="url(#${p.grad})"/>`));
const FLAME_XML = stage(
  `<circle cx="195.5" cy="353" r="10.5" fill="#fff" fill-opacity=".89"/>` +
    `<g transform="translate(195 371)"><path d="${THRIVE_FLAME_D}" fill="#fff" fill-opacity=".89"/></g>` +
    `<path transform="translate(185 343)" d="${THRIVE_DOT_D}" fill="#fff" fill-opacity=".89"/>`,
);

function flowerXml(tilt: number, opacity: number) {
  const petals = [0, 72, 144, 216, 288].map((r) => `<path d="${FLOWER_PETAL_D}" transform="rotate(${r})"/>`).join("");
  return (
    `<svg viewBox="-10 -10 20 20"><g opacity="${opacity}" transform="rotate(${tilt})">` +
    `<g fill="none" stroke="#E3BE9A" stroke-width=".8" stroke-linejoin="round">${petals}</g>` +
    `<circle r="1.2" fill="#E3BE9A"/></g></svg>`
  );
}
const FLOWER_DIM = FLOWER_SPOTS.map((f) => flowerXml(f.tilt, 0.32));
const FLOWER_LIT = FLOWER_SPOTS.map((f) => flowerXml(f.tilt, 1));
const SPARKLE_XML = `<svg viewBox="-5 -5 10 10"><path d="${SPARKLE_D}" fill="#E3BE9A"/></svg>`;
const DOT_XML = (r: number) => `<svg viewBox="-2 -2 4 4"><circle r="${r}" fill="#E3BE9A"/></svg>`;

/** Scale around a point of the 390x844 stage instead of the layer centre. */
function scaleAbout(ox: number, oy: number, scale: Animated.AnimatedInterpolation<number> | Animated.Value) {
  return [{ translateX: ox - CX }, { translateY: oy - CY }, { scale }, { translateX: -(ox - CX) }, { translateY: -(oy - CY) }];
}

export default function Launch() {
  const calm = useNabt((s) => s.calmMode);
  const { hold } = useLocalSearchParams<{ hold?: string }>();
  // Intro on the first launch only; afterwards straight to the campus or sign-in.
  const next = useRef<Promise<string> | null>(null);
  if (!next.current) next.current = resolveLaunchRoute();
  const leave = () => {
    void next.current?.then((href) => router.replace(href as never));
  };

  const word = useRef(new Animated.Value(0)).current; //  0 → 1: fades in
  const wordDrop = useRef(new Animated.Value(0)).current; // 0 → 1: moves from centre to under the lotus
  const petals = useRef(THRIVE_PETALS.map(() => new Animated.Value(0))).current;
  const flame = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const flowers = useRef(FLOWER_SPOTS.map(() => new Animated.Value(0))).current;
  const twinkle = useRef(SPARKLE_DOTS.map(() => new Animated.Value(0))).current;
  const glint = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anims: Animated.CompositeAnimation[] = [];
    if (calm) {
      // Reduced motion: everything is already in place and simply fades in.
      wordDrop.setValue(1);
      petals.forEach((v) => v.setValue(1));
      flame.setValue(1);
      bar.setValue(1);
      glint.setValue(1);
      flowers.forEach((v) => v.setValue(1));
      anims.push(Animated.timing(word, { toValue: 1, duration: 400, useNativeDriver: native }));
    } else {
      anims.push(
        Animated.sequence([
          Animated.delay(WORD_IN),
          Animated.timing(word, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
        ]),
        Animated.sequence([
          Animated.delay(MORPH),
          Animated.timing(wordDrop, { toValue: 1, duration: 780, easing: Easing.inOut(Easing.cubic), useNativeDriver: native }),
        ]),
        ...THRIVE_PETALS.map((p, i) =>
          Animated.sequence([
            Animated.delay(MORPH + 200 + p.wave * 150),
            Animated.timing(petals[i], { toValue: 1, duration: 560, easing: Easing.out(Easing.back(1.3)), useNativeDriver: native }),
          ]),
        ),
        Animated.sequence([
          Animated.delay(MORPH + 300),
          Animated.timing(flame, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
        ]),
        Animated.sequence([
          Animated.delay(BAR_START),
          Animated.timing(bar, { toValue: 1, duration: BAR_MS, easing: Easing.inOut(Easing.quad), useNativeDriver: native }),
        ]),
        ...FLOWER_SPOTS.map((f, i) =>
          Animated.sequence([
            // each flower lights up as the line reaches it
            Animated.delay(BAR_START + (BAR_MS * (f.x - BAR_X1)) / (BAR_X2 - BAR_X1)),
            Animated.timing(flowers[i], { toValue: 1, duration: 380, easing: Easing.out(Easing.back(1.6)), useNativeDriver: native }),
          ]),
        ),
        Animated.sequence([
          Animated.delay(BAR_START),
          Animated.timing(glint, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: native }),
        ]),
      );
    }
    const main = Animated.parallel(anims);
    main.start();

    // Sparkles keep twinkling for as long as the loader is on screen.
    const loops = twinkle.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(calm ? 0 : BAR_START + i * 90),
          Animated.timing(v, { toValue: 1, duration: 420 + i * 40, useNativeDriver: native }),
          Animated.timing(v, { toValue: 0.15, duration: 520 + i * 30, useNativeDriver: native }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!hold) timer = setTimeout(leave, calm ? CALM_LEAVE : LEAVE);
    return () => {
      main.stop();
      loops.forEach((l) => l.stop());
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calm, hold, word, wordDrop, petals, flame, bar, flowers, twinkle, glint]);

  const wordStyle = useMemo(
    () => ({
      opacity: word,
      transform: [
        { translateY: wordDrop.interpolate({ inputRange: [0, 1], outputRange: [CY - 13 - 476, 0] }) },
        { scale: word.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
      ],
    }),
    [word, wordDrop],
  );

  return (
    <Pressable
      style={styles.screen}
      accessibilityRole="button"
      accessibilityLabel="Thrive, loading. Tap to skip."
      onPress={leave}
    >
      <View style={[styles.art, { pointerEvents: "none" }]}>
        {/* lotus petals, each growing from its own base */}
        {THRIVE_PETALS.map((p, i) => (
          <Animated.View
            key={p.grad}
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: petals[i].interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
                transform: scaleAbout(p.ox, p.oy, petals[i].interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] })),
              },
            ]}
          >
            <SvgXml xml={PETAL_XML[i]} width={W} height={H} />
          </Animated.View>
        ))}
        {/* white flame and dot */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: flame,
              transform: [{ translateY: flame.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            },
          ]}
        >
          <SvgXml xml={FLAME_XML} width={W} height={H} />
        </Animated.View>

        {/* THRIVE: alone in the centre first, then it settles under the lotus */}
        <Animated.Text style={[styles.word, wordStyle]} accessibilityElementsHidden>
          THRIVE
        </Animated.Text>

        {/* loading bar: faint track, lit line, flowers, sparkles */}
        <Animated.View style={[styles.track, { left: BAR_X1, top: BAR_Y - 0.3, width: BAR_X2 - BAR_X1, opacity: glint }]} />
        <Animated.View
          style={[
            styles.line,
            {
              left: BAR_X1,
              top: BAR_Y - 0.6,
              width: BAR_X2 - BAR_X1,
              opacity: glint,
              transform: [{ translateX: -(BAR_X2 - BAR_X1) / 2 }, { scaleX: bar }, { translateX: (BAR_X2 - BAR_X1) / 2 }],
            },
          ]}
        />
        {FLOWER_SPOTS.map((f, i) => (
          <View key={f.x} style={[styles.flower, { left: f.x - 10, top: BAR_Y - 10 }]}>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: glint }]}>
              <SvgXml xml={FLOWER_DIM[i]} width={20} height={20} />
            </Animated.View>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: flowers[i],
                  transform: [{ scale: flowers[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
                },
              ]}
            >
              <SvgXml xml={FLOWER_LIT[i]} width={20} height={20} />
            </Animated.View>
          </View>
        ))}
        {SPARKLE_DOTS.map((d, i) => (
          <Animated.View
            key={`${d.x}-${d.y}`}
            style={[styles.dot, { left: d.x - 2, top: d.y - 2, opacity: Animated.multiply(glint, twinkle[i]) }]}
          >
            <SvgXml xml={DOT_XML(d.r)} width={4} height={4} />
          </Animated.View>
        ))}
        {SPARKLES.map((sp, i) => (
          <Animated.View
            key={sp.x}
            style={[
              styles.sparkle,
              {
                left: sp.x - 5,
                top: sp.y - 5,
                opacity: Animated.multiply(glint, twinkle[(i * 3 + 1) % twinkle.length]),
                transform: [
                  { scale: Animated.multiply(twinkle[(i * 3 + 1) % twinkle.length], sp.scale).interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) },
                  { rotate: twinkle[(i * 3 + 1) % twinkle.length].interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) },
                ],
              },
            ]}
          >
            <SvgXml xml={SPARKLE_XML} width={10} height={10} />
          </Animated.View>
        ))}
      </View>
      <HomeIndicator />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ground, alignItems: "center", justifyContent: "center" },
  art: { width: W, height: H },
  word: {
    position: "absolute",
    left: 4.4,
    right: 0,
    top: 476,
    textAlign: "center",
    ...t(500, 21, 26),
    letterSpacing: 8.8,
    color: C.white,
  },
  track: { position: "absolute", height: 0.6, backgroundColor: "rgba(207,156,116,0.3)" },
  line: { position: "absolute", height: 1.2, borderRadius: 1, backgroundColor: C.goldLight },
  flower: { position: "absolute", width: 20, height: 20 },
  dot: { position: "absolute", width: 4, height: 4 },
  sparkle: { position: "absolute", width: 10, height: 10 },
});
