const stations = [
  { name: "Lagos Radio", genre: "Afrobeats · Lagos", status: "LIVE", code: "L", style: "orange" },
  { name: "The Sound Room", genre: "R&B · Soul · Chill", status: "ON AIR", code: "S", style: "cream" },
  { name: "Naija Mix", genre: "Street pop · Hits", status: "TRENDING", code: "N", style: "lime" },
  { name: "Late Night FM", genre: "Chill · Global sounds", status: "ON AIR", code: "F", style: "cream" },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="nav">
        <a className="brand" href="#" aria-label="Vibez home"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></a>
        <nav aria-label="Main navigation"><a href="#listen">Listen</a><a href="#community">Communities</a><a href="#about">About</a><a href="/studio">Creator Studio</a></nav>
        <a className="login" href="/studio">Connect / Studio </a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse" /> YOUR CITY. YOUR SOUND. YOUR PEOPLE.</div>
          <h1>Press play.<br /><span>Find your people.</span></h1>
          <p className="intro">Live radio and real conversations, all in one place. Catch the sound, join the chat, and feel the vibe.</p>
          <div className="hero-actions"><a className="primary" href="#listen">Explore the stations </a><a className="secondary" href="#community">Explore communities</a></div>
          <div className="social-proof"><div className="avatars"><span>G</span><span>A</span><span>M</span><span>+</span></div><span>Good music sounds better together.</span></div>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="hero-sticker">NO SKIPS.<br /><b>JUST VIBEZ.</b><span>✳</span></div><div className="sound-wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
      </section>

      <section className="section" id="listen">
        <div className="section-head"><div><div className="eyebrow">THE AIRWAVES</div><h2>Find your frequency.</h2></div><span className="section-link">STATIONS · PREVIEW</span></div>
        <div className="station-grid">{stations.map((station, index) => <article className={`station ${station.style}`} key={station.name}>
          <div className="station-top"><span className="live-dot" />{station.status}<span className="station-number">0{index + 1}</span></div>
          <div className="art" aria-hidden="true"><span className="art-ring ring-one"/><span className="art-ring ring-two"/><span className="art-center">{station.code}</span><span className="equalizer"><i/><i/><i/><i/><i/></span></div>
          <div className="station-bottom"><div><h3>{station.name}</h3><p>{station.genre}</p></div><span className="play" aria-label="Playback coming soon">▶</span></div>
        </article>)}</div>
        <p className="note">Station artwork is a preview. Live playback will be enabled when verified stream URLs are configured.</p>
      </section>

      <section className="community" id="community">
        <div><div className="eyebrow">MORE THAN THE MUSIC</div><h2>One big group chat.<br /><span>Thousands of little worlds.</span></h2><p>Find your people by sound, city, culture, and whatever is trending today. The room is better when you’re in it.</p><a href="#join" className="primary">Get early access </a></div>
        <div className="chat-card"><div className="chat-head"><div className="chat-icon">✳</div><div><b>The After Hours</b><small>Community · preview</small></div><span className="online">● COMMUNITY</span></div>
          <div className="chat-message"><span className="avatar orange">D</span><div><b>dammy.wav <small>preview</small></b><p>Who’s got the playlist for tonight? 👀</p></div></div>
          <div className="chat-message"><span className="avatar white">K</span><div><b>koko.jpg <small>preview</small></b><p>Say less. We outside 🎶</p></div></div>
          <div className="chat-message"><span className="avatar peach">T</span><div><b>tee.b <small>preview</small></b><p>Naija to the world, abeg 🇳🇬</p></div></div>
          <div className="chat-compose"><span>Chat opens when accounts are enabled</span><span className="send">+</span></div><p className="demo-note">Illustrative UI · messaging is not connected yet</p>
        </div>
      </section>

      <section className="join" id="join"><div><div className="eyebrow">COMING TO YOUR CITY</div><h2>The next song starts here.</h2><p>Vibez is being built. Accounts, live streams and community features are coming in stages.</p></div><span className="join-mark">v.</span></section>
      <footer id="about"><a className="brand" href="#"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></a><span>Good sounds. Real people. Better nights.</span><span>© 2026 Vibez</span></footer>
    </main>
  );
}
