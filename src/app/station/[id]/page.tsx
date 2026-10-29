"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Track = { id: string; title: string; artist: string; duration: string; audioUrl: string };
type Station = { id: string; name: string; tagline: string; genre: string; queue: Track[] };

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const value = Math.floor(seconds);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export default function StationPage() {
  const params = useParams<{ id: string }>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [notice, setNotice] = useState("");
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stations/" + encodeURIComponent(params.id), { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Station not found.");
        return data.station as Station;
      })
      .then((value) => { if (!cancelled) setStation(value); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load station."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  const playTrack = useCallback(async (index: number) => {
    const track = station?.queue?.[index];
    if (!track) {
      setNotice("This station has no tracks in its saved queue yet.");
      return;
    }
    setCurrentTrack(index);
    if (!track.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setNotice(`“${track.title}” has no playable audio source. Previous playback has stopped; the station owner needs to add a direct HTTPS audio file URL they are licensed to stream.`);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.src !== track.audioUrl) { audio.pause(); audio.src = track.audioUrl; audio.load(); setCurrentTime(0); setDuration(0); }
      audio.volume = Math.max(0, Math.min(100, volume)) / 100;
      await audio.play();
      setPlaying(true);
      setNotice("");
    } catch {
      setPlaying(false);
      setNotice("Playback failed. This source may not be a direct audio file or may block browser playback.");
    }
  }, [station, volume]);

  const nextTrack = useCallback(() => {
    const tracks = station?.queue ?? [];
    if (tracks.length > 1) void playTrack((currentTrack + 1) % tracks.length);
    else setPlaying(false);
  }, [station, currentTrack, playTrack]);

  const selectedTrack = station?.queue?.[currentTrack];

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }
  }, []);

  return (
    <main className="shell" style={{ minHeight: "100vh", paddingTop: 36, paddingBottom: 64 }}>
      <header className="nav">
        <Link className="brand" href="/"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></Link>
        <Link className="login" href="/login">Log in</Link>
      </header>
      <section style={{ maxWidth: 760, margin: "48px auto", padding: 28, border: "1px solid #292929", borderRadius: 12, background: "#141414" }}>
        <div className="eyebrow">VIBEZ STATION</div>
        {loading ? <h1>Finding your frequency…</h1> : error ? <><h1>Station unavailable</h1><p>{error}</p><Link className="primary" href="/">Explore stations →</Link></> : station ? <>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 48px)", marginTop: 20, overflowWrap: "anywhere" }}>{station.name}</h1>
          <p style={{ color: "#aaa" }}>{station.tagline || "A creator station on Vibez"}</p>
          <p className="eyebrow">{station.genre}</p>
          <div style={{ marginTop: 28, padding: 20, background: "#090909", border: "1px solid #292929", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div className="brandmark" style={{ width: 48, height: 48, fontSize: 28, flexShrink: 0 }}>v.</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 9, color: "#ff875a", letterSpacing: 1.5 }}>NOW {playing ? "PLAYING" : "SELECTED"}</div>
                <b style={{ display: "block", marginTop: 6, overflowWrap: "anywhere" }}>{selectedTrack?.title || "No track selected"}</b>
                <span style={{ color: "#999", fontSize: 12 }}>{selectedTrack?.artist || "The creator has not added tracks yet"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button type="button" className="small-ghost" style={{ minWidth: 34, height: 40, padding: "0 9px" }} aria-label="Previous track" title="Previous track" disabled={!station.queue?.length || currentTrack <= 0} onClick={() => void playTrack(Math.max(0, currentTrack - 1))}>|◀</button>
                <button type="button" className="play" style={{ width: 44, height: 44, flexShrink: 0, cursor: "pointer" }} aria-label={playing ? "Pause station audio" : "Play station audio"} onClick={async () => {
                  if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); }
                  else await playTrack(currentTrack);
                }}>{playing ? "Ⅱ" : "▶"}</button>
                <button type="button" className="small-ghost" style={{ minWidth: 34, height: 40, padding: "0 9px" }} aria-label="Next track" title="Next track" disabled={!station.queue?.length || currentTrack >= station.queue.length - 1} onClick={() => void playTrack(Math.min((station.queue?.length ?? 1) - 1, currentTrack + 1))}>▶|</button>
              </div>
            </div>
            <audio ref={audioRef} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)} onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onEnded={nextTrack} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} onError={() => { setPlaying(false); setNotice("Audio source failed to load. The host may block playback or the URL may not point to a supported audio file."); }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#999", fontSize: 10 }}>
              <span>{clock(currentTime)}</span>
              <input aria-label="Seek through track" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} disabled={!duration} onChange={(event) => { const value = Number(event.target.value); if (audioRef.current && Number.isFinite(value)) { audioRef.current.currentTime = value; setCurrentTime(value); } }} style={{ minWidth: 0, flex: 1, accentColor: "#ff6b35" }} />
              <span>{clock(duration)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, color: "#999", fontSize: 11 }}><label htmlFor="listener-volume">Volume</label><input id="listener-volume" aria-label="Listener volume" type="range" min="0" max="100" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(100, value)) / 100; }} style={{ minWidth: 0, flex: 1, accentColor: "#ff6b35" }} /><span>{volume}%</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 12 }}>
              <span style={{ color: "#999", fontSize: 11 }}>{station.queue?.length ?? 0} queue items</span>
              <button className="small-ghost" onClick={async () => { const url = window.location.href; try { if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable"); await navigator.clipboard.writeText(url); setShareNotice("Station link copied."); } catch { setShareNotice(`Copy this station link: ${url}`); } }}>Copy station link ↗</button>
            </div>
            {notice && <p role="status" style={{ color: "#ffb18e", fontSize: 12, lineHeight: 1.6, marginTop: 14 }}>{notice}</p>}
          </div>
          <section style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 17, marginBottom: 12 }}>Station queue</h2>
            {(!station.queue || station.queue.length === 0) ? <p style={{ color: "#999", fontSize: 13 }}>This station&apos;s queue is empty. The creator&apos;s licensed audio can be added in Creator Studio.</p> : <div style={{ display: "grid", gap: 8 }}>{station.queue.map((track, index) => <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, border: "1px solid " + (index === currentTrack ? "#68402f" : "#292929"), borderRadius: 7, background: index === currentTrack ? "#201610" : "#101010" }}>
              <span style={{ color: "#ff875a", fontSize: 10, width: 18 }}>{String(index + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1, minWidth: 0 }}><b style={{ display: "block", fontSize: 12, overflowWrap: "anywhere" }}>{track.title}</b><span style={{ color: "#999", fontSize: 10 }}>{track.artist || "Unknown artist"} · {track.duration || "—"}</span></div>
              <button className="play" aria-label={`Play ${track.title}`} onClick={() => void playTrack(index)} style={{ cursor: "pointer" }}>▶</button>
            </div>)}</div>}
          </section>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            <Link className="primary" style={{ marginTop: 0 }} href="/studio">Create your own station →</Link>
            <Link className="secondary" href="/">Explore Vibez</Link>
          </div>
          {shareNotice && <p className="fine-print" role="status">{shareNotice}</p>}
          <p style={{ color: "#777", fontSize: 10, lineHeight: 1.6, marginTop: 20 }}>Playback works only for audio URLs that are playable in a browser. This page does not claim the station is broadcasting live; public live radio needs a streaming provider.</p>
        </> : null}
      </section>
    </main>
  );
}
