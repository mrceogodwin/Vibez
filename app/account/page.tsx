"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, ChevronRight, Clock3, Heart, MapPin, Menu, Search, Settings, Ticket, UserRound, WalletCards, X, QrCode, LogOut } from "lucide-react";

const tickets = [
  { id:"VZ-2048-7319", title:"The Mainland Block Party", type:"VIP Access", date:"22 Nov 2026", time:"7:00 PM", city:"Lagos", venue:"Landmark Event Centre", image:"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=900&q=85", status:"Confirmed", code:"VZ-2048-7319" },
  { id:"VZ-1192-4608", title:"Palmwine & Poetry", type:"Regular Entry", date:"29 Nov 2026", time:"6:30 PM", city:"Abuja", venue:"Central Park, Abuja", image:"https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=85", status:"Confirmed", code:"VZ-1192-4608" },
];

const saved = [
  { title:"After Dark: The Experience", category:"NIGHTLIFE", date:"06 Dec 2026", city:"Port Harcourt", price:"From ₦12,000", image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=700&q=85" },
  { title:"The Culture Festival", category:"FESTIVALS", date:"14 Dec 2026", city:"Lagos", price:"From ₦15,000", image:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=700&q=85" },
];

export default function AttendeeDashboard() {
  const [section,setSection]=useState("Overview");
  const [activeTicket,setActiveTicket]=useState<string|null>(null);
  const [mobileNav,setMobileNav]=useState(false);
  const [notice,setNotice]=useState("");
  const nav=[["Overview",UserRound],["My tickets",Ticket],["Favourites",Heart],["Event history",Clock3],["Payments",WalletCards],["Profile & settings",Settings]] as const;
  const current=tickets.find(ticket=>ticket.id===activeTicket);

  return <main className="attendee-shell">
    <header className="attendee-topbar">
      <Link href="/" className="attendee-back"><ArrowLeft size={17}/> <span>Back to VIBEZ</span></Link>
      <Link href="/" className="attendee-wordmark"><span>♛</span> VIBEZ <small>YOUR EXPERIENCE, YOUR WAY</small></Link>
      <div className="attendee-top-actions"><button aria-label="Notifications" onClick={()=>setNotice("You're all caught up.")}><Bell size={19}/><i/></button><button className="attendee-user-chip" onClick={()=>setSection("Profile & settings")}><span className="attendee-avatar"><UserRound size={18}/></span><span>My account</span></button><button className="attendee-mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-label="Toggle navigation">{mobileNav?<X/>:<Menu/>}</button></div>
    </header>
    <div className="attendee-layout">
      <aside className={mobileNav?"attendee-sidebar is-open":"attendee-sidebar"}>
        <div className="attendee-profile-card"><div className="attendee-avatar attendee-avatar-large"><UserRound size={25}/></div><div><strong>Welcome back</strong><span>VIBEZ attendee</span></div><span className="attendee-verified" title="Attendee account">✓</span></div>
        <span className="attendee-nav-label">YOUR SPACE</span>
        <nav>{nav.map(([label,Icon])=><button key={label} className={section===label?"active":""} onClick={()=>{setSection(label);setMobileNav(false);setActiveTicket(null)}}><Icon size={18}/><span>{label}</span>{label==="My tickets"&&<b>2</b>}</button>)}</nav>
        <div className="attendee-sidebar-bottom"><div className="attendee-help"><strong>Need a hand?</strong><span>We're here to help with your bookings.</span><Link href="/support">Visit support <ChevronRight size={14}/></Link></div><button className="attendee-signout" onClick={()=>setNotice("Sign out will be available when authentication is connected.")}><LogOut size={16}/> Sign out</button></div>
      </aside>
      <section className="attendee-main">
        <div className="attendee-mobile-heading"><span>YOUR VIBEZ ACCOUNT</span><button onClick={()=>setMobileNav(!mobileNav)}><Menu size={19}/></button></div>
        {notice&&<div className="attendee-notice">{notice}<button onClick={()=>setNotice("")}>Dismiss</button></div>}
        {activeTicket&&current ? <div className="attendee-ticket-detail"><button className="attendee-back-link" onClick={()=>setActiveTicket(null)}><ArrowLeft size={16}/> Back to my tickets</button><div className="attendee-ticket-detail-card"><div className="attendee-ticket-detail-image" style={{backgroundImage:"url("+current.image+")"}}/><div className="attendee-ticket-detail-content"><span className="attendee-kicker">YOUR DIGITAL TICKET</span><h1>{current.title}</h1><p>{current.type} · {current.status}</p><div className="attendee-ticket-facts"><span><CalendarDays size={16}/>{current.date} · {current.time}</span><span><MapPin size={16}/>{current.venue}, {current.city}</span></div><div className="attendee-qr-panel"><div className="attendee-qr-placeholder"><QrCode size={86}/></div><div><strong>Admission QR code</strong><span>Present this code at the entrance.</span><b>{current.code}</b><small>Demo preview — live QR validation will be connected to ticketing.</small></div></div></div></div></div>
        : section==="Overview" ? <>
          <div className="attendee-welcome"><div><span className="attendee-kicker">YOUR VIBEZ ACCOUNT</span><h1>Your next great<br/><em>moment starts here.</em></h1><p>Keep your tickets close, find your next experience and stay connected.</p></div><div className="attendee-welcome-mark">V<span>.</span></div></div>
          <div className="attendee-stat-grid"><article><span>UPCOMING EVENTS</span><strong>02</strong><small>You're booked and ready</small></article><article><span>TICKETS IN WALLET</span><strong>02</strong><small>Digital tickets available</small></article><article><span>SAVED EXPERIENCES</span><strong>04</strong><small>Worth another look</small></article></div>
          <div className="attendee-section-head"><div><span className="attendee-kicker">DON'T MISS YOUR MOMENT</span><h2>Your upcoming events</h2></div><button onClick={()=>setSection("My tickets")}>All tickets <ArrowRightIcon/></button></div>
          <div className="attendee-upcoming-grid">{tickets.map(ticket=><article className="attendee-upcoming-card" key={ticket.id}><div className="attendee-upcoming-image" style={{backgroundImage:"url("+ticket.image+")"}}><span><i/> CONFIRMED</span></div><div className="attendee-upcoming-body"><div className="attendee-date-line"><CalendarDays size={15}/>{ticket.date} <span>·</span> {ticket.time}</div><h3>{ticket.title}</h3><p><MapPin size={14}/>{ticket.venue}, {ticket.city}</p><div className="attendee-upcoming-footer"><span>{ticket.type}</span><button onClick={()=>setActiveTicket(ticket.id)}>View ticket <ChevronRight size={15}/></button></div></div></article>)}</div>
          <div className="attendee-section-head attendee-saved-head"><div><span className="attendee-kicker">SAVED FOR LATER</span><h2>Experiences you love</h2></div><button onClick={()=>setSection("Favourites")}>View favourites <ArrowRightIcon/></button></div>
          <div className="attendee-saved-grid">{saved.map(item=><article key={item.title} className="attendee-saved-card"><div style={{backgroundImage:"url("+item.image+")"}}/><section><span>{item.category}</span><h3>{item.title}</h3><p>{item.date} · {item.city}</p><b>{item.price}</b></section><button aria-label={"Save "+item.title} onClick={()=>setNotice(item.title+" is already in your saved experiences.")}><Heart size={17}/></button></article>)}</div>
        </> : <><div className="attendee-page-heading"><span className="attendee-kicker">YOUR VIBEZ ACCOUNT</span><h1>{section}</h1><p>{section==="My tickets"?"Every ticket you have booked, all in one place.":section==="Favourites"?"The events and experiences you've saved for later.":section==="Event history"?"Look back on the moments you've been part of.":section==="Payments"?"Your booking payments and transaction records.":"Manage your personal details and account preferences."}</p></div>
          {section==="My tickets"&&<div className="attendee-ticket-list">{tickets.map(ticket=><article key={ticket.id}><div className="attendee-list-thumb" style={{backgroundImage:"url("+ticket.image+")"}}/><div className="attendee-list-info"><span className="attendee-confirmed"><i/> CONFIRMED</span><h3>{ticket.title}</h3><p>{ticket.date} · {ticket.type}</p></div><button onClick={()=>setActiveTicket(ticket.id)}>Open ticket <ChevronRight size={15}/></button></article>)}</div>}
          {section==="Favourites"&&<div className="attendee-saved-grid">{saved.map(item=><article key={item.title} className="attendee-saved-card"><div style={{backgroundImage:"url("+item.image+")"}}/><section><span>{item.category}</span><h3>{item.title}</h3><p>{item.date} · {item.city}</p><b>{item.price}</b></section></article>)}</div>}
          {section!=="My tickets"&&section!=="Favourites"&&<div className="attendee-empty-state"><div><Ticket size={30}/></div><h2>{section==="Event history"?"Your story is just getting started.":section==="Payments"?"Your payments will appear here.":"Your profile is ready to personalise."}</h2><p>{section==="Event history"?"After you attend an event, it will appear here.":section==="Payments"?"Completed ticket purchases and receipts will be listed here.":"Your name, photo, contact details and preferences will live here."}</p><button onClick={()=>setSection("Overview")}>Back to overview <ChevronRight size={16}/></button></div>}
        </>}
        <footer className="attendee-footer"><span>VIBEZ · EVENTS · TICKETS · EXPERIENCES</span><span>Made for the moments that matter.</span></footer>
      </section>
    </div>
  </main>;
}

function ArrowRightIcon(){return <ChevronRight size={15}/>;}
