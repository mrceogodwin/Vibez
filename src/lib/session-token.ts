import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "vibez.session";

export async function readSessionToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  return SecureStore.getItemAsync(KEY);
}

export async function saveSessionToken(token: string): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  if (Platform.OS === "web") return;
  await SecureStore.deleteItemAsync(KEY);
}
