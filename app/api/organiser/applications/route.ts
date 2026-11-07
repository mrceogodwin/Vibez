import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Quiet honeypot: bots that fill this field receive a generic success response.
    if (text(body.companyFax, 200)) return NextResponse.json({ message: "Your request has been received." }, { status: 201 });

    const businessName = text(body.businessName, 120);
    const contactName = text(body.contactName, 100);
    const email = text(body.email, 254).toLowerCase();
    const phone = text(body.phone, 40);
    const website = text(body.website, 300);
    const city = text(body.city, 80);
    const eventTypes = text(body.eventTypes, 180);
    const expectedEvents = text(body.expectedEvents, 80);
    const message = text(body.message, 2000);

    if (!businessName || !contactName || !email || !phone || !city || !eventTypes) {
      return NextResponse.json({ error: "Complete all required fields before submitting." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid contact email." }, { status: 400 });
    }
    if (phone.replace(/[^0-9]/g, "").length < 7) {
      return NextResponse.json({ error: "Enter a valid phone number, including country code." }, { status: 400 });
    }
    if (website && !/^https:\/\//i.test(website)) {
      return NextResponse.json({ error: "Website links must start with https://." }, { status: 400 });
    }

    const application = await prisma.organizerApplication.create({
      data: {
        businessName, contactName, email, phone,
        website: website || null, city, eventTypes,
        expectedEvents: expectedEvents || null, message: message || null,
      },
      select: { id: true, status: true, createdAt: true },
    });
    return NextResponse.json({
      application,
      message: "Your organiser application has been received. The VIBEZ team will review it and contact you.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We couldn't submit your application right now. Please try again later." }, { status: 500 });
  }
}
