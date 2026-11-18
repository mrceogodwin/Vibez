import { useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/theme";
import { T } from "@/components/ui";
import { IconGame, IconMic, IconMusic, IconPeople, IconTicket, Mark, Swoosh } from "@/components/icons";
import { markOnboardingSeen } from "@/lib/preferences";

const woman = require("../../assets/images/onboard-woman.jpg");
const artist = require("../../assets/images/now-playing-man.jpg");
const crowd = require("../../assets/images/concert-crowd.jpg");
const mic = require("../../assets/images/podcast-mic.jpg");
const headphones = require("../../assets/images/headphones-orange.jpg");
const controller = require("../../assets/images/game-controller.jpg");
const community = require("../../assets/images/community-glow.jpg");

export function Onboarding() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 480);
  const x = useSharedValue(0);
  const [page, setPage] = useState(0);
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
    <View style={styles.root}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / pageWidth))}
        style={{ width: pageWidth }}
      >
        <Slide width={pageWidth}>
          <Image source={woman} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.scrim} />
          <TopBar onSkip={finish} />
          <View style={styles.copy}>
            <Headline orange="Belong." lines={["Connect. Create.", "Share. Belong."]} />
            <Dots page={page} progress={x} width={pageWidth} />
            <Footer onStart={finish} />
          </View>
        </Slide>
        <Slide width={pageWidth}>
          <View style={styles.dark}>
            <TopBar onSkip={finish} />
            <View style={styles.stage}>
              <PhoneMock />
              <MenuStack />
            </View>
            <View style={styles.copy}>
              <Headline orange="All in One Place." lines={["Stream. Play. Join. Talk.", "All in One Place."]} />
              <Dots page={page} progress={x} width={pageWidth} />
              <Footer onStart={finish} />
            </View>
          </View>
        </Slide>
        <Slide width={pageWidth}>
          <View style={styles.dark}>
            <TopBar onSkip={finish} />
            <Collage />
            <View style={styles.copy}>
              <Headline orange="More." lines={["Discover Events,", "Communities & More."]} />
              <Dots page={page} progress={x} width={pageWidth} />
              <Footer onStart={finish} />
            </View>
          </View>
        </Slide>
      </Animated.ScrollView>
    </View>
  );
}

function Slide({ width, children }: { width: number; children: React.ReactNode }) {
  return <View style={{ width, flex: 1 }}>{children}</View>;
}

function TopBar({ onSkip }: { onSkip: () => void }) {
  return (
    <View style={styles.top}>
      <View style={styles.brand}>
        <Mark size={34} />
        <T variant="headline">Vibez</T>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} hitSlop={12}>
        <T variant="label" color={colors.textMuted}>
          Skip
        </T>
      </Pressable>
    </View>
  );
}

function Headline({ lines, orange }: { lines: string[]; orange: string }) {
  const last = lines[lines.length - 1];
  const lead = lines.slice(0, -1);
  const orangeWord = last.includes(orange) ? orange : "";
  const before = orangeWord ? last.replace(orange, "") : last;
  return (
    <View>
      {lead.map((line) => (
        <T key={line} variant="display">
          {line}
        </T>
      ))}
      <T variant="display">
        {before}
        <T variant="display" color={colors.orange}>
          {orangeWord || ""}
        </T>
      </T>
      <View style={{ marginTop: 2 }}>
        <Swoosh />
      </View>
    </View>
  );
}

function Dots({ progress, width }: { page: number; progress: { value: number }; width: number }) {
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
    return { width: 8 + active * 16, opacity: 0.35 + active * 0.65, backgroundColor: active > 0.5 ? colors.orange : "#6E6E76" };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

function Footer({ onStart }: { onStart: () => void }) {
  return (
    <View style={{ gap: spacing.lg }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Get Started" onPress={onStart} style={styles.cta}>
        <T variant="headline">Get Started</T>
        <T variant="headline">→</T>
      </Pressable>
      <View style={styles.legalRow}>
        <LinkText href="/login" label="Log in" />
        <T color={colors.textDim}>·</T>
        <LinkText href="/terms" label="Terms" />
        <T color={colors.textDim}>and</T>
        <LinkText href="/privacy" label="Privacy" accent />
      </View>
    </View>
  );
}

function LinkText({ href, label, accent }: { href: string; label: string; accent?: boolean }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href as never)}>
      <T variant="label" color={accent ? colors.orange : colors.textMuted}>
        {label}
      </T>
    </Pressable>
  );
}

function PhoneMock() {
  return (
    <View style={styles.phone}>
      <View style={styles.phoneTop}>
        <T variant="caption" color={colors.textMuted}>
          Now Playing
        </T>
      </View>
      <Image source={artist} style={styles.album} contentFit="cover" />
      <View style={{ padding: spacing.md, gap: 4 }}>
        <T variant="headline">Naija Vibes</T>
        <T variant="caption" color={colors.textMuted}>
          Afrobeat Mix
        </T>
        <View style={styles.progress} />
        <View style={styles.play}>
          <View style={styles.pause} />
          <View style={styles.pause} />
        </View>
      </View>
    </View>
  );
}

function MenuStack() {
  const items = [
    { label: "Music", icon: <IconMusic color={colors.orange} />, active: true },
    { label: "Podcasts", icon: <IconMic color={colors.purple} /> },
    { label: "Games", icon: <IconGame color={colors.purple} /> },
    { label: "Events", icon: <IconTicket color={colors.orange} /> },
    { label: "Communities", icon: <IconPeople color={colors.purple} /> },
  ];
  return (
    <View style={styles.menu}>
      {items.map((item) => (
        <View key={item.label} style={[styles.menuRow, item.active && { backgroundColor: colors.orange }]}>
          {item.icon}
          <T variant="label" color={item.active ? "#fff" : colors.text}>
            {item.label}
          </T>
        </View>
      ))}
    </View>
  );
}

function Collage() {
  return (
    <View style={styles.collage}>
      <Tile source={mic} label="Podcasts" icon={<IconMic size={16} color={colors.purple} />} style={styles.tileLeft} />
      <Tile source={headphones} label="Music" icon={<IconMusic size={16} color={colors.orange} />} style={styles.tileRight} />
      <Tile source={controller} label="Games" icon={<IconGame size={16} color={colors.purple} />} style={styles.tileLowLeft} />
      <Tile source={community} label="Communities" icon={<IconPeople size={16} color={colors.purple} />} style={styles.tileLowRight} />
      <Tile source={crowd} label="Events" icon={<IconTicket size={16} color={colors.orange} />} style={styles.tileCenter} live />
    </View>
  );
}

function Tile({
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
    <View style={[styles.tile, style]}>
      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={styles.tileShade} />
      {live ? (
        <View style={styles.live}>
          <T variant="caption">Live</T>
        </View>
      ) : null}
      <View style={styles.tileLabel}>
        {icon}
        <T variant="label">{label}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: "center" },
  dark: { flex: 1, backgroundColor: colors.bg },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.28)" },
  top: {
    position: "absolute",
    top: 54,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  copy: { position: "absolute", left: spacing.xl, right: spacing.xl, bottom: 28, gap: spacing.lg },
  dots: { flexDirection: "row", gap: 6, marginTop: spacing.sm },
  dot: { height: 8, borderRadius: radius.pill },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  legalRow: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, alignItems: "center" },
  stage: { flex: 1, marginTop: 96, marginBottom: 250, alignItems: "center", justifyContent: "center" },
  phone: {
    width: 210,
    borderRadius: 28,
    backgroundColor: "#141418",
    borderWidth: 3,
    borderColor: "#2C2C32",
    transform: [{ rotate: "-8deg" }],
    overflow: "hidden",
  },
  phoneTop: { paddingTop: 14, alignItems: "center" },
  album: { height: 180, margin: 10, borderRadius: 16 },
  progress: { height: 4, borderRadius: 4, backgroundColor: colors.orange, marginTop: 8, width: "70%" },
  play: {
    alignSelf: "center",
    marginTop: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 8,
  },
  pause: { width: 4, height: 14, borderRadius: 2, backgroundColor: "#fff" },
  menu: { position: "absolute", right: 16, top: 70, width: 168, gap: 8 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(28,28,34,0.92)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  collage: { flex: 1, marginTop: 96, marginBottom: 230 },
  tile: { position: "absolute", width: 150, height: 150, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: colors.line },
  tileLeft: { left: 18, top: 10 },
  tileRight: { right: 18, top: 24 },
  tileLowLeft: { left: 24, top: 170 },
  tileLowRight: { right: 20, top: 190 },
  tileCenter: { left: 92, top: 86, width: 180, height: 190, zIndex: 2 },
  tileShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  tileLabel: { position: "absolute", left: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  live: { position: "absolute", top: 12, right: 12, backgroundColor: "#2A1216", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
});
