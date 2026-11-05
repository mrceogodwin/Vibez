"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Megaphone, ShieldCheck, Sparkles, Radio, Crown } from "lucide-react";

export default function PromotionsPage() {
  return <main className="promotions-page">
    <header className="promotions-header"><Link href="/" className="promotions-back"><ArrowLeft size={16}/> Back to VYBZ</Link><span><Sparkles size={15}/> PROMOTION SPOTLIGHT</span></header>
    <section className="promotions-hero">
      <div className="promotions-hero-copy"><span className="promotions-kicker">GET DISCOVERED ON VYBZ</span><h1>Give your event<br/>the <em>spotlight.</em></h1><p>Promote your event to people already looking for their next experience. Approved campaigns can appear in the homepage feature carousel, the LIVE NOW strip and other premium placements.</p><Link href="/organiser" className="promotions-cta">Start promoting <ArrowRight size={16}/></Link></div>
      <div className="promotions-hero-art"><Megaphone size={46}/><strong>YOUR EVENT<br/>IN THE SPOTLIGHT</strong><small>VYBZ PROMOTIONS</small></div>
    </section>
    <section className="live-promotion-offer"><div className="live-promotion-icon"><Radio size={24}/></div><div><span className="promotions-kicker">PRIORITY PLACEMENT</span><h2>Get your event into <em>LIVE NOW.</em></h2><p>Organisers can request a paid LIVE NOW feature for an event happening today or currently underway. The VYBZ Super Admin reviews the event, confirms payment, selects the run time and publishes or removes the live feature.</p><ul><li>Paid placement request submitted by the organiser</li><li>Super Admin approval before it appears on the homepage</li><li>Scheduled start and end time, with manual removal available</li></ul><Link href="/organiser" className="promotions-cta">Request LIVE NOW placement <ArrowRight size={16}/></Link></div><div className="live-promotion-preview"><span><i/> LIVE NOW</span><Crown size={26}/><strong>Your event<br/>could be here</strong><small>VYBZ SELECT</small></div></section><section className="promotions-how"><div><BadgeCheck size={20}/><strong>Reviewed by VYBZ</strong><span>Every campaign is checked before it goes live.</span></div><div><ShieldCheck size={20}/><strong>Payment verified</strong><span>Only paid and approved campaigns are eligible.</span></div><div><Sparkles size={20}/><strong>Premium visibility</strong><span>Selected campaigns can feature in the homepage carousel or LIVE NOW strip.</span></div></section>
    <section className="promotions-list"><div><span className="promotions-kicker">DISCOVER WHAT’S BEING PROMOTED</span><h2>Featured promotions</h2><p>Promoted events will appear here after the organiser completes payment and the VYBZ team approves the campaign.</p></div><div className="promotions-empty"><Megaphone size={27}/><strong>No featured promotions just yet</strong><span>Be among the first organisers to reserve a campaign slot.</span><Link href="/organiser">Create an event <ArrowRight size={14}/></Link></div></section>
    <section className="promotions-footer-cta"><div><span className="promotions-kicker">FOR EVENT ORGANISERS</span><h2>Ready to reach more people?</h2><p>Submit your event, choose a promotional placement and let the VYBZ team review your campaign.</p></div><Link href="/organiser">Get started <ArrowRight size={15}/></Link></section>
  </main>;
}
