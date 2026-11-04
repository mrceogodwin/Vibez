"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, Crown, MapPin, Menu, Search, Ticket, X, Music2, PartyPopper, Drama, Clapperboard, Gamepad2, Dumbbell, Palette, BriefcaseBusiness } from "lucide-react";

const events = [
  { slug:"mainland-block-party",name:"The Mainland Block Party",category:"Concerts",city:"Lagos",date:"22 Nov 2026",price:"₦8,000",image:"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1000&q=85",tag:"Vibez pick" },
  { slug:"palmwine-poetry",name:"Palmwine & Poetry",category:"Arts & Culture",city:"Abuja",date:"29 Nov 2026",price:"₦5,000",image:"https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1000&q=85",tag:"Live experience" },
  { slug:"after-dark-experience",name:"After Dark: The Experience",category:"Nightlife",city:"Port Harcourt",date:"06 Dec 2026",price:"₦12,000",image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1000&q=85",tag:"Popular" },
  { slug:"culture-festival",name:"The Culture Festival",category:"Festivals",city:"Lagos",date:"14 Dec 2026",price:"₦15,000",image:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000&q=85",tag:"Festival" },
];

const categories = ["All events","Concerts","Nightlife","Festivals","Comedy","Arts & Culture","Conferences"];
const organisers = [
  {name:"LiveSpot Events",count:"120+ events",mark:"L",tone:"violet"},
  {name:"Mavin Events",count:"85+ events",mark:"M",tone:"gold"},
  {name:"Flytime Live",count:"60+ events",mark:"F",tone:"red"},
  {name:"Chocolate City",count:"45+ events",mark:"C",tone:"dark"},
];

export default function Home() {
  const [query,setQuery]=useState("");
  const [city,setCity]=useState("All locations");
  const [category,setCategory]=useState("All events");
  const [menuOpen,setMenuOpen]=useState(false);
  const [email,setEmail]=useState("");
  const [subscribed,setSubscribed]=useState(false);
  const eventRail=useRef<HTMLDivElement>(null);
  const moveEvents=(direction:number)=>eventRail.current?.scrollBy({left:direction*eventRail.current.clientWidth*.78,behavior:"smooth"});
  const filtered=useMemo(()=>events.filter(event=>(category==="All events"||event.category===category)&&(city==="All locations"||event.city===city)&&(!query||[event.name,event.category,event.city].join(" ").toLowerCase().includes(query.toLowerCase()))),[category,city,query]);

  return <main className="light-site">
    <header className="light-header">
      <Link className="light-brand" href="/"><span className="brand-crown"><Crown size={17}/></span><span>VIBEZ</span><small>EVENTS · TICKETS · EXPERIENCES</small></Link>
      <nav className={menuOpen?"light-nav nav-open":"light-nav"}><a className="nav-current" href="#discover" onClick={()=>setMenuOpen(false)}>Home</a><a href="#events" onClick={()=>setMenuOpen(false)}>Events</a><a href="#discover" onClick={()=>setMenuOpen(false)}>Discover</a><a href="#organisers" onClick={()=>setMenuOpen(false)}>Organisers</a><a href="#vibez-tv" onClick={()=>setMenuOpen(false)}>Vibez TV</a></nav>
      <div className="light-header-actions"><a className="icon-search" href="#event-search" aria-label="Search events"><Search size={19}/></a><Link className="login-link" href="/signin">Log in</Link><Link className="create-event-btn" href="/organiser">＋ Create event</Link><button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label={menuOpen?"Close menu":"Open menu"}>{menuOpen?<X/>:<Menu/>}</button></div>
    </header>

    <section className="light-hero" id="discover">
      <div className="hero-left"><span className="light-eyebrow">EVENTS · TICKETS · EXPERIENCES</span><h1>Find your next<br/><em>Vibez.</em></h1><p>Discover concerts, parties, festivals, shows and unique experiences across Nigeria.</p>
        <form className="hero-search" id="event-search" onSubmit={e=>{e.preventDefault();document.getElementById("events")?.scrollIntoView({behavior:"smooth"});}}>
          <Search size={19}/><input aria-label="Search events, artists or locations" placeholder="Search events, artists, or locations..." value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit">Search</button>
        </form>
        <div className="hero-stats"><div><strong>Discover</strong><span>Events across Nigeria</span></div><div><strong>Book securely</strong><span>Digital tickets</span></div><div><strong>Stay in it</strong><span>Experiences & media</span></div></div>
      </div>
      <Link className="hero-feature" href="/events/mainland-block-party"><div className="feature-image"/><div className="feature-overlay"/><span className="feature-pill">✦ FEATURED EXPERIENCE</span><div className="feature-copy"><span>VIBEZ SPOTLIGHT</span><h2>Make memories<br/>that move you.</h2><p>Explore standout experiences and find your next night out.</p><span className="feature-cta">Explore events <ArrowRight size={16}/></span></div><span className="feature-dots">● ○ ○</span></Link>
    </section>

    <section className="category-strip" aria-label="Event categories">{[{name:"Music & concerts",Icon:Music2,tone:"lilac"},{name:"Parties & nightlife",Icon:PartyPopper,tone:"pink"},{name:"Comedy & shows",Icon:Drama,tone:"peach"},{name:"Movies & screenings",Icon:Clapperboard,tone:"blue"},{name:"Gaming & esports",Icon:Gamepad2,tone:"lilac"},{name:"Sports & wellness",Icon:Dumbbell,tone:"green"},{name:"Arts & culture",Icon:Palette,tone:"peach"},{name:"Business",Icon:BriefcaseBusiness,tone:"blue"}].map(item=><a className={"category-tile "+item.tone} href="#events" key={item.name} onClick={()=>setCategory(item.name.toLowerCase().includes("music")?"Concerts":item.name.toLowerCase().includes("parties")?"Nightlife":item.name.toLowerCase().includes("arts")?"Arts & Culture":"All events")}><b><item.Icon size={20} strokeWidth={1.9}/></b><span>{item.name}</span></a>)}</section>

    <section className="ad-slot ad-top" aria-label="Sponsored placement"><div className="ad-label">ADVERTISEMENT</div><div className="ad-top-copy"><span>VIBEZ BRAND PARTNER</span><strong>Your brand belongs in the middle of the moment.</strong><small>Reach people discovering their next experience.</small></div><div className="ad-top-action"><span>SPONSORED</span><a href="/advertise">Advertise with Vibez <ArrowUpRight size={15}/></a></div></section>

    <section className="light-section" id="events"><div className="light-section-heading"><div><span className="light-eyebrow">DON’T HEAR IT LAST</span><h2>Trending <em>events.</em></h2></div><div className="rail-heading-actions"><a href="/events">View all events <ArrowRight size={16}/></a><button aria-label="Scroll events left" onClick={()=>moveEvents(-1)}>‹</button><button aria-label="Scroll events right" onClick={()=>moveEvents(1)}>›</button></div></div>
      <div className="event-controls"><div className="category-filters">{categories.map(item=><button key={item} className={category===item?"filter-active":""} onClick={()=>setCategory(item)}>{item}</button>)}</div><label className="city-select"><MapPin size={15}/><select value={city} onChange={e=>setCity(e.target.value)}><option>All locations</option><option>Lagos</option><option>Abuja</option><option>Port Harcourt</option></select><ChevronDown size={14}/></label></div>
      {filtered.length?<div className="event-rail-viewport" ref={eventRail}><div className="light-event-grid">{filtered.map(event=><article className="light-event-card" key={event.slug}><Link className="light-event-image" href={"/events/"+event.slug} style={{backgroundImage:"linear-gradient(180deg,transparent 48%,rgba(0,0,0,.5)),url('"+event.image+"')"}}><span className="event-tag">{event.tag}</span><span className="event-heart">♡</span></Link><div className="light-event-body"><div className="light-event-meta"><span>{event.category.toUpperCase()}</span><span>{event.city}</span></div><h3>{event.name}</h3><div className="light-event-detail"><span><CalendarDays size={14}/>{event.date}</span><span><MapPin size={14}/>{event.city}</span></div><div className="light-event-bottom"><strong>From {event.price}</strong><Link href={"/events/"+event.slug}>Get tickets <ArrowRight size={14}/></Link></div></div></article>)}</div></div>:<div className="empty-events">No matching events in this selection. Try another category or location.</div>}
    </section>

    <section className="ad-banner" aria-label="Sponsored brand banner"><div className="ad-banner-text"><span className="sponsored-kicker">SPONSORED · BRAND PARTNER</span><h2>Make your brand<br/>part of the <em>Vibez.</em></h2><p>Connect with audiences who show up for culture, music and experiences.</p><a href="/advertise">Explore advertising <ArrowUpRight size={16}/></a></div><div className="ad-banner-art"><span>YOUR BRAND<br/>HERE</span><small>CAMPAIGN PLACEMENT</small></div></section>

    <section className="host-spotlight"><div className="host-spotlight-heading"><span className="light-eyebrow">MEET THE PEOPLE MAKING IT HAPPEN</span><h2>Hosts & <em>event curators.</em></h2><p>Follow the hosts bringing the best experiences to your city.</p></div><div className="host-avatar-rail">{[{name:"DJ Neptune",role:"DJ · Lagos",img:"photo-1524368535928-5b5e00ddc76b"},{name:"Toke Makinwa",role:"Host · Lagos",img:"photo-1534528741775-53994a69daeb"},{name:"AY Live",role:"Comedy · Lagos",img:"photo-1500648767791-00dcc994a43e"},{name:"Seyi Vibes",role:"Artist · Lagos",img:"photo-1506794778202-cad84cf45f1d"},{name:"The Culture Plug",role:"Curator · Abuja",img:"photo-1531123897727-8f129e1688ce"},{name:"LiveSpot",role:"Event host",img:"photo-1524504388940-b1c1722653e1"}].map(host=><a href="/organisers" className="host-avatar-item" key={host.name}><span className="host-avatar" style={{backgroundImage:"url(https://images.unsplash.com/"+host.img+"?w=240&q=85)"}}/><strong>{host.name}</strong><small>{host.role}</small></a>)}</div></section>

    <section className="ad-banner ad-banner-compact"><div className="ad-banner-text"><span className="sponsored-kicker">SPONSORED · EVENT PARTNER</span><h2>Put your event<br/>in the <em>spotlight.</em></h2><p>Reach people ready to discover their next experience.</p><a href="/advertise">Promote an event <ArrowUpRight size={16}/></a></div><div className="ad-banner-art"><span>YOUR EVENT<br/>HERE</span><small>FEATURED EVENT CAMPAIGN</small></div></section>

    <section className="organiser-light" id="organisers"><div className="light-section-heading"><div><span className="light-eyebrow">THE PEOPLE BEHIND THE MOMENTS</span><h2>Featured <em>organisers.</em></h2></div><a href="/organisers">View all organisers <ArrowRight size={16}/></a></div><div className="organiser-grid">{organisers.map(org=><article className="organiser-card" key={org.name}><div className={"organiser-avatar "+org.tone}>{org.mark}</div><div className="organiser-info"><strong>{org.name} <CheckCircle2 size={14}/></strong><span>Verified organiser</span><small>{org.count}</small></div><button onClick={e=>{const b=e.currentTarget;b.textContent=b.textContent==="Following"?"Follow":"Following";}}>Follow</button></article>)}</div></section>

    <section className="ad-slot ad-mid-slot"><div className="ad-top-copy"><span>VIBEZ SELECT · SPONSORED</span><strong>Give your next campaign a place in culture.</strong><small>Premium placements across discovery, events and experiences.</small></div><div className="ad-top-action"><span>BRAND SPOTLIGHT</span><a href="/advertise">Explore placements <ArrowUpRight size={15}/></a></div></section>

    <section className="newsletter-band"><div><span className="light-eyebrow">GOOD THINGS, STRAIGHT TO YOUR INBOX</span><h2>Stay in the <em>Vibez.</em></h2><p>Get event drops, exclusive ticket offers and experiences worth showing up for.</p></div><form onSubmit={e=>{e.preventDefault();if(email.includes("@"))setSubscribed(true);}}><label htmlFor="newsletter-email">Your email address</label><div><input id="newsletter-email" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/><button>{subscribed?"You're on the list":"Subscribe"}</button></div><small>{subscribed?"Thanks for your interest. Newsletter signup will be enabled at launch.":"No spam. Just the good stuff."}</small></form></section>

    <section className="ad-banner ad-banner-final"><div className="ad-banner-text"><span className="sponsored-kicker">SPONSORED · CULTURE PARTNER</span><h2>Be where the<br/><em>moments happen.</em></h2><p>Connect your brand to live culture, community and unforgettable experiences.</p><a href="/advertise">Become a partner <ArrowUpRight size={16}/></a></div><div className="ad-banner-art"><span>PARTNER<br/>WITH VYBZ</span><small>CULTURE & COMMUNITY</small></div></section>

    <section className="vibez-tv-light" id="vibez-tv"><div className="tv-light-image"><span>VIBEZ TV</span></div><div className="tv-light-copy"><span className="light-eyebrow">THE SHOW GOES ON</span><h2>Relive the moments.<br/><em>Discover what’s next.</em></h2><p>Concert highlights, interviews, performances and stories from the experiences shaping culture.</p><a href="/tv">Explore Vibez TV <ArrowRight size={16}/></a></div></section>

    <footer className="light-footer"><div className="footer-brand-col"><Link className="light-brand" href="/"><span className="brand-crown"><Crown size={17}/></span><span>VIBEZ</span><small>EVENTS · TICKETS · EXPERIENCES</small></Link><p>Nigeria’s home for discovering events, buying tickets and staying connected to the experiences you love.</p><div className="social-links"><a href="#instagram">ig</a><a href="#tiktok">tk</a><a href="#youtube">▶</a><a href="#x">𝕏</a></div></div><div className="footer-col"><strong>Explore</strong><a href="#events">Events</a><a href="#discover">Discover</a><a href="/organisers">Organisers</a><a href="/tv">Vibez TV</a></div><div className="footer-col"><strong>For organisers</strong><a href="/organiser">Create an event</a><a href="/pricing">Pricing</a><a href="/organiser-guide">Organiser guide</a><a href="/support">Support</a></div><div className="footer-col"><strong>Company</strong><a href="/about">About Vibez</a><a href="/contact">Contact</a><a href="/privacy">Privacy policy</a><a href="/terms">Terms of service</a></div><div className="footer-bottom"><span>© 2026 Vibez. All rights reserved.</span><span>Made for the moments that matter. <b>NG</b></span></div></footer>
  </main>;
}
