-- Public VIBEZ catalogue. Mirrors the published Event / TicketType / host fields
-- from the production Prisma schema. No customer, order, or auth rows.
create table if not exists curators (
  slug text primary key,
  name text not null,
  role text not null,
  city text not null,
  photo text not null,
  bio text not null
);
create table if not exists events (
  slug text primary key,
  title text not null,
  category text not null,
  city text not null,
  venue text not null,
  address text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  cover text not null,
  blurb text not null,
  description text not null,
  featured boolean not null default false,
  curator_slug text not null references curators (slug),
  status text not null default 'PUBLISHED'
);
create index if not exists events_status_starts_idx on events (status, starts_at);
create index if not exists events_city_category_idx on events (city, category);
create table if not exists ticket_types (
  event_slug text not null references events (slug) on delete cascade,
  code text not null,
  name text not null,
  detail text not null,
  price_kobo integer not null,
  quantity integer not null,
  sold integer not null default 0,
  primary key (event_slug, code)
);
insert into curators (slug, name, role, city, photo, bio) values
  ($v$neptune$v$, $v$Neptune$v$, $v$Host$v$, $v$Lagos$v$, $v$/media/cur-neptune.jpg$v$, $v$Waterfront nights and loud rooms. Neptune programmes concerts and late sets across Lagos Island and the mainland.$v$),
  ($v$toke-makinwa$v$, $v$Toke Makinwa$v$, $v$Host$v$, $v$Lagos$v$, $v$/media/cur-toke.jpg$v$, $v$Parties, conversations and the guest list people actually want. A host profile in the VIBEZ catalogue, not a verified account.$v$),
  ($v$ay-live$v$, $v$AY Live$v$, $v$Comedy$v$, $v$Lagos$v$, $v$/media/cur-ay.jpg$v$, $v$Stand-up nights with a full room and a sharp lineup. Catalogue profile for comedy shows on VIBEZ.$v$),
  ($v$seyi-vibes$v$, $v$Seyi Vibes$v$, $v$Artist$v$, $v$Lagos$v$, $v$/media/cur-seyi.jpg$v$, $v$Live music and street-energy shows. Listed here as an artist profile in the approved catalogue.$v$),
  ($v$tiwa-empire$v$, $v$Tiwa Empire$v$, $v$Host$v$, $v$Lagos$v$, $v$/media/cur-tiwa.jpg$v$, $v$Festivals, all-night parties and the December circuit. A host profile, not a verified organiser badge.$v$)
on conflict (slug) do nothing;
insert into events (slug, title, category, city, venue, address, starts_at, ends_at, cover, blurb, description, featured, curator_slug, status) values
  ($v$wizkid-live-lagos$v$, $v$Wizkid Live in Lagos$v$, $v$Concerts$v$, $v$Lagos$v$, $v$Eko Convention Centre$v$, $v$Eko Hotels, Victoria Island, Lagos$v$, '2026-12-20T18:00:00.000Z'::timestamptz, '2026-12-20T22:30:00.000Z'::timestamptz, $v$/media/cover-wizkid.jpg$v$, $v$A December headline night on the Island.$v$, $v$One night, full production, Eko Convention Centre. Doors, set times and entry rules are published on this page before tickets are released. This listing follows the approved VIBEZ catalogue.$v$, true, $v$seyi-vibes$v$, $v$PUBLISHED$v$),
  ($v$detty-december-festival$v$, $v$Detty December Festival$v$, $v$Festivals$v$, $v$Lagos$v$, $v$Lekki, Lagos$v$, $v$Lekki Phase 1 waterfront, Lagos$v$, '2026-12-26T13:00:00.000Z'::timestamptz, '2026-12-28T22:00:00.000Z'::timestamptz, $v$/media/cover-crowd.jpg$v$, $v$Three days of stages, food and late sets.$v$, $v$A three-day festival across the Detty December weekend. Day tickets and weekend passes are separate. Re-entry rules are printed on the pass.$v$, true, $v$tiwa-empire$v$, $v$PUBLISHED$v$),
  ($v$lagos-night-party$v$, $v$Lagos Night Party$v$, $v$Parties$v$, $v$Lagos$v$, $v$Victoria Island, Lagos$v$, $v$Adeola Odeku, Victoria Island, Lagos$v$, '2026-12-13T21:00:00.000Z'::timestamptz, '2026-12-14T03:00:00.000Z'::timestamptz, $v$/media/cover-party.jpg$v$, $v$A VI party with a late set and a tight room.$v$, $v$Dress code is enforced at the door. Tables are requested separately from entry tickets and are not confirmed until payment clears.$v$, true, $v$toke-makinwa$v$, $v$PUBLISHED$v$),
  ($v$island-sundown$v$, $v$Island Sundown$v$, $v$Parties$v$, $v$Lagos$v$, $v$Victoria Island waterfront$v$, $v$Bar Beach road, Victoria Island, Lagos$v$, now() - interval '2 hours', now() + interval '5 hours', $v$/media/cover-live.jpg$v$, $v$On right now. Doors are open.$v$, $v$A same-day waterfront session. This is the only catalogue listing currently inside its start and end time, so it is the one marked live.$v$, false, $v$neptune$v$, $v$PUBLISHED$v$),
  ($v$ay-live-december$v$, $v$AY Live: December$v$, $v$Shows$v$, $v$Lagos$v$, $v$Eko Hotel Expo Hall$v$, $v$Adetokunbo Ademola, Victoria Island, Lagos$v$, '2026-12-18T18:00:00.000Z'::timestamptz, '2026-12-18T21:30:00.000Z'::timestamptz, $v$/media/cover-show.jpg$v$, $v$A full comedy bill, one sitting.$v$, $v$Assigned seating is not used. Arrive before the opener. Recording during the set is not allowed.$v$, false, $v$ay-live$v$, $v$PUBLISHED$v$),
  ($v$ph-rooftop$v$, $v$Garden City Rooftop$v$, $v$Parties$v$, $v$Port Harcourt$v$, $v$Old GRA rooftop$v$, $v$Forces Avenue, Old GRA, Port Harcourt$v$, '2026-12-06T19:00:00.000Z'::timestamptz, '2026-12-07T01:00:00.000Z'::timestamptz, $v$/media/cover-rooftop.jpg$v$, $v$A Port Harcourt rooftop with a capped guest list.$v$, $v$Capacity is fixed. When regular entry sells through, the tier closes. No door sale is promised.$v$, false, $v$tiwa-empire$v$, $v$PUBLISHED$v$),
  ($v$lagos-gaming-finals$v$, $v$Lagos Gaming Finals$v$, $v$Gaming$v$, $v$Lagos$v$, $v$Landmark Centre$v$, $v$Water Corporation Drive, Victoria Island, Lagos$v$, '2026-12-11T11:00:00.000Z'::timestamptz, '2026-12-11T19:00:00.000Z'::timestamptz, $v$/media/cover-gaming.jpg$v$, $v$Finals day. Spectator tickets only on this page.$v$, $v$Player registration is separate and already closed. Spectator tickets do not include a station or a seat number.$v$, false, $v$neptune$v$, $v$PUBLISHED$v$),
  ($v$abuja-after-hours$v$, $v$Abuja After Hours$v$, $v$Shows$v$, $v$Abuja$v$, $v$Transcorp Hilton grounds$v$, $v$1 Aguiyi Ironsi Street, Maitama, Abuja$v$, '2026-12-15T17:00:00.000Z'::timestamptz, '2026-12-15T21:00:00.000Z'::timestamptz, $v$/media/cover-lights.jpg$v$, $v$An evening show in Maitama.$v$, $v$A seated-leaning evening programme. Children under 16 are not admitted. Venue security sets the final entry check.$v$, false, $v$ay-live$v$, $v$PUBLISHED$v$),
  ($v$benin-year-end$v$, $v$Benin Year-End Grounds$v$, $v$Festivals$v$, $v$Benin City$v$, $v$Ring Road grounds$v$, $v$Ring Road, Benin City$v$, '2026-12-27T14:00:00.000Z'::timestamptz, '2026-12-27T22:00:00.000Z'::timestamptz, $v$/media/cover-festival-alt.jpg$v$, $v$One-day festival on the grounds.$v$, $v$Outdoor programme with two stages. The site can pause entry in heavy rain. Tickets stay valid if the day is moved inside the same weekend.$v$, false, $v$tiwa-empire$v$, $v$PUBLISHED$v$),
  ($v$enugu-countdown$v$, $v$Enugu Countdown$v$, $v$Parties$v$, $v$Enugu$v$, $v$Nike Lake$v$, $v$Nike Lake Resort, Enugu$v$, '2026-12-31T20:00:00.000Z'::timestamptz, '2027-01-01T02:00:00.000Z'::timestamptz, $v$/media/cover-phones.jpg$v$, $v$New Year's Eve by the lake.$v$, $v$Countdown entry closes at 12:30 AM. Wristbands are checked at the gate. A hold on VIBEZ is not an entry band.$v$, false, $v$toke-makinwa$v$, $v$PUBLISHED$v$),
  ($v$ibadan-sound$v$, $v$Ibadan Sound$v$, $v$Concerts$v$, $v$Ibadan$v$, $v$Cultural Centre$v$, $v$Cultural Centre, Mokola, Ibadan$v$, '2026-12-22T17:00:00.000Z'::timestamptz, '2026-12-22T21:30:00.000Z'::timestamptz, $v$/media/cover-stage.jpg$v$, $v$A weeknight concert in Mokola.$v$, $v$One stage, one headliner, support before 7:30 PM. Parking is outside the gate and is not included.$v$, false, $v$seyi-vibes$v$, $v$PUBLISHED$v$)
on conflict (slug) do nothing;
insert into ticket_types (event_slug, code, name, detail, price_kobo, quantity, sold) values
  ($v$wizkid-live-lagos$v$, $v$ga$v$, $v$Regular$v$, $v$Standing access$v$, 1500000, 8000, 2410),
  ($v$wizkid-live-lagos$v$, $v$vip$v$, $v$VIP$v$, $v$Raised bay and lounge$v$, 5000000, 600, 188),
  ($v$detty-december-festival$v$, $v$day$v$, $v$Day pass$v$, $v$One festival day$v$, 500000, 12000, 4300),
  ($v$detty-december-festival$v$, $v$wknd$v$, $v$Weekend$v$, $v$All three days$v$, 1200000, 4000, 1660),
  ($v$lagos-night-party$v$, $v$entry$v$, $v$Entry$v$, $v$Before 1:00 AM$v$, 1000000, 700, 260),
  ($v$lagos-night-party$v$, $v$late$v$, $v$Late entry$v$, $v$After 1:00 AM$v$, 1500000, 300, 40),
  ($v$island-sundown$v$, $v$walk$v$, $v$Walk-up$v$, $v$Entry while the session is on$v$, 800000, 250, 90),
  ($v$ay-live-december$v$, $v$std$v$, $v$Standard$v$, $v$General entry$v$, 750000, 2500, 980),
  ($v$ay-live-december$v$, $v$front$v$, $v$Front block$v$, $v$Closer rows$v$, 1500000, 400, 210),
  ($v$ph-rooftop$v$, $v$entry$v$, $v$Entry$v$, $v$Rooftop access$v$, 600000, 350, 140),
  ($v$lagos-gaming-finals$v$, $v$spec$v$, $v$Spectator$v$, $v$Hall access$v$, 400000, 1500, 640),
  ($v$abuja-after-hours$v$, $v$ga$v$, $v$Regular$v$, $v$Evening entry$v$, 350000, 900, 220),
  ($v$benin-year-end$v$, $v$ga$v$, $v$Grounds$v$, $v$General access$v$, 400000, 5000, 860),
  ($v$enugu-countdown$v$, $v$ga$v$, $v$Countdown$v$, $v$Gate entry$v$, 1200000, 1200, 540),
  ($v$enugu-countdown$v$, $v$table$v$, $v$Table of 6$v$, $v$Reserved table$v$, 8000000, 40, 18),
  ($v$ibadan-sound$v$, $v$ga$v$, $v$Regular$v$, $v$Standing$v$, 500000, 3000, 740)
on conflict (event_slug, code) do nothing;
