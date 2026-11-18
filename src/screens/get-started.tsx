import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { saveSessionToken } from "@/lib/session-token";
import { useSession } from "@/lib/session";
import { colors, radius, spacing } from "@/theme";
import { T } from "@/components/ui";
import { Blob, glass, GradientButton, Lockup, Stage } from "@/components/brand";
import { IconApple, IconBack, IconEnter, IconGameFill, IconGoogle, IconMail, IconMicFill, IconMusicFill, IconUserPlus, Waveform } from "@/components/icons";

const artist = require("../../assets/images/editorial/hero-naija-960.webp");
const host = require("../../assets/images/editorial/host-960.webp");
const gamer = require("../../assets/images/editorial/gamer-960.webp");

export function GetStarted() {
  const router = useRouter();
  const { refresh } = useSession();
  return (
    <Stage style={styles.screen}>
      <Blob tint="rgba(255,122,30,0.9)" style={styles.blobRight} />
      <Blob tint="rgba(139,92,246,0.85)" style={styles.blobLeft} />
      <Blob tint="rgba(242,106,27,0.55)" style={styles.blobCorner} />
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back} hitSlop={8}>
        <IconBack />
      </Pressable>
      <View style={styles.logo}>
        <Lockup size={42} />
      </View>
      <View style={styles.fan}>
        <View style={styles.wave}>
          <Waveform width={70} height={28} />
        </View>
        <Portrait source={artist} style={styles.left} badge={<IconMusicFill size={18} color="#FF8A3D" />} glow="rgba(255,122,30,0.45)" />
        <Portrait source={host} style={styles.center} badge={<IconMicFill size={18} color="#C084FC" />} glow="rgba(139,92,246,0.4)" />
        <Portrait source={gamer} style={styles.right} badge={<IconGameFill size={18} color="#A78BFA" />} glow="rgba(139,92,246,0.35)" />
      </View>
      <T variant="title" center>
        Get Started on{"\n"}Vibez
      </T>
      <T variant="body" color={colors.textMuted} center>
        Create your account or sign in to keep your vibes going.
      </T>
      <GradientButton label="Create Account" icon={<IconUserPlus />} onPress={() => router.push("/signup")} />
      <Pressable accessibilityRole="button" accessibilityLabel="Log In" onPress={() => router.push("/login")} style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.88 : 1 }]}>
        <IconEnter />
        <T variant="headline">Log In</T>
      </Pressable>
      <View style={styles.divider}>
        <View style={styles.rule} />
        <T variant="label" color={colors.textDim}>
          or continue with
        </T>
        <View style={styles.rule} />
      </View>
      <View style={styles.socials}>
        <Social label="Continue with Apple" provider="apple" icon={<IconApple />} onSession={refresh} />
        <Social label="Continue with Google" provider="google" icon={<IconGoogle />} onSession={refresh} />
        <Social label="Continue with email" href="/signup" icon={<IconMail />} internal />
      </View>
      <T variant="caption" color={colors.textDim} center>
        By continuing, you agree to our{"\n"}
        <T variant="caption" color={colors.orangeDeep} onPress={() => router.push("/terms")}>
          Terms of Service
        </T>
        <T variant="caption" color={colors.textDim}>
          {" "}
          and{" "}
        </T>
        <T variant="caption" color={colors.orangeDeep} onPress={() => router.push("/privacy")}>
          Privacy Policy
        </T>
        .
      </T>
    </Stage>
  );
}

function Portrait({ source, style, badge, glow }: { source: number; style: object; badge: React.ReactNode; glow: string }) {
  return (
    <View style={[styles.cardFrame, style, { boxShadow: `0 16px 32px ${glow}` }]}>
      <View style={styles.cardClip}>
        <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" />
        <View style={styles.badge}>{badge}</View>
      </View>
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
      style={({ pressed }) => [styles.social, { opacity: pressed ? 0.86 : 1 }]}
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
  screen: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28, gap: 14 },
  back: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center", zIndex: 2 },
  logo: { alignItems: "center", marginTop: -28 },
  fan: { height: 214, alignItems: "center", justifyContent: "center" },
  wave: { position: "absolute", left: 8, top: 36, opacity: 0.35 },
  cardFrame: { position: "absolute", width: 132, height: 168 },
  cardClip: {
    flex: 1,
    borderRadius: 26,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.28)",
  },
  left: { transform: [{ rotate: "-14deg" }, { translateX: -86 }, { translateY: 8 }] },
  center: { width: 150, height: 188, zIndex: 2, transform: [{ translateY: -4 }] },
  right: { transform: [{ rotate: "13deg" }, { translateX: 88 }, { translateY: 10 }] },
  badge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,16,28,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  secondary: {
    ...glass,
    height: 58,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8 },
  rule: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.14)" },
  socials: { flexDirection: "row", justifyContent: "center", gap: 16 },
  social: {
    width: 74,
    height: 64,
    borderRadius: 18,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(28,28,34,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
  },
  blobRight: { width: 220, height: 220, right: -110, top: 120 },
  blobLeft: { width: 240, height: 240, left: -130, bottom: -20 },
  blobCorner: { width: 160, height: 160, right: -70, bottom: 40 },
});
