-- Vibez platform tables. Additive and idempotent. Applied once, recorded in _migrations.
-- Reuses events, ticket_types, curators and the Better Auth "user" table.
-- user_id columns are text and are not foreign-keyed, so a local preview user
-- ("dev-user") can persist without a Better Auth row.

alter table events add column if not exists is_sample boolean not null default false;
alter table events add column if not exists age_note text not null default '';
alter table events add column if not exists refund_policy text not null default '';
alter table events add column if not exists organiser_user_id text;
alter table events add column if not exists created_at timestamptz not null default now();

update events set is_sample = true
where slug in (
  'wizkid-live-lagos','detty-december-festival','lagos-night-party','island-sundown',
  'ay-live-december','ph-rooftop','lagos-gaming-finals','abuja-after-hours',
  'benin-year-end','enugu-countdown','ibadan-sound'
);

-- Seeded "sold" figures were catalogue fiction. Real sales increment this column
-- after a verified payment. This update runs only with this migration.
update ticket_types set sold = 0
where event_slug in (select slug from events where is_sample = true);

update events set
  age_note = case when age_note = '' then 'Check the event page before you travel. Sample listings are not on sale.' else age_note end,
  refund_policy = case when refund_policy = '' then 'Sample listings cannot be purchased. Live events publish their own refund policy before tickets go on sale.' else refund_policy end
where is_sample = true;

create table if not exists profiles (
  user_id text primary key,
  username text unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  city text not null default '',
  state text not null default '',
  country text not null default 'Nigeria',
  genres text[] not null default '{}',
  interests text[] not null default '{}',
  event_interests text[] not null default '{}',
  roles text[] not null default '{fan}',
  email_verified boolean not null default false,
  status text not null default 'active',
  notify_email boolean not null default true,
  notify_releases boolean not null default true,
  notify_events boolean not null default true,
  notify_campaigns boolean not null default true,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists auth_codes (
  id text primary key,
  email text not null,
  purpose text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists auth_codes_email_idx on auth_codes (email, purpose, created_at desc);

create table if not exists rate_limits (
  bucket text primary key,
  hits integer not null default 0,
  window_start timestamptz not null default now()
);

create table if not exists music_genres (
  name text primary key,
  sort integer not null default 0
);

create table if not exists artist_profiles (
  id text primary key,
  user_id text unique,
  username text not null unique,
  display_name text not null,
  bio text not null default '',
  avatar_url text not null,
  cover_url text not null,
  verified boolean not null default false,
  website text not null default '',
  city text not null default '',
  socials jsonb not null default '{}',
  is_sample boolean not null default false,
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create table if not exists music_releases (
  id text primary key,
  artist_id text not null references artist_profiles (id) on delete cascade,
  slug text not null,
  title text not null,
  artwork_url text not null,
  genre text not null,
  description text not null default '',
  release_date date,
  duration_seconds integer,
  preview_url text,
  lyrics text,
  links jsonb not null default '[]',
  is_sample boolean not null default false,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  unique (artist_id, slug)
);

create table if not exists artist_follows (
  user_id text not null,
  artist_id text not null references artist_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

create table if not exists saved_tracks (
  user_id text not null,
  release_id text not null references music_releases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, release_id)
);

create table if not exists saved_events (
  user_id text not null,
  event_slug text not null references events (slug) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_slug)
);

create table if not exists notifications (
  id text primary key,
  user_id text not null,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

create table if not exists orders (
  id text primary key,
  user_id text,
  event_slug text not null references events (slug),
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text not null default '',
  subtotal_kobo integer not null,
  fee_kobo integer not null default 0,
  amount_kobo integer not null,
  status text not null default 'pending',
  reference text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_idx on orders (user_id, created_at desc);
create index if not exists orders_event_idx on orders (event_slug, status);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders (id) on delete cascade,
  ticket_code text not null,
  name text not null,
  qty integer not null,
  unit_kobo integer not null
);

create table if not exists payments (
  id text primary key,
  order_id text not null references orders (id),
  provider text not null default 'paystack',
  reference text not null unique,
  amount_kobo integer not null,
  status text not null,
  provider_ref text,
  raw jsonb,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id text primary key,
  order_id text not null references orders (id),
  event_slug text not null,
  public_code text not null unique,
  qr_token text not null unique,
  category text not null,
  attendee_name text not null,
  status text not null default 'valid',
  checked_in_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tickets_event_idx on tickets (event_slug, status);
create index if not exists tickets_order_idx on tickets (order_id);

create table if not exists ticket_scans (
  id text primary key,
  ticket_id text,
  event_slug text not null,
  scanner_user_id text,
  result text not null,
  created_at timestamptz not null default now()
);

create table if not exists organiser_profiles (
  user_id text primary key,
  display_name text not null,
  status text not null default 'pending',
  paystack_subaccount text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists advertiser_profiles (
  user_id text primary key,
  business_name text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists communities (
  id text primary key,
  owner_user_id text,
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default '',
  country text not null default 'Nigeria',
  city text not null default '',
  platform text not null default 'WhatsApp',
  audience text not null default '',
  estimated_reach integer,
  price_kobo integer not null default 0,
  status text not null default 'pending',
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists community_campaigns (
  id text primary key,
  user_id text not null,
  title text not null,
  listening_url text not null default '',
  note text not null default '',
  status text not null default 'draft',
  amount_kobo integer not null default 0,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists community_assignments (
  id text primary key,
  campaign_id text not null references community_campaigns (id) on delete cascade,
  community_id text not null references communities (id),
  status text not null default 'invited',
  evidence_note text not null default '',
  evidence_url text not null default '',
  created_at timestamptz not null default now(),
  unique (campaign_id, community_id)
);

create table if not exists ad_inventory (
  id text primary key,
  name text not null,
  placement text not null unique,
  price_kobo integer not null,
  description text not null default '',
  active boolean not null default true
);

create table if not exists ad_campaigns (
  id text primary key,
  user_id text not null,
  name text not null,
  objective text not null default '',
  placement text not null,
  headline text not null default '',
  body text not null default '',
  image_url text not null default '',
  destination_url text not null default '',
  starts_on date,
  ends_on date,
  budget_kobo integer not null default 0,
  status text not null default 'draft',
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists ad_events (
  id text primary key,
  campaign_id text not null references ad_campaigns (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
create index if not exists ad_events_campaign_idx on ad_events (campaign_id, kind);

create table if not exists placement_products (
  id text primary key,
  name text not null,
  code text not null unique,
  price_kobo integer not null,
  days integer not null default 7,
  description text not null default '',
  active boolean not null default true
);

create table if not exists music_submissions (
  id text primary key,
  user_id text,
  artist_name text not null,
  title text not null,
  genre text not null,
  artwork_url text not null default '',
  listening_url text not null,
  description text not null default '',
  placement_code text not null default '',
  duration_days integer not null default 7,
  status text not null default 'submitted',
  amount_kobo integer not null default 0,
  reference text,
  review_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists homepage_slots (
  id text primary key,
  kind text not null,
  title text not null,
  subtitle text not null default '',
  image_url text not null default '',
  href text not null default '/home',
  sort integer not null default 0,
  active boolean not null default true,
  sponsored boolean not null default false,
  is_sample boolean not null default false
);

create table if not exists platform_settings (
  key text primary key,
  value_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key,
  actor_id text,
  action text not null,
  target text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists staff (
  user_id text primary key,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

create table if not exists link_redirects (
  old_path text primary key,
  new_path text not null,
  created_at timestamptz not null default now()
);

insert into music_genres (name, sort) values
  ('Afrobeats', 1), ('Amapiano', 2), ('Hip-Hop', 3), ('R&B', 4), ('Gospel', 5),
  ('Pop', 6), ('Reggae', 7), ('Dancehall', 8), ('Electronic', 9), ('Alternative', 10)
on conflict (name) do nothing;

insert into platform_settings (key, value_json) values
  ('ticket_fee_bps', '500'::jsonb),
  ('currency', '"NGN"'::jsonb)
on conflict (key) do nothing;

insert into placement_products (id, name, code, price_kobo, days, description) values
  ('plc_featured', 'Featured music', 'featured', 15000000, 7, 'A card in Featured music. Labelled Sponsored after editorial approval.'),
  ('plc_new', 'New release placement', 'new-release', 8000000, 7, 'Shown with new releases for the booked days.'),
  ('plc_genre', 'Genre feature', 'genre', 5000000, 7, 'Pinned inside one genre shelf.'),
  ('plc_spotlight', 'Artist spotlight', 'spotlight', 20000000, 14, 'Homepage artist spotlight. Payment does not guarantee editorial approval.')
on conflict (code) do nothing;

insert into ad_inventory (id, name, placement, price_kobo, description) values
  ('ad_hero', 'Homepage banner', 'homepage-banner', 25000000, 'The home hero. Always labelled Sponsored.'),
  ('ad_card', 'Sponsored homepage card', 'homepage-card', 12000000, 'A card under promotions on Home.'),
  ('ad_event', 'Event promotion', 'event-promotion', 10000000, 'A promoted slot on the events page.'),
  ('ad_music', 'Music promotion', 'music-promotion', 10000000, 'A promoted slot on the music page.')
on conflict (placement) do nothing;

insert into artist_profiles (id, user_id, username, display_name, bio, avatar_url, cover_url, verified, website, city, is_sample, status) values
  ('art_mudi', null, 'mudino', 'Mudi', 'Sample artist profile. Original catalogue entry for the Vibez preview, not an official artist account.', '/media/sample-mudi.jpg', '/media/hero-artist.jpg', false, '', 'Lagos', true, 'published'),
  ('art_ada', null, 'ada-rivers', 'Ada Rivers', 'Sample artist profile used to show how a Vibez page is laid out.', '/media/sample-ada.jpg', '/media/cover-party.jpg', false, '', 'Benin City', true, 'published'),
  ('art_kola', null, 'kola-wave', 'Kola Wave', 'Sample artist profile. Follow counts on this page come only from people who tap Follow.', '/media/sample-kola.jpg', '/media/cover-rooftop.jpg', false, '', 'Abuja', true, 'published'),
  ('art_nia', null, 'nia-gold', 'Nia Gold', 'Sample artist profile for the R&B shelf.', '/media/sample-nia.jpg', '/media/cover-lights.jpg', false, '', 'Port Harcourt', true, 'published'),
  ('art_temi', null, 'temi-lane', 'Temi Lane', 'Sample artist profile. Releases here are not licensed recordings.', '/media/sample-temi.jpg', '/media/cover-stage.jpg', false, '', 'Ibadan', true, 'published')
on conflict (username) do nothing;

insert into music_releases (id, artist_id, slug, title, artwork_url, genre, description, release_date, duration_seconds, preview_url, lyrics, links, is_sample, status) values
  ('rel_montana', 'art_mudi', 'montana', 'Montana', '/media/sample-montana.jpg', 'Afrobeats', 'Sample release. Vibez does not host the master. Use the listening links when an artist adds them.', '2026-11-01', 186, null, null, '[]'::jsonb, true, 'published'),
  ('rel_market', 'art_ada', 'night-market', 'Night Market', '/media/sample-market.jpg', 'Amapiano', 'Sample release for layout and discovery. Not an official recording.', '2026-10-18', 201, null, null, '[]'::jsonb, true, 'published'),
  ('rel_tide', 'art_kola', 'slow-tide', 'Slow Tide', '/media/sample-tide.jpg', 'Hip-Hop', 'Sample release. Playback stays off until a licensed preview URL is saved on the release.', '2026-09-02', 174, null, null, '[]'::jsonb, true, 'published'),
  ('rel_open', 'art_nia', 'open-sky', 'Open Sky', '/media/sample-open.jpg', 'R&B', 'Sample release used to demonstrate the song page.', '2026-08-20', 214, null, null, '[]'::jsonb, true, 'published')
on conflict (artist_id, slug) do nothing;

insert into homepage_slots (id, kind, title, subtitle, image_url, href, sort, active, sponsored, is_sample) values
  ('home_hero', 'hero', 'New music, marked as sample', 'Preview the Vibez home with sample artists. Plays start when a release has a licensed preview.', '/media/hero-artist.jpg', '/@mudino/montana', 0, true, false, true)
on conflict (id) do nothing;

insert into communities (id, owner_user_id, name, slug, description, category, country, city, platform, audience, estimated_reach, price_kobo, status, is_sample) values
  ('com_island', null, 'Island Weekend Sample', 'island-weekend-sample', 'Sample community listing so the marketplace has a shape. It is not a real group and has no member list.', 'Afrobeats', 'Nigeria', 'Lagos', 'WhatsApp', 'People who follow weekend shows. Estimate supplied for the sample, not measured by Vibez.', 0, 2500000, 'approved', true),
  ('com_ph', null, 'Garden City Sample', 'garden-city-sample', 'Sample community listing. No phone numbers are stored.', 'Parties', 'Nigeria', 'Port Harcourt', 'Telegram', 'A sample audience description.', 0, 1500000, 'approved', true)
on conflict (slug) do nothing;
