import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Play, Search, SlidersHorizontal, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Dock } from "@/components/vibez/dock";
import { artists } from "@/lib/feed";

export const Route = createFileRoute("/artists/")({
  component: ArtistsPage,
});

function ArtistsPage() {
  const [query, setQuery] = useState("");
  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artists.filter((artist) => !q || artist.name.toLowerCase().includes(q));
  }, [query]);
  const featured = artists.find((artist) => artist.slug === "burna-boy") ?? artists[0];

  return (
    <main className="fd-light">
      <div className="fd">
        <header className="fd-top">
          <img src="/brand/vibez-mark-blue.png" alt="Vibez" />
        </header>
        <div className="fd-pagehead">
          <Link to="/home" aria-label="Back"><ArrowLeft size={20} /></Link>
          <div>
            <h1>Artists</h1>
            <p>Discover, follow and support your favourite artists.</p>
          </div>
        </div>
        <div className="fd-searchrow">
          <div className="fd-search is-light">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artists, names, or genre..." />
          </div>
          <button type="button" className="fd-filter" aria-label="Filters"><SlidersHorizontal size={16} /></button>
        </div>
        <div className="fd-chips">
          <button type="button" className="is-on">All</button>
          <button type="button">Music</button>
          <button type="button">DJ</button>
          <button type="button">Producer</button>
          <button type="button"><Star size={14} /> Emerging</button>
        </div>
        <section className="fd-hero">
          <img src="/media/track-burna.jpg" alt="" />
          <div>
            <span className="fd-kicker">Featured Artist</span>
            <h1>{featured.name} <BadgeCheck size={18} /></h1>
            <p>Afrobeats artist. Profile details come from the Vibez listing, not a live follower count.</p>
            <Link to="/artists/$slug" params={{ slug: featured.slug }}><Play size={14} fill="currentColor" /> Explore Profile</Link>
          </div>
        </section>
        <section>
          <div className="fd-rowhead"><h2>Trending Artists</h2><span>See All</span></div>
          {people.length === 0 ? <p className="fd-empty">No artists match that search.</p> : (
            <div className="fd-rail">
              {people.map((artist) => (
                <Link key={artist.slug} to="/artists/$slug" params={{ slug: artist.slug }} className="fd-artist">
                  <span><img src={artist.image} alt="" /></span>
                  {artist.name}
                </Link>
              ))}
            </div>
          )}
        </section>
        <Dock tone="light" />
      </div>
    </main>
  );
}
