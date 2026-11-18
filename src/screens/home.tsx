import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/theme";
import { T } from "@/components/ui";
import { IconBell, IconChat, IconCompass, IconGame, IconHome, IconMic, IconMusic, IconPeople, IconPlus, IconTicket, IconUser, Mark } from "@/components/icons";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";

const chips = [
  { id: "for_you", label: "For You" },
  { id: "music", label: "Music" },
  { id: "podcasts", label: "Podcasts" },
  { id: "games", label: "Games" },
  { id: "events", label: "Events" },
  { id: "communities", label: "Communities" },
];

const tiles = [
  { id: "music", label: "Music", icon: IconMusic, tint: "#FF7A18" },
  { id: "podcasts", label: "Podcasts", icon: IconMic, tint: "#C084FC" },
  { id: "games", label: "Games", icon: IconGame, tint: "#A78BFA" },
  { id: "events", label: "Events", icon: IconTicket, tint: "#FB923C" },
  { id: "communities", label: "Communities", icon: IconPeople, tint: "#C4B5FD" },
];

type HomeData = {
  heroes: { id: string; title: string; subtitle: string | null; cta_label: string | null; cta_path: string | null }[];
  trending: { id: string; body: string; display_name: string; username: string; kind: string }[];
  communities: { id: string; name: string; description: string; members: number; category: string | null }[];
};

export function HomeScreen() {
  const { user } = useSession();
  const router = useRouter();
  const [filter, setFilter] = useState("for_you");
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api<HomeData>(`/api/home?filter=${filter}`)
      .then((next) => {
        if (active) setData(next);
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  const initial = user?.displayName?.slice(0, 1).toUpperCase() || "V";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Mark size={32} />
          <T variant="headline">Vibez</T>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push("/notifications")} style={styles.iconButton}>
            <IconBell />
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
        {error ? <T color={colors.danger}>{error}</T> : null}
        {data?.heroes.length ? (
          <View style={styles.hero}>
            <T variant="caption" color={colors.orange}>
              On Vibez
            </T>
            <T variant="title">{data.heroes[0].title}</T>
            {data.heroes[0].subtitle ? <T color={colors.textMuted}>{data.heroes[0].subtitle}</T> : null}
          </View>
        ) : (
          <View style={styles.hero}>
            <T variant="caption" color={colors.orange}>
              Your home
            </T>
            <T variant="title">Nothing here yet</T>
            <T color={colors.textMuted}>Posts, music and events from people you follow will show up in this spot. There is no sample content.</T>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
          {tiles.map((tile) => (
            <Pressable key={tile.id} accessibilityRole="button" onPress={() => setFilter(tile.id)} style={styles.tile}>
              <tile.icon color={tile.tint} />
              <T variant="caption">{tile.label}</T>
            </Pressable>
          ))}
        </ScrollView>
        <Section title="Trending Now" onSeeAll={() => router.push("/discover")} />
        {data && data.trending.length === 0 ? (
          <Empty text="Nothing is trending yet. When members publish, it will appear here." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {data?.trending.map((item) => (
              <View key={item.id} style={styles.trend}>
                <T variant="label">{item.display_name}</T>
                <T variant="caption" color={colors.textMuted} numberOfLines={3}>
                  {item.body || item.kind}
                </T>
              </View>
            ))}
          </ScrollView>
        )}
        <Section title="Communities for You" onSeeAll={() => router.push("/discover")} />
        {data && data.communities.length === 0 ? (
          <Empty text="No public communities yet. Joining opens when a real community exists." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {data?.communities.map((item) => (
              <View key={item.id} style={styles.community}>
                <T variant="label">{item.name}</T>
                <T variant="caption" color={colors.textMuted}>
                  {item.members.toLocaleString("en-NG")} members
                </T>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.section}>
      <T variant="headline">{title}</T>
      <Pressable accessibilityRole="button" onPress={onSeeAll}>
        <T variant="label" color={colors.orange}>
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
        <DockItem label="Home" icon={IconHome} active onPress={() => router.push("/home")} />
        <DockItem label="Discover" icon={IconCompass} onPress={() => router.push("/discover")} />
        <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={() => setOpen(true)} style={styles.create}>
          <IconPlus color="#fff" />
        </Pressable>
        <DockItem label="Chats" icon={IconChat} onPress={() => router.push("/chats")} />
        <DockItem label="Profile" icon={IconUser} onPress={() => router.push("/profile")} />
      </View>
    </>
  );
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
      <Icon color={active ? colors.orange : colors.textDim} />
      <T variant="caption" color={active ? colors.orange : colors.textDim}>
        {label}
      </T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 54, paddingHorizontal: spacing.xl, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.orange, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgRaised },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 120 },
  chips: { gap: spacing.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.chip },
  chipOn: { backgroundColor: colors.orange },
  hero: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm, borderWidth: 1, borderColor: colors.line, minHeight: 180, justifyContent: "flex-end" },
  tiles: { gap: spacing.md },
  tile: { width: 68, height: 78, borderRadius: 18, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderColor: colors.line },
  section: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empty: { backgroundColor: colors.bgRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.line },
  rail: { gap: spacing.md },
  trend: { width: 160, height: 140, borderRadius: 18, backgroundColor: colors.card, padding: spacing.md, justifyContent: "flex-end", gap: 6 },
  community: { width: 180, borderRadius: 18, backgroundColor: colors.card, padding: spacing.lg, gap: 6, borderWidth: 1, borderColor: colors.line },
  dock: { position: "absolute", left: 16, right: 16, bottom: 18, height: 68, borderRadius: 28, backgroundColor: colors.dock, flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderWidth: 1, borderColor: colors.line },
  dockItem: { alignItems: "center", gap: 2, minWidth: 56 },
  create: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", marginTop: -22 },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", padding: spacing.lg, paddingBottom: 100 },
  sheet: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm },
});
