"use client";

import { useEffect, useState } from "react";

type StationCard = { id?: string; name: string; genre: string; status: string; code: string; style: string };

const stations: StationCard[] = [
  { name: "Lagos Radio", genre: "Afrobeats · Lagos", status: "LIVE", code: "L", style: "orange" },
  { name: "The Sound Room", genre: "R&B · Soul · Chill", status: "ON AIR", code: "S", style: "cream" },
  { name: "Naija Mix", genre: "Street pop · Hits", status: "TRENDING", code: "N", style: "lime" },
  { name: "Late Night FM", genre: "Chill · Global sounds", status: "ON AIR", code: "F", style: "cream" },
  { name: "The Pulse", genre: "Hip-hop · New drops", status: "CURATED", code: "P", style: "orange" },
  { name: "Soul Garden", genre: "Neo-soul · Easy listening", status: "CURATED", code: "G", style: "lime" },
  { name: "Talk Naija", genre: "Culture · Conversations", status: "COMMUNITY", code: "T", style: "cream" },
  { name: "Global Bounce", genre: "Afrobeats · Amapiano", status: "TRENDING", code: "B", style: "orange" },
  { name: "Sunday Light", genre: "Gospel · Inspiration", status: "CURATED", code: "S", style: "lime" },
  { name: "Indie Orbit", genre: "Indie · Alternative", status: "CURATED", code: "I", style: "cream" },
  { name: "Club Frequency", genre: "Dance · Electronic", status: "ON AIR", code: "C", style: "orange" },
  { name: "The Focus Room", genre: "Lo-fi · Study", status: "CURATED", code: "F", style: "lime" },
];

export default function Home() {
  const [stationList, setStationList] = useState<StationCard[]>(stations);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stations", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (cancelled || !Array.isArray(data?.stations) || data.stations.length === 0) return;
        const creatorStations: StationCard[] = data.stations.map((station: { id: string; name: string; tagline?: string; genre?: string }, index: number) => ({
          id: station.id,
          name: station.name,
          genre: [station.genre, station.tagline].filter(Boolean).join(" · ") || "Vibez creator station",
          status: "CREATOR STATION",
          code: (station.name || "V").trim().charAt(0).toUpperCase() || "V",
          style: (["orange", "cream", "lime"] as const)[index % 3],
        }));
        setStationList(creatorStations);
      })
      .catch(() => { /* Keep the designed preview if discovery is temporarily unavailable. */ });
    return () => { cancelled = true; };
  }, []);

  const visibleStations = stationList.slice(0, visibleCount);

  return (
    <main className="shell">
      <header className="nav">
        <a className="brand" href="/" aria-label="Vibez home"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></a>
        <nav aria-label="Main navigation"><a href="#listen">Listen</a><a href="#community">Communities</a><a href="/studio">Creator Studio</a></nav>
        <div className="nav-actions"><a className="login" href="/login">Log in</a><a className="nav-join" href="/login?mode=signup">Join Vibez</a></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> YOUR CITY. YOUR SOUND. YOUR PEOPLE.</div>
          <h1>Press play.<br /><span>Find your people.</span></h1>
          <p className="intro">A world of personal radio. Tune in to creators everywhere, find your people, or build a station of your own.</p>
          <div className="hero-actions"><a className="primary" href="#listen">Explore stations <span>→</span></a><a className="secondary" href="/studio">Create your radio</a></div>
          <div className="social-proof"><div className="avatars"><span>G</span><span>A</span><span>M</span><span>+</span></div><span>One world. A million frequencies.</span></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="hero-sticker">YOUR SOUND.<br /><b>YOUR STATION.</b><span>✳</span></div><div className="sound-wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
      </section>

      <section className="section" id="listen">
        <div className="section-head"><div><div className="eyebrow">THE AIRWAVES</div><h2>Find your frequency.</h2><p className="section-subtitle">Small stations. Big personalities. Discover a new sound.</p></div><span className="section-link">STATIONS · PREVIEW</span></div>
        <div className="station-grid">{visibleStations.map((station, index) => <a className="station-card-link" href={station.id ? `/station/${station.id}` : "/login"} key={station.id || station.name}><article className={`station ${station.style}`}>
          <div className="station-top"><span className="live-dot" />{station.status}<span className="station-number">{String(index + 1).padStart(2,"0")}</span></div>
          <div className="art" aria-hidden="true"><span className="art-ring ring-one"/><span className="art-ring ring-two"/><span className="art-center">{station.code}</span><span className="equalizer"><i/><i/><i/><i/><i/></span></div>
          <div className="station-bottom"><div><h3>{station.name}</h3><p>{station.genre}</p></div><span className="play" aria-label="Open station">→</span></div>
        </article></a>)}</div>
        <div className="load-more-wrap">{visibleCount < stationList.length ? <button className="load-more" onClick={() => setVisibleCount((count) => Math.min(count + 6, stationList.length))}>Load more stations <span>↓</span></button> : <button className="load-more" onClick={() => setVisibleCount(6)}>Show fewer stations <span>↑</span></button>}</div>
        <p className="note">Station cards are a visual preview. Live playback will be enabled as verified stream sources are connected.</p>
      </section>

      <section className="creator-callout"><div className="creator-symbol">v.</div><div><div className="eyebrow">YOUR RADIO. YOUR RULES.</div><h2>Be the station everyone tunes into.</h2><p>Build your personal radio brand, prepare shows, shape your queue and grow a global audience from your own creator dashboard.</p></div><a className="primary" href="/studio">Open Creator Studio <span>→</span></a></section>

      <section className="community" id="community">
        <div><div className="eyebrow">MORE THAN THE MUSIC</div><h2>One big group chat.<br /><span>Thousands of little worlds.</span></h2><p>Find your people by sound, city, culture, and whatever is trending today. The room is better when you’re in it.</p><a href="/login?mode=signup" className="primary">Join the community <span>→</span></a></div>
        <div className="chat-card"><div className="chat-head"><div className="chat-icon">✳</div><div><b>The After Hours</b><small>Community · preview</small></div><span className="online">● COMMUNITY</span></div>
          <div className="chat-message"><span className="avatar orange">D</span><div><b>dammy.wav <small>preview</small></b><p>Who’s got the playlist for tonight? 👀</p></div></div>
          <div className="chat-message"><span className="avatar white">K</span><div><b>koko.jpg <small>preview</small></b><p>Say less. We outside 🎶</p></div></div>
          <div className="chat-message"><span className="avatar peach">T</span><div><b>tee.b <small>preview</small></b><p>Naija to the world, abeg 🇳🇬</p></div></div>
          <div className="chat-compose"><span>Sign in to join the conversation</span><a className="send" href="/login" aria-label="Log in">+</a></div><p className="demo-note">Illustrative UI · accounts and messaging are being built</p>
        </div>
      </section>

      <section className="join" id="join"><div><div className="eyebrow">TUNE IN. LINK UP.</div><h2>Find your sound. Make it yours.</h2><p>Listen to creators or start building your own radio station on Vibez.</p><div className="hero-actions"><a className="primary" href="/login?mode=signup">Create an account <span>→</span></a><a className="secondary" href="/studio">Creator Studio</a></div></div><span className="join-mark">v.</span></section>
      <footer id="about"><a className="brand" href="/"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></a><span>Good sounds. Real people. Better nights.</span><div className="footer-links"><a href="/login">Log in</a><a href="/studio">Creator Studio</a><span>© 2026 Vibez</span></div></footer>
    </main>
  );
}
