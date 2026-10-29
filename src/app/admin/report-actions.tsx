"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReportActionProps = { id: string; status: string };

export function ReportActions({ id, status }: ReportActionProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState(status);

  async function update(nextStatus: "reviewing" | "resolved" | "dismissed") {
    if (busy || currentStatus === "resolved" || currentStatus === "dismissed") return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update report.");
      setCurrentStatus(data.report.status);
      setMessage("Saved");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update report.");
    } finally {
      setBusy(false);
    }
  }

  const closed = currentStatus === "resolved" || currentStatus === "dismissed";
  return (
    <div className="admin-report-actions">
      <span className={`admin-status ${currentStatus}`}>{currentStatus}</span>
      {!closed && <div className="admin-action-buttons">
        {currentStatus !== "reviewing" && <button type="button" disabled={busy} onClick={() => update("reviewing")}>{busy ? "Saving…" : "Review"}</button>}
        <button type="button" disabled={busy} onClick={() => update("resolved")}>Resolve</button>
        <button type="button" disabled={busy} onClick={() => update("dismissed")}>Dismiss</button>
      </div>}
      {message && <small className="admin-action-message" role="status">{message}</small>}
    </div>
  );
}
