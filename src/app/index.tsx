import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { colors } from "@/theme";
import { Onboarding } from "@/screens/onboarding";
import { useSession } from "@/lib/session";
import { onboardingSeen } from "@/lib/preferences";

export default function Index() {
  const { user, ready } = useSession();
  const [seen, setSeen] = useState<boolean | null>(null);
  useEffect(() => {
    onboardingSeen().then(setSeen).catch(() => setSeen(false));
  }, []);
  if (!ready || seen === null) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (user) return <Redirect href="/home" />;
  if (seen) return <Redirect href="/get-started" />;
  return <Onboarding />;
}
