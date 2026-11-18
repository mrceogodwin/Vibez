import { Platform } from "react-native";

export type ApiError = Error & { code?: string };

function base() {
  if (Platform.OS === "web") return "";
  return process.env.EXPO_PUBLIC_API_URL || "";
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (Platform.OS !== "web") headers.set("x-vibez-client", "native");
  const response = await fetch(`${base()}${path}`, { ...init, headers, credentials: "include" });
  const data = (await response.json().catch(() => ({}))) as { error?: { message?: string; code?: string } };
  if (!response.ok) {
    const error = new Error(data.error?.message || "Something went wrong.") as ApiError;
    error.code = data.error?.code;
    throw error;
  }
  return data as T;
}
