export type Category = "Concerts" | "Parties" | "Festivals" | "Shows" | "Gaming";

export type TicketTier = {
  id: string;
  name: string;
  detail: string;
  priceKobo: number;
  quantity: number;
  sold: number;
};

export type VibezEvent = {
  slug: string;
  title: string;
  category: Category;
  city: string;
  venue: string;
  address: string;
  start: string;
  end: string;
  cover: string;
  blurb: string;
  description: string;
  featured?: boolean;
  curator: string;
  tickets: TicketTier[];
};

export type Curator = {
  slug: string;
  name: string;
  role: string;
  city: string;
  photo: string;
  bio: string;
};

const lagos = { timeZone: "Africa/Lagos" } as const;

export const categories: Category[] = ["Concerts", "Parties", "Festivals", "Shows", "Gaming"];

export const cities = ["Lagos", "Abuja", "Port Harcourt", "Benin City", "Enugu", "Ibadan"];

export function isLive(event: VibezEvent, atTime = Date.now()) {
  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  return start <= atTime && atTime <= end;
}

export function fromPrice(event: VibezEvent) {
  return Math.min(...event.tickets.map((tier) => tier.priceKobo));
}

export function naira(kobo: number) {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

export function formatWhen(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dayKey = new Intl.DateTimeFormat("en-CA", { ...lagos, year: "numeric", month: "2-digit", day: "2-digit" });
  const day = new Intl.DateTimeFormat("en-US", { ...lagos, weekday: "short", month: "short", day: "numeric" });
  const time = new Intl.DateTimeFormat("en-US", { ...lagos, hour: "numeric", minute: "2-digit", hour12: true });
  if (dayKey.format(start) !== dayKey.format(end)) {
    const short = new Intl.DateTimeFormat("en-US", { ...lagos, month: "short", day: "numeric" });
    return `${short.format(start)} – ${short.format(end)}`;
  }
  return `${day.format(start)} · ${time.format(start)}`;
}

export function matchesQuery(event: VibezEvent, query: string, curators: Curator[] = []) {
  const curator = curators.find((item) => item.slug === event.curator);
  const blob = [
    event.title,
    event.city,
    event.venue,
    event.address,
    event.category,
    event.blurb,
    event.description,
    curator?.name,
    curator?.role,
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => blob.includes(part));
}

export type AdCampaign = {
  id: string;
  placement: "home_mid" | "home_footer";
  status: "active" | "paused";
  headline: string;
  body: string;
  href: string;
};

/** No active campaigns. The slot stays mounted so a live campaign can render later. */
export const adCampaigns: AdCampaign[] = [];
