import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { saveSessionToken } from "@/lib/session-token";
import { useSession } from "@/lib/session";
import { colors, radius, spacing } from "@/theme";
import { T } from "@/components/ui";
import { IconApple, IconBack, IconGoogle, IconMail, Mark } from "@/components/icons";

const host = require("../../assets/images/portrait-host.jpg");
const artist = require("../../assets/images/now-playing-man.jpg");
const gamer = require("../../assets/images/portrait-gamer.jpg");

export function GetStarted() {
  const router = useRouter();
  const { refresh } = useSession();
  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
        <IconBack />
      </Pressable>
      <View style={styles.logo}>
        <Mark size={42} />
        <T variant="title">Vibez</T>
      </View>
      <View style={styles.fan}>
        <Image source={artist} style={[styles.card, styles.left]} contentFit="cover" />
        <Image source={host} style={[styles.card, styles.center]} contentFit="cover" />
        <Image source={gamer} style={[styles.card, styles.right]} contentFit="cover" />
      </View>
      <T variant="title" center>
        Get Started on{"\n"}Vibez
      </T>
      <T variant="body" color={colors.textMuted} center>
        Create your account or sign in to keep your vibes going.
      </T>
      <Pressable accessibilityRole="button" onPress={() => router.push("/signup")} style={styles.primary}>
        <T variant="headline">Create Account</T>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push("/login")} style={styles.secondary}>
        <T variant="headline">Log In</T>
      </Pressable>
      <T variant="label" color={colors.textDim} center>
        or continue with
      </T>
      <View style={styles.socials}>
        <Social label="Continue with Apple" provider="apple" icon={<IconApple />} onSession={refresh} />
        <Social label="Continue with Google" provider="google" icon={<IconGoogle />} onSession={refresh} />
        <Social label="Continue with email" href="/signup" icon={<IconMail />} internal />
      </View>
      <T variant="caption" color={colors.textDim} center>
        By continuing, you agree to our{" "}
        <T variant="caption" color={colors.orange} onPress={() => router.push("/terms")}>
          Terms of Service
        </T>{" "}
        and{" "}
        <T variant="caption" color={colors.orange} onPress={() => router.push("/privacy")}>
          Privacy Policy
        </T>
        .
      </T>
    </View>
  );
}

function Social({
  label,
  provider,
  href,
  icon,
  internal,
  onSession,
}: {
  label: string;
  provider?: "google" | "apple";
  href?: string;
  icon: React.ReactNode;
  internal?: boolean;
  onSession?: () => Promise<void>;
}) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        if (internal && href) {
          router.push(href as never);
          return;
        }
        if (!provider) return;
        void startProvider(provider, router, onSession);
      }}
      style={styles.social}
    >
      {icon}
    </Pressable>
  );
}

async function startProvider(
  provider: "google" | "apple",
  router: { replace: (href: string) => void },
  onSession?: () => Promise<void>,
) {
  const path = `/api/auth/${provider}/start`;
  if (Platform.OS === "web") {
    window.location.href = path;
    return;
  }
  const apiBase = process.env.EXPO_PUBLIC_API_URL || "";
  const result = await WebBrowser.openAuthSessionAsync(`${apiBase}${path}?client=native`, "vibez://auth");
  if (result.type !== "success") return;
  const token = new URL(result.url).searchParams.get("token");
  if (!token) return;
  await saveSessionToken(token);
  await onSession?.();
  router.replace("/home");
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl, paddingTop: 54, gap: spacing.lg },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  logo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: -36 },
  fan: { height: 210, alignItems: "center", justifyContent: "center", marginVertical: spacing.sm },
  card: { position: "absolute", width: 132, height: 168, borderRadius: 22, borderWidth: 2, borderColor: "rgba(255,255,255,0.16)" },
  left: { transform: [{ rotate: "-12deg" }, { translateX: -78 }] },
  center: { zIndex: 2, width: 148, height: 186 },
  right: { transform: [{ rotate: "12deg" }, { translateX: 78 }] },
  primary: { height: 56, borderRadius: radius.pill, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center" },
  secondary: { height: 56, borderRadius: radius.pill, backgroundColor: "#24242B", alignItems: "center", justifyContent: "center" },
  socials: { flexDirection: "row", justifyContent: "center", gap: spacing.lg },
  social: {
    width: 64,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
});
