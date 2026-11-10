import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, MapPin, Music, Search, Ticket, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { naira } from "@/lib/catalogue";
import { loadDiscover } from "@/lib/platform.functions";

export const Route = createFileRoute("/discover")({
  loader: () => loadDiscover({ data: { q: "" } }),
  component: DiscoverPage,
});

const filters = [
  { id: "all", label: "All" },
  { id: "music", label: "Music", icon: Music },
  { id: "artists", label: "Artists", icon: UserRound },
  { id: "events", label: "Events", icon: Calendar },
  { id: "shows", label: "Shows", icon: Ticket },
] as const;

function DiscoverPage() {
  const data = Route.useLoaderData();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const releases = useMemo(() => data.releases.filter((item) => !q || `${item.title} ${item.artist.name} ${item.genre}`.toLowerCase().includes(q)), [data.releases, q]);
  const artists = useMemo(() => data.artists.filter((item) => !q || `${item.name} ${item.city}`.toLowerCase().includes(q)), [data.artists, q]);
  const events = useMemo(() => data.events.filter((item) => !q || `${item.title} ${item.city} ${item.category}`.toLowerCase().includes(q)), [data.events, q]);

  return (
    <AppFrame>
      <h1 style={{ margin: "8px 0 4px", fontSize: 32, letterSpacing: "-0.04em" }}>Discover</h1>
      <p style={{ margin: 0, color: "#69738a" }}>Music, artists, events and promotions. Sample rows are marked.</p>
      <form className="app-search" style={{ marginTop: 12 }} onSubmit={(event) => event.preventDefault()}>
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search music, artists, events" aria-label="Search discover" />
      </form>
      <div className="app-chips">
        {filters.map((item) => (
          <button key={item.id} type="button" className={filter === item.id ? "app-chip is-on" : "app-chip"} onClick={() => setFilter(item.id)}>
            {"icon" in item && item.icon ? <item.icon size={14} /> : null}
            {item.label}
          </button>
        ))}
      </div>
      {filter === "all" ? (
        <section className="app-hero">
          <Media src="/media/hero-artist.jpg" alt="" />
          <div className="copy">
            <Sample on />
            <h1>Sample shelves</h1>
            <p>These rows use original sample profiles until artists publish their own.</p>
            <button type="button" className="btn small" onClick={() => setFilter("music")}>Browse music</button>
          </div>
        </section>
      ) : null}
      {(filter === "all" || filter === "artists") && artists.length ? (
        <section>
          <div className="app-row"><h2>Artists</h2><Link to="/artists">See all</Link></div>
          <div className="app-rail">
            {artists.map((artist) => (
              <Link key={artist.id} to="/$username" params={{ username: `@${artist.username}` }} className="person">
                <Media src={artist.avatar} alt={artist.name} />
                <span>{artist.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {(filter === "all" || filter === "events" || filter === "shows") ? (
        <section>
          <div className="app-row"><h2>{filter === "shows" ? "Shows" : "Events"}</h2><Link to="/events">See all</Link></div>
          <div style={{ display: "grid", gap: 12 }}>
            {events.filter((event) => filter !== "shows" || event.category === "Shows").map((event) => (
              <Link key={event.slug} to="/events/$slug" params={{ slug: event.slug }} className="event-card">
                <span style={{ position: "relative", display: "block" }}>
                  <Media src={event.cover} alt="" />
                  {event.sample ? <span className="badge-abs"><Sample on /></span> : null}
                </span>
                <div className="body">
                  <strong>{event.title}</strong>
                  <p><MapPin size={14} /> {event.venue}, {event.city}</p>
                  <div className="foot"><span className="price">From {naira(event.fromKobo)}</span><span className="btn small">Get tickets</span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {(filter === "all" || filter === "music") ? (
        <section>
          <div className="app-row"><h2>Music</h2><Link to="/music">See all</Link></div>
          {releases.length === 0 ? <p className="note">No releases match.</p> : (
            <div className="app-rail">
              {releases.map((track) => (
                <Link key={track.id} to="/$username/$slug" params={{ username: `@${track.artist.username}`, slug: track.slug }} className="track-card">
                  <Media src={track.artwork} alt="" />
                  <strong>{track.title}</strong>
                  <em>{track.artist.name}</em>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </AppFrame>
  );
}
