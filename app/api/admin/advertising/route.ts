import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { AdStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const statuses = new Set(Object.values(AdStatus));

function authorised(request: Request) {
  const expected = process.env.VIBEZ_ADMIN_KEY;
  const supplied = request.headers.get("x-vibez-admin-key") ?? "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised. Check the admin access key." }, { status: 401 });
  try {
    const campaigns = await prisma.adCampaign.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ error: "Could not load campaigns. Check the database connection and Prisma schema." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised. Check the admin access key." }, { status: 401 });
  try {
    const body = await request.json();
    const id = String(body.id ?? "");
    const status = String(body.status ?? "");
    if (!id || !statuses.has(status as AdStatus)) return NextResponse.json({ error: "A valid campaign and status are required." }, { status: 400 });

    const budgetNaira = body.budgetNaira === "" || body.budgetNaira == null ? null : Number(body.budgetNaira);
    if (budgetNaira !== null && (!Number.isFinite(budgetNaira) || budgetNaira < 0 || budgetNaira > 1000000000)) {
      return NextResponse.json({ error: "Enter a valid negotiated campaign price." }, { status: 400 });
    }
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if ((startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime()))) {
      return NextResponse.json({ error: "Enter valid campaign dates." }, { status: 400 });
    }
    if (startsAt && endsAt && endsAt <= startsAt) return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });

    const campaign = await prisma.adCampaign.update({
      where: { id },
      data: {
        status: status as AdStatus,
        budgetKobo: budgetNaira === null ? undefined : Math.round(budgetNaira * 100),
        startsAt: startsAt ?? undefined,
        endsAt: endsAt ?? undefined,
      },
    });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ error: "Campaign update failed. Confirm the record still exists." }, { status: 500 });
  }
}
