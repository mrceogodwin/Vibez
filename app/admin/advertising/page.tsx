"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, CircleDollarSign, ExternalLink, KeyRound, Megaphone, RefreshCw, ShieldCheck, Eye, MousePointerClick } from "lucide-react";

type Campaign = {
  id: string; name: string; advertiserName: string; advertiserEmail: string;
  placement: string; status: string; headline: string | null; body: string | null;
  imageUrl: string | null; destinationUrl: string | null; budgetKobo: number | null;
  impressions: number; clicks: number; startsAt: string | null; endsAt: string | null; createdAt: string;
};

const placementLabels: Record<string,string> = {
  HOMEPAGE_BANNER:"Homepage feature banner", EVENT_FEED:"Sponsored event cards",
  MID_PAGE_BANNER:"Mid-page brand banner", EVENT_DETAIL:"Event detail sponsorship", VIBEZ_TV:"VIBEZ TV sponsorship"
};
const statusOptions=["DRAFT","PENDING_REVIEW","SCHEDULED","ACTIVE","PAUSED","COMPLETED","REJECTED"];
const money=(kobo:number|null)=>kobo==null?"Price not set":new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(kobo/100);
const dateInput=(value:string|null)=>value?new Date(value).toISOString().slice(0,16):"";

export default function AdvertisingAdminPage(){
  const [key,setKey]=useState("");
  const [connected,setConnected]=useState(false);
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [filter,setFilter]=useState("ALL");

  useEffect(()=>{const saved=sessionStorage.getItem("vibez-admin-key");if(saved){setKey(saved);void load(saved);}},[]);

  async function load(accessKey=key){
    setLoading(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/admin/advertising",{headers:{"x-vibez-admin-key":accessKey},cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Could not connect.");
      setCampaigns(data.campaigns);setConnected(true);sessionStorage.setItem("vibez-admin-key",accessKey);
    }catch(e){setConnected(false);setError(e instanceof Error?e.message:"Unable to load campaigns.");}
    finally{setLoading(false);}
  }
  const visible=useMemo(()=>filter==="ALL"?campaigns:campaigns.filter(c=>c.status===filter),[campaigns,filter]);
  const pending=campaigns.filter(c=>c.status==="PENDING_REVIEW").length;
  const active=campaigns.filter(c=>c.status==="ACTIVE").length;
  const budget=campaigns.reduce((sum,c)=>sum+(c.budgetKobo??0),0);

  function disconnect(){sessionStorage.removeItem("vibez-admin-key");setKey("");setConnected(false);setCampaigns([]);setNotice("Admin session ended.");}

  return <main className="ad-admin-page">
    <header className="ad-admin-top"><Link href="/" className="ad-admin-brand"><span>VIBEZ</span><small>ADVERTISING MANAGER</small></Link><Link href="/" className="ad-admin-back"><ArrowLeft size={15}/> Back to site</Link></header>
    <section className="ad-admin-wrap">
      <div className="ad-admin-heading"><div><span className="ad-admin-kicker">VIBEZ BUSINESS TOOLS</span><h1>Advertising <em>manager.</em></h1><p>Manage inventory, review campaign requests, agree pricing and schedule sponsored placements.</p></div><div className="ad-admin-secure"><ShieldCheck size={17}/> Private admin workspace</div></div>
      {!connected?<section className="ad-admin-access"><div className="ad-admin-access-icon"><KeyRound size={22}/></div><div><h2>Admin access required</h2><p>Enter the VIBEZ admin access key configured on the server. The key is kept only for this browser session and is never displayed publicly.</p><form onSubmit={e=>{e.preventDefault();void load();}}><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Enter admin access key" autoComplete="current-password" required/><button disabled={loading||!key}>{loading?"Checking…":"Unlock dashboard"}</button></form>{error&&<span className="ad-admin-error">{error}</span>}</div></section>:<>
        <div className="ad-admin-toolbar"><span><BadgeCheck size={16}/> Connected to campaign records</span><div><button onClick={()=>void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button><button className="ad-admin-logout" onClick={disconnect}>Lock dashboard</button></div></div>
        {error&&<div className="ad-admin-error">{error}</div>}{notice&&<div className="ad-admin-notice">{notice}</div>}
        <div className="ad-admin-stats"><article><span>TOTAL CAMPAIGNS</span><strong>{campaigns.length}</strong><small>All submitted requests</small></article><article><span>AWAITING REVIEW</span><strong>{pending}</strong><small>Need team attention</small></article><article><span>LIVE CAMPAIGNS</span><strong>{active}</strong><small>Currently marked active</small></article><article><span>PROPOSED BUDGET</span><strong>{money(budget)}</strong><small>Across records with a price</small></article></div>
        <section className="ad-admin-inventory"><div className="ad-admin-section-title"><div><span className="ad-admin-kicker">SELLABLE INVENTORY</span><h2>Advertising placements</h2></div><Link href="/advertise"><ExternalLink size={14}/> Public advertising page</Link></div><div className="ad-admin-inventory-grid">{Object.entries(placementLabels).map(([code,label])=><article key={code}><Megaphone size={18}/><strong>{label}</strong><small>{campaigns.filter(c=>c.placement===code).length} campaign requests</small><span>Quote-based · Admin managed</span></article>)}</div></section>
        <section className="ad-admin-campaigns"><div className="ad-admin-section-title"><div><span className="ad-admin-kicker">SALES PIPELINE</span><h2>Campaign requests</h2></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">All statuses</option>{statusOptions.map(status=><option key={status} value={status}>{status.replaceAll("_"," ")}</option>)}</select></div>
          {loading?<div className="ad-admin-empty">Loading campaign records…</div>:visible.length===0?<div className="ad-admin-empty"><Megaphone size={25}/><strong>No campaign requests here yet.</strong><span>New advertiser submissions will appear in this workspace.</span></div>:<div className="ad-admin-list">{visible.map(c=><CampaignCard key={c.id} campaign={c} adminKey={key} onSaved={updated=>{setCampaigns(old=>old.map(item=>item.id===updated.id?updated:item));setNotice("Campaign changes saved.");}} onError={setError}/>)}</div>}
        </section>
      </>}
      <footer className="ad-admin-footer">VIBEZ · ADVERTISING OPERATIONS <span>Campaigns remain unpublished until the team approves and schedules them.</span></footer>
    </section>
  </main>;
}

function CampaignCard({campaign,adminKey,onSaved,onError}:{campaign:Campaign;adminKey:string;onSaved:(campaign:Campaign)=>void;onError:(message:string)=>void}){
  const [status,setStatus]=useState(campaign.status);
  const [budget,setBudget]=useState(campaign.budgetKobo==null?"":String(campaign.budgetKobo/100));
  const [startsAt,setStartsAt]=useState(dateInput(campaign.startsAt));
  const [endsAt,setEndsAt]=useState(dateInput(campaign.endsAt));
  const [saving,setSaving]=useState(false);
  async function save(){
    setSaving(true);onError("");
    try{
      const response=await fetch("/api/admin/advertising",{method:"PATCH",headers:{"Content-Type":"application/json","x-vibez-admin-key":adminKey},body:JSON.stringify({id:campaign.id,status,budgetNaira:budget,startsAt:startsAt?new Date(startsAt).toISOString():null,endsAt:endsAt?new Date(endsAt).toISOString():null})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not save campaign.");
      onSaved(data.campaign);
    }catch(e){onError(e instanceof Error?e.message:"Could not save campaign.");}
    finally{setSaving(false);}
  }
  return <article className="ad-admin-campaign">
    <div className="ad-admin-campaign-head"><div><span className={"ad-admin-status status-"+campaign.status.toLowerCase()}>{campaign.status.replaceAll("_"," ")}</span><h3>{campaign.name}</h3><p>{campaign.advertiserName} · <a href={"mailto:"+campaign.advertiserEmail}>{campaign.advertiserEmail}</a></p></div><strong>{money(campaign.budgetKobo)}</strong></div>
    <div className="ad-admin-campaign-meta"><span><Megaphone size={14}/>{placementLabels[campaign.placement]||campaign.placement}</span><span><Eye size={14}/>{campaign.impressions.toLocaleString()} impressions</span><span><MousePointerClick size={14}/>{campaign.clicks.toLocaleString()} clicks</span><span><CalendarDays size={14}/>{new Date(campaign.createdAt).toLocaleDateString("en-NG")}</span></div>
    {campaign.headline&&<strong className="ad-admin-preview-headline">{campaign.headline}</strong>}{campaign.body&&<p className="ad-admin-preview-body">{campaign.body}</p>}
    <div className="ad-admin-edit-grid"><label>Status<select value={status} onChange={e=>setStatus(e.target.value)}>{statusOptions.map(s=><option key={s} value={s}>{s.replaceAll("_"," ")}</option>)}</select></label><label>Agreed budget (₦)<input type="number" min="0" step="1000" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Set negotiated price"/></label><label>Start date<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)}/></label><label>End date<input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)}/></label></div>
    <div className="ad-admin-campaign-foot">{campaign.destinationUrl&&<a href={campaign.destinationUrl} target="_blank" rel="noreferrer">Open destination <ExternalLink size={13}/></a>}<button onClick={save} disabled={saving}>{saving?"Saving…":"Save campaign"}</button></div>
  </article>;
}
