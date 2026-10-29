"use client";

import { useState } from "react";

type Visibility = "public" | "unlisted" | "private";

export function StationVisibility({ id, initialVisibility }: { id: string; initialVisibility: string }) {
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility === "private" || initialVisibility === "unlisted" ? initialVisibility : "public");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function update(next: Visibility) {
    if (next === visibility || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/stations/" + encodeURIComponent(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update visibility.");
      setVisibility(next);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update visibility.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-station-visibility">
      <span className={"admin-status " + visibility}>{visibility}</span>
      <select aria-label="Station visibility" value={visibility} disabled={busy} onChange={(event) => update(event.target.value as Visibility)}>
        <option value="public">Public</option>
        <option value="unlisted">Unlisted</option>
        <option value="private">Private</option>
      </select>
      {busy && <small>Saving…</small>}
      {message && <small role="status" className={message === "Saved" ? "admin-visibility-saved" : "admin-visibility-error"}>{message}</small>}
    </div>
  );
}
