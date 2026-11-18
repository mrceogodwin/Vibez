import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, type } from "@/theme";
import { T } from "./ui";
import { Mark } from "./icons";

const stageImage = [
  "radial-gradient(circle at 108% -4%, rgba(255,122,30,0.55) 0%, rgba(255,122,30,0) 32%)",
  "radial-gradient(circle at 112% 86%, rgba(242,106,27,0.42) 0%, rgba(242,106,27,0) 28%)",
  "radial-gradient(circle at -8% 108%, rgba(139,92,246,0.5) 0%, rgba(139,92,246,0) 34%)",
  "radial-gradient(circle at 108% 48%, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0) 24%)",
  "linear-gradient(180deg, #1A1A1D 0%, #0D0D0F 58%)",
].join(", ");

export function Stage({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.stage, style]}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, wash(stageImage)]} />
      {children}
    </View>
  );
}

export function Blob({ style, tint }: { style: StyleProp<ViewStyle>; tint: string }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.blob, wash(`radial-gradient(circle, ${tint} 0%, rgba(0,0,0,0) 68%)`, "transparent"), style]}
    />
  );
}

export function Lockup({ size = 34 }: { size?: number }) {
  return (
    <View style={styles.lockup}>
      <Mark size={size} />
      <T variant="headline" style={{ fontFamily: type.display.fontFamily, fontSize: Math.round(size * 0.66), lineHeight: Math.round(size * 0.78), letterSpacing: -0.7 }}>
        Vibez
      </T>
    </View>
  );
}

export function GradientButton({
  label,
  onPress,
  icon,
  trailing,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  trailing?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
    >
      {trailing ? null : icon}
      <T variant="headline">{label}</T>
      {trailing ? icon : null}
    </Pressable>
  );
}

export const glass = {
  backgroundColor: "rgba(32, 28, 38, 0.72)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.16)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(0,0,0,0.28)",
} as const;

function wash(image: string, fallback: string = colors.bg) {
  return process.env.EXPO_OS === "web"
    ? { backgroundImage: image, backgroundColor: fallback }
    : { experimental_backgroundImage: image, backgroundColor: fallback };
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  blob: { position: "absolute" },
  lockup: { flexDirection: "row", alignItems: "center", gap: 8 },
  cta: {
    height: 58,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    boxShadow: "0 12px 28px rgba(242, 106, 27, 0.38)",
    ...wash("linear-gradient(180deg, #FF9A4A 0%, #FF7A1F 42%, #F26A1B 100%)"),
  },
});
