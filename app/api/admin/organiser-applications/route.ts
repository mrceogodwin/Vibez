import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { OrganizerApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
export const runtime="nodejs";
const statuses=new Set(Object.values(OrganizerApplicationStatus));
function authorised(request:Request){const expected=process.env.VIBEZ_ADMIN_KEY;const supplied=request.headers.get("x-vibez-admin-key")??"";if(!expected||!supplied)return false;const a=Buffer.from(expected),b=Buffer.from(supplied);return a.length===b.length&&timingSafeEqual(a,b);}
export async function GET(request:Request){
 if(!authorised(request))return NextResponse.json({error:"Unauthorised. Check the admin access key."},{status:401});
 try{const applications=await prisma.organizerApplication.findMany({orderBy:{createdAt:"desc"},take:200});return NextResponse.json({applications});}
 catch{return NextResponse.json({error:"Could not load organiser applications. Check the database connection and Prisma schema."},{status:500});}
}
export async function PATCH(request:Request){
 if(!authorised(request))return NextResponse.json({error:"Unauthorised. Check the admin access key."},{status:401});
 try{const body=await request.json();const id=typeof body.id==="string"?body.id:"";const status=typeof body.status==="string"?body.status:"";if(!id||!statuses.has(status as OrganizerApplicationStatus))return NextResponse.json({error:"A valid application ID and status are required."},{status:400});const application=await prisma.organizerApplication.update({where:{id},data:{status:status as OrganizerApplicationStatus}});return NextResponse.json({application});}
 catch{return NextResponse.json({error:"Application update failed. Confirm the record still exists."},{status:500});}
}