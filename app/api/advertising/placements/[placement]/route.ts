import { NextResponse } from "next/server";
import { AdPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const allowed = new Set(Object.values(AdPlacement));

export async function GET(_request: Request, context: { params: Promise<{ placement: string }> }) {
  const { placement } = await context.params;
  if (!allowed.has(placement as AdPlacement)) return NextResponse.json({ campaign: null }, { status: 404 });
  try {
    const now = new Date();
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        placement: placement as AdPlacement,
        status: "ACTIVE",
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, headline: true, body: true, imageUrl: true, destinationUrl: true },
    });
    if (campaign) await prisma.adCampaign.update({ where: { id: campaign.id }, data: { impressions: { increment: 1 } } });
    return NextResponse.json({ campaign });
  } catch {
    return NextResponse.json({ campaign: null }, { status: 200 });
  }
}

export async function POST(_request: Request, context: { params: Promise<{ placement: string }> }) {
  const { placement } = await context.params;
  if (!allowed.has(placement as AdPlacement)) return NextResponse.json({ error: "Unknown placement." }, { status: 404 });
  try {
    const body = await _request.json();
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "Campaign id is required." }, { status: 400 });
    const result = await prisma.adCampaign.updateMany({
      where: { id, placement: placement as AdPlacement, status: "ACTIVE" },
      data: { clicks: { increment: 1 } },
    });
    return NextResponse.json({ recorded: result.count === 1 });
  } catch {
    return NextResponse.json({ recorded: false }, { status: 200 });
  }
}
