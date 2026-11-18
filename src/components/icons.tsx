import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "@/theme";

type IconProps = { size?: number; color?: string };

export function Mark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="1" y="1" width="46" height="46" rx="15" fill={colors.orange} />
      <Rect x="13" y="16" width="4.2" height="16" rx="2" fill="#fff" />
      <Rect x="21.9" y="10" width="4.2" height="28" rx="2" fill="#fff" />
      <Rect x="30.8" y="18" width="4.2" height="12" rx="2" fill="#fff" />
    </Svg>
  );
}

export function IconMusic({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18V6l11-2v12" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6.5" cy="18" r="2.5" stroke={color} strokeWidth={1.8} />
      <Circle cx="17.5" cy="16" r="2.5" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function IconMic({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth={1.8} />
      <Path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconGame({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 15H5.5A3.5 3.5 0 0 1 3 10.2L4.2 7.4A4 4 0 0 1 8 5h8a4 4 0 0 1 3.8 2.4L21 10.2A3.5 3.5 0 0 1 18.5 15H17l-1.2 2.2A2 2 0 0 1 14 18.4h-4a2 2 0 0 1-1.8-1.2L7 15Z" stroke={color} strokeWidth={1.8} />
      <Path d="M8 10v4M6 12h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="16" cy="11" r="1" fill={color} />
      <Circle cx="18" cy="13" r="1" fill={color} />
    </Svg>
  );
}

export function IconTicket({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v10" stroke={color} strokeWidth={1.8} strokeDasharray="2 3" />
    </Svg>
  );
}

export function IconPeople({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="9" r="3" stroke={color} strokeWidth={1.8} />
      <Path d="M4.5 18.5c.6-2.4 2.5-3.5 4.5-3.5s3.9 1.1 4.5 3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="16.5" cy="9.5" r="2.2" stroke={color} strokeWidth={1.8} />
      <Path d="M16 15c1.6.2 2.9 1.1 3.5 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconBell({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16V11a6 6 0 1 1 12 0v5l1.2 1.5H4.8L6 16Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconHome({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCompass({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={1.8} />
      <Path d="m14.8 9.2-1.2 4.4-4.4 1.2 1.2-4.4 4.4-1.2Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPlus({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChat({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16.5 4 19V7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v6A2.5 2.5 0 0 1 17.5 16H8.2L6 16.5Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconUser({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="3.2" stroke={color} strokeWidth={1.8} />
      <Path d="M6 19c.8-2.8 2.8-4 6-4s5.2 1.2 6 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconArrow({ size = 18, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconBack({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 5 8 12l7 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMail({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke={color} strokeWidth={1.8} />
      <Path d="m5 8 7 5 7-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconApple({ size = 22, color = "#fff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.3-.2-2.6.8-3.3.8s-1.7-.8-2.9-.7c-1.5.1-2.8.9-3.6 2.2-1.5 2.7-.4 6.6 1.1 8.8.7 1.1 1.6 2.3 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.9.7 1.9-1.1 2.6-2.2c.8-1.2 1.2-2.3 1.2-2.4-.1 0-2.2-.9-2.2-3.6ZM14.7 6.8c.6-.8 1-1.8.9-2.8-1 .1-2.1.7-2.7 1.5-.6.7-1.1 1.8-.9 2.8 1 .1 2.1-.5 2.7-1.5Z" />
    </Svg>
  );
}

export function IconGoogle({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
      <Path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1V16c1.6 3.2 5 6 8.9 6Z" />
      <Path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.9H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.4l3.3-2.5Z" />
      <Path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.7 2 12 2 8.1 2 4.7 4.8 3.1 8l3.3 2.5C7.2 7.7 9.4 5.9 12 5.9Z" />
    </Svg>
  );
}

export function Swoosh({ width = 92 }: { width?: number }) {
  return (
    <Svg width={width} height={12} viewBox="0 0 92 12">
      <Path d="M2 8c18-8 40-8 88-2" stroke={colors.orange} strokeWidth={4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
