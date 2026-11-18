import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { colors, radius, spacing } from "@/theme";
import { T } from "@/components/ui";
import { glass, Lockup, Stage } from "@/components/brand";
import {
  IconBell,
  IconChat,
  IconClapper,
  IconCompass,
  IconGameFill,
  IconHome,
  IconHomeFill,
  IconMicFill,
  IconMusicFill,
  IconPeopleFill,
  IconPlay,
  IconPlus,
  IconTicketFill,
  IconUser,
} from "@/components/icons";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { kindSubtitle, memberLabel } from "@/lib/editorial";
import { artFor } from "@/lib/editorial-art";

const chips = [
  { id: "for_you", label: "For You" },
  { id: "music", label: "Music" },
  { id: "podcasts", label: "Podcasts" },
  { id: "games", label: "Games" },
  { id: "events", label: "Events" },
  { id: "communities", label: "Communities" },
];

const tiles = [
  { id: "music", label: "Music", icon: IconMusicFill, tint: "#C4B5FD" },
  { id: "podcasts", label: "Podcasts", icon: IconMicFill, tint: "#F0ABFC" },
  { id: "games", label: "Games", icon: IconGameFill, tint: "#C4B5FD" },
  { id: "events", label: "Events", icon: IconTicketFill, tint: "#FB923C" },
  { id: "communities", label: "Communities", icon: IconPeopleFill, tint: "#DDD6FE" },
];

type Hero = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_path: string | null;
  image_key: string | null;
};

type Trend = {
  id: string;
  title: string;
  kind: string;
  image_key: string | null;
  author: string;
};

type Community = {
  id: string;
  name: string;
  members: number;
  image_key: string | null;
  category: string | null;
  joined: boolean;
};

type HomeData = {
  heroes: Hero[];
  trending: Trend[];
  communities: Community[];
  unread: number;
};

export function HomeScreen() {
  const { user } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState("for_you");
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [railWidth, setRailWidth] = useState(0);

  useEffect(() => {
    let active = true;
    api<HomeData>(`/api/home?filter=${filter}`)
      .then((next) => {
        if (!active) return;
        setData(next);
        setHeroIndex(0);
        setError("");
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  const initial = user?.displayName?.slice(0, 1).toUpperCase() || "V";
  const heroes = filter === "for_you" ? data?.heroes ?? [] : [];

  async function join(community: Community) {
    if (community.joined) return;
    const result = await api<{ members: number; joined: boolean }>("/api/communities/join", {
      method: "POST",
      body: JSON.stringify({ communityId: community.id }),
    });
    setData((current) =>
      current
        ? {
            ...current,
            communities: current.communities.map((item) =>
              item.id === community.id ? { ...item, joined: result.joined, members: result.members } : item,
            ),
          }
        : current,
    );
  }

  return (
    <Stage>
      <View style={styles.header}>
        <Lockup size={32} />
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push("/notifications")} style={styles.iconButton}>
            <IconBell />
            {data && data.unread > 0 ? <View style={styles.dot} /> : null}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push("/profile")} style={styles.avatar}>
            <T variant="label">{initial}</T>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((chip) => {
            const active = filter === chip.id;
            return (
              <Pressable key={chip.id} accessibilityRole="button" onPress={() => setFilter(chip.id)} style={[styles.chip, active && styles.chipOn]}>
                <T variant="label" color={active ? "#fff" : colors.textMuted}>
                  {chip.label}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>
        {error ? (
          <T color={colors.danger} selectable>
            {error}
          </T>
        ) : null}
        {!data && !error ? <View style={styles.heroSkeleton} /> : null}
        {heroes.length ? (
          <View onLayout={(event) => setRailWidth(event.nativeEvent.layout.width)}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const width = event.nativeEvent.layoutMeasurement.width || 1;
                setHeroIndex(Math.round(event.nativeEvent.contentOffset.x / width));
              }}
            >
              {heroes.map((hero) => (
                <View key={hero.id} style={{ width: railWidth || undefined }}>
                  <HeroCard hero={hero} onPress={() => hero.cta_path && router.push(hero.cta_path as never)} />
                </View>
              ))}
            </ScrollView>
            <View style={styles.heroDots}>
              {heroes.map((hero, index) => (
                <View key={hero.id} style={[styles.heroDot, index === heroIndex && styles.heroDotOn]} />
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <Pressable key={tile.id} accessibilityRole="button" accessibilityLabel={tile.label} onPress={() => setFilter(tile.id)} style={styles.tile}>
              <tile.icon color={tile.tint} size={26} />
              <T variant="caption" style={styles.tileLabel}>
                {tile.label}
              </T>
            </Pressable>
          ))}
        </View>
        <Section title="Trending Now" onSeeAll={() => router.push("/discover")} />
        {data && data.trending.length === 0 ? (
          <Empty text="Official playlists, rooms and events published by Vibez will show up in this row." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {data?.trending.map((item) => (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push("/discover")} style={styles.trend}>
                <View style={styles.trendArt}>
                  {artFor(item.image_key) ? (
                    <Image source={artFor(item.image_key)} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#241C33" }]} />
                  )}
                  <View style={styles.play}>
                    <IconPlay size={14} color="#1A1A1D" />
                  </View>
                </View>
                <T variant="label" numberOfLines={1}>
                  {item.title}
                </T>
                <T variant="caption" color={colors.textDim}>
                  {kindSubtitle(item.kind)}
                </T>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Section title="Communities for You" onSeeAll={() => router.push("/discover")} />
        {data && data.communities.length === 0 ? (
          <Empty text="Public communities owned on Vibez will appear here, with their real member counts." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {data?.communities.map((item) => (
              <View key={item.id} style={styles.community}>
                <CommunityMark imageKey={item.image_key} category={item.category} />
                <View style={styles.communityCopy}>
                  <T variant="label" numberOfLines={1}>
                    {item.name}
                  </T>
                  <T variant="caption" color={colors.textDim}>
                    {memberLabel(item.members)}
                  </T>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.joined ? `Joined ${item.name}` : `Join ${item.name}`}
                    disabled={item.joined}
                    onPress={() => void join(item).catch((err: Error) => setError(err.message))}
                    style={[styles.join, item.joined && styles.joinOn]}
                  >
                    <T variant="caption" color={item.joined ? colors.orangeDeep : colors.text}>
                      {item.joined ? "Joined" : "Join"}
                    </T>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </Stage>
  );
}

function HeroCard({ hero, onPress }: { hero: Hero; onPress: () => void }) {
  const art = artFor(hero.image_key);
  return (
    <View style={styles.hero}>
      {art ? <Image source={art} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right center" /> : null}
      <View style={styles.heroScrim} />
      <View style={styles.heroCopy}>
        <View style={styles.kicker}>
          <T variant="caption">New on Vibez</T>
        </View>
        <T variant="title" style={styles.heroTitle}>
          {hero.title}
        </T>
        {hero.subtitle ? (
          <T variant="label" color="rgba(255,255,255,0.82)">
            {hero.subtitle}
          </T>
        ) : null}
        {hero.cta_label ? (
          <Pressable accessibilityRole="button" onPress={onPress} style={styles.listen}>
            <IconPlay size={12} />
            <T variant="label">{hero.cta_label}</T>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function CommunityMark({ imageKey, category }: { imageKey: string | null; category: string | null }) {
  const art = artFor(imageKey);
  return (
    <View style={styles.communityAvatar}>
      {art ? (
        <Image source={art} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : category === "games" ? (
        <IconGameFill color="#C4B5FD" />
      ) : (
        <IconClapper color="#F5D0A9" />
      )}
    </View>
  );
}

function Section({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.section}>
      <T variant="headline">{title}</T>
      <Pressable accessibilityRole="button" onPress={onSeeAll}>
        <T variant="label" color={colors.orangeDeep}>
          See All
        </T>
      </Pressable>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <T color={colors.textMuted}>{text}</T>
    </View>
  );
}

export function Dock() {
  const router = useRouter();
  const pathname = usePathname();
  const active = dockTab(pathname);
  const [open, setOpen] = useState(false);
  return (
    <>
      {open ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Close create menu" style={styles.sheetBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <T variant="headline">Create</T>
            <T color={colors.textMuted}>
              Posts, music, podcasts, communities and events are not in this release. Those actions stay closed until each one is built.
            </T>
          </View>
        </Pressable>
      ) : null}
      <View style={styles.dock}>
        <DockItem label="Home" icon={active === "home" ? IconHomeFill : IconHome} active={active === "home"} onPress={() => router.push("/home")} />
        <DockItem label="Discover" icon={IconCompass} active={active === "discover"} onPress={() => router.push("/discover")} />
        <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={() => setOpen(true)} style={styles.createWrap}>
          <View style={styles.create}>
            <IconPlus color="#fff" />
          </View>
        </Pressable>
        <DockItem label="Chats" icon={IconChat} active={active === "chats"} onPress={() => router.push("/chats")} />
        <DockItem label="Profile" icon={IconUser} active={active === "profile"} onPress={() => router.push("/profile")} />
      </View>
    </>
  );
}

function dockTab(pathname: string): "home" | "discover" | "chats" | "profile" | null {
  if (pathname === "/home" || pathname === "/") return "home";
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/chats")) return "chats";
  if (pathname.startsWith("/profile") || pathname.startsWith("/wallet")) return "profile";
  return null;
}

function DockItem({
  label,
  icon: Icon,
  onPress,
  active,
}: {
  label: string;
  icon: (props: { color?: string }) => React.ReactNode;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.dockItem}>
      <Icon color={active ? colors.orangeDeep : "#C8C8D0"} />
      <T variant="caption" color={active ? colors.orangeDeep : "#C8C8D0"}>
        {label}
      </T>
    </Pressable>
  );
}

const heroWash =
  process.env.EXPO_OS === "web"
    ? { backgroundImage: "linear-gradient(90deg, rgba(12,8,10,0.88) 0%, rgba(12,8,10,0.45) 48%, rgba(12,8,10,0.05) 100%)" }
    : { experimental_backgroundImage: "linear-gradient(90deg, rgba(12,8,10,0.92) 0%, rgba(12,8,10,0.35) 55%, rgba(12,8,10,0) 100%)" };

const chipWash =
  process.env.EXPO_OS === "web"
    ? { backgroundImage: "linear-gradient(180deg, #FF9348 0%, #F26A1B 100%)" }
    : { experimental_backgroundImage: "linear-gradient(180deg, #FF9348 0%, #F26A1B 100%)" };

const createWash =
  process.env.EXPO_OS === "web"
    ? { backgroundImage: "linear-gradient(180deg, #FF9348 0%, #F26A1B 100%)" }
    : { experimental_backgroundImage: "linear-gradient(180deg, #FF9348 0%, #F26A1B 100%)" };

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF7A1A", borderWidth: 1, borderColor: "#0D0D0F" },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#FF7A1A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A211C",
  },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: 10, gap: 12, paddingBottom: 108 },
  chips: { gap: 8, paddingRight: 12 },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "rgba(40,40,46,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.orangeDeep, borderColor: "transparent", ...chipWash },
  heroSkeleton: { height: 228, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.04)" },
  hero: { width: "100%", height: 196, borderRadius: 26, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#1A120E" },
  heroScrim: { ...StyleSheet.absoluteFill, ...heroWash },
  heroCopy: { flex: 1, justifyContent: "flex-end", padding: 18, gap: 8, maxWidth: "72%" },
  kicker: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(20,16,20,0.45)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroTitle: { fontSize: 28, lineHeight: 32 },
  listen: {
    alignSelf: "flex-start",
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF7A1A",
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 36,
    ...chipWash,
  },
  heroDots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  heroDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#5A5A62" },
  heroDotOn: { width: 18, backgroundColor: "#FF7A1A" },
  tiles: { flexDirection: "row", gap: 8 },
  tile: {
    flex: 1,
    height: 74,
    borderRadius: 20,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(36,30,48,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
  },
  tileLabel: { fontSize: 11, lineHeight: 13, textAlign: "center" },
  section: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  empty: { ...glass, borderRadius: 18, padding: spacing.lg },
  rail: { gap: 12, paddingRight: 8 },
  trend: { width: 132, gap: 6 },
  trendArt: { width: 132, height: 124, borderRadius: 20, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#241C33" },
  play: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  community: {
    width: 228,
    minHeight: 92,
    borderRadius: 22,
    borderCurve: "continuous",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(32,30,38,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  communityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#2A2438",
    alignItems: "center",
    justifyContent: "center",
  },
  communityCopy: { flex: 1, gap: 2 },
  join: {
    alignSelf: "flex-end",
    marginTop: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  joinOn: { backgroundColor: "rgba(255,122,26,0.12)" },
  dock: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 16,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(24,24,28,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)",
  },
  dockItem: { alignItems: "center", gap: 2, minWidth: 56 },
  createWrap: { marginTop: -26 },
  create: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderCurve: "continuous",
    backgroundColor: colors.orangeDeep,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 18px rgba(242,106,27,0.4)",
    ...createWash,
  },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", padding: spacing.lg, paddingBottom: 110, zIndex: 5 },
  sheet: { ...glass, borderRadius: 22, padding: spacing.lg, gap: spacing.sm },
});
