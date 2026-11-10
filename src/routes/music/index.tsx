import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ellipsis, LayoutGrid, Music, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { Dock } from "@/components/vibez/dock";
import { artists, playlists, tracks } from "@/lib/feed";

export const Route = createFileRoute("/music/")({
  component: MusicPage,
});

const genres = ["All", "Afrobeats", "Hip-Hop", "Amapiano", "R&B"] as const;

function MusicPage() {
  const [genre, setGenre] = useState<(typeof genres)[number]>("All");
  const songs = useMemo(
    () => (genre === "All" || genre === "Afrobeats" ? tracks : []),
    [genre],
  );

  return (
    <main className="fd-light">
      <div className="fd">
        <header className="fd-top">
          <img src="/brand/vibez-mark-blue.png" alt="Vibez" />
        </header>
        <div className="fd-pagehead">
          <Link to="/home" aria-label="Back"><ArrowLeft size={20} /></Link>
          <div>
            <h1>Music</h1>
            <p>Discover new releases, trending songs, playlists and more.</p>
          </div>
        </div>
        <section className="fd-hero">
          <img src="/media/hero-artist.jpg" alt="" />
          <div>
            <h1>New Releases</h1>
            <p>The latest drops from your favourite artists.</p>
            <Link to="/music/$slug" params={{ slug: "higher" }}><Play size={14} fill="currentColor" /> Listen Now</Link>
          </div>
        </section>
        <div className="fd-chips">
          {genres.map((item) => (
            <button key={item} type="button" className={genre === item ? "is-on" : undefined} onClick={() => setGenre(item)}>
              {item === "All" ? <LayoutGrid size={14} /> : item === "Afrobeats" ? <Music size={14} /> : null}
              {item}
            </button>
          ))}
        </div>
        <section>
          <div className="fd-rowhead"><h2>Trending Songs</h2><span>See All</span></div>
          {songs.length === 0 ? <p className="fd-empty">No {genre} releases are listed yet.</p> : (
            <div className="fd-songs">
              {songs.slice(0, 3).map((track) => (
                <Link key={track.slug} to="/music/$slug" params={{ slug: track.slug }}>
                  <span className="art"><img src={track.image} alt="" /><Play size={12} /></span>
                  <span><strong>{track.title}</strong><em>{track.artist}</em></span>
                  <em className="time">{track.duration}</em>
                  <Ellipsis size={16} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <section>
          <div className="fd-rowhead"><h2>Featured Playlists</h2><span>See All</span></div>
          <div className="fd-rail">
            {playlists.map((list) => (
              <article key={list.slug} className="fd-play">
                <img src={list.image} alt="" />
                <strong>{list.title}</strong>
                <em>{list.count}</em>
              </article>
            ))}
          </div>
        </section>
        <section>
          <div className="fd-rowhead"><h2>Top Artists</h2><Link to="/artists">See All</Link></div>
          <div className="fd-rail">
            {artists.map((artist) => (
              <Link key={artist.slug} to="/artists/$slug" params={{ slug: artist.slug }} className="fd-artist">
                <span><img src={artist.image} alt="" /></span>
                {artist.name}
              </Link>
            ))}
          </div>
        </section>
        <Dock tone="light" />
      </div>
    </main>
  );
}
