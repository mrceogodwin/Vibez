"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Megaphone } from "lucide-react";

type Campaign = { id:string; name:string; headline:string|null; body:string|null; imageUrl:string|null; destinationUrl:string|null };
export default function AdPlacementBanner({placement,children}:{placement:string;children:ReactNode}){
 const [campaign,setCampaign]=useState<Campaign|null>(null);
 useEffect(()=>{let live=true;fetch("/api/advertising/placements/"+placement,{cache:"no-store"}).then(r=>r.json()).then(data=>{if(live&&data.campaign)setCampaign(data.campaign)}).catch(()=>{});return()=>{live=false}},[placement]);
 if(!campaign)return <>{children}</>;
 const content=<section className="ad-banner ad-banner-compact live-ad-banner" style={campaign.imageUrl?{backgroundImage:"linear-gradient(90deg,rgba(250,247,255,.96),rgba(250,247,255,.64)),url("+JSON.stringify(campaign.imageUrl)+")"}:undefined}>
  <div className="ad-banner-text"><span className="sponsored-kicker">SPONSORED · VIBEZ PARTNER</span><h2>{campaign.headline||campaign.name}</h2><p>{campaign.body||"Discover more with our featured partner."}</p><span className="live-ad-cta">Explore campaign <ArrowUpRight size={16}/></span></div>
  <div className="ad-banner-art">{campaign.imageUrl?<img src={campaign.imageUrl} alt="" />:<><Megaphone size={30}/><span>FEATURED<br/>PARTNER</span><small>SPONSORED CAMPAIGN</small></>}</div>
 </section>;
 if(!campaign.destinationUrl)return content;
 return <a className="live-ad-link" href={campaign.destinationUrl} target="_blank" rel="noopener noreferrer" onClick={()=>{void fetch("/api/advertising/placements/"+placement,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:campaign.id}),keepalive:true}).catch(()=>{})}}>{content}</a>;
}
