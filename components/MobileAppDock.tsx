"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, Play, Plus, UserRound } from "lucide-react";
const items=[{href:"/",label:"Home",Icon:House},{href:"/events",label:"Events",Icon:CalendarDays},{href:"/tv",label:"VIBEZ TV",Icon:Play},{href:"/organiser",label:"Create",Icon:Plus},{href:"/account",label:"Account",Icon:UserRound}];
export default function MobileAppDock(){const pathname=usePathname();return <nav className={pathname.startsWith("/admin") ? "mobile-bottom-dock dock-admin-hidden" : "mobile-bottom-dock"} aria-label="Primary navigation">{items.map(({href,label,Icon})=>{const active=href==="/" ? pathname==="/" : pathname===href||pathname.startsWith(href+"/");return <Link href={href} key={href} className={active?"dock-item dock-active":"dock-item"} aria-current={active?"page":undefined}><Icon size={19} strokeWidth={active?2.4:1.8}/><span>{label}</span></Link>;})}</nav>}
