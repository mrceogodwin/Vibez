import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { loadSession, saveNotificationPrefs } from "@/lib/platform.functions";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [prefs, setPrefs] = useState({ email: true, releases: true, events: true, campaigns: true });
  const [message, setMessage] = useState("");
  useEffect(() => {
    loadSession().then((bundle) => setPrefs(bundle.profile.notifications)).catch(() => setMessage("Sign in to change notifications."));
  }, []);
  return (
    <AppFrame>
      <h1>Notifications</h1>
      <form className="panel" onSubmit={(event) => {
        event.preventDefault();
        saveNotificationPrefs({ data: prefs }).then(() => setMessage("Saved.")).catch((error) => setMessage(error instanceof Error ? error.message : "Could not save."));
      }}>
        {([
          ["email", "Email"],
          ["releases", "New music from artists you follow"],
          ["events", "Event reminders"],
          ["campaigns", "Campaign updates"],
        ] as const).map(([key, label]) => (
          <label key={key} className="rowlink">
            <input type="checkbox" checked={prefs[key]} onChange={(event) => setPrefs({ ...prefs, [key]: event.target.checked })} />
            <span>{label}</span>
          </label>
        ))}
        <button className="btn" type="submit">Save</button>
        {message ? <p className="note">{message}</p> : null}
      </form>
    </AppFrame>
  );
}
