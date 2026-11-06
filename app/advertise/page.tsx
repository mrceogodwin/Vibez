"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, CheckCircle2, Megaphone, Tv, MousePointerClick, ShieldCheck } from "lucide-react";

const placements=[
 {value:"HOMEPAGE_BANNER",name:"Homepage feature banner",desc:"High-visibility placement near the top of the discovery experience.",icon:Megaphone},
 {value:"EVENT_FEED",name:"Sponsored event cards",desc:"Appear naturally within event discovery and category feeds.",icon:CalendarDays},
 {value:"MID_PAGE_BANNER",name:"Mid-page brand banner",desc:"Reach people between curated ticket categories and trending events.",icon:BarChart3},
 {value:"EVENT_DETAIL",name:"Event page sponsorship",desc:"Associate your brand with a specific event and its audience.",icon:CheckCircle2},
 {value:"VIBEZ_TV",name:"VIBEZ TV sponsorship",desc:"Brand integrations around event films, interviews and highlights.",icon:Tv}
];

export default function AdvertisePage(){
 const [form,setForm]=useState({advertiserName:"",advertiserEmail:"",name:"",placement:"MID_PAGE_BANNER",budgetNaira:"",headline:"",body:"",imageUrl:"",destinationUrl:""});
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState("");
 const change=(field:keyof typeof form,value:string)=>setForm(current=>({...current,[field]:value}));
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");setSuccess("");
  try{
   const response=await fetch("/api/advertising/campaigns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
   const data=await response.json();if(!response.ok)throw new Error(data.error||"Your request could not be submitted.");
   setSuccess(data.message||"Your campaign request has been received.");setForm({advertiserName:"",advertiserEmail:"",name:"",placement:"MID_PAGE_BANNER",budgetNaira:"",headline:"",body:"",imageUrl:"",destinationUrl:""});
  }catch(err){setError(err instanceof Error?err.message:"Please try again.");}
  finally{setBusy(false);}
 }
 return <main className="simple-page advertise-page"><header className="simple-header"><Link className="light-brand" href="/"><span>VIBEZ</span><small>EVENTS · TICKETS · EXPERIENCES</small></Link><Link href="/" className="simple-back"><ArrowLeft size={15}/> Back to discover</Link></header>
  <section className="simple-hero"><span className="light-eyebrow">VIBEZ FOR BRANDS</span><h1>Put your brand<br/><em>in the moment.</em></h1><p>Reach people discovering concerts, festivals, nightlife and culture across Nigeria. Choose an advertising placement and send the VIBEZ team a campaign brief.</p><a className="simple-primary" href="#campaign-request">Request a campaign <ArrowRight size={16}/></a></section>
  <section className="simple-content"><div className="light-section-heading"><div><span className="light-eyebrow">ADVERTISING INVENTORY</span><h2>Places to <em>show up.</em></h2></div></div>
   <div className="placement-grid">{placements.map(p=><article className="placement-card" key={p.value}><p.icon size={22}/><h3>{p.name}</h3><p>{p.desc}</p><span>Request availability</span></article>)}</div>
   <div className="ad-measure"><div><span className="light-eyebrow">CAMPAIGN MANAGEMENT</span><h2>Clear placements.<br/>Measurable results.</h2><p>Every request is reviewed by VIBEZ. The team confirms available dates, creative requirements and the negotiated campaign price before scheduling. A placement is not published just because a request is submitted.</p></div><div className="measure-list"><span><CheckCircle2/> Campaign review and approval</span><span><CheckCircle2/> Agreed placement, dates and budget</span><span><CheckCircle2/> Creative and destination-link review</span><span><CheckCircle2/> Sponsored labels on published ads</span><span><CheckCircle2/> Impression and click reporting as tracking is enabled</span></div></div>
   <section className="advertiser-request" id="campaign-request"><div className="advertiser-request-heading"><span className="light-eyebrow">START A CAMPAIGN</span><h2>Reserve your <em>spotlight.</em></h2><p>Send your campaign details. VIBEZ will contact you to confirm availability, final pricing and payment instructions.</p></div>
    {success?<div className="advertiser-success"><CheckCircle2 size={25}/><strong>Request received</strong><p>{success}</p><button onClick={()=>setSuccess("")}>Submit another campaign</button></div>:<form className="advertiser-form" onSubmit={submit}>
     <label>Business / advertiser name<input required value={form.advertiserName} onChange={e=>change("advertiserName",e.target.value)} placeholder="Your brand or company"/></label>
     <label>Contact email<input required type="email" value={form.advertiserEmail} onChange={e=>change("advertiserEmail",e.target.value)} placeholder="name@company.com"/></label>
     <label>Campaign name<input required value={form.name} onChange={e=>change("name",e.target.value)} placeholder="e.g. December brand campaign"/></label>
     <label>Preferred placement<select value={form.placement} onChange={e=>change("placement",e.target.value)}>{placements.map(p=><option key={p.value} value={p.value}>{p.name}</option>)}</select></label>
     <label>Indicative budget (₦)<input type="number" min="0" step="1000" value={form.budgetNaira} onChange={e=>change("budgetNaira",e.target.value)} placeholder="Optional — final price is agreed with VIBEZ"/></label>
     <label>Campaign headline<input value={form.headline} onChange={e=>change("headline",e.target.value)} placeholder="Short message for your audience"/></label>
     <label className="advertiser-form-wide">Campaign brief<textarea value={form.body} onChange={e=>change("body",e.target.value)} rows={4} placeholder="Tell us what you are promoting, your target audience and preferred dates."/></label>
     <label>Creative image URL<input type="url" value={form.imageUrl} onChange={e=>change("imageUrl",e.target.value)} placeholder="https://…"/></label>
     <label>Destination URL<input type="url" value={form.destinationUrl} onChange={e=>change("destinationUrl",e.target.value)} placeholder="https://yourwebsite.com"/></label>
     {error&&<p className="advertiser-form-error">{error}</p>}
     <div className="advertiser-form-submit"><span><ShieldCheck size={15}/> Submission does not publish an advert or charge you.</span><button disabled={busy}>{busy?"Sending request…":"Send campaign request"} <ArrowRight size={15}/></button></div>
    </form>}
   </section>
  </section><footer className="simple-footer">© 2026 Vibez · Events · Tickets · Experiences</footer>
 </main>;
}
