import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CalendarPlus,
  Compass,
  Home,
  Megaphone,
  Music,
  Plus,
  Ticket,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlayerBar } from "@/components/vibez/player-bar";
import { loadSession } from "@/lib/platform.functions";
import { useCurrentUser } from "@/lib/auth/use-current-user";

const tabs = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/activity", label: "Activity", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

const tabOrder = ["/home", "/discover", "/activity", "/profile"];

type Bundle = Awaited<ReturnType<typeof loadSession>>;

export function AppFrame({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const prev = useRef(path);
  const motion = useRef("fade");
  if (prev.current !== path) {
    const a = tabOrder.indexOf(prev.current);
    const b = tabOrder.indexOf(path);
    motion.current = a === -1 || b === -1 ? "fade" : b > a ? "forward" : b < a ? "back" : "fade";
    prev.current = path;
  }

  useEffect(() => {
    let stop = false;
    loadSession()
      .then((value) => {
        if (!stop) setBundle(value);
      })
      .catch(() => {
        if (!stop) setBundle(null);
      });
    return () => {
      stop = true;
    };
  }, [user?.id, path]);

  const initial = (bundle?.profile.displayName || user?.displayName || user?.primaryEmail || "V").charAt(0).toUpperCase();
  const roles = bundle?.profile.roles ?? [];
  const actions = createActions(roles);

  if (bare) return <div className="app">{children}</div>;

  return (
    <div className="app">
      <div className="app-shell">
        <aside className="app-side">
          <Link to="/home" aria-label="Vibez home">
            <img className="app-logo" src="/brand/vibez-mark-blue.png" alt="Vibez" />
          </Link>
          {tabs.map((tab) => (
            <Link key={tab.to} to={tab.to} className={path === tab.to ? "is-on" : undefined}>
              <tab.icon size={18} /> {tab.label}
            </Link>
          ))}
          <Link to="/music" className={path.startsWith("/music") ? "is-on" : undefined}><Music size={18} /> Music</Link>
          <Link to="/events" className={path.startsWith("/events") ? "is-on" : undefined}><Ticket size={18} /> Events</Link>
          <button type="button" className="nav" onClick={() => setOpen(true)}>
            <Plus size={18} /> Create
          </button>
          {bundle?.staffRole ? <Link to="/control">Control Room</Link> : null}
        </aside>
        <div className="app-col">
          <header className="app-top">
            <Link to="/home" aria-label="Vibez home">
              <img className="app-logo" src="/brand/vibez-mark-blue.png" alt="Vibez" />
            </Link>
            <div className="app-tools">
              <Link to="/activity" className="app-iconbtn" aria-label="Activity">
                <Bell size={18} />
                {bundle?.unread ? <i className="app-dot" /> : null}
              </Link>
              <Link to="/profile" className="app-avatar" aria-label="Profile">
                {bundle?.profile.avatarUrl ? <img src={bundle.profile.avatarUrl} alt="" /> : initial}
              </Link>
            </div>
          </header>
          <div key={path} className="app-stage" data-motion={motion.current}>
            {children}
          </div>
          <PlayerBar />
          <nav className="app-dock" aria-label="Main">
            {tabs.slice(0, 2).map((tab) => (
              <Link key={tab.to} to={tab.to} className={path === tab.to ? "app-tab is-on" : "app-tab"}>
                <tab.icon />
                {tab.label}
              </Link>
            ))}
            <button type="button" className="app-plus" aria-label="Create" onClick={() => setOpen(true)}>
              <Plus size={26} />
            </button>
            {tabs.slice(2).map((tab) => (
              <Link key={tab.to} to={tab.to} className={path === tab.to ? "app-tab is-on" : "app-tab"}>
                <tab.icon />
                {tab.label}
              </Link>
            ))}
          </nav>
          <CreateSheet open={open} onClose={() => setOpen(false)} actions={actions} signedIn={Boolean(user)} />
        </div>
      </div>
    </div>
  );
}

function createActions(roles: string[]) {
  const all = [
    { to: "/studio", label: "Submit music", detail: "Send a release for review", icon: Music, needs: ["artist"] },
    { to: "/studio", label: "Promote music", detail: "Book a placement. Editorial still decides.", icon: Megaphone, needs: ["artist"] },
    { to: "/create", label: "List an event", detail: "Draft tickets for approval", icon: CalendarPlus, needs: ["organiser"] },
    { to: "/ads", label: "Run an ad campaign", detail: "Request sponsored inventory", icon: Ticket, needs: ["advertiser"] },
    { to: "/community", label: "Community push", detail: "Invite approved communities", icon: Users, needs: ["artist", "community"] },
  ] as const;
  if (roles.length === 0) return [];
  return all.filter((item) => item.needs.some((role) => roles.includes(role)));
}

function CreateSheet({
  open,
  onClose,
  actions,
  signedIn,
}: {
  open: boolean;
  onClose: () => void;
  actions: ReturnType<typeof createActions>;
  signedIn: boolean;
}) {
  const [drag, setDrag] = useState(0);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) setDrag(0);
  }, [open]);

  return (
    <div className={open ? "sheet is-open" : "sheet"} aria-hidden={!open}>
      <button type="button" className="sheet-bg" aria-label="Close create menu" onClick={onClose} />
      <div
        className="sheet-card"
        role="dialog"
        aria-label="Create"
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
        onPointerDown={(event) => {
          startY.current = event.clientY;
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (startY.current == null) return;
          setDrag(Math.max(0, event.clientY - startY.current));
        }}
        onPointerUp={() => {
          if (drag > 90) onClose();
          setDrag(0);
          startY.current = null;
        }}
      >
        <div className="sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Create</h2>
          <button type="button" className="app-iconbtn" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </div>
        {!signedIn ? (
          <p className="lead">Sign in to submit music, list events or run a campaign.</p>
        ) : actions.length === 0 ? (
          <p className="lead">Add an artist, organiser, advertiser or community role on your profile. A role does not publish anything by itself.</p>
        ) : (
          <p className="lead">Only the actions for your roles are shown.</p>
        )}
        {signedIn ? actions.map((item) => (
          <Link key={item.label} to={item.to} className="sheet-item" onClick={onClose}>
            <span className="ico"><item.icon size={18} /></span>
            <span><strong>{item.label}</strong><em>{item.detail}</em></span>
            <span />
          </Link>
        )) : (
          <Link to="/login" className="btn" style={{ width: "100%" }} onClick={onClose}>Log in</Link>
        )}
        {signedIn && actions.length === 0 ? (
          <Link to="/profile" className="btn" style={{ width: "100%", marginTop: 8 }} onClick={onClose}>Edit profile</Link>
        ) : null}
      </div>
    </div>
  );
}
