import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Heart, ListMusic, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";
import { loadPlaylists, makePlaylist, saveToPlaylist, saveTrack } from "@/lib/platform.functions";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/player")({
  component: PlayerPage,
});

function clock(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}

function PlayerPage() {
  const queue = usePlayer((state) => state.queue);
  const index = usePlayer((state) => state.index);
  const playing = usePlayer((state) => state.playing);
  const shuffle = usePlayer((state) => state.shuffle);
  const repeat = usePlayer((state) => state.repeat);
  const progress = usePlayer((state) => state.progress);
  const duration = usePlayer((state) => state.duration);
  const toggle = usePlayer((state) => state.toggle);
  const next = usePlayer((state) => state.next);
  const prev = usePlayer((state) => state.prev);
  const jump = usePlayer((state) => state.jump);
  const requestSeek = usePlayer((state) => state.requestSeek);
  const toggleShuffle = usePlayer((state) => state.toggleShuffle);
  const cycleRepeat = usePlayer((state) => state.cycleRepeat);
  const track = queue[index];
  const [saved, setSaved] = useState(false);
  const [playlists, setPlaylists] = useState<Awaited<ReturnType<typeof loadPlaylists>>>([]);
  const [sheet, setSheet] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    loadPlaylists().then(setPlaylists).catch(() => setPlaylists([]));
  }, []);

  if (!track) {
    return (
      <main className="player-screen">
        <Link to="/music" aria-label="Close"><ChevronDown /></Link>
        <div className="empty" style={{ marginTop: 40 }}>
          <div className="mark"><ListMusic /></div>
          <h2>Nothing in the queue</h2>
          <p>Open a release and press play. If it has no licensed preview, Vibez will not pretend to stream it.</p>
          <Link className="btn" to="/music">Browse music</Link>
        </div>
      </main>
    );
  }

  const width = duration > 0 ? `${Math.min(100, (progress / duration) * 100)}%` : "0%";

  return (
    <main className="player-screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/$username/$slug" params={{ username: `@${track.username}`, slug: track.slug }} aria-label="Close player"><ChevronDown /></Link>
        <strong>Now playing</strong>
        <button type="button" aria-label="Save" style={{ background: "transparent", border: 0 }} onClick={() => void saveTrack({ data: { releaseId: track.id } }).then((result) => setSaved(result.saved)).catch(() => setNote("Sign in to save."))}>
          <Heart fill={saved ? "#ff8b9a" : "none"} color={saved ? "#ff8b9a" : "#fff"} />
        </button>
      </div>
      <div className="art"><img src={track.artwork} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
      <h1 style={{ margin: "8px 0 0", fontSize: 28 }}>{track.title}</h1>
      <p style={{ margin: 0, color: "rgba(255,255,255,.75)" }}>{track.artist}{track.sample ? " · Sample" : ""}</p>
      {!track.previewUrl ? <p className="note" style={{ color: "#d5dcf5", background: "transparent", borderColor: "rgba(255,255,255,.2)" }}>No licensed preview is attached, so this player stays silent.</p> : null}
      <div className="scrub" style={{ marginTop: 18 }} onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (!duration) return;
        requestSeek(((event.clientX - rect.left) / rect.width) * duration);
      }}>
        <span style={{ width }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.7)" }}>
        <span>{clock(progress)}</span><span>{clock(duration || track.durationSeconds || 0)}</span>
      </div>
      <div className="transport">
        <button type="button" className="ghost" aria-label="Shuffle" onClick={toggleShuffle}><Shuffle color={shuffle ? "#fff" : "rgba(255,255,255,.55)"} /></button>
        <button type="button" className="ghost" aria-label="Previous" onClick={prev}><SkipBack /></button>
        <button type="button" className="play" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <Pause /> : <Play fill="currentColor" />}</button>
        <button type="button" className="ghost" aria-label="Next" onClick={next}><SkipForward /></button>
        <button type="button" className="ghost" aria-label="Repeat" onClick={cycleRepeat}><Repeat color={repeat === "off" ? "rgba(255,255,255,.55)" : "#fff"} /></button>
      </div>
      <button type="button" className="btn ghost" onClick={() => setSheet(true)}>Add to playlist</button>
      {note ? <p>{note}</p> : null}
      <h2 style={{ marginTop: 22 }}>Queue</h2>
      {queue.map((item, itemIndex) => (
        <button key={item.id} type="button" className={itemIndex === index ? "queue-row is-on" : "queue-row"} onClick={() => jump(itemIndex)}>
          <img src={item.artwork} alt="" width={48} height={48} style={{ borderRadius: 10, objectFit: "cover" }} />
          <span><strong>{item.title}</strong><em style={{ display: "block", fontStyle: "normal", color: "rgba(255,255,255,.65)" }}>{item.artist}</em></span>
          <span>{itemIndex === index ? "Playing" : ""}</span>
        </button>
      ))}
      {sheet ? (
        <div className="sheet is-open">
          <button type="button" className="sheet-bg" aria-label="Close" onClick={() => setSheet(false)} />
          <div className="sheet-card">
            <div className="sheet-handle" />
            <h2>Add to playlist</h2>
            {playlists.length === 0 ? <p className="lead">You have no playlists yet.</p> : playlists.map((list) => (
              <button key={list.id} type="button" className="rowlink" onClick={() => void saveToPlaylist({ data: { playlistId: list.id, releaseId: track.id } }).then(() => { setNote(`Saved to ${list.name}.`); setSheet(false); })}>
                <span>{list.name}<small>{list.count} tracks</small></span>
              </button>
            ))}
            <label className="field">New playlist<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <button type="button" className="btn" onClick={() => void makePlaylist({ data: { name } }).then(async (list) => { await saveToPlaylist({ data: { playlistId: list.id, releaseId: track.id } }); setPlaylists(await loadPlaylists()); setSheet(false); setNote(`Saved to ${list.name}.`); })}>Create and save</button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
