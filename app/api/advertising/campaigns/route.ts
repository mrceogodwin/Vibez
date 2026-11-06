import { NextResponse } from "next/server";
import { AdPlacement } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const allowedPlacements = new Set(Object.values(AdPlacement));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const advertiserName = String(body.advertiserName ?? "").trim();
    const advertiserEmail = String(body.advertiserEmail ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const placement = String(body.placement ?? "");
    const headline = String(body.headline ?? "").trim();
    const campaignBody = String(body.body ?? "").trim();
    const destinationUrl = String(body.destinationUrl ?? "").trim();
    const imageUrl = String(body.imageUrl ?? "").trim();
    const budgetNaira = body.budgetNaira === "" || body.budgetNaira == null ? null : Number(body.budgetNaira);

    if (!advertiserName || !advertiserEmail || !name || !allowedPlacements.has(placement as AdPlacement)) {
      return NextResponse.json({ error: "Please complete your name, email, campaign name and placement." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(advertiserEmail)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (budgetNaira !== null && (!Number.isFinite(budgetNaira) || budgetNaira < 0 || budgetNaira > 1000000000)) {
      return NextResponse.json({ error: "Enter a valid campaign budget." }, { status: 400 });
    }
    for (const url of [destinationUrl, imageUrl]) {
      if (url && !/^https:\/\//i.test(url)) return NextResponse.json({ error: "Links must use HTTPS." }, { status: 400 });
    }

    const campaign = await prisma.adCampaign.create({
      data: {
        name,
        advertiserName,
        advertiserEmail,
        placement: placement as AdPlacement,
        status: "PENDING_REVIEW",
        headline: headline || null,
        body: campaignBody || null,
        destinationUrl: destinationUrl || null,
        imageUrl: imageUrl || null,
        budgetKobo: budgetNaira === null ? null : Math.round(budgetNaira * 100),
      },
      select: { id: true, name: true, status: true, createdAt: true },
    });

    return NextResponse.json({ campaign, message: "Your campaign request has been received. The VIBEZ team will contact you to confirm pricing and availability." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Campaign request could not be submitted right now. Please try again." }, { status: 500 });
  }
}
