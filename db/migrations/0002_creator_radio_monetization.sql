-- Vibez creator radio + monetization schema (additive migration)
-- Applied to the connected Neon database on 2026-10-28.
-- Stream credentials must be stored encrypted/hashed and never exposed to clients.

CREATE TABLE IF NOT EXISTS creator_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  genre text NOT NULL DEFAULT 'Mixed genres',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted','private')),
  artwork_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','live','offline','suspended')),
  stream_provider text,
  provider_station_id text,
  stream_key_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_stations_owner_idx ON creator_stations(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS creator_stations_discovery_idx ON creator_stations(status, visibility, genre);

CREATE TABLE IF NOT EXISTS creator_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES creator_stations(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_playlists_station_idx ON creator_playlists(station_id, sort_order);

CREATE TABLE IF NOT EXISTS creator_playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES creator_playlists(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text NOT NULL DEFAULT '',
  source_type text NOT NULL DEFAULT 'external' CHECK (source_type IN ('licensed_upload','licensed_catalog','external')),
  source_reference text,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  rights_status text NOT NULL DEFAULT 'unverified' CHECK (rights_status IN ('unverified','verified','blocked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_playlist_items_order_idx ON creator_playlist_items(playlist_id, sort_order);

CREATE TABLE IF NOT EXISTS creator_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'creator_pro',
  provider text NOT NULL,
  provider_customer_id text,
  provider_subscription_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','past_due','cancelled','expired','failed')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS creator_subscriptions_user_idx ON creator_subscriptions(user_id, status);

CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS station_broadcast_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES creator_stations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','starting','live','ended','failed')),
  provider_session_id text,
  started_at timestamptz,
  ended_at timestamptz,
  listener_peak integer NOT NULL DEFAULT 0 CHECK (listener_peak >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS broadcast_sessions_station_idx ON station_broadcast_sessions(station_id, created_at DESC);
