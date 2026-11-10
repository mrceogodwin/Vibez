import { createHash, randomBytes, randomInt } from "node:crypto";
import { getSql, type Sql } from "@/lib/db";
import { decideFulfillment, feeKobo, paystackSignature, signaturesMatch } from "@/lib/platform/pay";

export const RESERVED_USERNAMES = new Set([
  "home", "discover", "create", "activity", "profile", "events", "music", "artists",
  "login", "register", "verify", "personalise", "account", "api", "control", "studio",
  "organise", "ads", "community", "tickets", "checkout", "player", "legal", "privacy",
  "terms", "reset", "promote", "curators", "tv", "admin", "settings", "onboarding",
  "auth", "favicon.ico",
]);

export function rid(prefix: string) {
  return `${prefix}_${randomBytes(9).toString("hex")}`;
}

export function cleanUsername(raw: string) {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export function validSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length >= 2 && value.length <= 40;
}

function pepper() {
  return process.env.AUTH_CODE_PEPPER?.trim() || "vibez-local-pepper";
}

function hashCode(code: string) {
  return createHash("sha256").update(`${pepper()}:${code}`).digest("hex");
}

function iso(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function day(value: string | Date | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function integrations() {
  return {
    paystack: Boolean(process.env.PAYSTACK_SECRET_KEY?.trim()),
    email: Boolean(process.env.RESEND_API_KEY?.trim()),
    storage: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    google: process.env.VITE_AUTH_ENABLED !== "false",
  };
}

export function publicOrigin() {
  const explicit = process.env.APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://localhost:8080";
}

type ProfileRow = {
  user_id: string;
  username: string | null;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  city: string;
  state: string;
  country: string;
  genres: string[] | null;
  interests: string[] | null;
  event_interests: string[] | null;
  roles: string[] | null;
  email_verified: boolean;
  status: string;
  notify_email: boolean;
  notify_releases: boolean;
  notify_events: boolean;
  notify_campaigns: boolean;
  deletion_requested_at: string | Date | null;
};

export type PublicProfile = {
  userId: string;
  username: string | null;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  city: string;
  state: string;
  country: string;
  genres: string[];
  interests: string[];
  eventInterests: string[];
  roles: string[];
  emailVerified: boolean;
  status: string;
  notifications: { email: boolean; releases: boolean; events: boolean; campaigns: boolean };
  deletionRequested: boolean;
};

function mapProfile(row: ProfileRow): PublicProfile {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    city: row.city,
    state: row.state,
    country: row.country,
    genres: row.genres ?? [],
    interests: row.interests ?? [],
    eventInterests: row.event_interests ?? [],
    roles: row.roles?.length ? row.roles : ["fan"],
    emailVerified: Boolean(row.email_verified),
    status: row.status,
    notifications: {
      email: row.notify_email,
      releases: row.notify_releases,
      events: row.notify_events,
      campaigns: row.notify_campaigns,
    },
    deletionRequested: Boolean(row.deletion_requested_at),
  };
}

async function feeBps(sql: Sql) {
  const rows = await sql<{ value_json: number | string }>`
    select value_json from platform_settings where key = 'ticket_fee_bps'
  `;
  const value = Number(rows[0]?.value_json ?? 500);
  return Number.isFinite(value) ? value : 500;
}

export async function assertRate(bucket: string, max: number, windowMs: number) {
  const sql = await getSql();
  const rows = await sql<{ hits: number; window_start: string | Date }>`
    select hits, window_start from rate_limits where bucket = ${bucket}
  `;
  const now = Date.now();
  const start = rows[0] ? new Date(rows[0].window_start).getTime() : 0;
  if (!rows[0] || now - start > windowMs) {
    await sql`
      insert into rate_limits (bucket, hits, window_start) values (${bucket}, 1, now())
      on conflict (bucket) do update set hits = 1, window_start = now()
    `;
    return;
  }
  if (Number(rows[0].hits) >= max) {
    throw new Error("Too many attempts. Wait a little, then try again.");
  }
  await sql`update rate_limits set hits = hits + 1 where bucket = ${bucket}`;
}

export async function ensureProfile(userId: string, name?: string | null) {
  const sql = await getSql();
  await sql`
    insert into profiles (user_id, display_name) values (${userId}, ${name?.trim() || ""})
    on conflict (user_id) do nothing
  `;
  const authRows = await sql<{ emailVerified: boolean; name: string }>`
    select "emailVerified", name from "user" where id = ${userId}
  `;
  if (authRows[0]?.emailVerified) {
    await sql`update profiles set email_verified = true, updated_at = now() where user_id = ${userId}`;
  }
  if (name && authRows[0] && !authRows[0].name) {
    /* display name stays on the profile */
  }
  const rows = await sql<ProfileRow>`select * from profiles where user_id = ${userId}`;
  return mapProfile(rows[0]);
}

async function requireActive(userId: string) {
  const profile = await ensureProfile(userId);
  if (profile.status === "suspended") throw new Error("This account is suspended.");
  return profile;
}

function commercialReady(profile: PublicProfile) {
  if (process.env.VITE_AUTH_ENABLED === "false") return;
  if (!profile.emailVerified) {
    throw new Error("Verify your email before using commercial tools.");
  }
}

export async function isStaff(userId: string, email?: string | null) {
  const sql = await getSql();
  const allow = (process.env.VIBEZ_ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (email && allow.includes(email.toLowerCase())) {
    await sql`
      insert into staff (user_id, role) values (${userId}, 'super_admin')
      on conflict (user_id) do update set role = 'super_admin'
    `;
  }
  if (process.env.VITE_AUTH_ENABLED === "false" && !process.env.DATABASE_URL?.trim()) {
    await sql`
      insert into staff (user_id, role) values (${userId}, 'super_admin')
      on conflict (user_id) do nothing
    `;
  }
  const rows = await sql<{ role: string }>`select role from staff where user_id = ${userId}`;
  return rows[0]?.role ?? null;
}

async function notify(userId: string, kind: string, title: string, body: string, href?: string) {
  const sql = await getSql();
  await sql`
    insert into notifications (id, user_id, kind, title, body, href)
    values (${rid("ntf")}, ${userId}, ${kind}, ${title}, ${body}, ${href ?? null})
  `;
}

export async function loadHome() {
  const sql = await getSql();
  const heroes = await sql<{
    title: string;
    subtitle: string;
    image_url: string;
    href: string;
    sponsored: boolean;
    is_sample: boolean;
  }>`
    select title, subtitle, image_url, href, sponsored, is_sample
    from homepage_slots where active = true and kind = 'hero'
    order by sort asc limit 1
  `;
  const releases = await sql<ReleaseRow>`
    select r.id, r.slug, r.title, r.artwork_url, r.genre, r.description, r.release_date,
           r.duration_seconds, r.preview_url, r.links, r.is_sample, r.lyrics,
           a.username, a.display_name, a.avatar_url, a.verified, a.is_sample as artist_sample
    from music_releases r
    join artist_profiles a on a.id = r.artist_id
    where r.status = 'published' and a.status = 'published'
    order by r.release_date desc nulls last, r.created_at desc
    limit 12
  `;
  const artists = await sql<ArtistRow>`
    select id, username, display_name, bio, avatar_url, cover_url, verified, city, is_sample, website,
           (select count(*)::int from artist_follows f where f.artist_id = artist_profiles.id) as followers,
           (select count(*)::int from music_releases m where m.artist_id = artist_profiles.id and m.status = 'published') as releases
    from artist_profiles
    where status = 'published'
    order by is_sample asc, display_name asc
    limit 12
  `;
  const events = await listEventRows(sql);
  const genres = await sql<{ name: string }>`select name from music_genres order by sort, name`;
  const ads = await sql<{
    id: string;
    name: string;
    headline: string;
    body: string;
    image_url: string;
    destination_url: string;
    placement: string;
  }>`
    select id, name, headline, body, image_url, destination_url, placement
    from ad_campaigns
    where status = 'active'
      and (starts_on is null or starts_on <= current_date)
      and (ends_on is null or ends_on >= current_date)
    order by created_at desc
    limit 4
  `;
  return {
    hero: heroes[0]
      ? {
          title: heroes[0].title,
          subtitle: heroes[0].subtitle,
          image: heroes[0].image_url,
          href: heroes[0].href,
          sponsored: Boolean(heroes[0].sponsored),
          sample: Boolean(heroes[0].is_sample),
        }
      : null,
    releases: releases.map(mapRelease),
    artists: artists.map(mapArtist),
    events: events.slice(0, 6).map(mapEvent),
    genres: genres.map((row) => row.name),
    promotions: ads.map((row) => ({
      id: row.id,
      name: row.name,
      headline: row.headline,
      body: row.body,
      image: row.image_url,
      href: row.destination_url || "/ads",
      placement: row.placement,
      sponsored: true,
    })),
    integrations: integrations(),
  };
}

type ReleaseRow = {
  id: string;
  slug: string;
  title: string;
  artwork_url: string;
  genre: string;
  description: string;
  release_date: string | Date | null;
  duration_seconds: number | null;
  preview_url: string | null;
  links: unknown;
  is_sample: boolean;
  lyrics: string | null;
  username: string;
  display_name: string;
  avatar_url: string;
  verified: boolean;
  artist_sample: boolean;
};

type ArtistRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  cover_url: string;
  verified: boolean;
  city: string;
  is_sample: boolean;
  website: string;
  followers: number;
  releases: number;
};

type EventRow = {
  slug: string;
  title: string;
  category: string;
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
  status: string;
  is_sample: boolean;
  age_note: string;
  refund_policy: string;
  organiser_user_id: string | null;
};

function mapRelease(row: ReleaseRow) {
  const links = Array.isArray(row.links) ? row.links : [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    artwork: row.artwork_url,
    genre: row.genre,
    description: row.description,
    releaseDate: day(row.release_date),
    durationSeconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    previewUrl: row.preview_url,
    lyrics: row.lyrics,
    links: links.filter((item) => item && typeof item === "object") as { label: string; url: string }[],
    sample: Boolean(row.is_sample),
    artist: {
      username: row.username,
      name: row.display_name,
      avatar: row.avatar_url,
      verified: Boolean(row.verified),
      sample: Boolean(row.artist_sample),
    },
  };
}

function mapArtist(row: ArtistRow) {
  return {
    id: row.id,
    username: row.username,
    name: row.display_name,
    bio: row.bio,
    avatar: row.avatar_url,
    cover: row.cover_url,
    verified: Boolean(row.verified),
    city: row.city,
    website: row.website,
    sample: Boolean(row.is_sample),
    followers: Number(row.followers) || 0,
    releases: Number(row.releases) || 0,
  };
}

function mapEvent(row: EventRow & { from_kobo?: number }) {
  return {
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
    status: row.status,
    sample: Boolean(row.is_sample),
    ageNote: row.age_note,
    refundPolicy: row.refund_policy,
    fromKobo: Number(row.from_kobo ?? 0),
  };
}

async function listEventRows(sql: Sql) {
  return sql<EventRow & { from_kobo: number }>`
    select e.slug, e.title, e.category, e.city, e.venue, e.address, e.starts_at, e.ends_at,
           e.cover, e.blurb, e.description, e.featured, e.curator_slug, e.status, e.is_sample,
           e.age_note, e.refund_policy, e.organiser_user_id,
           coalesce((select min(price_kobo) from ticket_types t where t.event_slug = e.slug), 0)::int as from_kobo
    from events e
    where e.status = 'PUBLISHED'
    order by e.starts_at asc
  `;
}

export async function loadDiscover(query: string) {
  const home = await loadHome();
  const q = query.trim().toLowerCase();
  if (!q) return home;
  return {
    ...home,
    releases: home.releases.filter((item) => `${item.title} ${item.artist.name} ${item.genre}`.toLowerCase().includes(q)),
    artists: home.artists.filter((item) => `${item.name} ${item.city} ${item.username}`.toLowerCase().includes(q)),
    events: home.events.filter((item) => `${item.title} ${item.city} ${item.venue} ${item.category}`.toLowerCase().includes(q)),
  };
}

export async function loadArtist(rawUsername: string) {
  const username = cleanUsername(rawUsername);
  const sql = await getSql();
  const redirected = await sql<{ new_path: string }>`
    select new_path from link_redirects where old_path = ${`/@${username}`} limit 1
  `;
  const artists = await sql<ArtistRow>`
    select id, username, display_name, bio, avatar_url, cover_url, verified, city, is_sample, website,
           (select count(*)::int from artist_follows f where f.artist_id = artist_profiles.id) as followers,
           (select count(*)::int from music_releases m where m.artist_id = artist_profiles.id and m.status = 'published') as releases
    from artist_profiles where username = ${username} and status = 'published'
  `;
  if (!artists[0]) return { artist: null, releases: [], events: [], redirect: redirected[0]?.new_path ?? null };
  const releases = await sql<ReleaseRow>`
    select r.id, r.slug, r.title, r.artwork_url, r.genre, r.description, r.release_date,
           r.duration_seconds, r.preview_url, r.links, r.is_sample, r.lyrics,
           a.username, a.display_name, a.avatar_url, a.verified, a.is_sample as artist_sample
    from music_releases r
    join artist_profiles a on a.id = r.artist_id
    where r.artist_id = ${artists[0].id} and r.status = 'published'
    order by r.release_date desc nulls last
  `;
  return { artist: mapArtist(artists[0]), releases: releases.map(mapRelease), redirect: null };
}

export async function loadSong(rawUsername: string, slug: string) {
  const artist = await loadArtist(rawUsername);
  if (!artist.artist) return { release: null, redirect: artist.redirect, related: [] };
  const release = artist.releases.find((item) => item.slug === slug) ?? null;
  return {
    release,
    redirect: null,
    related: artist.releases.filter((item) => item.slug !== slug),
    artist: artist.artist,
  };
}

export async function loadEvents() {
  const sql = await getSql();
  const events = await listEventRows(sql);
  const tickets = await sql<{
    event_slug: string;
    code: string;
    name: string;
    detail: string;
    price_kobo: number;
    quantity: number;
    sold: number;
  }>`select event_slug, code, name, detail, price_kobo, quantity, sold from ticket_types`;
  const curators = await sql<{ slug: string; name: string; role: string; city: string; photo: string; bio: string }>`
    select slug, name, role, city, photo, bio from curators
  `;
  return {
    events: events.map((row) => ({
      ...mapEvent(row),
      tickets: tickets
        .filter((tier) => tier.event_slug === row.slug)
        .map((tier) => ({
          code: tier.code,
          name: tier.name,
          detail: tier.detail,
          priceKobo: Number(tier.price_kobo),
          quantity: Number(tier.quantity),
          sold: row.is_sample ? 0 : Number(tier.sold),
          remaining: Number(tier.quantity) - Number(tier.sold),
        })),
    })),
    curators,
  };
}

export async function savePersonalisation(userId: string, input: {
  roles: string[];
  genres: string[];
  city: string;
  state: string;
  country: string;
  interests: string[];
  eventInterests: string[];
}) {
  const allowed = new Set(["fan", "artist", "organiser", "advertiser", "community"]);
  const roles = input.roles.filter((role) => allowed.has(role));
  if (roles.length === 0) roles.push("fan");
  const sql = await getSql();
  await ensureProfile(userId);
  await sql`
    update profiles set
      roles = ${roles},
      genres = ${input.genres.slice(0, 12)},
      city = ${input.city.slice(0, 80)},
      state = ${input.state.slice(0, 80)},
      country = ${input.country.slice(0, 80) || "Nigeria"},
      interests = ${input.interests.slice(0, 12)},
      event_interests = ${input.eventInterests.slice(0, 12)},
      updated_at = now()
    where user_id = ${userId}
  `;
  return ensureProfile(userId);
}

export async function updateProfile(userId: string, input: {
  displayName: string;
  username: string;
  bio: string;
  city: string;
  state: string;
  country: string;
  avatarUrl: string;
}) {
  const profile = await requireActive(userId);
  const username = cleanUsername(input.username);
  if (username && (!validSlug(username) || RESERVED_USERNAMES.has(username))) {
    throw new Error("Choose a username using letters, numbers and hyphens.");
  }
  const sql = await getSql();
  if (username && username !== profile.username) {
    const taken = await sql`select 1 from profiles where username = ${username} and user_id <> ${userId}`;
    const artistTaken = await sql`select 1 from artist_profiles where username = ${username} and user_id is distinct from ${userId}`;
    if (taken.length || artistTaken.length) throw new Error("That username is taken.");
    if (profile.username) {
      await sql`
        insert into link_redirects (old_path, new_path) values (${`/@${profile.username}`}, ${`/@${username}`})
        on conflict (old_path) do update set new_path = excluded.new_path
      `;
    }
  }
  await sql`
    update profiles set
      display_name = ${input.displayName.trim().slice(0, 80)},
      username = ${username || null},
      bio = ${input.bio.trim().slice(0, 600)},
      city = ${input.city.trim().slice(0, 80)},
      state = ${input.state.trim().slice(0, 80)},
      country = ${input.country.trim().slice(0, 80) || "Nigeria"},
      avatar_url = ${input.avatarUrl.trim().slice(0, 400) || null},
      updated_at = now()
    where user_id = ${userId}
  `;
  if (profile.roles.includes("artist") && username) {
    await sql`
      insert into artist_profiles (id, user_id, username, display_name, bio, avatar_url, cover_url, city, is_sample, status)
      values (${rid("art")}, ${userId}, ${username}, ${input.displayName.trim() || username}, ${input.bio.trim().slice(0, 600)},
              ${input.avatarUrl.trim() || "/media/sample-mudi.jpg"}, '/media/hero-artist.jpg', ${input.city.trim()}, false, 'published')
      on conflict (user_id) do update set
        username = excluded.username,
        display_name = excluded.display_name,
        bio = excluded.bio,
        avatar_url = excluded.avatar_url,
        city = excluded.city
    `;
  }
  return ensureProfile(userId);
}

export async function requestCode(email: string, purpose: "verify" | "reset") {
  const normalised = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) throw new Error("Enter a valid email.");
  await assertRate(`${purpose}:${normalised}`, purpose === "reset" ? 5 : 5, 60 * 60 * 1000);
  const recent = await (await getSql())<{ created_at: string | Date }>`
    select created_at from auth_codes where email = ${normalised} and purpose = ${purpose}
    order by created_at desc limit 1
  `;
  if (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < 60_000) {
    throw new Error("Wait a minute before asking for another code.");
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const sql = await getSql();
  await sql`delete from auth_codes where email = ${normalised} and purpose = ${purpose}`;
  await sql`
    insert into auth_codes (id, email, purpose, code_hash, expires_at)
    values (${rid("code")}, ${normalised}, ${purpose}, ${hashCode(code)}, now() + interval '15 minutes')
  `;
  const sent = await sendEmail(normalised, code, purpose);
  return sent.delivered ? { delivered: true as const } : { delivered: false as const, devCode: code, reason: sent.reason };
}

async function sendEmail(email: string, code: string, purpose: "verify" | "reset") {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { delivered: false as const, reason: "Email is not configured. Set RESEND_API_KEY." };
  const from = process.env.EMAIL_FROM?.trim() || "Vibez <onboarding@vibez.ng>";
  const subject = purpose === "reset" ? "Reset your Vibez password" : "Your Vibez verification code";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject,
      text: `Your Vibez code is ${code}. It expires in 15 minutes. If you did not ask for it, ignore this email.`,
    }),
  });
  if (!response.ok) {
    return { delivered: false as const, reason: "The email provider rejected the message. Check RESEND_API_KEY and EMAIL_FROM." };
  }
  return { delivered: true as const, reason: "" };
}

export async function confirmCode(email: string, purpose: "verify" | "reset", code: string, userId?: string) {
  const normalised = email.trim().toLowerCase();
  const sql = await getSql();
  const rows = await sql<{ id: string; code_hash: string; expires_at: string | Date; attempts: number }>`
    select id, code_hash, expires_at, attempts from auth_codes
    where email = ${normalised} and purpose = ${purpose}
    order by created_at desc limit 1
  `;
  const row = rows[0];
  if (!row) throw new Error("That code is not active. Request a new one.");
  if (new Date(row.expires_at).getTime() < Date.now() || Number(row.attempts) >= 5) {
    throw new Error("That code has expired. Request a new one.");
  }
  if (row.code_hash !== hashCode(code.trim())) {
    await sql`update auth_codes set attempts = attempts + 1 where id = ${row.id}`;
    throw new Error("That code does not match.");
  }
  await sql`delete from auth_codes where email = ${normalised} and purpose = ${purpose}`;
  if (purpose === "verify" && userId) {
    await sql`update profiles set email_verified = true, updated_at = now() where user_id = ${userId}`;
    await sql`update "user" set "emailVerified" = true where id = ${userId}`;
    await notify(userId, "account", "Email verified", "Your Vibez email is verified.", "/profile");
  }
  return { ok: true as const };
}

export async function resetPassword(email: string, code: string, nextPassword: string) {
  if (nextPassword.length < 8) throw new Error("Use at least 8 characters.");
  await confirmCode(email, "reset", code);
  const sql = await getSql();
  const users = await sql<{ id: string }>`select id from "user" where lower(email) = ${email.trim().toLowerCase()}`;
  if (!users[0]) throw new Error("No account uses that email.");
  const { auth } = await import("@/lib/auth/server");
  const ctx = (await auth.$context) as { password: { hash: (value: string) => Promise<string> } };
  const hashed = await ctx.password.hash(nextPassword);
  const updated = await sql`
    update account set password = ${hashed}, "updatedAt" = now()
    where "userId" = ${users[0].id} and "providerId" = 'credential'
    returning id
  `;
  if (!updated.length) throw new Error("This account has no password to reset.");
  await notify(users[0].id, "account", "Password updated", "Your Vibez password was changed.", "/login");
  return { ok: true as const };
}

export async function profileBundle(userId: string, email?: string | null) {
  const profile = await ensureProfile(userId);
  const sql = await getSql();
  const staffRole = await isStaff(userId, email);
  const follows = await sql<{ count: number }>`select count(*)::int as count from artist_follows where user_id = ${userId}`;
  const saved = await sql<{ count: number }>`select count(*)::int as count from saved_tracks where user_id = ${userId}`;
  const savedEvents = await sql<{ count: number }>`select count(*)::int as count from saved_events where user_id = ${userId}`;
  const ticketCount = await sql<{ count: number }>`
    select count(*)::int as count from tickets t
    join orders o on o.id = t.order_id
    where o.user_id = ${userId} and o.status = 'paid'
  `;
  const organiser = await sql<{ status: string; display_name: string; paystack_subaccount: string }>`
    select status, display_name, paystack_subaccount from organiser_profiles where user_id = ${userId}
  `;
  const advertiser = await sql<{ status: string; business_name: string }>`
    select status, business_name from advertiser_profiles where user_id = ${userId}
  `;
  const unread = await sql<{ count: number }>`
    select count(*)::int as count from notifications where user_id = ${userId} and read_at is null
  `;
  return {
    profile,
    staffRole,
    stats: {
      following: Number(follows[0]?.count ?? 0),
      saved: Number(saved[0]?.count ?? 0),
      savedEvents: Number(savedEvents[0]?.count ?? 0),
      tickets: Number(ticketCount[0]?.count ?? 0),
    },
    organiser: organiser[0] ?? null,
    advertiser: advertiser[0] ?? null,
    unread: Number(unread[0]?.count ?? 0),
    integrations: integrations(),
  };
}

export async function setNotifications(userId: string, input: PublicProfile["notifications"]) {
  await requireActive(userId);
  const sql = await getSql();
  await sql`
    update profiles set
      notify_email = ${input.email},
      notify_releases = ${input.releases},
      notify_events = ${input.events},
      notify_campaigns = ${input.campaigns},
      updated_at = now()
    where user_id = ${userId}
  `;
  return ensureProfile(userId);
}

export async function requestDeletion(userId: string) {
  const sql = await getSql();
  await sql`update profiles set deletion_requested_at = now(), updated_at = now() where user_id = ${userId}`;
  return { ok: true as const };
}

export async function toggleFollow(userId: string, username: string) {
  await requireActive(userId);
  const sql = await getSql();
  const artists = await sql<{ id: string }>`select id from artist_profiles where username = ${cleanUsername(username)}`;
  if (!artists[0]) throw new Error("That artist is not on Vibez.");
  const existing = await sql`select 1 from artist_follows where user_id = ${userId} and artist_id = ${artists[0].id}`;
  if (existing.length) {
    await sql`delete from artist_follows where user_id = ${userId} and artist_id = ${artists[0].id}`;
    return { following: false };
  }
  await sql`insert into artist_follows (user_id, artist_id) values (${userId}, ${artists[0].id})`;
  return { following: true };
}

export async function toggleSaveTrack(userId: string, releaseId: string) {
  await requireActive(userId);
  const sql = await getSql();
  const existing = await sql`select 1 from saved_tracks where user_id = ${userId} and release_id = ${releaseId}`;
  if (existing.length) {
    await sql`delete from saved_tracks where user_id = ${userId} and release_id = ${releaseId}`;
    return { saved: false };
  }
  await sql`insert into saved_tracks (user_id, release_id) values (${userId}, ${releaseId})`;
  return { saved: true };
}

export async function toggleSaveEvent(userId: string, slug: string) {
  await requireActive(userId);
  const sql = await getSql();
  const existing = await sql`select 1 from saved_events where user_id = ${userId} and event_slug = ${slug}`;
  if (existing.length) {
    await sql`delete from saved_events where user_id = ${userId} and event_slug = ${slug}`;
    return { saved: false };
  }
  await sql`insert into saved_events (user_id, event_slug) values (${userId}, ${slug})`;
  return { saved: true };
}

export async function myLibrary(userId: string) {
  const sql = await getSql();
  const tracks = await sql<{ release_id: string }>`select release_id from saved_tracks where user_id = ${userId} order by created_at desc`;
  const follows = await sql<{ username: string }>`
    select a.username from artist_follows f
    join artist_profiles a on a.id = f.artist_id
    where f.user_id = ${userId}
  `;
  const events = await sql<{ event_slug: string }>`select event_slug from saved_events where user_id = ${userId}`;
  return {
    savedReleaseIds: tracks.map((row) => row.release_id),
    followedUsernames: follows.map((row) => row.username),
    savedEventSlugs: events.map((row) => row.event_slug),
  };
}

export async function listNotifications(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    kind: string;
    title: string;
    body: string;
    href: string | null;
    read_at: string | Date | null;
    created_at: string | Date;
  }>`
    select id, kind, title, body, href, read_at, created_at
    from notifications where user_id = ${userId}
    order by created_at desc limit 50
  `;
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    read: Boolean(row.read_at),
    createdAt: iso(row.created_at),
  }));
}

export async function markNotificationsRead(userId: string) {
  const sql = await getSql();
  await sql`update notifications set read_at = now() where user_id = ${userId} and read_at is null`;
  return { ok: true as const };
}

export async function applyOrganiser(userId: string, displayName: string) {
  const profile = await requireActive(userId);
  commercialReady(profile);
  if (!profile.roles.includes("organiser")) throw new Error("Add the organiser role on your profile first.");
  const sql = await getSql();
  await sql`
    insert into organiser_profiles (user_id, display_name, status)
    values (${userId}, ${displayName.trim().slice(0, 80)}, 'pending')
    on conflict (user_id) do update set display_name = excluded.display_name
    where organiser_profiles.status <> 'approved'
  `;
  return { status: "pending" as const };
}

export async function createEventDraft(userId: string, input: {
  title: string;
  category: string;
  city: string;
  venue: string;
  address: string;
  start: string;
  end: string;
  description: string;
  cover: string;
  ageNote: string;
  refundPolicy: string;
  tickets: { name: string; priceNaira: number; quantity: number; detail: string }[];
}) {
  const profile = await requireActive(userId);
  commercialReady(profile);
  const sql = await getSql();
  const org = await sql<{ status: string }>`select status from organiser_profiles where user_id = ${userId}`;
  if (org[0]?.status !== "approved" && process.env.VITE_AUTH_ENABLED !== "false") {
    throw new Error("An admin has to approve your organiser profile before an event can be submitted.");
  }
  if (process.env.VITE_AUTH_ENABLED === "false" && org[0]?.status !== "approved") {
    await sql`
      insert into organiser_profiles (user_id, display_name, status)
      values (${userId}, ${profile.displayName || "Organiser"}, 'approved')
      on conflict (user_id) do update set status = 'approved'
    `;
  }
  const slugBase = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28);
  const slug = `${slugBase || "event"}-${randomBytes(2).toString("hex")}`;
  const curator = "neptune";
  await sql.transaction(async (tx) => {
    await tx`
      insert into events (slug, title, category, city, venue, address, starts_at, ends_at, cover, blurb, description, featured, curator_slug, status, is_sample, age_note, refund_policy, organiser_user_id)
      values (
        ${slug}, ${input.title.trim().slice(0, 120)}, ${input.category}, ${input.city}, ${input.venue.trim()},
        ${input.address.trim()}, ${input.start}, ${input.end || input.start},
        ${input.cover.trim() || "/media/cover-party.jpg"}, ${input.description.trim().slice(0, 180)},
        ${input.description.trim().slice(0, 2000)}, false, ${curator}, 'PENDING', false,
        ${input.ageNote.trim().slice(0, 240)}, ${input.refundPolicy.trim().slice(0, 400)}, ${userId}
      )
    `;
    for (const [index, tier] of input.tickets.entries()) {
      const price = Math.round(Number(tier.priceNaira) * 100);
      const quantity = Math.round(Number(tier.quantity));
      if (!tier.name.trim() || price < 0 || quantity < 1) throw new Error("Each ticket needs a name, price and quantity.");
      await tx`
        insert into ticket_types (event_slug, code, name, detail, price_kobo, quantity, sold)
        values (${slug}, ${`t${index + 1}`}, ${tier.name.trim()}, ${tier.detail.trim() || "Entry"}, ${price}, ${quantity}, 0)
      `;
    }
  });
  await notify(userId, "event", "Event submitted", `${input.title.trim()} is waiting for review.`, "/organise");
  return { slug, status: "PENDING" as const };
}

type OrderRow = {
  id: string;
  user_id: string | null;
  event_slug: string;
  buyer_name: string;
  buyer_email: string;
  status: string;
  reference: string;
  amount_kobo: number;
  subtotal_kobo: number;
  fee_kobo: number;
};

export async function startCheckout(userId: string | null, input: {
  eventSlug: string;
  tierCode: string;
  qty: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}) {
  const qty = Math.round(Number(input.qty));
  if (qty < 1 || qty > 10) throw new Error("Choose between 1 and 10 tickets.");
  if (!input.buyerName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.buyerEmail.trim())) {
    throw new Error("Add the attendee name and email.");
  }
  const sql = await getSql();
  const events = await sql<EventRow>`
    select slug, title, category, city, venue, address, starts_at, ends_at, cover, blurb, description,
           featured, curator_slug, status, is_sample, age_note, refund_policy, organiser_user_id
    from events where slug = ${input.eventSlug}
  `;
  const event = events[0];
  if (!event || event.status !== "PUBLISHED") throw new Error("That event is not on sale.");
  if (event.is_sample) throw new Error("Sample listings are not for sale. Create an event to sell tickets.");
  const tiers = await sql<{ code: string; name: string; price_kobo: number; quantity: number; sold: number }>`
    select code, name, price_kobo, quantity, sold from ticket_types
    where event_slug = ${event.slug} and code = ${input.tierCode}
  `;
  const tier = tiers[0];
  if (!tier) throw new Error("Choose a ticket type.");
  if (Number(tier.quantity) - Number(tier.sold) < qty) throw new Error("Not enough tickets left.");
  const bps = await feeBps(sql);
  const subtotal = Number(tier.price_kobo) * qty;
  const fee = feeKobo(subtotal, bps);
  const amount = subtotal + fee;
  const reference = `vz_${randomBytes(12).toString("hex")}`;
  const orderId = rid("ord");
  if (amount > 0 && !process.env.PAYSTACK_SECRET_KEY?.trim()) {
    return {
      configured: false as const,
      message: "Paystack is not configured. Add PAYSTACK_SECRET_KEY on the server. No order was created and no ticket was issued.",
    };
  }
  await sql.transaction(async (tx) => {
    await tx`
      insert into orders (id, user_id, event_slug, buyer_name, buyer_email, buyer_phone, subtotal_kobo, fee_kobo, amount_kobo, status, reference)
      values (${orderId}, ${userId}, ${event.slug}, ${input.buyerName.trim()}, ${input.buyerEmail.trim().toLowerCase()}, ${input.buyerPhone.trim()}, ${subtotal}, ${fee}, ${amount}, 'pending', ${reference})
    `;
    await tx`
      insert into order_items (id, order_id, ticket_code, name, qty, unit_kobo)
      values (${rid("item")}, ${orderId}, ${tier.code}, ${tier.name}, ${qty}, ${Number(tier.price_kobo)})
    `;
  });
  if (amount === 0) {
    await issueTickets(orderId, null, { free: true });
    return { configured: true as const, free: true as const, reference };
  }
  const secret = process.env.PAYSTACK_SECRET_KEY!.trim();
  const org = event.organiser_user_id
    ? await sql<{ paystack_subaccount: string }>`select paystack_subaccount from organiser_profiles where user_id = ${event.organiser_user_id}`
    : [];
  const subaccount = org[0]?.paystack_subaccount?.trim();
  const payload: Record<string, unknown> = {
    email: input.buyerEmail.trim(),
    amount,
    reference,
    callback_url: `${publicOrigin()}/checkout/return?reference=${reference}`,
    metadata: { order_id: orderId, event_slug: event.slug },
  };
  if (subaccount) {
    payload.subaccount = subaccount;
    payload.transaction_charge = fee;
    payload.bearer = "account";
  }
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as { status?: boolean; data?: { authorization_url?: string } } | null;
  if (!response.ok || !body?.data?.authorization_url) {
    await sql`update orders set status = 'failed' where id = ${orderId}`;
    throw new Error("Paystack did not start the payment. Nothing was charged.");
  }
  return {
    configured: true as const,
    free: false as const,
    reference,
    authorizationUrl: body.data.authorization_url,
    split: Boolean(subaccount),
    message: subaccount ? "" : "This organiser has no Paystack subaccount yet, so the payment is collected by Vibez.",
  };
}

async function issueTickets(orderId: string, providerRef: string | null, extra: { free?: boolean; raw?: unknown }) {
  const sql = await getSql();
  return sql.transaction(async (tx) => {
    const orders = await tx<OrderRow>`select * from orders where id = ${orderId} for update`;
    const order = orders[0];
    if (!order) return { ok: false as const, error: "Order missing." };
    const existing = await tx<{ id: string }>`select id from tickets where order_id = ${order.id}`;
    if (order.status === "paid" || existing.length) return { ok: true as const, already: true };
    const items = await tx<{ ticket_code: string; name: string; qty: number; unit_kobo: number }>`
      select ticket_code, name, qty, unit_kobo from order_items where order_id = ${order.id}
    `;
    for (const item of items) {
      const updated = await tx<{ sold: number }>`
        update ticket_types set sold = sold + ${item.qty}
        where event_slug = ${order.event_slug} and code = ${item.ticket_code}
          and sold + ${item.qty} <= quantity
        returning sold
      `;
      if (!updated.length) {
        await tx`update orders set status = 'needs_refund' where id = ${order.id}`;
        await tx`
          insert into payments (id, order_id, reference, amount_kobo, status, provider_ref, raw)
          values (${rid("pay")}, ${order.id}, ${order.reference}, ${order.amount_kobo}, 'paid_unfulfilled', ${providerRef}, ${JSON.stringify(extra.raw ?? { free: true })}::jsonb)
          on conflict (reference) do nothing
        `;
        return { ok: false as const, error: "Those tickets sold out after payment. The order is marked for a refund review. No ticket was issued." };
      }
      for (let n = 0; n < Number(item.qty); n += 1) {
        await tx`
          insert into tickets (id, order_id, event_slug, public_code, qr_token, category, attendee_name, status)
          values (
            ${rid("tkt")}, ${order.id}, ${order.event_slug}, ${randomBytes(6).toString("hex")},
            ${randomBytes(18).toString("hex")}, ${item.name}, ${order.buyer_name}, 'valid'
          )
        `;
      }
    }
    await tx`update orders set status = 'paid' where id = ${order.id}`;
    await tx`
      insert into payments (id, order_id, reference, amount_kobo, status, provider_ref, raw)
      values (${rid("pay")}, ${order.id}, ${order.reference}, ${order.amount_kobo}, ${extra.free ? "free" : "success"}, ${providerRef}, ${JSON.stringify(extra.raw ?? { free: Boolean(extra.free) })}::jsonb)
      on conflict (reference) do update set status = excluded.status
    `;
    if (order.user_id) {
      await tx`
        insert into notifications (id, user_id, kind, title, body, href)
        values (${rid("ntf")}, ${order.user_id}, 'ticket', 'Tickets ready', 'Your Vibez tickets are in your account.', '/tickets')
      `;
    }
    return { ok: true as const, already: false };
  });
}

export async function fulfillReference(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  const sql = await getSql();
  const orders = await sql<OrderRow>`select * from orders where reference = ${reference}`;
  const order = orders[0];
  if (!order) return { ok: false as const, error: "Unknown payment reference." };
  if (order.status === "paid") return { ok: true as const, already: true, reference };
  if (Number(order.amount_kobo) === 0) {
    await issueTickets(order.id, null, { free: true });
    return { ok: true as const, already: false, reference };
  }
  if (!secret) return { ok: false as const, error: "Paystack is not configured." };
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = (await response.json().catch(() => null)) as { data?: { status?: string; amount?: number; id?: number } } | null;
  const decision = decideFulfillment({
    orderStatus: order.status,
    providerStatus: body?.data?.status ?? null,
    paidAmountKobo: body?.data?.amount != null ? Number(body.data.amount) : null,
    expectedAmountKobo: Number(order.amount_kobo),
    alreadyHasTickets: false,
  });
  if (decision === "reject") {
    await sql`update orders set status = 'failed' where id = ${order.id} and status = 'pending'`;
    await sql`
      insert into payments (id, order_id, reference, amount_kobo, status, raw)
      values (${rid("pay")}, ${order.id}, ${reference}, ${Number(order.amount_kobo)}, 'failed', ${JSON.stringify(body)}::jsonb)
      on conflict (reference) do update set status = 'failed', raw = excluded.raw
    `;
    return { ok: false as const, error: "Paystack has not confirmed this payment. No ticket was issued." };
  }
  const issued = await issueTickets(order.id, body?.data?.id != null ? String(body.data.id) : null, { raw: body });
  return { ...issued, reference };
}

export function webhookTrusted(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) return { ok: false as const, error: "Paystack is not configured." };
  if (!signature || !signaturesMatch(paystackSignature(secret, rawBody), signature)) {
    return { ok: false as const, error: "Invalid signature." };
  }
  return { ok: true as const };
}

export async function myTickets(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    public_code: string;
    category: string;
    attendee_name: string;
    status: string;
    event_slug: string;
    title: string;
    starts_at: string | Date;
    venue: string;
    city: string;
    cover: string;
  }>`
    select t.public_code, t.category, t.attendee_name, t.status, t.event_slug,
           e.title, e.starts_at, e.venue, e.city, e.cover
    from tickets t
    join orders o on o.id = t.order_id
    join events e on e.slug = t.event_slug
    where o.user_id = ${userId}
    order by t.created_at desc
  `;
  return rows.map((row) => ({
    code: row.public_code,
    category: row.category,
    attendee: row.attendee_name,
    status: row.status,
    eventSlug: row.event_slug,
    title: row.title,
    start: iso(row.starts_at),
    venue: row.venue,
    city: row.city,
    cover: row.cover,
  }));
}

export async function ticketDetail(userId: string, code: string) {
  const sql = await getSql();
  const rows = await sql<{
    public_code: string;
    qr_token: string;
    category: string;
    attendee_name: string;
    status: string;
    event_slug: string;
    title: string;
    starts_at: string | Date;
    venue: string;
    city: string;
    cover: string;
    user_id: string | null;
  }>`
    select t.public_code, t.qr_token, t.category, t.attendee_name, t.status, t.event_slug,
           e.title, e.starts_at, e.venue, e.city, e.cover, o.user_id
    from tickets t
    join orders o on o.id = t.order_id
    join events e on e.slug = t.event_slug
    where t.public_code = ${code}
  `;
  const row = rows[0];
  if (!row || row.user_id !== userId) return null;
  const mod = await import("qrcode");
  const QRCode = "default" in mod && mod.default ? mod.default : mod;
  const svg = await QRCode.toString(row.qr_token, { type: "svg", margin: 1, width: 220, errorCorrectionLevel: "M" });
  return {
    code: row.public_code,
    category: row.category,
    attendee: row.attendee_name,
    status: row.status,
    eventSlug: row.event_slug,
    title: row.title,
    start: iso(row.starts_at),
    venue: row.venue,
    city: row.city,
    cover: row.cover,
    qrSvg: svg,
  };
}

export async function scanTicket(userId: string, token: string, eventSlug: string) {
  const sql = await getSql();
  const staffRole = await isStaff(userId);
  const org = await sql<{ organiser_user_id: string | null }>`
    select organiser_user_id from events where slug = ${eventSlug}
  `;
  if (!org[0]) throw new Error("That event does not exist.");
  if (org[0].organiser_user_id !== userId && !staffRole) {
    throw new Error("Only the organiser or Vibez staff can scan this event.");
  }
  const needle = token.trim();
  const found = await sql<{ id: string; status: string; event_slug: string; public_code: string; category: string; attendee_name: string }>`
    select id, status, event_slug, public_code, category, attendee_name
    from tickets where qr_token = ${needle} or public_code = ${needle}
  `;
  const ticket = found[0];
  const record = async (result: string, ticketId: string | null) => {
    await sql`
      insert into ticket_scans (id, ticket_id, event_slug, scanner_user_id, result)
      values (${rid("scan")}, ${ticketId}, ${eventSlug}, ${userId}, ${result})
    `;
  };
  if (!ticket) {
    await record("invalid", null);
    return { result: "invalid" as const, message: "This code is not a Vibez ticket." };
  }
  if (ticket.event_slug !== eventSlug) {
    await record("wrong_event", ticket.id);
    return { result: "wrong_event" as const, message: "This ticket is for a different event." };
  }
  if (ticket.status === "used") {
    await record("already_used", ticket.id);
    return { result: "already_used" as const, message: "This ticket was already used.", code: ticket.public_code };
  }
  if (ticket.status !== "valid") {
    await record("invalid", ticket.id);
    return { result: "invalid" as const, message: "This ticket is not valid for entry." };
  }
  const updated = await sql`
    update tickets set status = 'used', checked_in_at = now()
    where id = ${ticket.id} and status = 'valid'
    returning id
  `;
  if (!updated.length) {
    await record("already_used", ticket.id);
    return { result: "already_used" as const, message: "This ticket was already used." };
  }
  await record("admitted", ticket.id);
  return {
    result: "admitted" as const,
    message: "Admitted.",
    attendee: ticket.attendee_name,
    category: ticket.category,
    code: ticket.public_code,
  };
}

export async function submitMusic(userId: string, input: {
  artistName: string;
  title: string;
  genre: string;
  listeningUrl: string;
  artworkUrl: string;
  description: string;
  placementCode: string;
}) {
  const profile = await requireActive(userId);
  commercialReady(profile);
  if (!profile.roles.includes("artist")) throw new Error("Add the artist role on your profile first.");
  if (!input.title.trim() || !input.listeningUrl.trim()) throw new Error("Add a title and a listening link.");
  const sql = await getSql();
  const products = input.placementCode
    ? await sql<{ price_kobo: number; days: number }>`select price_kobo, days from placement_products where code = ${input.placementCode} and active = true`
    : [];
  const amount = products[0] ? Number(products[0].price_kobo) : 0;
  if (amount > 0 && !integrations().paystack) {
    return { configured: false as const, message: "Paystack is not configured, so a paid placement cannot be booked. You can still submit without a placement." };
  }
  const submissionId = rid("sub");
  await sql`
    insert into music_submissions (id, user_id, artist_name, title, genre, artwork_url, listening_url, description, placement_code, duration_days, status, amount_kobo)
    values (
      ${submissionId}, ${userId}, ${input.artistName.trim().slice(0, 80)}, ${input.title.trim().slice(0, 120)},
      ${input.genre}, ${input.artworkUrl.trim()}, ${input.listeningUrl.trim()}, ${input.description.trim().slice(0, 800)},
      ${input.placementCode}, ${products[0]?.days ?? 7}, 'submitted', ${amount}
    )
  `;
  await notify(userId, "music", "Music submitted", `${input.title.trim()} is in the editorial queue. Payment does not approve it.`, "/studio");
  return { configured: true as const, id: submissionId, amountKobo: amount, status: "submitted" as const };
}

export async function studioData(userId: string) {
  const sql = await getSql();
  const products = await sql`select code, name, price_kobo, days, description from placement_products where active = true order by price_kobo`;
  const submissions = await sql`
    select id, title, status, placement_code, amount_kobo, review_note, created_at
    from music_submissions where user_id = ${userId} order by created_at desc
  `;
  const artist = await sql<{ username: string }>`select username from artist_profiles where user_id = ${userId}`;
  return {
    products: products.map((row) => ({
      code: String(row.code),
      name: String(row.name),
      priceKobo: Number(row.price_kobo),
      days: Number(row.days),
      description: String(row.description),
    })),
    submissions: submissions.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      status: String(row.status),
      placement: String(row.placement_code),
      amountKobo: Number(row.amount_kobo),
      note: String(row.review_note),
      createdAt: iso(row.created_at as string),
    })),
    username: artist[0]?.username ?? null,
    integrations: integrations(),
  };
}

export async function communityBoard() {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    city: string;
    platform: string;
    audience: string;
    estimated_reach: number | null;
    price_kobo: number;
    is_sample: boolean;
  }>`
    select id, name, slug, description, category, city, platform, audience, estimated_reach, price_kobo, is_sample
    from communities where status = 'approved' order by is_sample desc, name
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    city: row.city,
    platform: row.platform,
    audience: row.audience,
    estimatedReach: row.estimated_reach == null ? null : Number(row.estimated_reach),
    priceKobo: Number(row.price_kobo),
    sample: Boolean(row.is_sample),
  }));
}

export async function applyCommunity(userId: string, input: {
  name: string;
  description: string;
  category: string;
  city: string;
  platform: string;
  audience: string;
  priceNaira: number;
}) {
  const profile = await requireActive(userId);
  commercialReady(profile);
  if (!profile.roles.includes("community")) throw new Error("Add the community owner role on your profile first.");
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "community"}-${randomBytes(2).toString("hex")}`;
  const sql = await getSql();
  await sql`
    insert into communities (id, owner_user_id, name, slug, description, category, city, platform, audience, estimated_reach, price_kobo, status, is_sample)
    values (
      ${rid("com")}, ${userId}, ${input.name.trim().slice(0, 80)}, ${slug}, ${input.description.trim().slice(0, 500)},
      ${input.category}, ${input.city}, ${input.platform}, ${input.audience.trim().slice(0, 240)},
      null, ${Math.round(Number(input.priceNaira) * 100)}, 'pending', false
    )
  `;
  return { status: "pending" as const };
}

export async function createCommunityCampaign(userId: string, input: { title: string; listeningUrl: string; note: string; communityIds: string[] }) {
  const profile = await requireActive(userId);
  commercialReady(profile);
  if (!input.communityIds.length) throw new Error("Choose at least one community.");
  const sql = await getSql();
  const communities = await sql<{ id: string; price_kobo: number; is_sample: boolean }>`
    select id, price_kobo, is_sample from communities where status = 'approved' and id = any(${input.communityIds})
  `;
  if (!communities.length) throw new Error("Those communities are not available.");
  if (communities.some((row) => row.is_sample)) {
    throw new Error("Sample communities cannot be booked. They are here to show the marketplace.");
  }
  const amount = communities.reduce((sum, row) => sum + Number(row.price_kobo), 0);
  if (amount > 0 && !integrations().paystack) {
    return { configured: false as const, message: "Paystack is not configured, so a paid community campaign cannot start. No charge was made. Payouts to community owners are not enabled." };
  }
  const campaignId = rid("cmp");
  await sql.transaction(async (tx) => {
    await tx`
      insert into community_campaigns (id, user_id, title, listening_url, note, status, amount_kobo)
      values (${campaignId}, ${userId}, ${input.title.trim()}, ${input.listeningUrl.trim()}, ${input.note.trim()}, 'submitted', ${amount})
    `;
    for (const community of communities) {
      await tx`
        insert into community_assignments (id, campaign_id, community_id, status)
        values (${rid("asg")}, ${campaignId}, ${community.id}, 'invited')
      `;
    }
  });
  return { configured: true as const, id: campaignId, amountKobo: amount, payouts: "Community owner payouts are not enabled. Vibez does not move this money to owners automatically." };
}

export async function myCommunity(userId: string) {
  const sql = await getSql();
  const owned = await sql<{ id: string; name: string; status: string; city: string; platform: string; price_kobo: number; is_sample: boolean }>`
    select id, name, status, city, platform, price_kobo, is_sample from communities where owner_user_id = ${userId} order by created_at desc
  `;
  const incoming = await sql<{ id: string; status: string; evidence_note: string; campaign: string; community: string }>`
    select a.id, a.status, a.evidence_note, c.title as campaign, m.name as community
    from community_assignments a
    join community_campaigns c on c.id = a.campaign_id
    join communities m on m.id = a.community_id
    where m.owner_user_id = ${userId}
    order by a.created_at desc
  `;
  const mine = await sql<{ id: string; title: string; status: string; amount_kobo: number }>`
    select id, title, status, amount_kobo from community_campaigns where user_id = ${userId} order by created_at desc
  `;
  return {
    owned: owned.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      city: row.city,
      platform: row.platform,
      priceKobo: Number(row.price_kobo),
      sample: Boolean(row.is_sample),
    })),
    incoming: incoming.map((row) => ({
      id: row.id,
      status: row.status,
      note: row.evidence_note,
      campaign: row.campaign,
      community: row.community,
    })),
    campaigns: mine.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      amountKobo: Number(row.amount_kobo),
    })),
    payoutsEnabled: false,
  };
}

export async function respondAssignment(userId: string, assignmentId: string, accept: boolean) {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    select a.id from community_assignments a
    join communities m on m.id = a.community_id
    where a.id = ${assignmentId} and m.owner_user_id = ${userId}
  `;
  if (!rows[0]) throw new Error("That invitation is not yours.");
  await sql`update community_assignments set status = ${accept ? "accepted" : "rejected"} where id = ${assignmentId}`;
  return { ok: true as const };
}

export async function submitEvidence(userId: string, assignmentId: string, note: string, url: string) {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    select a.id from community_assignments a
    join communities m on m.id = a.community_id
    where a.id = ${assignmentId} and m.owner_user_id = ${userId} and a.status = 'accepted'
  `;
  if (!rows[0]) throw new Error("Accept the campaign before sending evidence.");
  if (note.trim().length < 8) throw new Error("Describe what was shared.");
  await sql`
    update community_assignments set status = 'delivered', evidence_note = ${note.trim().slice(0, 800)}, evidence_url = ${url.trim().slice(0, 400)}
    where id = ${assignmentId}
  `;
  return { ok: true as const };
}

export async function adInventory() {
  const sql = await getSql();
  const rows = await sql<{ id: string; name: string; placement: string; price_kobo: number; description: string }>`
    select id, name, placement, price_kobo, description from ad_inventory where active = true order by price_kobo
  `;
  return rows.map((row) => ({ ...row, priceKobo: Number(row.price_kobo) }));
}

export async function createAd(userId: string, input: {
  name: string;
  objective: string;
  placement: string;
  headline: string;
  body: string;
  imageUrl: string;
  destinationUrl: string;
  startsOn: string;
  endsOn: string;
  businessName: string;
}) {
  const profile = await requireActive(userId);
  commercialReady(profile);
  if (!profile.roles.includes("advertiser")) throw new Error("Add the advertiser role on your profile first.");
  const sql = await getSql();
  const slots = await sql<{ price_kobo: number }>`select price_kobo from ad_inventory where placement = ${input.placement} and active = true`;
  if (!slots[0]) throw new Error("That placement is not available.");
  await sql`
    insert into advertiser_profiles (user_id, business_name, status)
    values (${userId}, ${input.businessName.trim().slice(0, 80) || profile.displayName || "Advertiser"}, 'pending')
    on conflict (user_id) do nothing
  `;
  const payable = Number(slots[0].price_kobo) > 0;
  const ready = integrations().paystack || !payable;
  const campaignId = rid("ad");
  await sql`
    insert into ad_campaigns (id, user_id, name, objective, placement, headline, body, image_url, destination_url, starts_on, ends_on, budget_kobo, status)
    values (
      ${campaignId}, ${userId}, ${input.name.trim()}, ${input.objective.trim()}, ${input.placement},
      ${input.headline.trim()}, ${input.body.trim()}, ${input.imageUrl.trim()}, ${input.destinationUrl.trim()},
      ${input.startsOn || null}, ${input.endsOn || null}, ${Number(slots[0].price_kobo)},
      ${ready ? "submitted" : "draft"}
    )
  `;
  if (!ready) {
    return { configured: false as const, message: "Paystack is not configured, so this campaign was saved as a draft and was not charged." };
  }
  return { configured: true as const, id: campaignId, status: "submitted" as const };
}

export async function myAds(userId: string) {
  const sql = await getSql();
  const rows = await sql`
    select c.id, c.name, c.status, c.placement, c.budget_kobo,
           (select count(*)::int from ad_events e where e.campaign_id = c.id and e.kind = 'impression') as impressions,
           (select count(*)::int from ad_events e where e.campaign_id = c.id and e.kind = 'click') as clicks
    from ad_campaigns c where c.user_id = ${userId} order by c.created_at desc
  `;
  return rows.map((row) => {
    const impressions = Number(row.impressions) || 0;
    const clicks = Number(row.clicks) || 0;
    return {
      id: String(row.id),
      name: String(row.name),
      status: String(row.status),
      placement: String(row.placement),
      budgetKobo: Number(row.budget_kobo),
      impressions,
      clicks,
      ctr: impressions ? clicks / impressions : null,
    };
  });
}

export async function recordAdEvent(campaignId: string, kind: "impression" | "click") {
  const sql = await getSql();
  const rows = await sql`select id from ad_campaigns where id = ${campaignId} and status = 'active'`;
  if (!rows.length) return { ok: false as const };
  await sql`insert into ad_events (id, campaign_id, kind) values (${rid("ade")}, ${campaignId}, ${kind})`;
  return { ok: true as const };
}

export async function organiserHome(userId: string) {
  const sql = await getSql();
  const events = await sql`
    select slug, title, status, starts_at, city, is_sample from events
    where organiser_user_id = ${userId} order by created_at desc
  `;
  const sales = await sql<{ count: number; amount: number }>`
    select count(*)::int as count, coalesce(sum(o.subtotal_kobo), 0)::int as amount
    from tickets t
    join orders o on o.id = t.order_id
    join events e on e.slug = t.event_slug
    where e.organiser_user_id = ${userId} and o.status = 'paid'
  `;
  return {
    events: events.map((row) => ({
      slug: String(row.slug),
      title: String(row.title),
      status: String(row.status),
      start: iso(row.starts_at as string),
      city: String(row.city),
      sample: Boolean(row.is_sample),
    })),
    ticketsSold: Number(sales[0]?.count ?? 0),
    ticketRevenueKobo: Number(sales[0]?.amount ?? 0),
  };
}

async function audit(actorId: string, action: string, target: string, detail: string) {
  const sql = await getSql();
  await sql`
    insert into audit_log (id, actor_id, action, target, detail)
    values (${rid("aud")}, ${actorId}, ${action}, ${target}, ${detail})
  `;
}

export async function controlOverview(userId: string, email?: string | null) {
  const role = await isStaff(userId, email);
  if (!role) return { allowed: false as const };
  const sql = await getSql();
  const count = async (query: Promise<{ count: number }[]>) => Number((await query)[0]?.count ?? 0);
  const users = await count(sql`select count(*)::int as count from "user"`);
  const artists = await count(sql`select count(*)::int as count from artist_profiles where is_sample = false`);
  const sampleArtists = await count(sql`select count(*)::int as count from artist_profiles where is_sample = true`);
  const organisers = await count(sql`select count(*)::int as count from organiser_profiles where status = 'approved'`);
  const advertisers = await count(sql`select count(*)::int as count from advertiser_profiles`);
  const communities = await count(sql`select count(*)::int as count from communities where is_sample = false and status = 'approved'`);
  const events = await count(sql`select count(*)::int as count from events where status = 'PUBLISHED' and is_sample = false`);
  const tickets = await count(sql`select count(*)::int as count from tickets`);
  const revenue = await sql<{ amount: number }>`select coalesce(sum(amount_kobo), 0)::int as amount from payments where status in ('success', 'free')`;
  const pendingEvents = await sql<{ slug: string; title: string; city: string }>`
    select slug, title, city from events where status = 'PENDING' order by created_at desc limit 20
  `;
  const pendingMusic = await sql<{ id: string; title: string; artist_name: string }>`
    select id, title, artist_name from music_submissions where status = 'submitted' order by created_at desc limit 20
  `;
  const pendingAds = await sql<{ id: string; name: string; placement: string }>`
    select id, name, placement from ad_campaigns where status in ('submitted', 'draft') order by created_at desc limit 20
  `;
  const pendingCommunities = await sql<{ id: string; name: string; city: string }>`
    select id, name, city from communities where status = 'pending' order by created_at desc limit 20
  `;
  const evidence = await sql<{ id: string; evidence_note: string; community: string; campaign: string }>`
    select a.id, a.evidence_note, m.name as community, c.title as campaign
    from community_assignments a
    join communities m on m.id = a.community_id
    join community_campaigns c on c.id = a.campaign_id
    where a.status = 'delivered' limit 20
  `;
  const people = await sql<{ user_id: string; display_name: string; status: string; email: string | null }>`
    select p.user_id, p.display_name, p.status, u.email
    from profiles p
    left join "user" u on u.id = p.user_id
    order by p.created_at desc limit 30
  `;
  const settings = await sql<{ key: string; value_json: unknown }>`select key, value_json from platform_settings`;
  return {
    allowed: true as const,
    role,
    previewAdmin: process.env.VITE_AUTH_ENABLED === "false" && !process.env.DATABASE_URL?.trim(),
    metrics: {
      users,
      artists,
      sampleArtists,
      organisers,
      advertisers,
      communities,
      publishedEvents: events,
      ticketsIssued: tickets,
      paymentKobo: Number(revenue[0]?.amount ?? 0),
    },
    pendingEvents: pendingEvents.map((row) => ({ slug: row.slug, title: row.title, city: row.city })),
    pendingMusic: pendingMusic.map((row) => ({ id: row.id, title: row.title, artistName: row.artist_name })),
    pendingAds: pendingAds.map((row) => ({ id: row.id, name: row.name, placement: row.placement })),
    pendingCommunities: pendingCommunities.map((row) => ({ id: row.id, name: row.name, city: row.city })),
    evidence: evidence.map((row) => ({ id: row.id, note: row.evidence_note, community: row.community, campaign: row.campaign })),
    people: people.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      status: row.status,
      email: row.email ?? "",
    })),
    settings: settings.map((row) => ({ key: row.key, value: JSON.stringify(row.value_json) })),
  };
}

export async function controlAct(userId: string, email: string | null, action: string, target: string, note: string) {
  const role = await isStaff(userId, email);
  if (!role) throw new Error("You do not have Control Room access.");
  const sql = await getSql();
  if (action === "approve-event") {
    await sql`update events set status = 'PUBLISHED' where slug = ${target} and status = 'PENDING'`;
  } else if (action === "reject-event") {
    await sql`update events set status = 'REJECTED' where slug = ${target}`;
  } else if (action === "approve-organiser") {
    await sql`update organiser_profiles set status = 'approved', note = ${note} where user_id = ${target}`;
  } else if (action === "suspend-user") {
    await sql`update profiles set status = 'suspended', updated_at = now() where user_id = ${target}`;
  } else if (action === "restore-user") {
    await sql`update profiles set status = 'active', updated_at = now() where user_id = ${target}`;
  } else if (action === "approve-music") {
    await sql`update music_submissions set status = 'approved', review_note = ${note} where id = ${target}`;
  } else if (action === "reject-music") {
    await sql`update music_submissions set status = 'rejected', review_note = ${note} where id = ${target}`;
  } else if (action === "approve-ad") {
    await sql`update ad_campaigns set status = 'active' where id = ${target}`;
  } else if (action === "reject-ad") {
    await sql`update ad_campaigns set status = 'rejected' where id = ${target}`;
  } else if (action === "approve-community") {
    await sql`update communities set status = 'approved' where id = ${target}`;
  } else if (action === "verify-delivery") {
    await sql`update community_assignments set status = 'verified' where id = ${target} and status = 'delivered'`;
  } else if (action === "hide-sample-artist") {
    await sql`update artist_profiles set status = 'hidden' where id = ${target} and is_sample = true`;
  } else if (action === "set-fee-bps") {
    const bps = Math.max(0, Math.min(3000, Math.round(Number(note))));
    await sql`
      insert into platform_settings (key, value_json) values ('ticket_fee_bps', ${JSON.stringify(bps)}::jsonb)
      on conflict (key) do update set value_json = excluded.value_json, updated_at = now()
    `;
  } else {
    throw new Error("Unknown action.");
  }
  await audit(userId, action, target, note.slice(0, 240));
  return { ok: true as const };
}
