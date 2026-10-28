"use client";

import { useMemo, useState } from "react";

type Track = { id: number; title: string; artist: string; duration: string };

const starterTracks: Track[] = [
  { id: 1, title: "City Lights", artist: "Vibez Selects", duration: "3:24" },
  { id: 2, title: "No Pressure", artist: "The After Hours", duration: "2:58" },
  { id: 3, title: "Outside Tonight", artist: "Vibez Selects", duration: "3:41" },
];

export default function StudioPage() {
  const [stationName, setStationName] = useState("Godwin's Frequency");
  const [tagline, setTagline] = useState("Good music. No bad energy.");
  const [category, setCategory] = useState("Afrobeats");
  const [visibility, setVisibility] = useState("Public");
  const [tracks, setTracks] = useState(starterTracks);
  const [newTrack, setNewTrack] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(72);
  const [mic, setMic] = useState(false);
  const [crossfade, setCrossfade] = useState(4);
  const [broadcast, setBroadcast] = useState(false);
  const [notice, setNotice] = useState("");

  const selectedTrack = tracks[currentTrack];
  const totalTracks = useMemo(() => tracks.length, [tracks]);

  function addTrack() {
    const title = newTrack.trim();
    if (!title) return;
    setTracks((items) => [...items, { id: Date.now(), title, artist: "Added to your queue", duration: "—" }]);
    setNewTrack("");
    setNotice("Track added to your local studio queue.");
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
        <a className="brand" href="/"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></a>
        <div className="sidebar-label">CREATOR SPACE</div>
        <a className="side-link active" href="/studio"><span>◉</span> Studio overview</a>
        <a className="side-link" href="#station"><span>▧</span> Station setup</a>
        <a className="side-link" href="#playlist"><span>♫</span> Music & queue</a>
        <a className="side-link" href="#controls"><span>☷</span> DJ controls</a>
        <a className="side-link" href="#growth"><span>↗</span> Audience & growth</a>
        <div className="sidebar-bottom"><div className="plan-chip">✦ CREATOR PRO <span>PREVIEW</span></div><a href="/">← Back to Vibez</a></div>
      </aside>

      <section className="studio-main">
        <header className="studio-topbar"><div><span className="studio-breadcrumb">VIBEZ / CREATOR STUDIO</span><h1>Your sound. Your station.</h1></div><div className="profile-pill"><span className="profile-avatar">G</span><span>Creator account<small>Demo workspace</small></span><span>⌄</span></div></header>

        <div className="studio-banner"><div><span className="studio-live-indicator"><i /> STUDIO PREVIEW</span><h2>Make the airwaves yours.</h2><p>Set up your station, build a queue, tune your sound and prepare your show.</p></div><div className="banner-mark">v<span>✳</span></div></div>
        {notice && <div className="studio-notice" role="status"><span>ⓘ</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}

        <div className="studio-stats"><article><span>YOUR STATION</span><b>{stationName || "Untitled station"}</b><small>Ready to configure</small></article><article><span>QUEUE LENGTH</span><b>{totalTracks} tracks</b><small>Local demo queue</small></article><article><span>BROADCAST STATUS</span><b className={broadcast ? "status-orange" : ""}>{broadcast ? "Preview active" : "Offline"}</b><small>{broadcast ? "Not publicly streaming" : "No audience connected"}</small></article><article><span>SUBSCRIPTION</span><b>Creator Pro</b><small>Plan preview · not billed</small></article></div>

        <div className="studio-columns">
          <div className="studio-column">
            <section className="studio-panel" id="station"><div className="panel-heading"><div><span className="panel-kicker">01 / YOUR BRAND</span><h3>Station setup</h3></div><span className="panel-symbol">▧</span></div>
              <label className="field-label" htmlFor="station-name">Station name</label><input id="station-name" className="studio-input" value={stationName} onChange={(e) => setStationName(e.target.value)} maxLength={48}/>
              <label className="field-label" htmlFor="station-tagline">Tagline</label><input id="station-tagline" className="studio-input" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={90}/>
              <div className="field-pair"><div><label className="field-label" htmlFor="station-category">Main genre</label><select id="station-category" className="studio-input" value={category} onChange={(e) => setCategory(e.target.value)}><option>Afrobeats</option><option>Hip-hop</option><option>R&B / Soul</option><option>Gospel</option><option>Electronic</option><option>Talk & culture</option><option>Mixed genres</option></select></div><div><label className="field-label" htmlFor="station-visibility">Discovery</label><select id="station-visibility" className="studio-input" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option>Public</option><option>Unlisted</option><option>Private</option></select></div></div>
              <div className="station-preview"><div className="mini-art">v.</div><div><b>{stationName || "Your station"}</b><p>{tagline || "Your station tagline"}</p><span>{category.toUpperCase()} · {visibility.toUpperCase()}</span></div><button className="small-ghost" onClick={() => setNotice("Station branding is a local preview. Saving to your account will be enabled after authentication is implemented.")}>Save setup</button></div>
            </section>

            <section className="studio-panel" id="playlist"><div className="panel-heading"><div><span className="panel-kicker">02 / YOUR SOUND</span><h3>Music & queue</h3></div><span className="queue-count">{totalTracks.toString().padStart(2, "0")} TRACKS</span></div>
              <div className="queue-toolbar"><span>UP NEXT <small>· drag-and-drop ordering coming next</small></span><button className="small-ghost" onClick={() => setTracks([])}>Clear queue</button></div>
              {tracks.length === 0 ? <div className="empty-queue">Your queue is empty. Add a track below to get started.</div> : <div className="track-list">{tracks.map((track, index) => <div className={`track-row ${index === currentTrack ? "selected" : ""}`} key={track.id}><button className="track-play" onClick={() => {setCurrentTrack(index);setPlaying(true);}} aria-label={`Play ${track.title}`}>{index === currentTrack && playing ? "Ⅱ" : "▶"}</button><div className="track-title"><b>{track.title}</b><span>{track.artist}</span></div><span className="track-duration">{track.duration}</span><button className="remove-track" onClick={() => {setTracks((items) => items.filter((item) => item.id !== track.id));setCurrentTrack(0);setPlaying(false);}} aria-label={`Remove ${track.title}`}>×</button></div>)}</div>}
              <form className="add-track" onSubmit={(e) => {e.preventDefault();addTrack();}}><input className="studio-input" value={newTrack} onChange={(e) => setNewTrack(e.target.value)} placeholder="Add a track title to the demo queue" aria-label="New track title"/><button className="add-button" type="submit">+ Add</button></form>
              <p className="fine-print">Demo queue only. Real music uploads, licensing checks and catalog integrations are not connected.</p>
            </section>
          </div>

          <div className="studio-column">
            <section className="studio-panel on-air-panel"><div className="panel-heading"><div><span className="panel-kicker">BROADCAST CONTROL</span><h3>On-air console</h3></div><span className={`on-air-badge ${broadcast ? "active" : ""}`}><i/>{broadcast ? "PREVIEW ON" : "OFFLINE"}</span></div>
              <div className="console-screen"><div className="console-art"><span>v.</span><div className="console-eq"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div><div className="console-track"><span>NOW SELECTED</span><b>{selectedTrack?.title || "Nothing in queue"}</b><small>{selectedTrack?.artist || "Add a track to begin"}</small></div><div className="console-timeline"><span>00:00</span><div><i/></div><span>{selectedTrack?.duration || "—"}</span></div></div>
              <div className="transport"><button onClick={() => {setCurrentTrack((n) => tracks.length ? (n - 1 + tracks.length) % tracks.length : 0);setPlaying(false);}} aria-label="Previous track">|◀</button><button className="transport-main" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause preview" : "Play preview"}>{playing ? "Ⅱ" : "▶"}</button><button onClick={() => {setCurrentTrack((n) => tracks.length ? (n + 1) % tracks.length : 0);setPlaying(false);}} aria-label="Next track">▶|</button><span className="transport-divider"/><button className={mic ? "control-active" : ""} onClick={() => setMic((value) => !value)} aria-label="Toggle microphone preview">♩ Mic {mic ? "on" : "off"}</button></div>
              <div className="slider-control"><div><label htmlFor="volume">Master volume</label><span>{volume}%</span></div><input id="volume" type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))}/></div>
              <div className="slider-control"><div><label htmlFor="crossfade">Crossfade</label><span>{crossfade}s</span></div><input id="crossfade" type="range" min="0" max="12" value={crossfade} onChange={(e) => setCrossfade(Number(e.target.value))}/></div>
              <button className={`go-live ${broadcast ? "stop" : ""}`} onClick={toggleBroadcast}>{broadcast ? "■ Stop studio preview" : "● Prepare to go live"} <span>↗</span></button>
              <p className="broadcast-warning">This control only changes the preview state. Public live audio requires a configured streaming server/provider, encoder ingest, stream-key security and production checks.</p>
            </section>

            <section className="studio-panel" id="controls"><div className="panel-heading"><div><span className="panel-kicker">03 / YOUR SHOW</span><h3>DJ tools</h3></div><span className="panel-symbol">♫</span></div>
              <div className="tool-grid"><button onClick={() => setNotice("Auto-DJ is planned. It will need a licensed queue and server-side scheduler.")}><span>↻</span><b>Auto-DJ</b><small>Planned</small></button><button onClick={() => setNotice("Mic mixing is UI-only until browser audio permissions and broadcast audio routing are implemented.")}><span>♩</span><b>Mic mixer</b><small>Preview</small></button><button onClick={() => setNotice("Show scheduling is planned for a future studio release.")}><span>◷</span><b>Schedule</b><small>Planned</small></button><button onClick={() => setNotice("Stream quality presets will be available after the broadcast provider is selected.")}><span>⌁</span><b>Stream quality</b><small>Planned</small></button></div>
            </section>
            <section className="studio-panel growth-panel" id="growth"><div className="panel-heading"><div><span className="panel-kicker">04 / YOUR AUDIENCE</span><h3>Build your audience</h3></div></div><div className="growth-row"><span className="growth-icon">↗</span><div><b>Station profile & share link</b><p>Let listeners find your station</p></div><span className="coming-soon">NEXT</span></div><div className="growth-row"><span className="growth-icon">♧</span><div><b>Listener chat & requests</b><p>Bring your audience into the show</p></div><span className="coming-soon">NEXT</span></div><div className="growth-row"><span className="growth-icon">✦</span><div><b>Tips & premium access</b><p>Monetization setup comes after payments integration</p></div><span className="coming-soon">NEXT</span></div></section>
          </div>
        </div>
        <footer className="studio-footer"><span>VIBEZ CREATOR STUDIO · CONCEPT BUILD</span><span>Black / white / orange</span><a href="/">View public landing page ↗</a></footer>
      </section>
    </main>
  );
}
