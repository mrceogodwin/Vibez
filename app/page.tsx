"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Play, ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, ChevronDown, Crown, MapPin, Menu, Search, Ticket, X, UserRound, Flame, TrendingUp, Music2, PartyPopper, Drama, Clapperboard, Gamepad2, Dumbbell, Palette, BriefcaseBusiness } from "lucide-react";

const events = [
  { slug:"mainland-block-party",name:"The Mainland Block Party",category:"Concerts",city:"Lagos",date:"22 Nov 2026",time:"6:00 PM",host:"LiveSpot Events",price:"₦8,000",image:"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1000&q=85",tag:"Vibez pick",sold:12480 },
  { slug:"palmwine-poetry",name:"Palmwine & Poetry",category:"Arts & Culture",city:"Abuja",date:"29 Nov 2026",time:"5:30 PM",host:"The Culture Plug",price:"₦5,000",image:"https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1000&q=85",tag:"Live experience",sold:8320 },
  { slug:"after-dark-experience",name:"After Dark: The Experience",category:"Nightlife",city:"Port Harcourt",date:"06 Dec 2026",time:"9:00 PM",host:"After Dark Collective",price:"₦12,000",image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1000&q=85",tag:"Popular",sold:6915 },
  { slug:"culture-festival",name:"The Culture Festival",category:"Festivals",city:"Lagos",date:"14 Dec 2026",time:"12:00 PM",host:"The Culture Plug",price:"₦15,000",image:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000&q=85",tag:"Festival",sold:5840 },
  { slug:"lagos-jazz-weekend",name:"Lagos Jazz Weekend",category:"Concerts",city:"Lagos",date:"19 Dec 2026",time:"7:00 PM",host:"LiveSpot Events",price:"₦10,000",image:"https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1000&q=85",tag:"Live music",sold:4210 },
  { slug:"abuja-comedy-night",name:"Abuja Comedy Night",category:"Comedy",city:"Abuja",date:"20 Dec 2026",time:"6:30 PM",host:"AY Live",price:"₦7,500",image:"https://images.unsplash.com/photo-1585699324551-f6c309easee5?w=1000&q=85",tag:"Comedy pick",sold:3680 },
  { slug:"new-years-countdown",name:"The Countdown Party",category:"Nightlife",city:"Lagos",date:"31 Dec 2026",time:"8:00 PM",host:"Flytime Live",price:"₦20,000",image:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&q=85",tag:"New year",sold:3120 },
  { slug:"creative-market",name:"The Creative Market",category:"Arts & Culture",city:"Port Harcourt",date:"10 Jan 2027",time:"10:00 AM",host:"The Culture Plug",price:"₦3,000",image:"https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1000&q=85",tag:"Culture",sold:2240 },
  { slug:"startup-social",name:"The Startup Social",category:"Conferences",city:"Abuja",date:"17 Jan 2027",time:"9:00 AM",host:"VIBEZ Community",price:"₦5,000",image:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&q=85",tag:"Networking",sold:1780 },
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
  const [visibleEvents,setVisibleEvents]=useState(4);
  const [menuOpen,setMenuOpen]=useState(false);
  const [heroSlide,setHeroSlide]=useState(0);
  const [salesTab,setSalesTab]=useState("Best Selling");
  const [spotlightIndex,setSpotlightIndex]=useState(0);
  const [followedHosts,setFollowedHosts]=useState<string[]>([]);
  useEffect(()=>{const timer=window.setInterval(()=>setSpotlightIndex(i=>(i+1)%events.length),4000);return()=>window.clearInterval(timer);},[]);
  const [highlightPlaying,setHighlightPlaying]=useState(false);
  const [email,setEmail]=useState("");
  const [subscribed,setSubscribed]=useState(false);
  const eventRail=useRef<HTMLDivElement>(null);
  const spotlightTouchStart=useRef<number|null>(null);
  const moveEvents=(direction:number)=>eventRail.current?.scrollBy({left:direction*eventRail.current.clientWidth*.78,behavior:"smooth"});
  const filtered=useMemo(()=>events.filter(event=>(category==="All events"||event.category===category)&&(city==="All locations"||event.city===city)&&(!query||[event.name,event.category,event.city].join(" ").toLowerCase().includes(query.toLowerCase()))),[category,city,query]);
  const visibleFiltered=filtered.slice(0,visibleEvents);

  return <main className="light-site">
    <header className="light-header">
      <Link className="account-avatar" href="/signin" aria-label="Sign in to your VYBZ account"><UserRound size={20}/></Link><Link className="light-brand" href="/"><span className="brand-crown"><Crown size={17}/></span><span>VIBEZ</span><small>Events • Tickets • Experiences</small></Link>
      <nav className={menuOpen?"light-nav nav-open":"light-nav"}><a className="nav-current" href="#discover" onClick={()=>setMenuOpen(false)}>Home</a><a href="#events" onClick={()=>setMenuOpen(false)}>Events</a><a href="#discover" onClick={()=>setMenuOpen(false)}>Discover</a><a href="#organisers" onClick={()=>setMenuOpen(false)}>Organisers</a><a href="#vibez-tv" onClick={()=>setMenuOpen(false)}>Vibez TV</a></nav>
      <div className="light-header-actions"><a className="icon-search" href="#event-search" aria-label="Search events"><Search size={19}/></a><Link className="login-link" href="/signin">Log in</Link><Link className="create-event-btn" href="/organiser">＋ Create event</Link><button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label={menuOpen?"Close menu":"Open menu"}>{menuOpen?<X/>:<Menu/>}</button></div>
    </header>

    <section className="live-now-strip" aria-label="Live now events"><span className="live-now-label"><i/> LIVE</span><div className="live-now-track"><div className="live-now-track-inner"><span>Discover events happening right now</span><b>•</b><span>Get your tickets while the moment is live</span><b>•</b><span>Discover events happening right now</span><b>•</b><span>Get your tickets while the moment is live</span></div></div><Link href="/events?status=live">Explore live events <ArrowRight size={15}/></Link></section>

    <section className="host-spotlight"><div className="host-spotlight-heading"><h2>Hosts & <em>event curators.</em></h2><p>Follow the hosts bringing the best experiences to your city.</p></div><div className="host-avatar-viewport"><div className="host-avatar-rail">{[...Array(2)].flatMap(()=>[{name:"DJ Neptune",role:"DJ · Lagos",img:"photo-1524368535928-5b5e00ddc76b"},{name:"Toke Makinwa",role:"Host · Lagos",img:"photo-1534528741775-53994a69daeb"},{name:"AY Live",role:"Comedy · Lagos",img:"photo-1500648767791-00dcc994a43e"},{name:"Seyi Vibes",role:"Artist · Lagos",img:"photo-1506794778202-cad84cf45f1d"},{name:"The Culture Plug",role:"Curator · Abuja",img:"photo-1531123897727-8f129e1688ce"},{name:"LiveSpot",role:"Event host",img:"photo-1524504388940-b1c1722653e1"}]).map((host,index)=><div className="host-avatar-item" key={host.name+"-"+index}><a href="/organisers" className="host-avatar-link"><span className="host-avatar" style={{backgroundImage:"url(https://images.unsplash.com/"+host.img+"?w=240&q=85)"}}/><strong>{host.name}</strong><small>{host.role}</small></a><button className={followedHosts.includes(host.name)?"host-follow-btn is-following":"host-follow-btn"} onClick={()=>setFollowedHosts(current=>current.includes(host.name)?current.filter(name=>name!==host.name):[...current,host.name])}>{followedHosts.includes(host.name)?"Following":"Follow"}</button></div>)}</div></div></section>
    <section className="light-hero" id="discover">
      <div className="hero-left"><span className="light-eyebrow">EVENTS · TICKETS · EXPERIENCES</span><h1>Find your next<br/><em>Vibez.</em></h1><p>Discover concerts, parties, festivals, shows and unique experiences across Nigeria.</p>
        <form className="hero-search" id="event-search" onSubmit={e=>{e.preventDefault();document.getElementById("events")?.scrollIntoView({behavior:"smooth"});}}>
          <Search size={19}/><input aria-label="Search events, artists or locations" placeholder="Search events, artists, or locations..." value={query} onChange={e=>setQuery(e.target.value)}/><button type="submit">Search</button>
        </form>
        <div className="hero-stats"><div><strong>Discover</strong><span>Events across Nigeria</span></div><div><strong>Book securely</strong><span>Digital tickets</span></div><div><strong>Stay in it</strong><span>Experiences & media</span></div></div>
      </div>
      <section className="hero-carousel flagship-event-spotlight" aria-label="Featured event spotlight">
        <div className="event-spotlight-slider">
          <div className="event-spotlight-slide" onTouchStart={e=>{spotlightTouchStart.current=e.touches[0]?.clientX??null}} onTouchEnd={e=>{if(spotlightTouchStart.current===null)return;const delta=e.changedTouches[0].clientX-spotlightTouchStart.current;spotlightTouchStart.current=null;if(Math.abs(delta)>45)setSpotlightIndex(i=>(i+(delta<0?1:events.length-1))%events.length)}} style={{backgroundImage:"linear-gradient(180deg,rgba(12,7,22,.12) 0%,rgba(12,7,22,.12) 35%,rgba(12,7,22,.92) 100%),url("+events[spotlightIndex%events.length].image+")"}}>
            <span className="spotlight-feature-tag" role="img" aria-label="Featured event crown"><Crown size={19}/></span>
            <div className="spotlight-feature-copy">
              <span>VIBEZ SPOTLIGHT · {String((spotlightIndex%events.length)+1).padStart(2,"0")} / {String(events.length).padStart(2,"0")}</span>
              <h3>{events[spotlightIndex%events.length].name}</h3>
              <div className="spotlight-event-facts">
                <span><CalendarDays size={14}/> {events[spotlightIndex%events.length].date}</span>
                <span><span className="spotlight-fact-dot"/> {events[spotlightIndex%events.length].time}</span>
                <span><MapPin size={14}/> {events[spotlightIndex%events.length].city}</span>
              </div>
              <span className="spotlight-host-line">Hosted by <strong>{events[spotlightIndex%events.length].host}</strong></span>
              <span className="spotlight-price-line">Tickets from <strong>{events[spotlightIndex%events.length].price}</strong></span>
              <Link className="spotlight-outline-cta" href={"/events/"+events[spotlightIndex%events.length].slug}>Explore event <ArrowUpRight size={16}/></Link>
            </div>
            <div className="spotlight-feature-controls">
              <button type="button" aria-label="Previous event spotlight" onClick={()=>setSpotlightIndex(i=>(i+events.length-1)%events.length)}><ChevronLeft size={18}/></button>
              <span>{String((spotlightIndex%events.length)+1).padStart(2,"0")} / {String(events.length).padStart(2,"0")}</span>
              <button type="button" aria-label="Next event spotlight" onClick={()=>setSpotlightIndex(i=>(i+1)%events.length)}><ChevronRight size={18}/></button>
            </div>
          </div>
        </div>
      </section>
    </section>

    <section className="category-strip" aria-label="Event categories">{[{name:"Music & concerts",Icon:Music2,tone:"lilac"},{name:"Parties & nightlife",Icon:PartyPopper,tone:"pink"},{name:"Comedy & shows",Icon:Drama,tone:"peach"},{name:"Movies & screenings",Icon:Clapperboard,tone:"blue"},{name:"Gaming & esports",Icon:Gamepad2,tone:"lilac"},{name:"Sports & wellness",Icon:Dumbbell,tone:"green"},{name:"Arts & culture",Icon:Palette,tone:"peach"},{name:"Business",Icon:BriefcaseBusiness,tone:"blue"}].map(item=><a className={"category-tile "+item.tone} href="#events" key={item.name} onClick={()=>setCategory(item.name.toLowerCase().includes("music")?"Concerts":item.name.toLowerCase().includes("parties")?"Nightlife":item.name.toLowerCase().includes("arts")?"Arts & Culture":"All events")}><b><item.Icon size={20} strokeWidth={1.9}/></b><span>{item.name}</span></a>)}</section>

    <section className="ad-slot ad-top" aria-label="Sponsored placement"><div className="ad-label">ADVERTISEMENT</div><div className="ad-top-copy"><span>VIBEZ BRAND PARTNER</span><strong>Your brand belongs in the middle of the moment.</strong><small>Reach people discovering their next experience.</small></div><div className="ad-top-action"><span>SPONSORED</span><a href="/advertise">Advertise with Vibez <ArrowUpRight size={15}/></a></div></section>


    <section className="top-sales-section" aria-label="Top ticket sales"><div className="sales-heading"><div><span className="light-eyebrow">WHAT PEOPLE ARE BOOKING</span><h2><em>Top ticket sales.</em></h2></div><div className="sales-tabs">{[{name:"Best Selling",Icon:Flame},{name:"Trending",Icon:TrendingUp},{name:"Upcoming",Icon:CalendarDays}].map(t=><button key={t.name} className={salesTab===t.name?"active":""} onClick={()=>setSalesTab(t.name)}><t.Icon size={14}/>{t.name}</button>)}</div></div><div className="sales-event-grid">{[...events].sort((a,b)=>salesTab==="Upcoming"?a.date.localeCompare(b.date):b.sold-a.sold).slice(0,3).map((event,i)=><Link className="sales-event-card" href={"/events/"+event.slug} key={event.slug}><div className="sales-event-image" style={{backgroundImage:"url('"+event.image+"')"}}><b>#{i+1}</b></div><div className="sales-event-info"><strong>{event.name}</strong><span><MapPin size={12}/>{event.city}<i/><CalendarDays size={12}/>{event.date}</span><small>{event.sold.toLocaleString()} tickets sold</small></div></Link>)}</div><p className="sales-disclaimer">Ticket-sales rankings will reflect verified VYBZ transactions once live ticketing is enabled.</p></section>
    <section className="ad-banner ad-banner-compact"><div className="ad-banner-text"><span className="sponsored-kicker">SPONSORED · EVENT PARTNER</span><h2>Put your event<br/>in the <em>spotlight.</em></h2><p>Reach people ready to discover their next experience.</p><a href="/advertise">Promote an event <ArrowUpRight size={16}/></a></div><div className="ad-banner-art"><span>YOUR EVENT<br/>HERE</span><small>FEATURED EVENT CAMPAIGN</small></div></section>
    <section className="light-section" id="events"><div className="light-section-heading"><div><span className="light-eyebrow">DON’T HEAR IT LAST</span><h2>Trending <em>events.</em></h2></div><div className="rail-heading-actions"><a href="/events">View all events <ArrowRight size={16}/></a><button aria-label="Scroll events left" onClick={()=>moveEvents(-1)}>‹</button><button aria-label="Scroll events right" onClick={()=>moveEvents(1)}>›</button></div></div>
      <div className="event-controls"><div className="category-filters">{categories.map(item=><button key={item} className={category===item?"filter-active":""} onClick={()=>{setCategory(item);setVisibleEvents(4);}}>{item}</button>)}</div><div className="event-search-tools"><label className="event-inline-search"><Search size={16}/><input aria-label="Search events" placeholder="Search events..." value={query} onChange={e=>{setQuery(e.target.value);setVisibleEvents(4);}}/></label><label className="city-select"><MapPin size={15}/><select value={city} onChange={e=>{setCity(e.target.value);setVisibleEvents(4);}}><option>All locations</option><option>Lagos</option><option>Abuja</option><option>Port Harcourt</option></select><ChevronDown size={14}/></label></div></div>
      {filtered.length ? <><div className="event-rail-viewport" ref={eventRail}><div className="light-event-grid">{visibleFiltered.map(event=><article className="light-event-card" key={event.slug}><Link className="light-event-image" href={"/events/"+event.slug} style={{backgroundImage:"linear-gradient(180deg,transparent 48%,rgba(0,0,0,.5)),url('"+event.image+"')"}}><span className="event-tag">{event.tag}</span><span className="event-heart">♡</span></Link><div className="light-event-body"><div className="light-event-meta"><span>{event.category.toUpperCase()}</span><span>{event.city}</span></div><h3>{event.name}</h3><div className="light-event-detail"><span><CalendarDays size={14}/>{event.date}</span><span><MapPin size={14}/>{event.city}</span></div><div className="light-event-bottom"><strong>From {event.price}</strong><Link href={"/events/"+event.slug}>Get tickets <ArrowRight size={14}/></Link></div></div></article>)}</div></div>{visibleEvents<filtered.length&&<div className="load-more-wrap"><button className="load-more-events" onClick={()=>setVisibleEvents(n=>Math.min(n+5,filtered.length))}>Load more events <ArrowRight size={15}/></button></div>}</> : <div className="empty-events">No matching events in this selection. Try another category or location.</div>}
    </section>

    <section className="ticket-types-home">
      <div className="light-section-heading"><div><span className="light-eyebrow">FIND YOUR WAY IN</span><h2>Tickets for every <em>kind of plan.</em></h2></div><a href="/events">Browse events <ArrowRight size={16}/></a></div>
      <div className="ticket-type-grid">
        {[{name:"Early bird",desc:"Get in early. Pay less.",tag:"LIMITED DROPS",symbol:"",tone:"mint"},{name:"General admission",desc:"The classic event pass.",tag:"MOST POPULAR",symbol:"✦",tone:"lilac"},{name:"VIP experience",desc:"A little closer to the action.",tag:"PREMIUM ACCESS",symbol:"♛",tone:"peach"},{name:"Group passes",desc:"Bring your people along.",tag:"CREW DEALS",symbol:"＋",tone:"blue"},{name:"Tables & lounges",desc:"Your own space for the night.",tag:"RESERVED",symbol:"▦",tone:"rose"},{name:"Free experiences",desc:"Discover something new.",tag:"₦0 ENTRY",symbol:"♡",tone:"green"}].map(t=><a className={"ticket-type-card "+t.tone} href="/events" key={t.name}><span className="ticket-type-tag">{t.tag}</span>{t.symbol && <b>{t.symbol}</b>}<strong>{t.name}</strong><small>{t.desc}</small><span className="ticket-type-link">Explore tickets <ArrowUpRight size={14}/></span></a>)}
      </div>
    </section>

    <section className="organiser-light" id="organisers"><div className="light-section-heading"><div><span className="light-eyebrow">THE PEOPLE BEHIND THE MOMENTS</span><h2>Featured <em>organisers.</em></h2></div><a href="/organisers">View all organisers <ArrowRight size={16}/></a></div><div className="organiser-grid">{organisers.map(org=><article className="organiser-card" key={org.name}><div className={"organiser-avatar "+org.tone}>{org.mark}</div><div className="organiser-info"><strong>{org.name} <CheckCircle2 size={14}/></strong><span>Verified organiser</span><small>{org.count}</small></div><button onClick={e=>{const b=e.currentTarget;b.textContent=b.textContent==="Following"?"Follow":"Following";}}>Follow</button></article>)}</div></section>

        <section className="ad-slot ad-mid-slot"><div className="ad-top-copy"><span>VIBEZ SELECT · SPONSORED</span><strong>Give your next campaign a place in culture.</strong><small>Premium placements across discovery, events and experiences.</small></div><div className="ad-top-action"><span>BRAND SPOTLIGHT</span><a href="/advertise">Explore placements <ArrowUpRight size={15}/></a></div></section>

    <section className="ad-banner ad-banner-final"><div className="ad-banner-text"><span className="sponsored-kicker">SPONSORED · CULTURE PARTNER</span><h2>Be where the<br/><em>moments happen.</em></h2><p>Connect your brand to live culture, community and unforgettable experiences.</p><a href="/advertise">Become a partner <ArrowUpRight size={16}/></a></div><div className="ad-banner-art"><span>PARTNER<br/>WITH VYBZ</span><small>CULTURE & COMMUNITY</small></div></section>

    <section className="vibez-tv-light" id="vibez-tv"><div className="tv-light-image"><span>VIBEZ TV</span></div><div className="tv-light-copy"><span className="light-eyebrow">THE SHOW GOES ON</span><h2>Relive the moments.<br/><em>Discover what’s next.</em></h2><p>Concert highlights, interviews, performances and stories from the experiences shaping culture.</p><a href="/tv">Explore Vibez TV <ArrowRight size={16}/></a></div></section>

    <section className="newsletter-band"><div><span className="light-eyebrow">GOOD THINGS, STRAIGHT TO YOUR INBOX</span><h2>Stay in the <em>Vibez.</em></h2><p>Get event drops, exclusive ticket offers and experiences worth showing up for.</p></div><form onSubmit={e=>{e.preventDefault();if(email.includes("@"))setSubscribed(true);}}><label htmlFor="newsletter-email">Your email address</label><div><input id="newsletter-email" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/><button>{subscribed?"You're on the list":"Subscribe"}</button></div><small>{subscribed?"Thanks for your interest. Newsletter signup will be enabled at launch.":"No spam. Just the good stuff."}</small></form></section>

    <section className="recent-bookings-section" aria-label="Recent event bookings">
      <div className="recent-bookings-heading"><div><span className="light-eyebrow">THE MOMENT, IN NUMBERS</span><h2>Recently <em>booked.</em></h2></div><span className="activity-preview-label">Platform preview</span></div>
      <div className="recent-bookings-rail">
        {[...events].sort((a,b)=>b.sold-a.sold).slice(0,5).map(event=><article className="recent-booking-card" key={event.slug}>
          <div className="recent-booking-image" style={{backgroundImage:"url('"+event.image+"')"}} />
          <div className="recent-booking-copy"><strong>{event.name}</strong><span><MapPin size={12}/>{event.city}</span><div className="booking-count"><CheckCircle2 size={15}/><b>{event.sold.toLocaleString()}</b><small>tickets booked</small></div></div>
        </article>)}
      </div>
      <p className="booking-preview-note">Illustrative figures for the design preview. Verified booking totals will come from completed VYBZ orders.</p>
    </section>

    <footer className="light-footer"><div className="footer-brand-col"><Link className="light-brand" href="/"><span className="brand-crown"><Crown size={17}/></span><span>VIBEZ</span><small>EVENTS · TICKETS · EXPERIENCES</small></Link><p>Nigeria’s home for discovering events, buying tickets and staying connected to the experiences you love.</p><div className="social-links"><a href="#instagram">ig</a><a href="#tiktok">tk</a><a href="#youtube" aria-label="YouTube">yt</a><a href="#x">𝕏</a></div></div><div className="footer-col"><strong>Explore</strong><a href="#events">Events</a><a href="#discover">Discover</a><a href="/organisers">Organisers</a><a href="/tv">Vibez TV</a></div><div className="footer-col"><strong>For organisers</strong><a href="/organiser">Create an event</a><a href="/pricing">Pricing</a><a href="/organiser-guide">Organiser guide</a><a href="/support">Support</a></div><div className="footer-col"><strong>Company</strong><a href="/about">About Vibez</a><a href="/contact">Contact</a><a href="/privacy">Privacy policy</a><a href="/terms">Terms of service</a></div><div className="footer-bottom"><span>© 2026 Vibez. All rights reserved.</span><span>Made for the moments that matter. <b>NG</b></span><strong className="powered-by">Powered by Cookit Technologies Ltd.</strong></div></footer>
  </main>;
}
