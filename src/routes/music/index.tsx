import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { loadHome } from "@/lib/platform.functions";

export const Route = createFileRoute("/music/")({
  loader: () => loadHome(),
  component: MusicHome,
});

function MusicHome() {
  const data = Route.useLoaderData();
  const [genre, setGenre] = useState("All");
  const genres = ["All", ...data.genres];
  const songs = data.releases.filter((item) => genre === "All" || item.genre === genre);
  return (
    <AppFrame>
      <h1 style={{ margin: "8px 0 4px" }}>Music</h1>
      <p style={{ margin: 0, color: "#69738a" }}>New releases and sample shelves. Playback needs a licensed preview URL.</p>
      <div className="app-chips">
        {genres.map((item) => (
          <button key={item} type="button" className={genre === item ? "app-chip is-on" : "app-chip"} onClick={() => setGenre(item)}>{item}</button>
        ))}
      </div>
      {songs.length === 0 ? <div className="empty"><h2>No {genre} releases yet</h2><p>Approved submissions show up here.</p></div> : (
        <div style={{ display: "grid", gap: 8 }}>
          {songs.map((track) => (
            <Link key={track.id} to="/$username/$slug" params={{ username: `@${track.artist.username}`, slug: track.slug }} className="rowlink" style={{ background: "#fff", borderRadius: 16 }}>
              <span className="media" style={{ width: 56, height: 56, borderRadius: 12 }}><img className="is-in" src={track.artwork} alt="" /></span>
              <span>{track.title}<small>{track.artist.name} · {track.genre}</small></span>
              <Sample on={track.sample} />
            </Link>
          ))}
        </div>
      )}
      <section>
        <div className="app-row"><h2>Artists</h2><Link to="/artists">See all</Link></div>
        <div className="app-rail">
          {data.artists.map((artist) => (
            <Link key={artist.id} className="person" to="/$username" params={{ username: `@${artist.username}` }}>
              <Media src={artist.avatar} alt={artist.name} />
              <span>{artist.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </AppFrame>
  );
}
