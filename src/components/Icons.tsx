import Svg, { Circle, Path, Rect, G } from "react-native-svg";

type I = { size?: number; color?: string; stroke?: number };

export function IconHome({ color = "#fff" }: I) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3.8 10.4 12 3.8l8.2 6.6v9a1 1 0 0 1-1 1h-4.6v-5.7H9.4v5.7H4.8a1 1 0 0 1-1-1z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconDiscover({ color = "#fff" }: I) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.6" stroke={color} strokeWidth={1.6} />
      <Path d="m15.4 8.6-2 4.8-4.8 2 2-4.8z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconChat({ color = "#fff" }: I) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 18.8V7a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 7v7.2a2.5 2.5 0 0 1-2.5 2.5H8.2z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMe({ color = "#fff" }: I) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.2" r="3.9" stroke={color} strokeWidth={1.6} />
      <Path d="M4.8 20.2c.9-3.6 3.8-5.8 7.2-5.8s6.3 2.2 7.2 5.8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconLotus({ size = 30, color = "#411516" }: I) {
  return (
    <Svg width={size} height={size * (18 / 24)} viewBox="-12 -11 24 18">
      <Path d="M0 4.6C-2.9 1.4-3 -3.7 0 -7.2 3 -3.7 2.9 1.4 0 4.6Z" fill={color} />
      <Path d="M-1.2 5C-5.8 4.3-8.8 .6-9.3 -3.4-5.3 -2.9-2.3 -.3-1.2 5Z" fill={color} />
      <Path d="M1.2 5C5.8 4.3 8.8 .6 9.3 -3.4 5.3 -2.9 2.3 -.3 1.2 5Z" fill={color} />
      <Path d="M-11 4.4C-7.6 6.3-3.6 6.6 0 5.9 3.6 6.6 7.6 6.3 11 4.4 7.4 3.4 3.7 4.3 0 5.6-3.7 4.3-7.4 3.4-11 4.4Z" fill={color} opacity={0.75} />
    </Svg>
  );
}

export function IconClose({ color = "#411516" }: I) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M7 7l10 10M17 7 7 17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconWordLotus({ width = 28, height = 19, fill = "#fff" }: { width?: number; height?: number; fill?: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 48 32">
      <G fill={fill} stroke="#411516" strokeWidth={1.6} strokeLinejoin="round">
        <Path d="M24 29 C31 22 39 18 47 18.5 C43 26 34 30.5 24 29Z" />
        <Path d="M24 29 C17 22 9 18 1 18.5 C5 26 14 30.5 24 29Z" />
        <Path d="M24 29 C26.5 19 30.5 12 37 8.5 C38.5 17 33 26 24 29Z" />
        <Path d="M24 29 C21.5 19 17.5 12 11 8.5 C9.5 17 15 26 24 29Z" />
        <Path d="M24 1.5 C30 9 30.5 20 24 29 C17.5 20 18 9 24 1.5Z" />
      </G>
    </Svg>
  );
}

export function IconChevron({ color = "#fff" }: I) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
      <Path d="M3 4.5 6 7.5 9 4.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrow({ color = "#411516" }: I) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M3 8h10M9 4l4 4-4 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconBack({ color = "#fff" }: I) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M14.5 5.5 8 12l6.5 6.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconShield({ size = 14, color = "#fff" }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.2 19 6v6.2c0 4.4-2.9 7.4-7 8.6-4.1-1.2-7-4.2-7-8.6V6l7-2.8z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconShieldCheck({ size = 20, color = "#fff" }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path d="M10 2.2 3.6 4.6v5c0 3.9 2.7 6.9 6.4 8.2 3.7-1.3 6.4-4.3 6.4-8.2v-5L10 2.2Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M7.3 10.1 9.2 12l3.6-3.8" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconHeartChip({ size = 11, color = "#fff" }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconRootChip({ size = 11, color = "#fff" }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v9M12 13l-4.5 6M12 13l4.5 6M12 13v7" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconSearch({ color = "#fff" }: I) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="10.8" cy="10.8" r="6.3" stroke={color} strokeWidth={1.7} />
      <Path d="m15.6 15.6 4.6 4.6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function IconClock({ color = "#fff", size = 14 }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="6.2" stroke={color} strokeWidth={1.4} />
      <Path d="M8 4.6V8l2.4 1.6" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevronDown({ color = "#fff", size = 10 }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M3 4.5 6 7.5 9 4.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconRootGold({ size = 14 }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M1.6 3.4c3.6-.7 7.2-.7 10.8 0" stroke="#CF9C74" strokeOpacity={0.6} strokeLinecap="round" strokeWidth={1.2} />
      <Path d="M7 3.3c.1 3.2-.2 6.2.3 9.2" stroke="#CF9C74" strokeLinecap="round" strokeWidth={1.2} />
      <Path d="M7 4.8C5.2 5.6 3.9 7.3 3.3 9.8" stroke="#CF9C74" strokeLinecap="round" strokeWidth={1.2} />
      <Path d="M7.1 4.8c1.8.8 3.1 2.5 3.7 5" stroke="#CF9C74" strokeLinecap="round" strokeWidth={1.2} />
    </Svg>
  );
}

export function IconBubble({ color = "#fff", size = 18 }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 18.8V7a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 7v7.2a2.5 2.5 0 0 1-2.5 2.5H8.2z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconHeartPlain({ color = "#fff", size = 18 }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconSendUp({ color = "#411515" }: I) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M8 13V3.5M3.8 7.5 8 3.3l4.2 4.2" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconGear({ color = "#fff" }: I) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.6} />
      <Path d="M12 3.5v2.2M12 18.3V20.5M4.8 6.8l1.6 1.6M17.6 15.6l1.6 1.6M3.5 12h2.2M18.3 12H20.5M4.8 17.2l1.6-1.6M17.6 8.4l1.6-1.6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconLock({ size = 12, color = "#fff" }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth={1.7} />
      <Path d="M8 11V8.2a4 4 0 0 1 8 0V11" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevronRight({ color = "rgba(255,255,255,0.7)" }: I) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconRoot() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M3 4.5c4.6-.8 9.4-.8 14 0" stroke="#fff" strokeOpacity={0.55} strokeLinecap="round" strokeWidth={1.5} />
      <Path d="M10 4.4c.1 4.2-.3 8.4.4 12.6" stroke="#fff" strokeLinecap="round" strokeWidth={1.5} />
      <Path d="M10 6.4C7.4 7.6 5.5 10 4.6 13.6" stroke="#fff" strokeLinecap="round" strokeWidth={1.5} />
      <Path d="M10.1 6.4c2.6 1.2 4.5 3.6 5.4 7.2" stroke="#fff" strokeLinecap="round" strokeWidth={1.5} />
      <Path d="M6.5 9.6c-1.3-.1-2.4-.6-3.2-1.5" stroke="#fff" strokeOpacity={0.7} strokeLinecap="round" strokeWidth={1.2} />
      <Path d="M13.7 9.6c1.3-.1 2.4-.6 3.2-1.5" stroke="#fff" strokeOpacity={0.7} strokeLinecap="round" strokeWidth={1.2} />
      <Path d="M10.2 12c-1.2.7-2 1.8-2.3 3.2" stroke="#fff" strokeOpacity={0.7} strokeLinecap="round" strokeWidth={1.2} />
    </Svg>
  );
}

export function IconCircles() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7.2" r="4.4" stroke="#fff" strokeWidth={1.5} />
      <Circle cx="7" cy="15.8" r="4.4" stroke="#fff" strokeWidth={1.5} />
      <Circle cx="17" cy="15.8" r="4.4" stroke="#fff" strokeWidth={1.5} />
    </Svg>
  );
}

export function IconPin() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21.5s-6.5-6-6.5-11.5a6.5 6.5 0 0 1 13 0c0 5.5-6.5 11.5-6.5 11.5z" stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="2.3" stroke="#fff" strokeWidth={1.5} />
    </Svg>
  );
}

export function IconPen() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20h4l10-10-4-4L4 16v4z" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M12.5 7.5l4 4" stroke="rgba(255,255,255,0.8)" strokeWidth={1.6} />
    </Svg>
  );
}

export function IconSend({ color = "#411515" }: I) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h12M13 6l6 6-6 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPlus({ color = "rgba(255,255,255,0.64)" }: I) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCompose() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 18.5V6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8.5z" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M8.5 9h7M8.5 12.2h4.5" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCalendar() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="#fff" strokeWidth={1.6} />
      <Path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconHeart() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s-6.3-5.8-6.3-11.1a6.3 6.3 0 0 1 12.6 0C18.3 15.2 12 21 12 21z" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M9.6 9.9h4.8" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconDoc() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3.5h8.5L19 8v12.5H6z" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M14 3.5V8h5M9 12.5h7M9 16h4.5" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCheck({ color = "#fff", size = 14 }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5 10 17.5 19 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMore() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="6" cy="12" r="1.3" fill="#fff" />
      <Circle cx="12" cy="12" r="1.3" fill="#fff" />
      <Circle cx="18" cy="12" r="1.3" fill="#fff" />
    </Svg>
  );
}

export function IconBadgeBloom({ color = "#CF9C74" }: I) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="10" r="5.5" stroke={color} strokeWidth={1.6} />
      <Path d="m9 14.5-1.5 6 4.5-2.5 4.5 2.5-1.5-6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconBadgeLeaf({ color = "#CF9C74" }: I) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5c3 3.5 3 8 0 12-3-4-3-8.5 0-12z" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 20h16" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconBadgeLink({ color = "#CF9C74" }: I) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="12" r="3" stroke={color} strokeWidth={1.6} />
      <Circle cx="16" cy="12" r="3" stroke={color} strokeWidth={1.6} />
      <Path d="M11 12h2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function IconArrowRight({ color = "#fff", size = 16 }: I) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M2.5 8h11M9.2 3.8 13.4 8 9.2 12.2" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLeaf({ color = "#CF9C74" }: I) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 19c8-1 12-7 13-14-7 1-13 5-13 14z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M9 15c2-2 4-4 7-6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function IconBloom() {
  return (
    <Svg width={22} height={16} viewBox="0 0 48 32">
      <G fill="#CF9C74">
        <Path d="M24 29 C31 22 39 18 47 18.5 C43 26 34 30.5 24 29Z" />
        <Path d="M24 29 C17 22 9 18 1 18.5 C5 26 14 30.5 24 29Z" />
        <Path d="M24 29 C26.5 19 30.5 12 37 8.5 C38.5 17 33 26 24 29Z" />
        <Path d="M24 29 C21.5 19 17.5 12 11 8.5 C9.5 17 15 26 24 29Z" />
        <Path d="M24 1.5 C30 9 30.5 20 24 29 C17.5 20 18 9 24 1.5Z" />
      </G>
    </Svg>
  );
}
