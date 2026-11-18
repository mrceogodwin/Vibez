import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type TextProps, type ViewStyle } from "react-native";
import { colors, radius, spacing, type } from "@/theme";
import { IconArrow } from "./icons";

export function T({
  children,
  variant = "body",
  color = colors.text,
  center,
  style,
  ...props
}: TextProps & {
  children: React.ReactNode;
  variant?: keyof typeof type;
  color?: string;
  center?: boolean;
}) {
  return (
    <Text {...props} style={[type[variant], { color }, center && { textAlign: "center" }, style]}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  arrow,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "dark" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  arrow?: boolean;
}) {
  const background = variant === "primary" ? colors.orange : variant === "dark" ? "#2A2A31" : "transparent";
  const text = colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderWidth: variant === "ghost" ? 1 : 0, borderColor: colors.line },
        { opacity: disabled ? 0.45 : pressed ? 0.86 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <View style={styles.buttonRow}>
          <T variant="headline" color={text}>
            {title}
          </T>
          {arrow ? <IconArrow color={text} /> : null}
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <T variant="label" color={colors.textMuted}>
        {label}
      </T>
      <TextInput
        placeholderTextColor={colors.textDim}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    fontFamily: "PlusJakartaSans_500Medium, system-ui, sans-serif",
  },
  screen: { flex: 1, backgroundColor: colors.bg },
});
