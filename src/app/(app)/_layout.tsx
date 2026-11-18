import { Redirect, Slot } from "expo-router";
import { View } from "react-native";
import { colors } from "@/theme";
import { useSession } from "@/lib/session";
import { Dock } from "@/screens/home";

export default function AppLayout() {
  const { user, ready } = useSession();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  if (!user) return <Redirect href="/login" />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Slot />
      <Dock />
    </View>
  );
}
