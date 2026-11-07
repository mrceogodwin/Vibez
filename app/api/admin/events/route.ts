import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {EventStatus,UserRole} from "@prisma/client";
import {prisma} from "@/lib/prisma";
export const runtime="nodejs";
const statuses=new Set(Object.values(EventStatus));
function authorised(request:Request){const expected=process.env.VIBEZ_ADMIN_KEY;const supplied=request.headers.get("x-vibez-admin-key")??"";if(!expected||!supplied)return false;const a=Buffer.from(expected),b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b);}
const clean=(v:unknown,n:number)=>typeof v==="string"?v.trim().slice(0,n):"";
export async function GET(request:Request){
 if(!authorised(request))return NextResponse.json({error:"Unauthorised."},{status:401});
 try{const events=await prisma.event.findMany({include:{organizer:{select:{id:true,name:true,email:true,organizerProfile:{select:{businessName:true,verificationStatus:true}}}},ticketTypes:true},orderBy:{createdAt:"desc"},take:200});return NextResponse.json({events});}
 catch{return NextResponse.json({error:"Could not load events. Check the database and Prisma schema."},{status:500});}
}
export async function POST(request:Request){
 if(!authorised(request))return NextResponse.json({error:"Unauthorised."},{status:401});
 try{
  const b=await request.json();const organizerId=clean(b.organizerId,100),title=clean(b.title,140),slug=clean(b.slug,160).toLowerCase(),description=clean(b.description,10000),summary=clean(b.summary,280),category=clean(b.category,80),city=clean(b.city,80),venue=clean(b.venue,180),address=clean(b.address,300),coverImage=clean(b.coverImage,1000);
  const startsAt=new Date(b.startsAt),endsAt=b.endsAt?new Date(b.endsAt):null;
  const ticketTypes=Array.isArray(b.ticketTypes)?b.ticketTypes.slice(0,10):[];
  if(!organizerId||!title||!slug||!description||!category||!city||!venue||Number.isNaN(startsAt.getTime()))return NextResponse.json({error:"Organizer, title, slug, description, category, city, venue and valid start date are required."},{status:400});
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return NextResponse.json({error:"Use a URL-friendly slug with lowercase letters, numbers and hyphens."},{status:400});
  if(endsAt&&(!Number.isFinite(endsAt.getTime())||endsAt<=startsAt))return NextResponse.json({error:"End date must be later than the start date."},{status:400});
  if(!ticketTypes.length)return NextResponse.json({error:"Add at least one ticket type before submitting an event for review."},{status:400});
  const parsed=ticketTypes.map((t:Record<string,unknown>)=>({name:clean(t.name,80),description:clean(t.description,300),priceNaira:Number(t.priceNaira),quantity:Number(t.quantity)}));
  if(parsed.some(t=>!t.name||!Number.isSafeInteger(t.priceNaira)||t.priceNaira<0||t.priceNaira>100000000||!Number.isSafeInteger(t.quantity)||t.quantity<1||t.quantity>1000000))return NextResponse.json({error:"Each ticket needs a name, valid non-negative whole-naira price and quantity above zero."},{status:400});
  const organizer=await prisma.user.findUnique({where:{id:organizerId},include:{organizerProfile:true}});
  if(!organizer||organizer.role!==UserRole.ORGANIZER||organizer.organizerProfile?.verificationStatus!=="APPROVED")return NextResponse.json({error:"Events can only be created for an approved organiser account."},{status:409});
  const event=await prisma.event.create({data:{slug,title,summary:summary||null,description,category,city,venue,address:address||null,startsAt,endsAt,coverImage:coverImage||null,status:EventStatus.PENDING_REVIEW,organizerId,ticketTypes:{create:parsed.map(t=>({name:t.name,description:t.description||null,priceKobo:t.priceNaira*100,quantity:t.quantity}))}},include:{ticketTypes:true,organizer:{select:{id:true,email:true}}}});
  return NextResponse.json({event,message:"Event submitted for review. It is not public and ticket sales are not open."},{status:201});
 }catch{return NextResponse.json({error:"Event could not be created. Check for a duplicate slug and valid organiser."},{status:500});}
}
export async function PATCH(request:Request){
 if(!authorised(request))return NextResponse.json({error:"Unauthorised."},{status:401});
 try{const b=await request.json(),id=clean(b.id,100),status=clean(b.status,40);if(!id||!statuses.has(status as EventStatus))return NextResponse.json({error:"A valid event ID and status are required."},{status:400});
  if(status===EventStatus.PUBLISHED){const event=await prisma.event.findUnique({where:{id},include:{organizer:{include:{organizerProfile:true}},ticketTypes:{where:{isActive:true}}}});if(!event)return NextResponse.json({error:"Event not found."},{status:404});if(event.organizer.role!==UserRole.ORGANIZER||event.organizer.organizerProfile?.verificationStatus!=="APPROVED")return NextResponse.json({error:"Verify the organiser before publishing this event."},{status:409});if(event.startsAt<=new Date()||event.ticketTypes.length===0||event.ticketTypes.some(t=>t.quantity<=0||t.priceKobo<0))return NextResponse.json({error:"A future event with at least one valid active ticket type is required before publishing."},{status:409});}
  const event=await prisma.event.update({where:{id},data:{status:status as EventStatus},include:{ticketTypes:true}});return NextResponse.json({event});
 }catch{return NextResponse.json({error:"Event status update failed. Confirm the event exists."},{status:500});}
}