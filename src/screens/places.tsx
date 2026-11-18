import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "@/theme";
import { Button, T } from "@/components/ui";
import { api } from "@/lib/api";
import { clearSessionToken } from "@/lib/session-token";
import { useSession } from "@/lib/session";
import { formatNaira } from "@/server/money";

export function DiscoverScreen() {
  return <Page title="Discover" body="Nothing to explore yet. People, music, communities and events will show up here as they are published." />;
}

export function ChatsScreen() {
  return <Page title="Chats" body="Your conversations will show up here." />;
}

export function NotificationsScreen() {
  const [items, setItems] = useState<{ id: string; title: string; body: string }[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<{ notifications: { id: string; title: string; body: string }[] }>("/api/notifications")
      .then((data) => setItems(data.notifications))
      .catch((err: Error) => setError(err.message));
  }, []);
  return (
    <Page title="Notifications" body={error || (items && items.length === 0 ? "You have no notifications." : "")}>
      {items?.map((item) => (
        <View key={item.id} style={styles.card}>
          <T variant="label">{item.title}</T>
          <T color={colors.textMuted}>{item.body}</T>
        </View>
      ))}
    </Page>
  );
}

export function ProfileScreen() {
  const { user, refresh } = useSession();
  const router = useRouter();
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    await clearSessionToken();
    await refresh();
    router.replace("/login");
  }
  return (
    <Page title={user?.displayName || "Profile"} body={`@${user?.username || ""}`}>
      <View style={styles.stats}>
        <Stat label="Posts" value={user?.posts ?? 0} />
        <Stat label="Followers" value={user?.followers ?? 0} />
        <Stat label="Following" value={user?.following ?? 0} />
      </View>
      <T color={colors.textMuted}>{user?.email}</T>
      <T color={colors.textMuted}>{user?.plusUntil ? `Vibez Plus until ${new Date(user.plusUntil).toLocaleDateString("en-NG")}` : "Vibez Plus is not active."}</T>
      <Button title="Wallet" variant="dark" onPress={() => router.push("/wallet")} />
      <Button title="Log out" variant="ghost" onPress={logout} />
    </Page>
  );
}

type WalletResponse = {
  balanceLabel: string;
  credits: number;
  bundles: { code: string; amount_kobo: number; credits: number }[];
  entries: { id: string; amount_kobo: number; entry_type: string; created_at: string }[];
  payments: { enabled: boolean; status: string; message: string };
  plusUntil: string | null;
};

export function WalletScreen() {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api<WalletResponse>("/api/wallet")
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function topup(code: string) {
    setError("");
    setMessage("");
    try {
      const result = await api<{ checkoutUrl: string }>("/api/wallet/topup", { method: "POST", body: JSON.stringify({ bundleCode: code }) });
      await Linking.openURL(result.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the top-up.");
    }
  }

  async function plus() {
    setError("");
    try {
      const result = await api<{ checkoutUrl: string }>("/api/wallet/plus", { method: "POST", body: JSON.stringify({}) });
      await Linking.openURL(result.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Vibez Plus.");
    }
  }

  return (
    <Page title="Wallet" body={data ? `${data.balanceLabel} · ${data.credits.toLocaleString("en-NG")} credits` : "Loading your balance"}>
      <T color={colors.textMuted}>1 credit equals ₦1. Your balance comes from your transaction history.</T>
      {data && !data.payments.enabled ? <T color={colors.textMuted}>{data.payments.message}</T> : null}
      {error ? <T color={colors.danger}>{error}</T> : null}
      {message ? <T color={colors.success}>{message}</T> : null}
      <T variant="headline">Top up</T>
      {data?.bundles.map((bundle) => (
        <Pressable key={bundle.code} accessibilityRole="button" disabled={!data.payments.enabled} onPress={() => topup(bundle.code)} style={[styles.card, styles.bundle, !data.payments.enabled && styles.bundleOff]}>
          <T variant="label">{formatNaira(Number(bundle.amount_kobo))}</T>
          <T variant="caption" color={colors.textMuted}>
            {bundle.credits.toLocaleString("en-NG")} credits
          </T>
        </Pressable>
      ))}
      <T variant="headline">Vibez Plus</T>
      <T color={colors.textMuted}>₦2,000 for 30 days. Renewal is manual. Benefits are not switched on until they are approved.</T>
      <Button title="Renew or start Plus" onPress={plus} disabled={!data?.payments.enabled} />
      <T variant="headline">Ledger</T>
      {data && data.entries.length === 0 ? <EmptyLine text="No wallet activity yet." /> : null}
      {data?.entries.map((entry) => (
        <View key={entry.id} style={styles.card}>
          <T variant="label">{entry.entry_type.replaceAll("_", " ")}</T>
          <T color={Number(entry.amount_kobo) < 0 ? colors.danger : colors.success}>{formatNaira(Number(entry.amount_kobo))}</T>
        </View>
      ))}
    </Page>
  );
}

export function LegalScreen({ title, body }: { title: string; body: string }) {
  return <Page title={title} body={body} />;
}

function Page({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <T variant="title">{title}</T>
      {body ? <T color={colors.textMuted}>{body}</T> : null}
      {children}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <T variant="headline">{value}</T>
      <T variant="caption" color={colors.textDim}>
        {label}
      </T>
    </View>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <T color={colors.textMuted}>{text}</T>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: 64, paddingBottom: 148, gap: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: 4, borderWidth: 1, borderColor: colors.line },
  bundle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56 },
  bundleOff: { opacity: 0.72 },
  stats: { flexDirection: "row", gap: spacing.lg },
  stat: { alignItems: "flex-start" },
});
