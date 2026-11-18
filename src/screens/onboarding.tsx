import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/theme";
import { T } from "@/components/ui";
import { Blob, glass, GradientButton, Lockup, Stage } from "@/components/brand";
import {
  IconArrow,
  IconGameFill,
  IconMicFill,
  IconMusicFill,
  IconPeopleFill,
  IconTicketFill,
  Spark,
  Swoosh,
  Waveform,
} from "@/components/icons";
import { markOnboardingSeen } from "@/lib/preferences";

const woman = require("../../assets/images/editorial/woman-960.webp");
const artist = require("../../assets/images/editorial/hero-naija-960.webp");
const mic = require("../../assets/images/editorial/vibez-cast-480.webp");
const headphones = require("../../assets/images/editorial/headphones-480.webp");
const controller = require("../../assets/images/editorial/weekend-games-480.webp");
const crowd = require("../../assets/images/editorial/vibez-fest-480.webp");
const people = require("../../assets/images/editorial/silhouettes-480.webp");

const slides = [
  { key: "connect", lead: "Connect. Create.", rest: "Share. ", accent: "Belong." },
  { key: "stream", lead: "Stream. Play. Join. Talk.", rest: "", accent: "All in One Place." },
  { key: "discover", lead: "Discover Events,", rest: "Communities ", accent: "& More." },
];

export function Onboarding() {
  const router = useRouter();
  const [box, setBox] = useState({ width: 390, height: 780 });
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  async function finish() {
    await markOnboardingSeen();
    router.replace("/get-started");
  }

  return (
    <Stage>
      <View
        style={styles.fill}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          if (width > 0 && height > 0) setBox({ width, height });
        }}
      >
        <Animated.ScrollView
          testID="onboarding-pager"
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ width: box.width, height: box.height }}
        >
          {slides.map((slide) => (
            <View key={slide.key} style={{ width: box.width, height: box.height, overflow: "hidden" }}>
              {slide.key === "connect" ? <ConnectArt /> : null}
              {slide.key === "stream" ? <StreamArt /> : null}
              {slide.key === "discover" ? <DiscoverArt /> : null}
              <View style={styles.copy}>
                <Headline lead={slide.lead} rest={slide.rest} accent={slide.accent} />
                <Dots progress={x} width={box.width} />
                <GradientButton label="Get Started" icon={<IconArrow />} trailing onPress={finish} />
                <Legal />
              </View>
              <TopBar onSkip={finish} />
            </View>
          ))}
        </Animated.ScrollView>
      </View>
    </Stage>
  );
}

function TopBar({ onSkip }: { onSkip: () => void }) {
  return (
    <View style={styles.top}>
      <Lockup size={34} />
      <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} hitSlop={12}>
        <T variant="label" color={colors.textMuted}>
          Skip
        </T>
      </Pressable>
    </View>
  );
}

function Headline({ lead, rest, accent }: { lead: string; rest: string; accent: string }) {
  return (
    <View>
      <T variant="display">{lead}</T>
      <T variant="display">
        {rest}
        <T variant="display" color={colors.orangeDeep}>
          {accent}
        </T>
      </T>
      <View style={styles.swoosh}>
        <Swoosh width={accent.length > 12 ? 168 : 112} />
      </View>
    </View>
  );
}

function Dots({ progress, width }: { progress: { value: number }; width: number }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((index) => (
        <Dot key={index} index={index} progress={progress} width={width} />
      ))}
    </View>
  );
}

function Dot({ index, progress, width }: { index: number; progress: { value: number }; width: number }) {
  const style = useAnimatedStyle(() => {
    const active = interpolate(progress.value, [(index - 1) * width, index * width, (index + 1) * width], [0, 1, 0], Extrapolation.CLAMP);
    return {
      width: 7 + active * 14,
      backgroundColor: active > 0.5 ? "#FF7A1A" : "#5C5C66",
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

function Legal() {
  const router = useRouter();
  return (
    <View style={styles.legal}>
      <Pressable accessibilityRole="link" onPress={() => router.push("/login")}>
        <T variant="label" color={colors.text}>
          Log in
        </T>
      </Pressable>
      <T color={colors.textDim}>•</T>
      <T variant="label">
        <T variant="label" onPress={() => router.push("/terms")}>
          Terms and{" "}
        </T>
        <T variant="label" color={colors.orangeDeep} onPress={() => router.push("/privacy")}>
          Privacy
        </T>
      </T>
    </View>
  );
}

function ConnectArt() {
  return (
    <View style={styles.art} pointerEvents="none">
      <Image source={woman} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="left center" />
      <View style={styles.scrim} />
      <Blob tint="rgba(255,122,30,0.95)" style={styles.blobTopRight} />
      <Blob tint="rgba(255,122,30,0.8)" style={styles.blobBottomRight} />
      <Blob tint="rgba(139,92,246,0.85)" style={styles.blobBottomLeft} />
      <Blob tint="rgba(120,70,220,0.55)" style={styles.blobMidRight} />
      <View style={styles.spark}>
        <Spark />
      </View>
      <FloatTile label="Music" tint="rgba(20,16,18,0.78)" icon={<IconMusicFill color="#FF8A3D" />} style={styles.tileMusic} />
      <FloatTile label="Podcasts" tint="rgba(88,48,140,0.55)" icon={<IconMicFill color="#C084FC" />} style={styles.tilePods} />
      <FloatTile label="Games" tint="rgba(72,48,130,0.62)" icon={<IconGameFill color="#C4B5FD" />} style={styles.tileGames} />
      <FloatTile label="Events" tint="rgba(180,78,20,0.55)" icon={<IconTicketFill color="#FF8A3D" />} style={styles.tileEvents} />
      <FloatTile label="Communities" tint="rgba(64,40,120,0.6)" icon={<IconPeopleFill color="#C4B5FD" />} style={styles.tilePeople} />
    </View>
  );
}

function FloatTile({ label, icon, style, tint }: { label: string; icon: React.ReactNode; style: object; tint: string }) {
  return (
    <View style={[styles.floatTile, { backgroundColor: tint }, style]}>
      {icon}
      <T variant="label" style={styles.tileText}>
        {label}
      </T>
    </View>
  );
}

function StreamArt() {
  return (
    <View style={styles.stream} pointerEvents="none">
      <Blob tint="rgba(255,122,30,0.7)" style={styles.streamBlobLeft} />
      <Blob tint="rgba(139,92,246,0.7)" style={styles.streamBlobRight} />
      <View style={styles.sparkStream}>
        <Spark size={28} />
      </View>
      <View style={styles.phoneWrap}>
        <PhoneMock />
        <MenuStack />
        <View style={styles.wave}>
          <Waveform />
        </View>
      </View>
    </View>
  );
}

function PhoneMock() {
  return (
    <View style={styles.phone}>
      <View style={styles.phoneBezel}>
        <View style={styles.phoneHeader}>
          <T variant="caption" color={colors.textDim}>
            ‹
          </T>
          <T variant="label">Now Playing</T>
          <T variant="caption" color={colors.textMuted}>
            ♡
          </T>
        </View>
        <Image source={artist} style={styles.album} contentFit="cover" contentPosition="center" />
        <View style={styles.phoneMeta}>
          <T variant="headline">Naija Vibes</T>
          <T variant="caption" color={colors.textMuted}>
            Afrobeat Mix
          </T>
          <View style={styles.track}>
            <View style={styles.trackFill} />
          </View>
          <View style={styles.times}>
            <T variant="caption" color={colors.textDim}>
              1:24
            </T>
            <T variant="caption" color={colors.textDim}>
              3:56
            </T>
          </View>
          <View style={styles.controls}>
            <T color={colors.textDim}>↺</T>
            <T color={colors.text}>⏮</T>
            <View style={styles.pause}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
            <T color={colors.text}>⏭</T>
            <T color={colors.textDim}>↻</T>
          </View>
        </View>
      </View>
    </View>
  );
}

function MenuStack() {
  const rows = [
    { label: "Music", icon: <IconMusicFill size={18} color="#fff" />, active: true },
    { label: "Podcasts", icon: <IconMicFill size={18} color="#C084FC" /> },
    { label: "Games", icon: <IconGameFill size={18} color="#A78BFA" /> },
    { label: "Events", icon: <IconTicketFill size={18} color="#FB923C" /> },
    { label: "Communities", icon: <IconPeopleFill size={18} color="#C4B5FD" /> },
  ];
  return (
    <View style={styles.menu}>
      {rows.map((row) => (
        <View key={row.label} style={[styles.menuRow, row.active && styles.menuOn]}>
          {row.icon}
          <T variant="label" color="#fff">
            {row.label}
          </T>
        </View>
      ))}
    </View>
  );
}

function DiscoverArt() {
  return (
    <View style={styles.collage} pointerEvents="none">
      <Blob tint="rgba(255,122,30,0.85)" style={styles.blobBottomLeft} />
      <Blob tint="rgba(139,92,246,0.75)" style={styles.blobBottomRight} />
      <View style={styles.sparkCollage}>
        <Spark size={30} />
      </View>
      <CollageCard source={mic} label="Podcasts" icon={<IconMicFill size={16} color="#C084FC" />} style={styles.cardPods} />
      <CollageCard source={headphones} label="Music" icon={<IconMusicFill size={16} color="#FF8A3D" />} style={styles.cardMusic} />
      <CollageCard source={controller} label="Games" icon={<IconGameFill size={16} color="#A78BFA" />} style={styles.cardGames} />
      <CollageCard source={people} label="Communities" icon={<IconPeopleFill size={16} color="#C4B5FD" />} style={styles.cardPeople} />
      <CollageCard source={crowd} label="Events" icon={<IconTicketFill size={16} color="#FF8A3D" />} style={styles.cardEvents} live />
    </View>
  );
}

function CollageCard({
  source,
  label,
  icon,
  style,
  live,
}: {
  source: number;
  label: string;
  icon: React.ReactNode;
  style: object;
  live?: boolean;
}) {
  return (
    <View style={[styles.card, style]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.cardShade} />
      {live ? (
        <View style={styles.live}>
          <View style={styles.liveDot} />
          <T variant="caption">Live</T>
        </View>
      ) : null}
      <View style={styles.cardLabel}>
        {icon}
        <T variant="label">{label}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: {
    position: "absolute",
    top: 54,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  art: { ...StyleSheet.absoluteFill },
  scrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "48%",
    backgroundColor: "rgba(13,13,15,0.2)",
    ...(process.env.EXPO_OS === "web"
      ? { backgroundImage: "linear-gradient(180deg, rgba(13,13,15,0) 0%, rgba(13,13,15,0.55) 38%, #0D0D0F 78%)" }
      : { experimental_backgroundImage: "linear-gradient(180deg, rgba(13,13,15,0) 0%, rgba(13,13,15,0.72) 46%, #0D0D0F 82%)" }),
  },
  copy: { position: "absolute", left: 22, right: 22, bottom: 28, gap: 16, zIndex: 3 },
  swoosh: { marginTop: -2, marginLeft: 4 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 7, height: 10, alignItems: "center" },
  dot: { height: 7, borderRadius: radius.pill },
  legal: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  blobTopRight: { width: 180, height: 180, top: -50, right: -60 },
  blobBottomRight: { width: 210, height: 210, right: -80, bottom: 150 },
  blobBottomLeft: { width: 200, height: 200, left: -90, bottom: 40 },
  blobMidRight: { width: 140, height: 140, right: -30, top: "46%" },
  spark: { position: "absolute", top: "16%", right: "34%", zIndex: 3 },
  floatTile: {
    position: "absolute",
    width: 108,
    height: 108,
    borderRadius: 26,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 12px 24px rgba(0,0,0,0.35)",
    zIndex: 2,
  },
  tileText: { fontSize: 13 },
  tileMusic: { top: 132, right: 78, transform: [{ rotate: "-8deg" }] },
  tilePods: { top: 196, right: 8, transform: [{ rotate: "7deg" }] },
  tileGames: { top: 268, right: 72, transform: [{ rotate: "-4deg" }] },
  tileEvents: { top: 340, right: 6, transform: [{ rotate: "8deg" }] },
  tilePeople: { top: 418, right: 36, transform: [{ rotate: "-6deg" }] },
  stream: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 210 },
  streamBlobLeft: { width: 160, height: 160, left: -70, top: "38%" },
  streamBlobRight: { width: 190, height: 190, right: -80, bottom: 180 },
  sparkStream: { position: "absolute", top: "18%", right: "18%" },
  phoneWrap: { width: "100%", height: 390, marginTop: 36 },
  phone: { position: "absolute", left: 28, top: 8, transform: [{ rotate: "-8deg" }] },
  phoneBezel: {
    width: 214,
    borderRadius: 32,
    borderCurve: "continuous",
    backgroundColor: "#121214",
    borderWidth: 3,
    borderColor: "#3A3A40",
    overflow: "hidden",
    boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
  },
  phoneHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingTop: 12 },
  album: { height: 148, marginHorizontal: 12, marginTop: 8, borderRadius: 16 },
  phoneMeta: { paddingHorizontal: 14, paddingBottom: 12, gap: 2 },
  track: { height: 4, borderRadius: 4, backgroundColor: "#3A3A42", marginTop: 8 },
  trackFill: { width: "42%", height: 4, borderRadius: 4, backgroundColor: "#FF7A1A" },
  times: { flexDirection: "row", justifyContent: "space-between" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  pause: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FF7A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pauseBar: { width: 4, height: 14, borderRadius: 2, backgroundColor: "#fff" },
  menu: { position: "absolute", right: 10, top: 28, width: 158, gap: 8 },
  menuRow: {
    ...glass,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  menuOn: {
    backgroundColor: "#FF7A1A",
    borderColor: "rgba(255,255,255,0.2)",
    ...(process.env.EXPO_OS === "web"
      ? { backgroundImage: "linear-gradient(180deg, #FF9348 0%, #F26A1B 100%)" }
      : { experimental_backgroundImage: "linear-gradient(180deg, #FF9348 0%, #F26A1B 100%)" }),
  },
  wave: { position: "absolute", left: 150, bottom: 18 },
  collage: { flex: 1, marginTop: 108, marginBottom: 250 },
  sparkCollage: { position: "absolute", top: 8, alignSelf: "center", zIndex: 3 },
  card: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 28,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
  },
  cardShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.18)" },
  cardLabel: { position: "absolute", left: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  cardPods: { left: 12, top: 8, transform: [{ rotate: "-8deg" }] },
  cardMusic: { right: 10, top: 16, transform: [{ rotate: "8deg" }] },
  cardGames: { left: 16, top: 146, transform: [{ rotate: "-6deg" }] },
  cardPeople: { right: 12, top: 158, transform: [{ rotate: "7deg" }] },
  cardEvents: { left: 112, top: 78, width: 168, height: 168, zIndex: 2, transform: [{ rotate: "-2deg" }] },
  live: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(20,12,16,0.72)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FF4D4D" },
});
