import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Calendar, Flame, MapPin, Megaphone, Music, Play, Search, SlidersHorizontal, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { Dock } from "@/components/vibez/dock";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { spotlight, tracks } from "@/lib/feed";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

const tabs = ["For You", "Promotions"] as const;

function HomePage() {
  const user = useCurrentUser();
  const [tab, setTab] = useState<(typeof tabs)[number]>("For You");
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((track) => `${track.title} ${track.artist}`.toLowerCase().includes(q));
  }, [query]);
  const initial = (user?.displayName || user?.primaryEmail || "V").charAt(0).toUpperCase();

  return (
    <main className="fd-light">
      <div className="fd">
        <header className="fd-top">
          <img src="/brand/vibez-mark-blue.png" alt="Vibez" />
          <div className="fd-tools">
            <Link to="/activity" aria-label="Activity">
              <Bell size={20} />
            </Link>
            <Link to="/profile" className="fd-avatar" aria-label="Profile">{initial}</Link>
          </div>
        </header>
        <div className="fd-searchrow">
          <div className="fd-search is-light">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search music, artists, events, shows..." />
          </div>
          <Link to="/discover" className="fd-filter" aria-label="Filters"><SlidersHorizontal size={16} /></Link>
        </div>
        <div className="fd-tabs">
          <button type="button" className={tab === "For You" ? "is-on" : undefined} onClick={() => setTab("For You")}>For You</button>
          <Link to="/music">Music</Link>
          <Link to="/artists">Artists</Link>
          <Link to="/events">Events</Link>
          <button type="button" className={tab === "Promotions" ? "is-on" : undefined} onClick={() => setTab("Promotions")}>Promotions</button>
        </div>
        {tab === "For You" ? (
          <section className="fd-hero">
            <img src="/media/hero-artist.jpg" alt="" />
            <div>
              <h1>New Music Out Now</h1>
              <p>Listen, share and support the hottest releases on Vibez.</p>
              <Link to="/music/$slug" params={{ slug: tracks[0].slug }}>
                <Play size={14} fill="currentColor" /> Listen Now
              </Link>
            </div>
          </section>
        ) : null}
        {tab === "For You" || tab === "Promotions" ? (
          <div className="fd-actions">
            <Link to="/discover"><span className="c1"><Music size={18} /></span>Music Placements</Link>
            <Link to="/discover"><span className="c2"><Megaphone size={18} /></span>Promote Music</Link>
            <Link to="/events"><span className="c3"><Ticket size={18} /></span>Event Tickets</Link>
            <Link to="/create"><span className="c4"><Calendar size={18} /></span>List an Event</Link>
            <Link to="/discover"><span className="c5"><Flame size={18} /></span>Run an Ad Campaign</Link>
          </div>
        ) : null}
        {tab === "For You" ? (
          <section>
            <div className="fd-rowhead">
              <h2>Trending Music</h2>
              <Link to="/discover">See All</Link>
            </div>
            {shown.length === 0 ? <p className="fd-empty">Nothing matches that search.</p> : (
              <div className="fd-rail">
                {shown.map((track) => (
                  <Link key={track.slug} to="/music/$slug" params={{ slug: track.slug }} className="fd-track">
                    <span className="art"><img src={track.image} alt="" /><Play size={14} /></span>
                    <strong>{track.title}</strong>
                    <em>{track.artist}</em>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}
        {tab === "For You" ? (
          <section>
            <div className="fd-rowhead">
              <h2>Upcoming Events</h2>
              <Link to="/events">See All</Link>
            </div>
            <article className="fd-event is-light">
              <img src={spotlight.image} alt="" />
              <div>
                <strong>{spotlight.title}</strong>
                <p><Calendar size={13} /> {spotlight.when}</p>
                <p><MapPin size={13} /> {spotlight.city}</p>
                <div>
                  <span>{spotlight.tag}</span>
                  <Link to="/events">Get Tickets</Link>
                </div>
              </div>
            </article>
          </section>
        ) : null}
        <Dock tone="light" />
      </div>
    </main>
  );
}
