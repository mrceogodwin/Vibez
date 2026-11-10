import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Calendar, MapPin, Music, Play, Search, SlidersHorizontal, UserRound, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Dock } from "@/components/vibez/dock";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { artists, spotlight, tracks } from "@/lib/feed";

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
});

const filters = [
  { id: "all", label: "All", icon: null },
  { id: "music", label: "Music", icon: Music },
  { id: "artists", label: "Artists", icon: UserRound },
  { id: "events", label: "Events", icon: Calendar },
  { id: "shows", label: "Shows", icon: Video },
] as const;

function DiscoverPage() {
  const user = useCurrentUser();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const music = useMemo(() => tracks.filter((track) => !q || `${track.title} ${track.artist}`.toLowerCase().includes(q)), [q]);
  const people = useMemo(() => artists.filter((artist) => !q || artist.name.toLowerCase().includes(q)), [q]);
  const initial = (user?.displayName || user?.primaryEmail || "V").charAt(0).toUpperCase();
  const showMusic = filter === "all" || filter === "music";
  const showArtists = filter === "all" || filter === "artists";
  const showEvents = filter === "all" || filter === "events";

  return (
    <main className="fd-light">
      <div className="fd">
        <header className="fd-top">
          <img src="/brand/vibez-mark-blue.png" alt="Vibez" />
          <div className="fd-tools">
            <Link to="/activity" aria-label="Activity"><Bell size={20} /></Link>
            <Link to="/profile" className="fd-avatar" aria-label="Profile">{initial}</Link>
          </div>
        </header>
        <h1>Discover</h1>
        <p className="fd-sub">Explore music, artists, events, shows and communities in one place.</p>
        <div className="fd-search is-light">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search music, artists, events, playlists..." />
          <button type="button" className="is-solid" aria-label="Filters"><SlidersHorizontal size={16} /></button>
        </div>
        <div className="fd-chips">
          {filters.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? "is-on" : undefined} onClick={() => setFilter(item.id)}>
              {item.icon ? <item.icon size={14} /> : null}
              {item.label}
            </button>
          ))}
        </div>
        {filter === "all" ? (
          <section className="fd-banner">
            <img src="/media/hero-artist.jpg" alt="" />
            <div>
              <h2>Vibez Music Charts</h2>
              <p>The hottest songs, rising artists and top trends right now.</p>
              <button type="button" onClick={() => setFilter("music")}>Explore Charts</button>
            </div>
          </section>
        ) : null}
        {showArtists ? (
          <section>
            <div className="fd-rowhead">
              <h2>Trending Artists</h2>
              <span>See All</span>
            </div>
            {people.length === 0 ? <p className="fd-empty">No artists match that search.</p> : (
              <div className="fd-rail">
                {people.map((artist) => (
                  <article key={artist.slug} className="fd-artist">
                    <span><img src={artist.image} alt="" /></span>
                    {artist.name}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
        {showEvents ? (
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
        {showMusic ? (
          <section>
            <div className="fd-rowhead">
              <h2>Trending Music</h2>
              <span>See All</span>
            </div>
            {music.length === 0 ? <p className="fd-empty">No music matches that search.</p> : (
              <div className="fd-rail">
                {music.map((track) => (
                  <Link key={track.slug} to="/music/$slug" params={{ slug: track.slug }} className="fd-track is-light">
                    <span className="art"><img src={track.image} alt="" /><Play size={14} /></span>
                    <strong>{track.title}</strong>
                    <em>{track.artist}</em>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : null}
        {filter === "shows" ? <p className="fd-empty">No shows are listed yet.</p> : null}
        <Dock tone="light" />
      </div>
    </main>
  );
}
