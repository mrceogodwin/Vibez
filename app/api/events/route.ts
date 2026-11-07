import { NextResponse } from "next/server";
import { EventStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const textParam = (value: string | null, max: number) =>
  (value ?? "").trim().slice(0, max);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = textParam(url.searchParams.get("q"), 100);
  const city = textParam(url.searchParams.get("city"), 80);
  const category = textParam(url.searchParams.get("category"), 80);
  const page = Math.max(1, Math.min(1000, Number(url.searchParams.get("page")) || 1));
  const limit = Math.max(1, Math.min(40, Number(url.searchParams.get("limit")) || 20));
  const now = new Date();

  try {
    const where = {
      status: EventStatus.PUBLISHED,
      startsAt: { gt: now },
      organizer: {
        role: UserRole.ORGANIZER,
        organizerProfile: { is: { verificationStatus: "APPROVED" } },
      },
      ticketTypes: {
        some: {
          isActive: true,
          quantity: { gt: 0 },
          AND: [
            { OR: [{ salesStart: null }, { salesStart: { lte: now } }] },
            { OR: [{ salesEnd: null }, { salesEnd: { gt: now } }] },
          ],
        },
      },
      ...(city ? { city: { equals: city, mode: "insensitive" as const } } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" as const } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { summary: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
              { city: { contains: q, mode: "insensitive" as const } },
              { category: { contains: q, mode: "insensitive" as const } },
              { venue: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { startsAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          category: true,
          city: true,
          venue: true,
          startsAt: true,
          endsAt: true,
          coverImage: true,
          isFeatured: true,
          organizer: {
            select: {
              name: true,
              organizerProfile: { select: { businessName: true, slug: true } },
            },
          },
          ticketTypes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              priceKobo: true,
              quantity: true,
              sold: true,
              salesStart: true,
              salesEnd: true,
            },
            orderBy: { priceKobo: "asc" },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const visibleEvents = events.map((event) => ({
      ...event,
      ticketTypes: event.ticketTypes.filter((ticket) => {
        const salesStarted = !ticket.salesStart || ticket.salesStart <= now;
        const salesOpen = !ticket.salesEnd || ticket.salesEnd > now;
        return salesStarted && salesOpen && ticket.quantity > ticket.sold;
      }),
    })).filter((event) => event.ticketTypes.length > 0);

    return NextResponse.json(
      {
        events: visibleEvents.map((event) => ({
          ...event,
          lowestPriceKobo: Math.min(...event.ticketTypes.map((ticket) => ticket.priceKobo)),
          availableTickets: event.ticketTypes.reduce(
            (sum, ticket) => sum + Math.max(0, ticket.quantity - ticket.sold),
            0,
          ),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load published events right now." },
      { status: 500 },
    );
  }
}
