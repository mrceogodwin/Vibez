"use client";

import { useState } from "react";

type Visibility = "public" | "unlisted" | "private";

export function StationActions({ id, visibility }: { id: string; visibility: string }) {
  const [value, setValue] = useState<Visibility>(
    visibility === "unlisted" || visibility === "private" ? visibility : "public",
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    if (busy || value === visibility) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/stations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not update station visibility.");
      setMessage("Saved");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update station.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-station-actions">
      <label className="admin-sr-only" htmlFor={`station-visibility-${id}`}>Visibility for station</label>
      <select id={`station-visibility-${id}`} value={value} onChange={(event) => setValue(event.target.value as Visibility)} disabled={busy}>
        <option value="public">Public</option>
        <option value="unlisted">Unlisted</option>
        <option value="private">Private</option>
      </select>
      <button type="button" onClick={save} disabled={busy || value === visibility}>{busy ? "Saving…" : "Save"}</button>
      {message && <span role="status">{message}</span>}
    </div>
  );
}
