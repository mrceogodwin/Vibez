"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AdminSignOut({ redirectTo = "/login" }: { redirectTo?: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      await authClient.signOut();
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setBusy(false);
    }
  }

  return <button className="admin-signout" type="button" onClick={signOut} disabled={busy}>{busy ? "Signing out…" : "Sign out ↗"}</button>;
}
