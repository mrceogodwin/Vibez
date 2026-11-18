export const colors = {
  bg: "#0C0C0E",
  bgRaised: "#16161A",
  card: "#1C1C21",
  cardGlass: "rgba(28, 28, 34, 0.78)",
  line: "rgba(255,255,255,0.12)",
  text: "#FFFFFF",
  textMuted: "#C6C6D0",
  textDim: "#8E8E99",
  orange: "#FF7A18",
  orangeDeep: "#E2650A",
  onOrange: "#FFFFFF",
  purple: "#8B6CFF",
  purpleGlow: "rgba(123, 77, 255, 0.35)",
  danger: "#FF5D5D",
  success: "#3DDC97",
  dock: "#1A1A1E",
  chip: "#2A2A30",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 } as const;

export const radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const type = {
  display: { fontFamily: "PlusJakartaSans_800ExtraBold, system-ui, sans-serif", fontSize: 36, lineHeight: 40, letterSpacing: -1.1 },
  title: { fontFamily: "PlusJakartaSans_800ExtraBold, system-ui, sans-serif", fontSize: 30, lineHeight: 34, letterSpacing: -0.8 },
  headline: { fontFamily: "PlusJakartaSans_700Bold, system-ui, sans-serif", fontSize: 18, lineHeight: 24 },
  body: { fontFamily: "PlusJakartaSans_500Medium, system-ui, sans-serif", fontSize: 16, lineHeight: 22 },
  label: { fontFamily: "PlusJakartaSans_600SemiBold, system-ui, sans-serif", fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: "PlusJakartaSans_500Medium, system-ui, sans-serif", fontSize: 12, lineHeight: 16 },
} as const;

export const motion = { fast: 150, base: 280, slow: 450 } as const;

export const shadow = {
  orange: "0 10px 24px rgba(255, 122, 24, 0.35)",
  dock: "0 12px 40px rgba(0, 0, 0, 0.45)",
} as const;
