"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type Track = { id: number; title: string; artist: string; duration: string; audioUrl?: string };

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

const starterTracks: Track[] = [];

export default function StudioPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micFrameRef = useRef<number | null>(null);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  useEffect(() => {
    if (!sessionPending && !session) router.replace("/login");
  }, [sessionPending, session, router]);

  const [stationId, setStationId] = useState("");
  const [stationName, setStationName] = useState("Godwin's Frequency");
  const [tagline, setTagline] = useState("Good music. No bad energy.");
  const [category, setCategory] = useState("Afrobeats");
  const [visibility, setVisibility] = useState("Public");
  const [tracks, setTracks] = useState(starterTracks);
  const [newTrack, setNewTrack] = useState("");
  const [newTrackUrl, setNewTrackUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [draggedTrackId, setDraggedTrackId] = useState<number | null>(null);
  const [volume, setVolume] = useState(72);
  const [mic, setMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [crossfade, setCrossfade] = useState(4);
  const [broadcast, setBroadcast] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedTrack = tracks[currentTrack];
  const totalTracks = useMemo(() => tracks.length, [tracks]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    async function loadSavedStation() {
      try {
        const response = await fetch("/api/studio/profile", { cache: "no-store" });
        if (!response.ok) {
          if (response.status !== 404 && response.status !== 401) throw new Error("Could not load your saved station.");
          return;
        }
        const data = await response.json();
        const profile = data?.profile;
        if (cancelled || !profile) return;
        setStationId(typeof profile.id === "string" ? profile.id : "");
        setStationName(typeof profile.name === "string" ? profile.name : "My Vibez Station");
        setTagline(typeof profile.tagline === "string" ? profile.tagline : "");
        setCategory(typeof profile.genre === "string" ? profile.genre : "Mixed genres");
        const savedVisibility = typeof profile.visibility === "string" ? profile.visibility.toLowerCase() : "public";
        setVisibility(savedVisibility === "private" ? "Private" : savedVisibility === "unlisted" ? "Unlisted" : "Public");
        const savedQueue = Array.isArray(profile.queue) ? profile.queue : [];
        const usedTrackIds = new Set<number>();
        const restoredTracks = savedQueue.slice(0, 250).map((item: unknown, index: number) => {
          const track = item && typeof item === "object" ? item as Record<string, unknown> : {};
          const numericId = Number(track.id);
          let id = Number.isSafeInteger(numericId) && numericId > 0 ? numericId : Date.now() + index;
          while (usedTrackIds.has(id)) id += 1;
          usedTrackIds.add(id);
          return {
            id,
            title: typeof track.title === "string" ? track.title : "",
            artist: typeof track.artist === "string" ? track.artist : "",
            duration: typeof track.duration === "string" ? track.duration : "—",
            audioUrl: typeof track.audioUrl === "string" ? track.audioUrl : "",
          };
        }).filter((track: Track) => track.title.trim().length > 0);
        setTracks(restoredTracks);
        const settings = profile.settings && typeof profile.settings === "object" ? profile.settings as Record<string, unknown> : {};
        if (typeof settings.volume === "number" && Number.isFinite(settings.volume)) setVolume(Math.max(0, Math.min(100, Math.round(settings.volume))));
        if (typeof settings.crossfade === "number" && Number.isFinite(settings.crossfade)) setCrossfade(Math.max(0, Math.min(12, Math.round(settings.crossfade))));
      } catch (error) {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Could not load your saved station.");
      }
    }
    void loadSavedStation();
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(100, volume)) / 100;
  }, [volume]);

  useEffect(() => () => {
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (micFrameRef.current !== null) cancelAnimationFrame(micFrameRef.current);
    void micContextRef.current?.close().catch(() => undefined);
  }, []);

  async function toggleMicrophone() {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
      if (micContextRef.current) {
        await micContextRef.current.close().catch(() => undefined);
        micContextRef.current = null;
      }
      if (micFrameRef.current !== null) cancelAnimationFrame(micFrameRef.current);
      micFrameRef.current = null;
      micAnalyserRef.current = null;
      setMicLevel(0);
      setMic(false);
      setNotice("Microphone input test stopped. No audio was broadcast to listeners.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("Microphone input testing is unavailable in this browser or page context. Use a secure HTTPS page.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      const samples = new Uint8Array(analyser.fftSize);
      const measure = () => {
        if (!micAnalyserRef.current) return;
        micAnalyserRef.current.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) { const normalized = (sample - 128) / 128; sum += normalized * normalized; }
        setMicLevel(Math.min(100, Math.round(Math.sqrt(sum / samples.length) * 280)));
        micFrameRef.current = requestAnimationFrame(measure);
      };
      micFrameRef.current = requestAnimationFrame(measure);
      micStreamRef.current = stream;
      micContextRef.current = context;
      setMic(true);
      setNotice("Microphone input meter is active. Audio is not played back, preventing feedback; this is local input testing, not a broadcast.");
    } catch {
      setMic(false);
      setNotice("Microphone input could not start. Check browser permissions and try again.");
    }
  }

  async function playQueueTrack(index: number) {
    const track = tracks[index];
    if (!track) {
      setNotice("Add a track to the queue first.");
      return;
    }
    setCurrentTrack(index);
    if (!track.audioUrl || !audioRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }
      setIsPlaying(false);
      setPlaybackTime(0);
      setPlaybackDuration(0);
      setNotice("This queue item has no playable audio URL. Previous playback has stopped; add a direct HTTPS audio file link.");
      return;
    }
    try {
      if (audioRef.current.src !== track.audioUrl) audioRef.current.src = track.audioUrl;
      audioRef.current.volume = Math.max(0, Math.min(100, volume)) / 100;
      await audioRef.current.play();
      setIsPlaying(true);
      setNotice(`Playing ${track.title}.`);
    } catch {
      setIsPlaying(false);
      setNotice("Playback failed. Check that the HTTPS URL is a direct audio file and allows browser playback.");
    }
  }

  function moveQueueTrack(fromId: number, toId: number) {
    if (fromId === toId) return;
    const selectedId = tracks[currentTrack]?.id;
    const from = tracks.findIndex((item) => item.id === fromId);
    const to = tracks.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...tracks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setTracks(next);
    if (selectedId !== undefined) {
      const selectedIndex = next.findIndex((item) => item.id === selectedId);
      if (selectedIndex >= 0) setCurrentTrack(selectedIndex);
    }
    setNotice("Queue order updated. Save queue to keep the new order on your account.");
  }

  async function saveStation() {
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/studio/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: stationName,
          tagline,
          genre: category,
          visibility: visibility.toLowerCase(),
          queue: tracks,
          settings: { volume, crossfade },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save your station.");
      if (typeof data.profile?.id === "string") setStationId(data.profile.id);
      setNotice("Station settings and queue saved to your Vibez account.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save your station.");
    } finally {
      setSaving(false);
    }
  }

  if (sessionPending || !session) return <main className="studio-loading"><span className="brandmark">v.</span><p>Opening your creator studio…</p></main>;

  function addTrack() {
    const title = newTrack.trim();
    if (!title) return;
    const candidate = newTrackUrl.trim();
    let audioUrl: string | undefined;
    if (candidate) {
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Use a secure HTTPS audio URL without embedded credentials.");
        audioUrl = parsed.toString();
      } catch {
        setNotice("Enter a valid HTTPS link to a playable audio file, or leave the URL empty.");
        return;
      }
    }
    let id = Date.now();
    while (tracks.some((track) => track.id === id)) id += 1;
    setTracks((items) => [...items, { id, title, artist: "Added to your queue", duration: "—", audioUrl }]);
    setNewTrack("");
    setNewTrackUrl("");
    setNotice(audioUrl ? "Track added. You can try playing its audio URL." : "Track added without an audio source. Add an HTTPS audio URL to play it.");
  }

  function toggleBroadcast() {
    setBroadcast((value) => !value);
    setNotice(broadcast
      ? "Studio preview stopped. No public stream was broadcast."
      : "Preview mode only: connect a broadcast provider and configure a licensed audio source before going live to listeners.");
  }

  return (
    <main className="studio-shell">
      <aside className="studio-sidebar">
        <Link className="brand" href="/"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></Link>
        <div className="sidebar-label">CREATOR SPACE</div>
        <Link className="side-link active" href="/studio"><span>◉</span> Studio overview</Link>
        <a className="side-link" href="#station"><span>▧</span> Station setup</a>
        <a className="side-link" href="#playlist"><span>♫</span> Music & queue</a>
        <a className="side-link" href="#controls"><span>☷</span> DJ controls</a>
        <a className="side-link" href="#growth"><span>↗</span> Audience & growth</a>
        <div className="sidebar-bottom"><div className="plan-chip">✦ CREATOR PRO <span>PREVIEW</span></div><Link href="/">← Back to Vibez</Link></div>
      </aside>

      <section className="studio-main">
        <header className="studio-topbar"><div><span className="studio-breadcrumb">VIBEZ / CREATOR STUDIO</span><h1>Your sound. Your station.</h1></div><div className="profile-pill"><span className="profile-avatar">{(session.user.name || session.user.email || "V").slice(0,1).toUpperCase()}</span><span>{session.user.name || "Creator account"}<small>{session.user.email}</small></span><button className="studio-signout" onClick={async () => { await authClient.signOut(); router.replace("/"); router.refresh(); }}>Sign out</button></div></header>

        <div className="studio-banner"><div><span className="studio-live-indicator"><i /> STUDIO PREVIEW · NO AUDIO STREAM</span><h2>Make the airwaves yours.</h2><p>Set up your station, build a queue, tune your sound and prepare your show.</p></div><div className="banner-mark">v<span>✳</span></div></div>
        {notice && <div className="studio-notice" role="status"><span>ⓘ</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}

        <div className="studio-stats"><article><span>YOUR STATION</span><b>{stationName || "Untitled station"}</b><small>Ready to configure</small></article><article><span>QUEUE LENGTH</span><b>{totalTracks} tracks</b><small>{tracks.some((track) => track.audioUrl) ? "Playable sources added" : "Add playable audio sources"}</small></article><article><span>BROADCAST STATUS</span><b className={broadcast ? "status-orange" : ""}>{broadcast ? "Preview active" : "Offline"}</b><small>{broadcast ? "Not publicly streaming" : "No audience connected"}</small></article><article><span>SUBSCRIPTION</span><b>Creator Pro</b><small>Plan preview · not billed</small></article></div>

        <div className="studio-columns">
          <div className="studio-column">
            <section className="studio-panel" id="station"><div className="panel-heading"><div><span className="panel-kicker">01 / YOUR BRAND</span><h3>Station setup</h3></div><span className="panel-symbol">▧</span></div>
              <label className="field-label" htmlFor="station-name">Station name</label><input id="station-name" className="studio-input" value={stationName} onChange={(e) => setStationName(e.target.value)} maxLength={48}/>
              <label className="field-label" htmlFor="station-tagline">Tagline</label><input id="station-tagline" className="studio-input" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={90}/>
              <div className="field-pair"><div><label className="field-label" htmlFor="station-category">Main genre</label><select id="station-category" className="studio-input" value={category} onChange={(e) => setCategory(e.target.value)}><option>Afrobeats</option><option>Hip-hop</option><option>R&B / Soul</option><option>Gospel</option><option>Electronic</option><option>Talk & culture</option><option>Mixed genres</option></select></div><div><label className="field-label" htmlFor="station-visibility">Discovery</label><select id="station-visibility" className="studio-input" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option>Public</option><option>Unlisted</option><option>Private</option></select></div></div>
              <div className="station-preview"><div className="mini-art">v.</div><div><b>{stationName || "Your station"}</b><p>{tagline || "Your station tagline"}</p><span>{category.toUpperCase()} · {visibility.toUpperCase()}</span></div><button className="small-ghost" onClick={saveStation} disabled={saving}>{saving ? "Saving…" : "Save setup"}</button></div>
              {stationId && visibility === "Public" && <div className="station-share-row"><div><span>PUBLIC STATION LINK</span><code>{typeof window !== "undefined" ? `${window.location.origin}/station/${stationId}` : `/station/${stationId}`}</code></div><button className="small-ghost" onClick={async () => { const url = `${window.location.origin}/station/${stationId}`; try { await navigator.clipboard.writeText(url); setNotice("Public station link copied."); } catch { setNotice(url); } }}>Copy link</button></div>}
              {stationId && visibility !== "Public" && <p className="fine-print">Your station is {visibility.toLowerCase()}. It will not appear in public discovery or have a shareable public page until you set it to Public.</p>}
            </section>

            <section className="studio-panel" id="playlist"><div className="panel-heading"><div><span className="panel-kicker">02 / YOUR SOUND</span><h3>Music & queue</h3></div><span className="queue-count">{totalTracks.toString().padStart(2, "0")} TRACKS</span></div>
              <div className="queue-toolbar"><span>UP NEXT <small>· drag tracks to reorder</small></span><button className="small-ghost" onClick={() => { if (!tracks.length || !window.confirm("Clear all tracks from your queue? Save the station afterward to keep this change.")) return; audioRef.current?.pause(); if (audioRef.current) { audioRef.current.removeAttribute("src"); audioRef.current.load(); } setTracks([]); setCurrentTrack(0); setIsPlaying(false); setPlaybackTime(0); setPlaybackDuration(0); setNotice("Queue cleared. Save your station to keep this change."); }} disabled={tracks.length === 0}>Clear queue</button></div>
              {tracks.length === 0 ? <div className="empty-queue">Your queue is empty. Add a track below to get started.</div> : <div className="track-list">{tracks.map((track, index) => <div className={`track-row ${index === currentTrack ? "selected" : ""} ${draggedTrackId === track.id ? "dragging" : ""}`} key={track.id} draggable onDragStart={(event) => { setDraggedTrackId(track.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(track.id)); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); const sourceId = Number(event.dataTransfer.getData("text/plain")) || draggedTrackId; if (sourceId !== null) moveQueueTrack(sourceId, track.id); setDraggedTrackId(null); }} onDragEnd={() => setDraggedTrackId(null)}><button className="track-play" onClick={() => void playQueueTrack(index)} aria-label={`Play ${track.title}`}>▶</button><div className="track-title"><b>{track.title}</b><span>{track.artist}</span></div><span className="track-duration">{track.duration}</span><div aria-label={`Reorder ${track.title}`} style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}><button type="button" onClick={() => index > 0 && moveQueueTrack(track.id, tracks[index - 1].id)} disabled={index === 0} aria-label={`Move ${track.title} up`} title="Move up" style={{ width: 25, height: 20, padding: 0, border: "1px solid #38302b", borderRadius: 4, background: "#191715", color: "#e7d7ce", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.3 : 1 }}>↑</button><button type="button" onClick={() => index < tracks.length - 1 && moveQueueTrack(track.id, tracks[index + 1].id)} disabled={index === tracks.length - 1} aria-label={`Move ${track.title} down`} title="Move down" style={{ width: 25, height: 20, padding: 0, border: "1px solid #38302b", borderRadius: 4, background: "#191715", color: "#e7d7ce", cursor: index === tracks.length - 1 ? "not-allowed" : "pointer", opacity: index === tracks.length - 1 ? 0.3 : 1 }}>↓</button></div><button className="remove-track" onClick={() => { const removedIndex = tracks.findIndex((item) => item.id === track.id); if (removedIndex === currentTrack) { audioRef.current?.pause(); if (audioRef.current) { audioRef.current.removeAttribute("src"); audioRef.current.load(); } setIsPlaying(false); setPlaybackTime(0); setPlaybackDuration(0); } setTracks((items) => items.filter((item) => item.id !== track.id)); setCurrentTrack((index) => removedIndex < index ? Math.max(0, index - 1) : removedIndex === index ? Math.min(removedIndex, Math.max(0, tracks.length - 2)) : index); setNotice("Track removed. Save the queue to keep this change."); }} aria-label={`Remove ${track.title}`}>×</button></div>)}</div>}
              <form className="add-track" onSubmit={(e) => {e.preventDefault();addTrack();}}><input className="studio-input" value={newTrack} onChange={(e) => setNewTrack(e.target.value)} placeholder="Track title" aria-label="New track title" required/><input className="studio-input" type="url" value={newTrackUrl} onChange={(e) => setNewTrackUrl(e.target.value)} placeholder="HTTPS audio file URL (optional)" aria-label="Direct audio file URL"/><button className="add-button" type="submit">+ Add</button></form>
              <div className="queue-save-row"><p className="fine-print">Queue entries are saved to your account. Add a direct HTTPS audio URL to try browser playback; use only audio you own or are licensed to stream.</p><button className="small-ghost" onClick={saveStation} disabled={saving}>{saving ? "Saving…" : "Save queue"}</button></div>
            </section>
          </div>

          <div className="studio-column">
            <section className="studio-panel on-air-panel"><div className="panel-heading"><div><span className="panel-kicker">BROADCAST CONTROL</span><h3>On-air console</h3></div><span className={`on-air-badge ${broadcast ? "active" : ""}`}><i/>{broadcast ? "PREVIEW ON" : "OFFLINE"}</span></div>
              <div className="console-screen"><audio ref={audioRef} onTimeUpdate={(event) => setPlaybackTime(event.currentTarget.currentTime || 0)} onLoadedMetadata={(event) => { const seconds = event.currentTarget.duration; setPlaybackDuration(Number.isFinite(seconds) ? seconds : 0); if (Number.isFinite(seconds) && seconds > 0 && tracks[currentTrack]) { const detected = formatClock(seconds); setTracks((items) => items.map((item) => item.id === tracks[currentTrack].id ? { ...item, duration: detected } : item)); } }} onDurationChange={(event) => setPlaybackDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onEnded={() => { setIsPlaying(false); if (tracks.length > 1) void playQueueTrack((currentTrack + 1) % tracks.length); }} onPause={() => setIsPlaying(false)} onPlay={() => setIsPlaying(true)} onError={() => { setIsPlaying(false); setNotice("Audio source failed to load. Check the direct HTTPS URL, file format and hosting permissions."); }} /><div className="console-art"><span>v.</span><div className="console-eq"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div><div className="console-track"><span>NOW SELECTED</span><b>{selectedTrack?.title || "Nothing in queue"}</b><small>{selectedTrack?.artist || "Add a track to begin"}</small></div><div className="console-timeline"><span>{formatClock(playbackTime)}</span><input aria-label="Seek through current track" className="playback-seek" type="range" min="0" max={playbackDuration || 0} step="0.1" value={Math.min(playbackTime, playbackDuration || 0)} onChange={(event) => { const next = Number(event.target.value); if (audioRef.current && Number.isFinite(next)) { audioRef.current.currentTime = next; setPlaybackTime(next); } }} disabled={!playbackDuration} /><span>{formatClock(playbackDuration)}</span></div></div>
              <div className="transport"><button onClick={() => { if (tracks.length) void playQueueTrack((currentTrack - 1 + tracks.length) % tracks.length); }} aria-label="Previous track">|◀</button><button className="transport-main" onClick={async () => { if (isPlaying && audioRef.current) { audioRef.current.pause(); setIsPlaying(false); } else { await playQueueTrack(currentTrack); } }} aria-label={isPlaying ? "Pause audio" : "Play audio"}>{isPlaying ? "Ⅱ" : "▶"}</button><button onClick={() => { if (tracks.length) void playQueueTrack((currentTrack + 1) % tracks.length); }} aria-label="Next track">▶|</button><span className="transport-divider"/><button className={mic ? "control-active" : ""} onClick={() => void toggleMicrophone()} aria-label={mic ? "Stop microphone preview" : "Enable microphone preview"}>♩ Mic {mic ? "on" : "off"}</button></div>
              <div className="slider-control"><div><label htmlFor="volume">Master volume</label><span>{volume}%</span></div><input id="volume" type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))}/></div>
              <div className="slider-control"><div><label>Microphone input level</label><span>{mic ? `${micLevel}%` : "Off"}</span></div><div role="meter" aria-label="Microphone input level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mic ? micLevel : 0} style={{ height: 6, background: "#37302c", borderRadius: 6, overflow: "hidden" }}><div style={{ width: `${mic ? micLevel : 0}%`, height: "100%", background: micLevel > 75 ? "#f59e0b" : "#ff6b35", transition: "width 80ms linear" }} /></div></div>
              <div className="slider-control"><div><label htmlFor="crossfade">Crossfade</label><span>{crossfade}s</span></div><input id="crossfade" type="range" min="0" max="12" value={crossfade} onChange={(e) => setCrossfade(Number(e.target.value))}/></div>
              <button className={`go-live ${broadcast ? "stop" : ""}`} onClick={toggleBroadcast}>{broadcast ? "■ Stop studio preview" : "● Prepare to go live"} <span>↗</span></button>
              <p className="broadcast-warning">Browser playback can work for queue items with playable HTTPS audio URLs. This is not a public broadcast: live radio still requires a streaming provider, secure ingest and server-side broadcast controls.</p>
            </section>

            <section className="studio-panel" id="controls"><div className="panel-heading"><div><span className="panel-kicker">03 / YOUR SHOW</span><h3>DJ tools</h3></div><span className="panel-symbol">♫</span></div>
              <div className="tool-grid"><button onClick={() => setNotice("Auto-DJ is planned. It will need a licensed queue and server-side scheduler.")}><span>↻</span><b>Auto-DJ</b><small>Planned</small></button><button onClick={() => setNotice("Mic mixing is UI-only until browser audio permissions and broadcast audio routing are implemented.")}><span>♩</span><b>Mic mixer</b><small>Preview</small></button><button onClick={() => setNotice("Show scheduling is planned for a future studio release.")}><span>◷</span><b>Schedule</b><small>Planned</small></button><button onClick={() => setNotice("Stream quality presets will be available after the broadcast provider is selected.")}><span>⌁</span><b>Stream quality</b><small>Planned</small></button></div>
            </section>
            <section className="studio-panel growth-panel" id="growth"><div className="panel-heading"><div><span className="panel-kicker">04 / YOUR AUDIENCE</span><h3>Build your audience</h3></div></div><div className="growth-row"><span className="growth-icon">↗</span><div><b>Station profile & share link</b><p>Let listeners find your station</p></div><span className="coming-soon">NEXT</span></div><div className="growth-row"><span className="growth-icon">♧</span><div><b>Listener chat & requests</b><p>Bring your audience into the show</p></div><span className="coming-soon">NEXT</span></div><div className="growth-row"><span className="growth-icon">✦</span><div><b>Tips & premium access</b><p>Monetization setup comes after payments integration</p></div><span className="coming-soon">NEXT</span></div></section>
          </div>
        </div>
        <footer className="studio-footer"><span>VIBEZ CREATOR STUDIO · CONCEPT BUILD</span><span>Black / white / orange</span><Link href="/">View public landing page ↗</Link></footer>
      </section>
    </main>
  );
}
