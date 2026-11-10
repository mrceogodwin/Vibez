import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { askDeletion, loadSession, saveAppearance, saveNotificationPrefs } from "@/lib/platform.functions";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [prefs, setPrefs] = useState({ email: true, releases: true, events: true, campaigns: true });
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("vibez.theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    }
    loadSession().then((bundle) => setPrefs(bundle.profile.notifications)).catch(() => setMessage("Sign in to change account settings."));
  }, []);

  function applyTheme(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("vibez.theme", next);
    void saveAppearance({ data: { appearance: next } }).catch(() => undefined);
  }

  return (
    <AppFrame>
      <h1 style={{ letterSpacing: "-0.04em" }}>Settings</h1>
      <section className="panel">
        <h2>Appearance</h2>
        <p className="note">Light is the Vibez default. Dark is optional and stays on this device.</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className={theme === "light" ? "btn" : "btn ghost"} onClick={() => applyTheme("light")}>Light</button>
          <button type="button" className={theme === "dark" ? "btn" : "btn ghost"} onClick={() => applyTheme("dark")}>Dark</button>
        </div>
      </section>
      <form className="panel" onSubmit={(event) => {
        event.preventDefault();
        saveNotificationPrefs({ data: prefs }).then(() => setMessage("Notification preferences saved.")).catch((error) => setMessage(error instanceof Error ? error.message : "Could not save."));
      }}>
        <h2>Notifications</h2>
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
        <button className="btn" type="submit">Save preferences</button>
      </form>
      <section className="panel">
        <h2>Account</h2>
        <p>Deletion is a request. An admin actions it. Nothing is erased immediately.</p>
        <button type="button" className="btn ghost" onClick={() => void askDeletion().then(() => setMessage("Deletion request recorded."))}>Request account deletion</button>
      </section>
      {message ? <p className="note">{message}</p> : null}
    </AppFrame>
  );
}
