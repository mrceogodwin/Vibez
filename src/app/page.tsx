"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type StationCard = { id?: string; name: string; genre: string; status: string; code: string; style: string };

const stations: StationCard[] = [
  { name: "Lagos Radio", genre: "Afrobeats · Lagos", status: "PREVIEW", code: "L", style: "orange" },
  { name: "The Sound Room", genre: "R&B · Soul · Chill", status: "PREVIEW", code: "S", style: "cream" },
  { name: "Naija Mix", genre: "Street pop · Hits", status: "PREVIEW", code: "N", style: "lime" },
  { name: "Late Night FM", genre: "Chill · Global sounds", status: "PREVIEW", code: "F", style: "cream" },
  { name: "The Pulse", genre: "Hip-hop · New drops", status: "PREVIEW", code: "P", style: "orange" },
  { name: "Soul Garden", genre: "Neo-soul · Easy listening", status: "PREVIEW", code: "G", style: "lime" },
  { name: "Talk Naija", genre: "Culture · Conversations", status: "PREVIEW", code: "T", style: "cream" },
  { name: "Global Bounce", genre: "Afrobeats · Amapiano", status: "PREVIEW", code: "B", style: "orange" },
  { name: "Sunday Light", genre: "Gospel · Inspiration", status: "PREVIEW", code: "S", style: "lime" },
  { name: "Indie Orbit", genre: "Indie · Alternative", status: "PREVIEW", code: "I", style: "cream" },
  { name: "Club Frequency", genre: "Dance · Electronic", status: "PREVIEW", code: "C", style: "orange" },
  { name: "The Focus Room", genre: "Lo-fi · Study", status: "PREVIEW", code: "F", style: "lime" },
];

export default function Home() {
  const [stationList, setStationList] = useState<StationCard[]>(stations);
  const [visibleCount, setVisibleCount] = useState(6);
  const [stationSearch, setStationSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All genres");

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

  const hasCreatorStations = stationList.some((station) => Boolean(station.id));
  const availableGenres = ["All genres", ...Array.from(new Set(stationList.map((station) => station.genre.split(" · ")[0]?.trim()).filter(Boolean)))];
  const filteredStations = stationList.filter((station) => {
    const query = stationSearch.trim().toLowerCase();
    const matchesSearch = !query || [station.name, station.genre, station.status].some((value) => value.toLowerCase().includes(query));
    const primaryGenre = station.genre.split(" · ")[0]?.trim() || "";
    return matchesSearch && (genreFilter === "All genres" || primaryGenre === genreFilter);
  });
  const visibleStations = filteredStations.slice(0, visibleCount);

  return (
    <main className="shell">
      <header className="nav">
        <Link className="brand" href="/" aria-label="Vibez home"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></Link>
        <nav aria-label="Main navigation"><Link href="#listen">Listen</Link><Link href="#community">Communities</Link><Link href="/studio">Creator Studio</Link></nav>
        <div className="nav-actions"><Link className="login" href="/login">Log in</Link><Link className="nav-join" href="/login?mode=signup">Join Vibez</Link></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> YOUR CITY. YOUR SOUND. YOUR PEOPLE.</div>
          <h1>Press play.<br /><span>Find your people.</span></h1>
          <p className="intro">A world of personal radio. Tune in to creators everywhere, find your people, or build a station of your own.</p>
          <div className="hero-actions"><Link className="primary" href="#listen">Explore stations <span>→</span></Link><Link className="secondary" href="/studio">Create your radio</Link></div>
          <div className="social-proof"><div className="avatars"><span>G</span><span>A</span><span>M</span><span>+</span></div><span>One world. A million frequencies.</span></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="hero-sticker">YOUR SOUND.<br /><b>YOUR STATION.</b><span>✳</span></div><div className="sound-wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
      </section>

      <section className="section" id="listen">
        <div className="section-head"><div><div className="eyebrow">THE AIRWAVES</div><h2>Find your frequency.</h2><p className="section-subtitle">Small stations. Big personalities. Discover a new sound.</p></div><span className="section-link">{hasCreatorStations ? "PUBLIC CREATOR STATIONS" : "STATION PREVIEW"}</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "22px 0 18px" }}>
          <label style={{ flex: "1 1 240px", minWidth: 0 }}>
            <span className="eyebrow" style={{ display: "block", marginBottom: 7 }}>SEARCH STATIONS</span>
            <input value={stationSearch} onChange={(event) => { setStationSearch(event.target.value); setVisibleCount(6); }} placeholder="Search names, genres or vibes…" aria-label="Search stations" style={{ width: "100%", minHeight: 44, boxSizing: "border-box", borderRadius: 8, border: "1px solid #34302d", background: "#141414", color: "#f5f0ec", padding: "0 13px", font: "inherit" }} />
          </label>
          <label style={{ flex: "0 1 210px", minWidth: "160px" }}>
            <span className="eyebrow" style={{ display: "block", marginBottom: 7 }}>GENRE</span>
            <select value={genreFilter} onChange={(event) => { setGenreFilter(event.target.value); setVisibleCount(6); }} aria-label="Filter stations by genre" style={{ width: "100%", minHeight: 44, borderRadius: 8, border: "1px solid #34302d", background: "#141414", color: "#f5f0ec", padding: "0 13px", font: "inherit" }}>
              {availableGenres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </label>
        </div>
        <div className="station-grid">{visibleStations.map((station, index) => <Link className="station-card-link" href={station.id ? `/station/${station.id}` : "/login?mode=signup"} aria-label={station.id ? `Open ${station.name}` : `Preview ${station.name}; create an account to start a station`} key={station.id || station.name}><article className={`station ${station.style}`}>
          <div className="station-top"><span className="live-dot" />{station.status}<span className="station-number">{String(index + 1).padStart(2,"0")}</span></div>
          <div className="art" aria-hidden="true"><span className="art-ring ring-one"/><span className="art-ring ring-two"/><span className="art-center">{station.code}</span><span className="equalizer"><i/><i/><i/><i/><i/></span></div>
          <div className="station-bottom"><div><h3>{station.name}</h3><p>{station.genre}</p></div><span className="play" aria-label="Open station">→</span></div>
        </article></Link>)}</div>
        {filteredStations.length === 0 && <p role="status" style={{ padding: "26px 0", color: "#aaa" }}>No stations match that search. Try another name or genre.</p>}
        <div className="load-more-wrap">{visibleCount < filteredStations.length ? <button className="load-more" onClick={() => setVisibleCount((count) => Math.min(count + 6, filteredStations.length))}>Load more stations <span>↓</span></button> : visibleCount > 6 && filteredStations.length > 6 ? <button className="load-more" onClick={() => setVisibleCount(6)}>Show fewer stations <span>↑</span></button> : null}</div>
        <p className="note">{hasCreatorStations ? "Public creator stations are loaded from Vibez accounts. Live playback will be enabled when verified stream sources are connected." : "These are sample station designs, not live broadcasts. Create an account to build a real station; live playback requires a verified stream source."}</p>
      </section>

      <section className="creator-callout"><div className="creator-symbol">v.</div><div><div className="eyebrow">YOUR RADIO. YOUR RULES.</div><h2>Be the station everyone tunes into.</h2><p>Build your personal radio brand, prepare shows, shape your queue and grow a global audience from your own creator dashboard.</p></div><Link className="primary" href="/studio">Open Creator Studio <span>→</span></Link></section>

      <section className="community" id="community">
        <div><div className="eyebrow">MORE THAN THE MUSIC</div><h2>One big group chat.<br /><span>Thousands of little worlds.</span></h2><p>Find your people by sound, city, culture, and whatever is trending today. The room is better when you’re in it.</p><Link href="/login?mode=signup" className="primary">Join the community <span>→</span></Link></div>
        <div className="chat-card"><div className="chat-head"><div className="chat-icon">✳</div><div><b>The After Hours</b><small>Community · preview</small></div><span className="online">● COMMUNITY</span></div>
          <div className="chat-message"><span className="avatar orange">D</span><div><b>dammy.wav <small>preview</small></b><p>Who’s got the playlist for tonight? 👀</p></div></div>
          <div className="chat-message"><span className="avatar white">K</span><div><b>koko.jpg <small>preview</small></b><p>Say less. We outside 🎶</p></div></div>
          <div className="chat-message"><span className="avatar peach">T</span><div><b>tee.b <small>preview</small></b><p>Naija to the world, abeg 🇳🇬</p></div></div>
          <div className="chat-compose"><span>Sign in to join the conversation</span><Link className="send" href="/login" aria-label="Log in">+</Link></div><p className="demo-note">Illustrative UI · accounts and messaging are being built</p>
        </div>
      </section>

      <section className="join" id="join"><div><div className="eyebrow">TUNE IN. LINK UP.</div><h2>Find your sound. Make it yours.</h2><p>Listen to creators or start building your own radio station on Vibez.</p><div className="hero-actions"><Link className="primary" href="/login?mode=signup">Create an account <span>→</span></Link><Link className="secondary" href="/studio">Creator Studio</Link></div></div><span className="join-mark">v.</span></section>
      <footer id="about"><Link className="brand" href="/"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></Link><span>Good sounds. Real people. Better nights.</span><div className="footer-links"><Link href="/login">Log in</Link><Link href="/studio">Creator Studio</Link><span>© 2026 Vibez</span></div></footer>
    </main>
  );
}
