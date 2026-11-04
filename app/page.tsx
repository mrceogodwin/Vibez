import { ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, MapPin, Play, Search, Ticket, Zap } from "lucide-react";

const events = [
  { name: "The Mainland Block Party", category: "MUSIC · NIGHTLIFE", city: "Lagos", date: "NOV 22", price: "₦8,000", image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1000&q=85", featured: true },
  { name: "Palmwine & Poetry", category: "CULTURE · LIVE", city: "Abuja", date: "NOV 29", price: "₦5,000", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1000&q=85" },
  { name: "After Dark: The Experience", category: "NIGHTLIFE", city: "Port Harcourt", date: "DEC 06", price: "₦12,000", image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1000&q=85" },
  { name: "The Culture Festival", category: "FESTIVAL · CULTURE", city: "Lagos", date: "DEC 14", price: "₦15,000", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000&q=85" },
];

const categories = ["Concerts", "Nightlife", "Festivals", "Comedy", "Arts & Culture", "Conferences"];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#"><span className="brand-mark">V</span>VYBZ<span className="brand-dot">.</span></a>
        <nav className="desktop-nav"><a className="active" href="#discover">Discover</a><a href="#events">Events</a><a href="#experiences">Experiences</a><a href="#vybz-tv">VYBZ TV</a></nav>
        <div className="header-actions"><a className="organiser-link" href="#organisers">For organisers <ArrowUpRight size={14}/></a><a className="sign-in" href="#signin">Sign in</a><button className="menu-button" aria-label="Open menu">☰</button></div>
      </header>

      <section className="hero" id="discover">
        <div className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="eyebrow"><span className="live-dot"/> THE CITY IS YOURS</div>
          <h1>MAKE ROOM<br/>FOR <em>GOOD</em> TIMES.</h1>
          <p className="hero-copy">The events you want to be at.<br/>The moments you don’t want to miss.</p>
          <div className="hero-ctas"><a className="button button-light" href="#events">Explore events <ArrowUpRight size={17}/></a><a className="text-link" href="#organisers">I'm an organiser <ArrowRight size={16}/></a></div>
        </div>
        <div className="hero-bottom"><span>01 — 04&nbsp;&nbsp; CURATED EXPERIENCES</span><span>SCROLL TO EXPLORE&nbsp; ↓</span></div>
      </section>

      <section className="search-section">
        <div className="search-intro"><span className="eyebrow muted">FIND YOUR NEXT VYBZ</span><h2>What’s happening<br/><span>around you?</span></h2></div>
        <div className="search-panel">
          <label><span>SEARCH</span><div><Search size={17}/><input placeholder="Artists, events, venues..." /></div></label>
          <label><span>LOCATION</span><div><MapPin size={17}/><select defaultValue=""><option value="" disabled>All locations</option><option>Lagos</option><option>Abuja</option><option>Port Harcourt</option><option>Benin City</option></select><ChevronDown size={15}/></div></label>
          <label><span>WHEN</span><div><CalendarDays size={17}/><select defaultValue=""><option value="" disabled>Any date</option><option>This weekend</option><option>This month</option></select><ChevronDown size={15}/></div></label>
          <button className="search-button"><Search size={17}/> Find events</button>
        </div>
      </section>

      <section className="events-section section-wrap" id="events">
        <div className="section-heading"><div><span className="eyebrow muted">DON’T HEAR IT LAST</span><h2>Trending <span>right now.</span></h2></div><a className="view-all" href="#all-events">Explore all events <ArrowUpRight size={16}/></a></div>
        <div className="category-row">{categories.map((category, i)=><a className={i===0?"category active-category":"category"} href="#events" key={category}>{category}<ArrowUpRight size={12}/></a>)}</div>
        <div className="event-grid">{events.map((event,i)=><article className={i===0?"event-card featured-card":"event-card"} key={event.name}>
          <a className="event-image" href="#event-details" style={{backgroundImage:"linear-gradient(180deg,transparent 48%,rgba(0,0,0,.72)),url('"+event.image+"')"}}>
            <span className="event-date">{event.date}</span>{event.featured&&<span className="featured-label"><Zap size={11}/> VYBZ PICK</span>}<span className="event-open"><ArrowUpRight size={18}/></span>
          </a>
          <div className="event-meta">{event.category}<span>{event.city}</span></div><h3>{event.name}</h3><div className="event-foot"><strong>From {event.price}</strong><a href="#event-details">Get tickets <ArrowRight size={14}/></a></div>
        </article>)}</div>
      </section>

      <section className="experience-band" id="experiences"><div className="experience-copy"><span className="eyebrow">MORE THAN A TICKET</span><h2>BE THERE.<br/><em>FEEL THAT.</em><br/>KEEP IT FOREVER.</h2><p>From the first beat to the encore. Discover experiences worth showing up for — and relive the ones you missed.</p><a className="button button-outline" href="#vybz-tv">Explore experiences <ArrowUpRight size={16}/></a></div><div className="experience-visual"><div className="experience-photo"/><div className="photo-caption"><span>THE NIGHT IS STILL YOUNG</span><span>VYBZ ORIGINALS / 001</span></div></div></section>

      <section className="organiser-section section-wrap" id="organisers"><div><span className="eyebrow muted">BUILT FOR THE PEOPLE WHO MAKE IT HAPPEN</span><h2>Your event.<br/><span>Our platform.</span></h2><p>Publish your event, sell tickets, manage your guests and track every sale — all from one place.</p><a className="button button-light" href="#organiser-start">Start organising <ArrowUpRight size={16}/></a></div><div className="organiser-stats"><div><strong>01</strong><span>LIST YOUR EVENT</span></div><div><strong>02</strong><span>SELL TICKETS</span></div><div><strong>03</strong><span>OWN THE MOMENT</span></div></div></section>

      <section className="tv-section section-wrap" id="vybz-tv"><div className="section-heading"><div><span className="eyebrow muted">THE SHOW GOES ON</span><h2>Press play on <span>VYBZ TV.</span></h2></div><a className="view-all" href="#watch">Explore VYBZ TV <ArrowUpRight size={16}/></a></div><div className="tv-feature"><div className="tv-image"><button aria-label="Play featured video"><Play fill="currentColor" size={22}/></button></div><div className="tv-copy"><span className="eyebrow">AFTERMOVIES · LIVE SESSIONS · STORIES</span><h3>The moments<br/>don’t end here.</h3><p>Watch the highlights, discover new sounds and get closer to the experiences that move culture.</p><a className="text-link" href="#watch">Discover the stories <ArrowRight size={16}/></a></div></div></section>

      <footer className="footer"><a className="brand" href="#"><span className="brand-mark">V</span>VYBZ<span className="brand-dot">.</span></a><span>EVENTS · TICKETS · EXPERIENCES</span><div><a href="#events">Discover</a><a href="#organisers">Organisers</a><a href="#vybz-tv">VYBZ TV</a><a href="#help">Help</a></div><small>© 2026 VYBZ. FIND YOUR PEOPLE. FIND YOUR VYBZ.</small></footer>
    </main>
  );
}
