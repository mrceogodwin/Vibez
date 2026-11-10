import { createServerFn } from "@tanstack/react-start";
import type { Curator, TicketTier, VibezEvent } from "@/lib/catalogue";
import { getSql } from "@/lib/db";

const eventOrder = [
  "wizkid-live-lagos",
  "detty-december-festival",
  "lagos-night-party",
  "island-sundown",
  "ay-live-december",
  "ph-rooftop",
  "lagos-gaming-finals",
  "abuja-after-hours",
  "benin-year-end",
  "enugu-countdown",
  "ibadan-sound",
];

const curatorOrder = ["neptune", "toke-makinwa", "ay-live", "seyi-vibes", "tiwa-empire"];

type EventRow = {
  slug: string;
  title: string;
  category: VibezEvent["category"];
  city: string;
  venue: string;
  address: string;
  starts_at: string | Date;
  ends_at: string | Date;
  cover: string;
  blurb: string;
  description: string;
  featured: boolean;
  curator_slug: string;
};

type TicketRow = {
  event_slug: string;
  code: string;
  name: string;
  detail: string;
  price_kobo: number;
  quantity: number;
  sold: number;
};

type CuratorRow = {
  slug: string;
  name: string;
  role: string;
  city: string;
  photo: string;
  bio: string;
};

function iso(value: string | Date) {
  return new Date(value).toISOString();
}

export const loadCatalogue = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const eventRows = await sql<EventRow>`
    select slug, title, category, city, venue, address, starts_at, ends_at, cover, blurb, description, featured, curator_slug
    from events
    where status = 'PUBLISHED'
  `;
  const ticketRows = await sql<TicketRow>`
    select event_slug, code, name, detail, price_kobo, quantity, sold
    from ticket_types
  `;
  const curatorRows = await sql<CuratorRow>`
    select slug, name, role, city, photo, bio from curators
  `;

  const ticketsByEvent = new Map<string, TicketTier[]>();
  for (const row of ticketRows) {
    const list = ticketsByEvent.get(row.event_slug) ?? [];
    list.push({
      id: row.code,
      name: row.name,
      detail: row.detail,
      priceKobo: Number(row.price_kobo),
      quantity: Number(row.quantity),
      sold: Number(row.sold),
    });
    ticketsByEvent.set(row.event_slug, list);
  }

  const events: VibezEvent[] = eventRows
    .map((row) => ({
      slug: row.slug,
      title: row.title,
      category: row.category,
      city: row.city,
      venue: row.venue,
      address: row.address,
      start: iso(row.starts_at),
      end: iso(row.ends_at),
      cover: row.cover,
      blurb: row.blurb,
      description: row.description,
      featured: Boolean(row.featured),
      curator: row.curator_slug,
      tickets: ticketsByEvent.get(row.slug) ?? [],
    }))
    .sort((a, b) => eventOrder.indexOf(a.slug) - eventOrder.indexOf(b.slug));

  const curators: Curator[] = curatorRows
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      role: row.role,
      city: row.city,
      photo: row.photo,
      bio: row.bio,
    }))
    .sort((a, b) => curatorOrder.indexOf(a.slug) - curatorOrder.indexOf(b.slug));

  return { events, curators };
});
