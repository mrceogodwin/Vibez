import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, spacing } from "@/theme";
import { Button, Field, T } from "@/components/ui";
import { IconBack, Mark } from "@/components/icons";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";

export function LoginScreen() {
  const router = useRouter();
  const { refresh } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      await refresh();
      router.replace("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Log in with your email and password.">
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      {error ? <T color={colors.danger}>{error}</T> : null}
      <Button title="Log in" onPress={submit} loading={loading} />
      <Pressable accessibilityRole="link" onPress={() => router.push("/forgot-password")}>
        <T variant="label" color={colors.orange}>
          Forgot password?
        </T>
      </Pressable>
    </AuthFrame>
  );
}

export function SignupScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ message: string; verificationPath?: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (result.verificationPath) {
        router.replace(result.verificationPath as never);
        return;
      }
      setInfo(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title="Create your account" subtitle="A verified email is required before you can use Vibez.">
      <Field label="Display name" value={form.displayName} onChangeText={(displayName) => setForm({ ...form, displayName })} />
      <Field label="Username" value={form.username} onChangeText={(username) => setForm({ ...form, username })} autoCapitalize="none" />
      <Field label="Email" value={form.email} onChangeText={(email) => setForm({ ...form, email })} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Password" value={form.password} onChangeText={(password) => setForm({ ...form, password })} secureTextEntry />
      {error ? <T color={colors.danger}>{error}</T> : null}
      {info ? <T color={colors.success}>{info}</T> : null}
      <Button title="Create account" onPress={submit} loading={loading} />
    </AuthFrame>
  );
}

export function ForgotScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ message: string; resetPath?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (result.resetPath) {
        router.replace(result.resetPath as never);
        return;
      }
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title="Reset your password" subtitle="We will email a reset link if the account exists.">
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      {error ? <T color={colors.danger}>{error}</T> : null}
      {message ? <T color={colors.success}>{message}</T> : null}
      <Button title="Send reset link" onPress={submit} loading={loading} />
    </AuthFrame>
  );
}

export function ResetScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token: params.token, password }) });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title="Choose a new password" subtitle="This signs you out of other sessions.">
      <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <T color={colors.danger}>{error}</T> : null}
      <Button title="Update password" onPress={submit} loading={loading} />
    </AuthFrame>
  );
}

export function VerifyScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await api("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token: params.token }) });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title="Verify your email" subtitle={done ? "Your email is verified. You can log in." : "Confirm this address to finish creating your account."}>
      {error ? <T color={colors.danger}>{error}</T> : null}
      {done ? <Button title="Go to log in" onPress={() => router.replace("/login")} /> : <Button title="Verify email" onPress={submit} loading={loading} />}
    </AuthFrame>
  );
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
        <IconBack />
      </Pressable>
      <View style={styles.brand}>
        <Mark size={36} />
        <T variant="headline">Vibez</T>
      </View>
      <T variant="title">{title}</T>
      <T color={colors.textMuted}>{subtitle}</T>
      <View style={{ gap: spacing.lg }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, paddingTop: 54, gap: spacing.md },
  back: { width: 44, height: 44, justifyContent: "center" },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
