import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Pause, Play, Repeat, Share2, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { loadLibrary, loadSongPage, saveTrack } from "@/lib/platform.functions";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/$username/$slug")({
  loader: ({ params }) => loadSongPage({ data: { username: params.username, slug: params.slug } }),
  head: ({ loaderData }) => ({
    meta: loaderData?.release
      ? [
          { title: `${loaderData.release.title} · ${loaderData.release.artist.name} · Vibez` },
          { name: "description", content: loaderData.release.description },
          { property: "og:title", content: `${loaderData.release.title} by ${loaderData.release.artist.name}` },
          { property: "og:image", content: loaderData.release.artwork },
          { property: "og:type", content: "music.song" },
        ]
      : [{ title: "Release · Vibez" }],
  }),
  component: SongPage,
});

function clock(total: number | null) {
  if (!total) return "0:00";
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function SongPage() {
  const data = Route.useLoaderData();
  const play = usePlayer((state) => state.play);
  const toggle = usePlayer((state) => state.toggle);
  const playing = usePlayer((state) => state.playing);
  const currentId = usePlayer((state) => state.queue[state.index]?.id);
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const toggleShuffle = usePlayer((state) => state.toggleShuffle);
  const cycleRepeat = usePlayer((state) => state.cycleRepeat);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");

  const release = data.release;
  useEffect(() => {
    if (!release) return;
    loadLibrary().then((library) => setSaved(library.savedReleaseIds.includes(release.id))).catch(() => undefined);
  }, [release]);

  if (!release) {
    return (
      <AppFrame>
        <div className="empty">
          <h2>Release not found</h2>
          <p>Song addresses look like /@mudino/montana.</p>
          <Link className="btn" to="/music">Back to music</Link>
        </div>
      </AppFrame>
    );
  }

  const active = currentId === release.id && playing;
  const playable = {
    id: release.id,
    title: release.title,
    artist: release.artist.name,
    artwork: release.artwork,
    username: release.artist.username,
    slug: release.slug,
    previewUrl: release.previewUrl,
    durationSeconds: release.durationSeconds,
    sample: release.sample,
  };

  return (
    <AppFrame>
      <article className="player-page">
        <div className="art"><Media src={release.artwork} alt={`${release.title} artwork`} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
          <div>
            <Sample on={release.sample} />
            <h1 style={{ margin: "6px 0 0", fontSize: 28 }}>{release.title}</h1>
            <p style={{ margin: 0 }}>
              <Link to="/$username" params={{ username: `@${release.artist.username}` }} style={{ color: "#1016c9", fontWeight: 800, textDecoration: "none" }}>{release.artist.name}</Link>
            </p>
          </div>
          <button type="button" aria-label="Save" className="app-iconbtn" onClick={() => void saveTrack({ data: { releaseId: release.id } }).then((result) => setSaved(result.saved)).catch((error) => setMessage(error instanceof Error ? error.message : "Sign in to save."))}>
            <Heart size={18} fill={saved ? "#dc4545" : "none"} color={saved ? "#dc4545" : "currentColor"} />
          </button>
        </div>
        <p className="note" style={{ marginTop: 12 }}>{release.description}</p>
        <p style={{ color: "#69738a", fontSize: 13 }}>{release.genre}{release.releaseDate ? ` · ${release.releaseDate}` : ""}</p>
        <div className="scrub" aria-hidden="true"><span style={{ width: release.previewUrl ? "0%" : "0%" }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#69738a", fontSize: 12 }}>
          <span>0:00</span><span>{clock(release.durationSeconds)}</span>
        </div>
        <div className="transport">
          <button type="button" className="ghost" aria-label="Shuffle" onClick={toggleShuffle}><Shuffle color={shuffle ? "#1016c9" : "currentColor"} /></button>
          <button type="button" className="play" aria-label={active ? "Pause" : "Play"} onClick={() => (currentId === release.id ? toggle() : play(playable, [playable, ...data.related.map((item) => ({
            id: item.id, title: item.title, artist: item.artist.name, artwork: item.artwork, username: item.artist.username, slug: item.slug, previewUrl: item.previewUrl, durationSeconds: item.durationSeconds, sample: item.sample,
          }))]))}>
            {active ? <Pause /> : <Play fill="currentColor" />}
          </button>
          <button type="button" className="ghost" aria-label="Repeat" onClick={cycleRepeat}><Repeat color={repeat === "off" ? "currentColor" : "#1016c9"} /></button>
        </div>
        {!release.previewUrl ? (
          <p className="note">No preview for this song yet.</p>
        ) : null}
        {release.links.length ? (
          <div className="group">
            {release.links.map((link) => (
              <a key={link.url} className="rowlink" href={link.url} target="_blank" rel="noreferrer">{link.label}</a>
            ))}
          </div>
        ) : <p className="note">Listening links show up when the artist adds them. Vibez does not invent stream counts.</p>}
        {release.lyrics ? <section className="panel"><h2>Lyrics</h2><p style={{ whiteSpace: "pre-wrap" }}>{release.lyrics}</p></section> : null}
        <button type="button" className="btn ghost" style={{ marginTop: 12 }} onClick={() => void navigator.clipboard.writeText(window.location.href)}><Share2 size={16} /> Copy link</button>
        {message ? <p className="warn">{message}</p> : null}
        {data.related.length ? (
          <section>
            <div className="app-row"><h2>More from {release.artist.name}</h2></div>
            {data.related.map((item) => (
              <Link key={item.id} to="/$username/$slug" params={{ username: `@${item.artist.username}`, slug: item.slug }} className="rowlink">
                <span>{item.title}<small>{item.genre}</small></span>
              </Link>
            ))}
          </section>
        ) : null}
      </article>
    </AppFrame>
  );
}
