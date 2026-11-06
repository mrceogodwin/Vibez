"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

type Campaign = { id:string; name:string; headline:string|null; body:string|null; imageUrl:string|null; destinationUrl:string|null };
export default function AdPlacementBanner({placement,children}:{placement:string;children:ReactNode}){
 const [campaign,setCampaign]=useState<Campaign|null>(null);
 useEffect(()=>{let live=true;fetch("/api/advertising/placements/"+placement,{cache:"no-store"}).then(r=>r.json()).then(data=>{if(live&&data.campaign)setCampaign(data.campaign)}).catch(()=>{});return()=>{live=false}},[placement]);
 if(!campaign)return <>{children}</>;
 const background=campaign.imageUrl
  ? "linear-gradient(90deg,rgba(12,8,22,.94) 0%,rgba(12,8,22,.72) 58%,rgba(12,8,22,.22) 100%),url("+JSON.stringify(campaign.imageUrl)+")"
  : "linear-gradient(110deg,#21132f,#49305d 58%,#171020)";
 const content=<section className="ad-banner live-ad-banner live-ad-campaign" style={{backgroundImage:background}}>
  <span className="live-ad-label">VIBEZ BRAND PARTNER · ADVERTISEMENT</span>
  <div className="ad-banner-text"><span className="sponsored-kicker">SPONSORED CAMPAIGN</span><h2>{campaign.headline||campaign.name}</h2><p>{campaign.body||"Discover more with our featured VIBEZ partner."}</p><span className="live-ad-cta">Explore campaign <ArrowUpRight size={17}/></span></div>
 </section>;
 if(!campaign.destinationUrl)return content;
 return <a className="live-ad-link" href={campaign.destinationUrl} target="_blank" rel="noopener noreferrer" onClick={()=>{void fetch("/api/advertising/placements/"+placement,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:campaign.id}),keepalive:true}).catch(()=>{})}}>{content}</a>;
}
