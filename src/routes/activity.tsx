import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { loadActivity, readActivity } from "@/lib/platform.functions";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

type Note = Awaited<ReturnType<typeof loadActivity>>[number];

function ActivityPage() {
  const [items, setItems] = useState<Note[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadActivity()
      .then(async (rows) => {
        setItems(rows);
        if (rows.some((row) => !row.read)) await readActivity().catch(() => undefined);
      })
      .catch(() => setError("Sign in to see tickets, reviews and account updates."));
  }, []);

  return (
    <AppFrame>
      <h1 style={{ margin: "8px 0 4px", fontSize: 32, letterSpacing: "-0.04em" }}>Activity</h1>
      <p style={{ margin: 0, color: "#69738a" }}>Tickets, reviews and account messages from this account.</p>
      {error ? (
        <div className="empty">
          <div className="mark"><Bell /></div>
          <h2>Sign in for activity</h2>
          <p>{error}</p>
          <Link className="btn" to="/login">Log in</Link>
        </div>
      ) : items === null ? (
        <div className="panel">Loading your activity…</div>
      ) : items.length === 0 ? (
        <div className="empty">
          <div className="mark"><Bell /></div>
          <h2>You&apos;re all caught up</h2>
          <p>Ticket receipts, campaign reviews and event reminders will land here. Nothing is waiting.</p>
          <Link className="btn" to="/discover">Discover something</Link>
        </div>
      ) : (
        <div className="group">
          {items.map((item) => (
            <a key={item.id} href={item.href || "/activity"} className="rowlink">
              <span className="ico"><Bell size={16} /></span>
              <span>
                {item.title}
                <small>{item.body}</small>
              </span>
              <span />
            </a>
          ))}
        </div>
      )}
    </AppFrame>
  );
}
