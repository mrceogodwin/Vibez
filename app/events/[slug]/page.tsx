import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, ShieldCheck, Ticket } from "lucide-react";

const events: Record<string, {title:string;category:string;city:string;venue:string;date:string;time:string;price:string;image:string;description:string}> = {
  "mainland-block-party": {title:"The Mainland Block Party",category:"MUSIC · NIGHTLIFE",city:"Lagos",venue:"To be announced",date:"Saturday, 22 November 2026",time:"6:00 PM",price:"₦8,000",image:"https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1800&q=90",description:"A night built around good music, great people and unforgettable energy. Event details and final venue information will be confirmed by the organiser."},
  "palmwine-poetry": {title:"Palmwine & Poetry",category:"CULTURE · LIVE",city:"Abuja",venue:"To be announced",date:"Sunday, 29 November 2026",time:"5:00 PM",price:"₦5,000",image:"https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1800&q=90",description:"An intimate celebration of spoken word, live sounds and contemporary culture. Event details will be confirmed by the organiser."},
  "after-dark-experience": {title:"After Dark: The Experience",category:"NIGHTLIFE",city:"Port Harcourt",venue:"To be announced",date:"Sunday, 6 December 2026",time:"8:00 PM",price:"₦12,000",image:"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1800&q=90",description:"A late-night experience for music lovers. Event details and final venue information will be confirmed by the organiser."},
  "culture-festival": {title:"The Culture Festival",category:"FESTIVAL · CULTURE",city:"Lagos",venue:"To be announced",date:"Monday, 14 December 2026",time:"12:00 PM",price:"₦15,000",image:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1800&q=90",description:"A gathering celebrating music, creativity and culture. Event details will be confirmed by the organiser."}
};

export default async function EventPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const event=events[slug];
 if(!event) return <main className="not-found"><span className="eyebrow">VYBZ / EVENT NOT FOUND</span><h1>This event isn’t here.</h1><Link className="button button-light" href="/">Back to discover <ArrowRight size={16}/></Link></main>;
 return <main className="event-detail-page">
  <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">V</span>VYBZ<span className="brand-dot">.</span></Link><nav className="desktop-nav"><Link href="/">Discover</Link><a className="active" href="#tickets">Events</a><a href="/#experiences">Experiences</a><a href="/#vybz-tv">VYBZ TV</a></nav><div className="header-actions"><Link className="sign-in" href="/">Back to VYBZ</Link></div></header>
  <div className="detail-hero" style={{backgroundImage:"linear-gradient(90deg,rgba(5,6,8,.95),rgba(5,6,8,.38)),linear-gradient(0deg,#090a0c,transparent 55%),url('"+event.image+"')"}}>
   <div className="detail-hero-content"><Link className="back-link" href="/"><ArrowLeft size={15}/> ALL EVENTS</Link><span className="eyebrow">{event.category}</span><h1>{event.title}</h1><div className="detail-location"><span><CalendarDays size={16}/>{event.date}</span><span><MapPin size={16}/>{event.city}</span></div></div>
  </div>
  <section className="detail-content">
   <div className="detail-main"><span className="eyebrow muted">ABOUT THIS EVENT</span><h2>Be part of the experience.</h2><p>{event.description}</p><div className="detail-info"><div><span>DATE & TIME</span><strong>{event.date}</strong><small>{event.time}</small></div><div><span>LOCATION</span><strong>{event.venue}</strong><small>{event.city}, Nigeria</small></div></div><div className="detail-notice"><ShieldCheck size={18}/><p>Tickets purchased on VYBZ will be confirmed only after secure payment verification. Never share your ticket QR code publicly.</p></div></div>
   <aside className="ticket-panel" id="tickets"><span className="eyebrow muted">TICKETS</span><h3>Get in on it.</h3><div className="ticket-option"><div><strong>General admission</strong><small>Standard entry</small></div><strong>{event.price}</strong></div><p className="checkout-note">Ticket sales will open when this event is published by its verified organiser.</p><button className="button button-light ticket-disabled" disabled><Ticket size={16}/> Tickets coming soon</button><small className="secure-note">Secure checkout · Digital QR ticket</small></aside>
  </section>
 </main>;
}
