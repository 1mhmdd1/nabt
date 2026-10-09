import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SvgXml } from "react-native-svg";
import { dotsSvg, nextSvg, verifySvg } from "../src/art/svgs";
import { SPROUT, SUPPORT_IMAGE } from "../src/art/onboardingParts";
import { HomeIndicator } from "../src/components/Chrome";
import { IconArrow } from "../src/components/Icons";
import { markIntroSeen } from "../src/intro";
import { C, t } from "../src/theme";
import { useNabt } from "../src/state";

const W = 390;
const H = 844;
const CX = W / 2;
const CY = H / 2;
const native = Platform.OS !== "web";

type Slide = { title: string[]; body: string[]; art: "sprout" | "people" };
const SLIDES: Slide[] = [
  { title: ["Understand", "yourself."], body: ["Take a moment", "for your mind, body", "and heart."], art: "sprout" },
  { title: ["Support", "students."], body: ["Bringing students", "together to grow,", "positively."], art: "people" },
  { title: ["Find", "your circle."], body: ["Your campus is full", "of people who", "understand."], art: "sprout" },
];
const VERIFY = SLIDES.length; // the fourth page: lotus + "Scan your ID card"

const stage = (inner: string) => `<svg viewBox="0 0 ${W} ${H}">${inner}</svg>`;
const clipped = (id: "l" | "c" | "r" | "s") =>
  stage(`<defs><clipPath id="k${id}">${SPROUT.clips[id]}</clipPath></defs><g clip-path="url(#k${id})">${SPROUT.art}</g>`);
const SOIL_XML = clipped("s");
const LEAF_XML = { l: clipped("l"), c: clipped("c"), r: clipped("r") };
const STEM_XML = stage(
  `<path d="${SPROUT.stemD}" transform="${SPROUT.stemTransform}" fill="none" stroke="#E2B485" stroke-width="2" stroke-linecap="round"/>`,
);
const PEOPLE_XML = stage(`<image ${SUPPORT_IMAGE.attrs} href="${SUPPORT_IMAGE.href}"/>`);

/** Where each leaf grows from (the base of the sprout). */
const LEAF_BASE = { l: { x: 167, y: 501 }, c: { x: 168, y: 501 }, r: { x: 170, y: 501 } };

function scaleAbout(x: number, y: number, scale: Animated.AnimatedInterpolation<number>) {
  return [{ translateX: x - CX }, { translateY: y - CY }, { scale }, { translateX: -(x - CX) }, { translateY: -(y - CY) }];
}

/**
 * Reveals a full-stage drawing from left to right. The clipping box slides in from the
 * left while the drawing inside slides the other way, so the art itself never moves.
 */
function Wipe({
  xml,
  left,
  top,
  width,
  height,
  progress,
}: {
  xml: string;
  left: number;
  top: number;
  width: number;
  height: number;
  progress: Animated.Value;
}) {
  const box = progress.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] });
  const art = progress.interpolate({ inputRange: [0, 1], outputRange: [width, 0] });
  return (
    <Animated.View style={{ position: "absolute", left, top, width, height, overflow: "hidden", transform: [{ translateX: box }] }}>
      <Animated.View style={{ position: "absolute", left: -left, top: -top, width: W, height: H, transform: [{ translateX: art }] }}>
        <SvgXml xml={xml} width={W} height={H} />
      </Animated.View>
    </Animated.View>
  );
}

function timing(v: Animated.Value, delay: number, duration: number, easing = Easing.out(Easing.cubic)) {
  return Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: native })]);
}

/** One intro page. Mounting it plays the entrance: text, then the stem draws and the leaves grow. */
function Page({ slide, calm }: { slide: Slide; calm: boolean }) {
  const title = useRef(new Animated.Value(0)).current;
  const body = useRef(new Animated.Value(0)).current;
  const soil = useRef(new Animated.Value(0)).current;
  const stem = useRef(new Animated.Value(0)).current;
  const leaves = useRef({ l: new Animated.Value(0), r: new Animated.Value(0), c: new Animated.Value(0) }).current;
  const people = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const all = [title, body, soil, stem, leaves.l, leaves.r, leaves.c, people];
    if (calm) {
      all.forEach((v) => v.setValue(1));
      return;
    }
    all.forEach((v) => v.setValue(0));
    const anim = Animated.parallel([
      timing(title, 0, 420),
      timing(body, 160, 460),
      timing(soil, 120, 760, Easing.inOut(Easing.cubic)),
      timing(stem, 560, 700, Easing.inOut(Easing.cubic)),
      timing(leaves.l, 700, 640, Easing.out(Easing.back(1.25))),
      timing(leaves.r, 850, 640, Easing.out(Easing.back(1.25))),
      timing(leaves.c, 1000, 680, Easing.out(Easing.back(1.2))),
      timing(people, 260, 700),
    ]);
    anim.start();
    return () => anim.stop();
  }, [slide, calm, title, body, soil, stem, leaves, people]);

  const rise = (v: Animated.Value, from = 16) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  });
  const leaf = (k: "l" | "c" | "r") => ({
    opacity: leaves[k].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
    transform: scaleAbout(LEAF_BASE[k].x, LEAF_BASE[k].y, leaves[k].interpolate({ inputRange: [0, 1], outputRange: [0.05, 1] })),
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.title, rise(title)]}>
        {slide.title.map((line) => (
          <Text key={line} style={styles.titleText}>
            {line}
          </Text>
        ))}
      </Animated.View>
      <Animated.View style={[styles.body, rise(body, 12)]}>
        {slide.body.map((line) => (
          <Text key={line} style={styles.bodyText}>
            {line}
          </Text>
        ))}
      </Animated.View>
      {slide.art === "sprout" ? (
        <>
          {/* soil curve from the left edge to the plant */}
          <Wipe xml={SOIL_XML} left={-20} top={499} width={226} height={122} progress={soil} />
          {/* thin stem continuing to the right edge */}
          <Wipe xml={STEM_XML} left={104} top={520} width={310} height={110} progress={stem} />
          {(["l", "r", "c"] as const).map((k) => (
            <Animated.View key={k} style={[StyleSheet.absoluteFill, leaf(k)]}>
              <SvgXml xml={LEAF_XML[k]} width={W} height={H} />
            </Animated.View>
          ))}
        </>
      ) : (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: people,
              transform: scaleAbout(187, 448, people.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] })),
            },
          ]}
        >
          <SvgXml xml={PEOPLE_XML} width={W} height={H} />
        </Animated.View>
      )}
    </View>
  );
}

export default function Onboarding() {
  const params = useLocalSearchParams<{ step?: string }>();
  const calm = useNabt((s) => s.calmMode);
  const [step, setStep] = useState(Math.min(VERIFY, Number(params.step || 0)));
  const shift = useRef(new Animated.Value(1)).current; // 1 = in place, 0 = slid away
  const busy = useRef(false);

  const dots = dotsSvg.replace('id="dotOn"', `id="dotOn" transform="translate(${Math.min(step, 2) * 30} 0)"`);

  const go = (next: number) => {
    if (busy.current || next === step) return;
    busy.current = true;
    if (calm) {
      setStep(next);
      busy.current = false;
      return;
    }
    Animated.timing(shift, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: native }).start(() => {
      setStep(next);
      shift.setValue(2); // enters from the right
      Animated.timing(shift, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start(() => {
        busy.current = false;
      });
    });
  };

  const leave = (href: string) => {
    void markIntroSeen();
    router.push(href as never);
  };

  const slideStyle = {
    opacity: shift.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 1, 0] }),
    transform: [{ translateX: shift.interpolate({ inputRange: [0, 1, 2], outputRange: [-48, 0, 48] }) }],
  };

  return (
    <View style={styles.screen}>
      <View style={styles.stage}>
        {step === VERIFY ? (
          <Animated.View style={[StyleSheet.absoluteFill, slideStyle]}>
            <SvgXml xml={verifySvg} width={W} height={H} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan your ID card"
              onPress={() => leave("/signup/scan")}
              style={styles.cta}
            >
              <IconArrow color={C.burgundy} />
              <Text style={[t(600, 16, 16), { color: C.burgundy, letterSpacing: 0.16 }]}>Scan your ID card</Text>
            </Pressable>
            <Text style={styles.hint}>
              Only a staff reviewer sees your ID.{"\n"}Peers see a nickname.
            </Text>
            <Text style={styles.signin}>
              Already have an account?{" "}
              <Text style={styles.link} onPress={() => leave("/login")}>
                Sign in
              </Text>
            </Text>
          </Animated.View>
        ) : (
          <>
            <Animated.View style={[StyleSheet.absoluteFill, slideStyle]}>
              <Page key={step} slide={SLIDES[step]} calm={calm} />
            </Animated.View>
            <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
              <SvgXml xml={dots} width={W} height={H} />
            </View>
            <Pressable accessibilityLabel="Next" onPress={() => go(step + 1)} style={styles.next}>
              <SvgXml xml={nextSvg} width={72} height={72} />
            </Pressable>
          </>
        )}
        <HomeIndicator />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ground, alignItems: "center", justifyContent: "center" },
  stage: { width: W, height: H, backgroundColor: C.ground, overflow: "hidden" },
  title: { position: "absolute", left: 80.8, top: 104, right: 24 },
  titleText: { ...t(400, 38, 44), color: C.white },
  body: { position: "absolute", left: 84.9, top: 262, right: 24 },
  bodyText: { ...t(400, 22.4, 28), color: C.white },
  next: { position: "absolute", left: 158.5, top: 607, width: 72, height: 72 },
  cta: {
    position: "absolute",
    left: 40,
    top: 518,
    width: 310,
    height: 50,
    borderRadius: 999,
    backgroundColor: C.gold,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow: "0 0 0 1px rgba(255,255,255,0.18), 0 0 0 6px rgba(207,156,116,0.12)",
  },
  hint: {
    position: "absolute",
    left: 40,
    width: 310,
    top: 586,
    textAlign: "center",
    ...t(500, 12.5, 18),
    color: C.w64,
  },
  signin: { position: "absolute", left: 40, width: 310, top: 660, textAlign: "center", ...t(500, 13.5, 18), color: C.w80 },
  link: { color: C.white, fontWeight: "600", textDecorationLine: "underline" },
});
