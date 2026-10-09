import { useEffect, useId } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { LOTUS_SVG, LOTUS_VIEWBOX } from "../art/lotusSvg";
import { PERK_QR_SVG } from "../art/perkQrSvg";
import { useNabt } from "../state";

/** Sprout crop from the same lotus drawing (garden, 4th bloom). */
export const SPROUT_VIEWBOX = "158 338 64 126";

function xmlFor(prefix: string, viewBox: string, width: number, height: number, goldOnly = false) {
  let xml = LOTUS_SVG;
  if (goldOnly) {
    xml = xml.replace(/<g transform="translate\(195 371\)">[\s\S]*?<\/g>/, "");
  }
  return xml.replace(/\b(Lg[0-4]|Sg[0-4]|dotGold)\b/g, `${prefix}$1`).replace(
    /<svg[^>]*>/,
    `<svg width="${width}" height="${height}" viewBox="${viewBox}">`,
  );
}

export function LotusArt({
  width = 190,
  height = 132,
  viewBox = LOTUS_VIEWBOX,
  faded = false,
  goldOnly = false,
}: {
  width?: number;
  height?: number;
  viewBox?: string;
  faded?: boolean;
  /** Bloom moment: gold petals and the white moon dot, without the white center petal. */
  goldOnly?: boolean;
}) {
  const prefix = `L${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View style={{ width, height, opacity: faded ? 0.45 : 1 }} accessibilityElementsHidden>
      <SvgXml xml={xmlFor(prefix, viewBox, width, height, goldOnly)} width={width} height={height} />
    </View>
  );
}

/** Bloom moment: opens from 0.55 to full. Calm mode holds the finished flower still. */
export function BloomingLotus({ width, height }: { width: number; height: number }) {
  const calm = useNabt((s) => s.calmMode);
  const scale = useSharedValue(calm ? 1 : 0.55);
  useEffect(() => {
    if (calm) {
      scale.value = 1;
      return;
    }
    scale.value = 0.55;
    scale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [calm, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <LotusArt width={width} height={height} goldOnly />
    </Animated.View>
  );
}

/** Mockup QR tile. A picture of the code, not a live HMAC token. */
export function PerkQr({ size = 220 }: { size?: number }) {
  const xml = PERK_QR_SVG.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
  return <SvgXml xml={xml} width={size} height={size} />;
}
