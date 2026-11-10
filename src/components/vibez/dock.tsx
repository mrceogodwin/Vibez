import { Link, useRouterState } from "@tanstack/react-router";
import { AudioLines, Compass, Home, Plus, UserRound, X } from "lucide-react";
import { useState } from "react";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/activity", label: "Activity", icon: AudioLines },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function Dock({ tone }: { tone: "dark" | "light" }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={tone === "dark" ? "fd-dock is-dark" : "fd-dock"} aria-label="Main">
        {tabs.slice(0, 2).map((tab) => (
          <Link key={tab.to} to={tab.to} className={path === tab.to ? "is-on" : undefined}>
            <tab.icon size={22} />
            {tab.label}
          </Link>
        ))}
        <button type="button" className="fd-plus" aria-label="Create" onClick={() => setOpen(true)}>
          <Plus size={26} />
        </button>
        {tabs.slice(2).map((tab) => (
          <Link key={tab.to} to={tab.to} className={path === tab.to ? "is-on" : undefined}>
            <tab.icon size={22} />
            {tab.label}
          </Link>
        ))}
      </nav>
      {open ? (
        <div className="fd-sheet" role="dialog" aria-label="Create">
          <button type="button" className="fd-sheet-bg" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="fd-sheet-card">
            <div className="fd-sheet-head">
              <strong>Create</strong>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <Link to="/create" onClick={() => setOpen(false)}>List an event</Link>
            <Link to="/discover" onClick={() => setOpen(false)}>Promote music</Link>
            <Link to="/discover" onClick={() => setOpen(false)}>Run an ad campaign</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
