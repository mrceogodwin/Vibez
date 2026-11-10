import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarPlus,
  CirclePlay,
  Crown,
  House,
  Menu,
  Search,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { usePrefs } from "@/lib/prefs";

const links = [
  { to: "/", label: "Home", icon: House },
  { to: "/events", label: "Events", icon: Ticket },
  { to: "/tv", label: "Vibez TV", icon: CirclePlay },
  { to: "/create", label: "Create Event", icon: CalendarPlus },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

function isOn(path: string, to: string) {
  if (to === "/") return path === "/";
  return path === to || path.startsWith(`${to}/`);
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const profile = usePrefs((state) => state.profile);
  const [open, setOpen] = useState(false);
  const loginLabel = profile ? profile.name.split(" ")[0] : "Log in";

  return (
    <div className="vz-app">
      <header className="vz-top">
        <div className="vz-left">
          <Link to="/account" className="vz-icon" aria-label="Account">
            <UserRound />
          </Link>
          <Link to="/" className="vz-brand" aria-label="VIBEZ home">
            <Crown strokeWidth={2.2} />
            <span className="vz-word">VIBEZ</span>
            <span className="vz-tag">EVENTS · TICKETS · EXPERIENCES</span>
          </Link>
          <nav className="vz-desk" aria-label="Primary">
            <Link to="/events" className={isOn(path, "/events") ? "is-on" : undefined}>
              Events
            </Link>
            <Link to="/curators" className={isOn(path, "/curators") ? "is-on" : undefined}>
              Curators
            </Link>
            <Link to="/tv" className={isOn(path, "/tv") ? "is-on" : undefined}>
              Vibez TV
            </Link>
            <Link to="/create" className={isOn(path, "/create") ? "is-on" : undefined}>
              Create
            </Link>
          </nav>
        </div>
        <div className="vz-actions">
          <Link to="/events" className="vz-icon" aria-label="Search events">
            <Search />
          </Link>
          <Link to="/account" className="vz-login">
            {loginLabel}
          </Link>
          <button type="button" className="vz-icon vz-burger" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
        </div>
      </header>
      {open ? (
        <div className="vz-menu" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="vz-menu-panel"
            role="dialog"
            aria-label="Menu"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="vz-menu-head">
              <strong>VIBEZ</strong>
              <button type="button" className="vz-icon" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            {links.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
            <Link to="/curators" onClick={() => setOpen(false)}>
              Curators
            </Link>
            <Link to="/events" search={{ status: "live" }} onClick={() => setOpen(false)}>
              Live events
            </Link>
          </div>
        </div>
      ) : null}
      <main className="vz-main">{children}</main>
      <nav className="vz-dock" aria-label="Mobile">
        {links.map((item) => {
          const Icon = item.icon;
          const on = isOn(path, item.to);
          return (
            <Link key={item.to} to={item.to} className={on ? "is-on" : undefined} aria-current={on ? "page" : undefined}>
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
