import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Flame, MapPin, Megaphone, Music, Play, Search, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { naira } from "@/lib/catalogue";
import { loadHome } from "@/lib/platform.functions";
import { usePlayer, type Playable } from "@/lib/player-store";

export const Route = createFileRoute("/home")({
  loader: () => loadHome(),
  component: HomePage,
});

const chips = [
  { id: "for-you", label: "For You" },
  { id: "music", label: "Music" },
  { id: "artists", label: "Artists" },
  { id: "events", label: "Events" },
  { id: "promotions", label: "Promotions" },
] as const;

function HomePage() {
  const data = Route.useLoaderData();
  const [chip, setChip] = useState<(typeof chips)[number]["id"]>("for-you");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const releases = useMemo(
    () => data.releases.filter((item) => !q || `${item.title} ${item.artist.name}`.toLowerCase().includes(q)),
    [data.releases, q],
  );
  const artists = useMemo(
    () => data.artists.filter((item) => !q || item.name.toLowerCase().includes(q)),
    [data.artists, q],
  );
  const events = useMemo(
    () => data.events.filter((item) => !q || `${item.title} ${item.city}`.toLowerCase().includes(q)),
    [data.events, q],
  );
  const show = (id: (typeof chips)[number]["id"]) => chip === "for-you" || chip === id;

  return (
    <AppFrame>
      <form className="app-search" role="search" onSubmit={(event) => event.preventDefault()}>
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search music, artists, events" aria-label="Search" />
      </form>
      <div className="app-chips" role="tablist" aria-label="Home sections">
        {chips.map((item) => (
          <button key={item.id} type="button" className={chip === item.id ? "app-chip is-on" : "app-chip"} onClick={() => setChip(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="home-split">
        <div>
          {show("music") && data.hero ? (
            <section className="app-hero">
              <Media src={data.hero.image} alt="" />
              <div className="copy">
                {data.hero.sponsored ? <em className="pill">Sponsored</em> : null}{" "}
                <Sample on={data.hero.sample} />
                <h1>{data.hero.title}</h1>
                <p>{data.hero.subtitle}</p>
                <Link className="btn small" to="/$username/$slug" params={songParams(data.hero.href)}>
                  <Play size={14} fill="currentColor" /> Listen now
                </Link>
              </div>
            </section>
          ) : null}
          {chip === "for-you" || chip === "promotions" ? (
            <div className="app-actions">
              <Link className="app-action app-press" to="/studio"><span><Music size={20} /></span><em>Placements</em></Link>
              <Link className="app-action app-press" to="/studio"><span><Megaphone size={20} /></span><em>Promote</em></Link>
              <Link className="app-action app-press" to="/events"><span><Ticket size={20} /></span><em>Tickets</em></Link>
              <Link className="app-action app-press" to="/create"><span><Calendar size={20} /></span><em>New event</em></Link>
              <Link className="app-action app-press" to="/ads"><span><Flame size={20} /></span><em>Advertise</em></Link>
            </div>
          ) : null}
          {show("music") ? (
            <section>
              <div className="app-row"><h2>Trending music</h2><Link to="/music">See all</Link></div>
              {releases.length === 0 ? <p className="note">Nothing matches that search.</p> : (
                <div className="app-rail">
                  {releases.map((track) => <TrackCard key={track.id} track={track} queue={releases} />)}
                </div>
              )}
            </section>
          ) : null}
          {show("artists") ? (
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
        </div>
        <div>
          {show("events") ? (
            <section>
              <div className="app-row"><h2>Upcoming events</h2><Link to="/events">See all</Link></div>
              <div style={{ display: "grid", gap: 12 }}>
                {events.slice(0, 3).map((event) => (
                  <Link key={event.slug} to="/events/$slug" params={{ slug: event.slug }} className="event-card app-press">
                    <span style={{ position: "relative", display: "block" }}>
                      <Media src={event.cover} alt="" />
                      {event.sample ? <span className="badge-abs"><Sample on /></span> : null}
                    </span>
                    <div className="body">
                      <strong>{event.title}</strong>
                      <p><Calendar size={14} /> {event.start ? new Date(event.start).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" }) : ""}</p>
                      <p><MapPin size={14} /> {event.city}</p>
                      <div className="foot">
                        <span className="price">From {naira(event.fromKobo)}</span>
                        <span className="btn small">Get tickets</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          {show("promotions") ? (
            <section>
              <div className="app-row"><h2>Promotions</h2><Link to="/ads">Inventory</Link></div>
              {data.promotions.length === 0 ? (
                <div className="empty">
                  <div className="mark"><Megaphone /></div>
                  <h2>No live campaigns</h2>
                  <p>Sponsored cards appear here only after a campaign is approved and active. Sample artists are labelled separately.</p>
                </div>
              ) : data.promotions.map((item) => (
                <article key={item.id} className="panel">
                  <em className="pill">Sponsored</em>
                  <h2>{item.headline || item.name}</h2>
                  <p>{item.body}</p>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </AppFrame>
  );
}

function songParams(href: string) {
  const match = href.match(/^\/@([^/]+)\/([^/]+)/);
  if (!match) return { username: "@mudino", slug: "montana" };
  return { username: `@${match[1]}`, slug: match[2] };
}

export function TrackCard({ track, queue }: { track: PlayableSource; queue: PlayableSource[] }) {
  const play = usePlayer((state) => state.play);
  const playable = toPlayable(track);
  return (
    <Link
      to="/$username/$slug"
      params={{ username: `@${track.artist.username}`, slug: track.slug }}
      className="track-card app-press"
      onClick={() => play(playable, queue.map(toPlayable))}
    >
      <span style={{ position: "relative", display: "block" }}>
        <Media src={track.artwork} alt={`${track.title} artwork`} />
        {track.sample ? <span className="badge-abs"><Sample on /></span> : null}
      </span>
      <strong>{track.title}</strong>
      <em>{track.artist.name}</em>
    </Link>
  );
}

type PlayableSource = {
  id: string;
  title: string;
  artwork: string;
  slug: string;
  previewUrl: string | null;
  durationSeconds: number | null;
  sample: boolean;
  artist: { username: string; name: string };
};

function toPlayable(track: PlayableSource): Playable {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist.name,
    artwork: track.artwork,
    username: track.artist.username,
    slug: track.slug,
    previewUrl: track.previewUrl,
    durationSeconds: track.durationSeconds,
    sample: track.sample,
  };
}
