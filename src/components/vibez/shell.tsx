import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Dock } from "@/components/vibez/dock";
import { useCurrentUser } from "@/lib/auth/use-current-user";

const more = [
  { to: "/home", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/music", label: "Music" },
  { to: "/artists", label: "Artists" },
  { to: "/events", label: "Events" },
  { to: "/create", label: "List an event" },
  { to: "/account", label: "Tickets" },
  { to: "/curators", label: "Curators" },
  { to: "/tv", label: "Vibez TV" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const initial = (user?.displayName || user?.primaryEmail || "V").charAt(0).toUpperCase();

  return (
    <div className="vz-app is-light">
      <header className="vz-top">
        <Link to="/home" aria-label="Vibez home">
          <img className="vz-logo" src="/brand/vibez-mark-blue.png" alt="Vibez" />
        </Link>
        <div className="vz-actions">
          <Link to="/activity" className="vz-icon" aria-label="Activity">
            <Bell />
          </Link>
          <Link to="/profile" className="fd-avatar" aria-label="Profile">
            {initial}
          </Link>
          <button type="button" className="vz-icon" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
        </div>
      </header>
      {open ? (
        <div className="vz-menu" role="presentation" onClick={() => setOpen(false)}>
          <div className="vz-menu-panel" role="dialog" aria-label="Menu" onClick={(event) => event.stopPropagation()}>
            <div className="vz-menu-head">
              <strong>Vibez</strong>
              <button type="button" className="vz-icon" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            {more.map((item) => (
              <Link key={item.to} to={item.to} className={path === item.to ? "is-on" : undefined} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <main className="vz-main">{children}</main>
      <Dock tone="light" />
    </div>
  );
}
