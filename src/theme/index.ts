export const colors = {
  bg: "#0D0D0F",
  bgTop: "#1A1A1D",
  bgRaised: "#16161A",
  card: "#1C1C21",
  cardGlass: "rgba(28, 24, 32, 0.72)",
  line: "rgba(255,255,255,0.14)",
  lineStrong: "rgba(255,255,255,0.22)",
  text: "#FFFFFF",
  textMuted: "#C8C8D0",
  textDim: "#8E8E99",
  orange: "#FF8A3D",
  orangeDeep: "#F26A1B",
  onOrange: "#FFFFFF",
  purple: "#8B5CF6",
  purpleSoft: "#A78BFA",
  purpleGlow: "rgba(139, 92, 246, 0.38)",
  danger: "#FF5D5D",
  success: "#3DDC97",
  dock: "rgba(22, 22, 26, 0.9)",
  chip: "#232328",
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 40 } as const;

export const radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;

export const type = {
  display: { fontFamily: "PlusJakartaSans_800ExtraBold, system-ui, sans-serif", fontSize: 34, lineHeight: 39, letterSpacing: -1.15 },
  title: { fontFamily: "PlusJakartaSans_800ExtraBold, system-ui, sans-serif", fontSize: 30, lineHeight: 34, letterSpacing: -0.9 },
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
