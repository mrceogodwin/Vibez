-- Vibez application schema.
-- Additive only: creates the schema "vibez" and objects inside it.
-- Does not ALTER, DROP, or write to existing public tables.
-- Apply on a Neon branch before production. See docs/migration-plan.md.

CREATE SCHEMA IF NOT EXISTS vibez;

CREATE TABLE IF NOT EXISTS vibez.schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- Identity -------------------------------------------------------------------

CREATE TABLE vibez.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_verified_at timestamptz,
  password_hash text,
  display_name text NOT NULL,
  username text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_deletion')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_username_lowercase CHECK (username = lower(username)),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE TABLE vibez.profiles (
  user_id uuid PRIMARY KEY REFERENCES vibez.users (id) ON DELETE RESTRICT,
  bio text NOT NULL DEFAULT '',
  location text,
  website text,
  avatar_media_id uuid,
  is_private boolean NOT NULL DEFAULT false,
  message_policy text NOT NULL DEFAULT 'everyone' CHECK (message_policy IN ('everyone', 'followers', 'none')),
  follow_policy text NOT NULL DEFAULT 'everyone' CHECK (follow_policy IN ('everyone', 'approval')),
  show_online boolean NOT NULL DEFAULT true,
  verified_at timestamptz
);

CREATE TABLE vibez.user_settings (
  user_id uuid PRIMARY KEY REFERENCES vibez.users (id) ON DELETE RESTRICT,
  push_enabled boolean NOT NULL DEFAULT false,
  email_enabled boolean NOT NULL DEFAULT true,
  marketing_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE vibez.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  step_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON vibez.sessions (user_id) WHERE revoked_at IS NULL;

CREATE TABLE vibez.auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('email_verify', 'password_reset')),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_tokens_user_idx ON vibez.auth_tokens (user_id, purpose);

CREATE TABLE vibez.oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_subject text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject)
);

CREATE TABLE vibez.oauth_states (
  state_hash text PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('google', 'apple')),
  redirect_to text,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.permissions (
  code text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE vibez.roles (
  code text PRIMARY KEY,
  description text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false
);

CREATE TABLE vibez.role_permissions (
  role_code text NOT NULL REFERENCES vibez.roles (code),
  permission_code text NOT NULL REFERENCES vibez.permissions (code),
  PRIMARY KEY (role_code, permission_code)
);

CREATE TABLE vibez.user_roles (
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  role_code text NOT NULL REFERENCES vibez.roles (code),
  granted_by uuid REFERENCES vibez.users (id),
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_code)
);

CREATE TABLE vibez.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  reason text,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON vibez.audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON vibez.audit_logs (actor_id, created_at DESC);

CREATE TABLE vibez.rate_limits (
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL CHECK (hits > 0),
  PRIMARY KEY (bucket, window_start)
);

-- Media ----------------------------------------------------------------------

CREATE TABLE vibez.media_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  object_key text NOT NULL UNIQUE,
  content_type text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  status text NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),
  visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
  purpose text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX media_owner_idx ON vibez.media_objects (owner_id, created_at DESC);

-- Social ---------------------------------------------------------------------

CREATE TABLE vibez.follows (
  follower_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX follows_followee_idx ON vibez.follows (followee_id) WHERE status = 'active';

CREATE TABLE vibez.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN (
    'text', 'photo', 'carousel', 'music_share', 'podcast_share',
    'event_share', 'community_update', 'game_activity'
  )),
  body text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX posts_feed_idx ON vibez.posts (created_at DESC) WHERE deleted_at IS NULL AND visibility = 'public';
CREATE INDEX posts_author_idx ON vibez.posts (author_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE vibez.post_media (
  post_id uuid NOT NULL REFERENCES vibez.posts (id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES vibez.media_objects (id),
  position integer NOT NULL CHECK (position >= 0),
  PRIMARY KEY (post_id, position)
);

CREATE TABLE vibez.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES vibez.posts (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  parent_id uuid REFERENCES vibez.comments (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX comments_post_idx ON vibez.comments (post_id, created_at);

CREATE TABLE vibez.reactions (
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('like', 'love', 'fire', 'clap')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE TABLE vibez.bookmarks (
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES vibez.posts (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE vibez.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES vibez.posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.hashtags (
  tag text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.post_hashtags (
  post_id uuid NOT NULL REFERENCES vibez.posts (id) ON DELETE CASCADE,
  tag text NOT NULL REFERENCES vibez.hashtags (tag),
  PRIMARY KEY (post_id, tag)
);

CREATE TABLE vibez.blocks (
  blocker_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- Messaging ------------------------------------------------------------------

CREATE TABLE vibez.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('direct', 'group', 'community')),
  title text,
  community_id uuid,
  created_by uuid REFERENCES vibez.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.conversation_members (
  conversation_id uuid NOT NULL REFERENCES vibez.conversations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  muted_until timestamptz,
  archived_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX conversation_members_user_idx ON vibez.conversation_members (user_id);

CREATE TABLE vibez.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES vibez.conversations (id) ON DELETE CASCADE,
  sender_id uuid REFERENCES vibez.users (id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('text', 'image', 'voice', 'system')),
  body text,
  reply_to_id uuid REFERENCES vibez.messages (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX messages_conversation_idx ON vibez.messages (conversation_id, created_at);

CREATE TABLE vibez.message_media (
  message_id uuid PRIMARY KEY REFERENCES vibez.messages (id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES vibez.media_objects (id)
);

CREATE TABLE vibez.message_receipts (
  message_id uuid NOT NULL REFERENCES vibez.messages (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  delivered_at timestamptz,
  read_at timestamptz,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE vibez.voice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL UNIQUE REFERENCES vibez.messages (id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES vibez.media_objects (id),
  duration_ms integer NOT NULL CHECK (duration_ms > 0 AND duration_ms <= 30000)
);

-- Communities ----------------------------------------------------------------

CREATE TABLE vibez.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text,
  image_media_id uuid REFERENCES vibez.media_objects (id),
  visibility text NOT NULL CHECK (visibility IN ('public', 'private', 'approval')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX communities_public_idx ON vibez.communities (created_at DESC) WHERE visibility = 'public' AND status = 'active';

CREATE TABLE vibez.community_members (
  community_id uuid NOT NULL REFERENCES vibez.communities (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  status text NOT NULL CHECK (status IN ('active', 'pending', 'banned')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE vibez.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES vibez.communities (id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX community_posts_idx ON vibez.community_posts (community_id, created_at DESC);

CREATE TABLE vibez.community_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES vibez.communities (id) ON DELETE CASCADE,
  position integer NOT NULL,
  body text NOT NULL,
  UNIQUE (community_id, position)
);

ALTER TABLE vibez.conversations
  ADD CONSTRAINT conversations_community_fk
  FOREIGN KEY (community_id) REFERENCES vibez.communities (id) ON DELETE CASCADE;

-- Games ----------------------------------------------------------------------

CREATE TABLE vibez.games (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  min_players integer NOT NULL CHECK (min_players >= 1),
  max_players integer NOT NULL CHECK (max_players >= min_players),
  formats jsonb NOT NULL,
  supports_solo boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL
);

CREATE TABLE vibez.game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code text NOT NULL REFERENCES vibez.games (code),
  host_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  join_code text NOT NULL UNIQUE,
  visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
  status text NOT NULL CHECK (status IN ('waiting', 'ready', 'starting', 'active', 'completed', 'cancelled')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX game_rooms_status_idx ON vibez.game_rooms (status, created_at DESC);

CREATE TABLE vibez.game_room_players (
  room_id uuid NOT NULL REFERENCES vibez.game_rooms (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  seat integer NOT NULL CHECK (seat >= 0),
  team text,
  ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  PRIMARY KEY (room_id, user_id),
  UNIQUE (room_id, seat)
);

CREATE TABLE vibez.game_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES vibez.game_rooms (id) ON DELETE CASCADE,
  seq bigint NOT NULL,
  actor_id uuid REFERENCES vibez.users (id),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, seq)
);

CREATE TABLE vibez.game_state_snapshots (
  room_id uuid NOT NULL REFERENCES vibez.game_rooms (id) ON DELETE CASCADE,
  seq bigint NOT NULL,
  state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, seq)
);

CREATE TABLE vibez.game_results (
  room_id uuid PRIMARY KEY REFERENCES vibez.game_rooms (id) ON DELETE CASCADE,
  winner_user_id uuid REFERENCES vibez.users (id),
  winner_team text,
  rankings jsonb NOT NULL,
  score jsonb NOT NULL,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  game_code text NOT NULL REFERENCES vibez.games (code),
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size >= 1),
  enqueued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_code)
);

CREATE TABLE vibez.game_trials (
  user_id uuid PRIMARY KEY REFERENCES vibez.users (id) ON DELETE RESTRICT,
  activated_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  free_starts_granted integer NOT NULL CHECK (free_starts_granted >= 0),
  free_starts_used integer NOT NULL DEFAULT 0 CHECK (free_starts_used >= 0 AND free_starts_used <= free_starts_granted)
);

-- Wallet and payments --------------------------------------------------------
-- Amounts are integer kobo (1 NGN = 100 kobo). Bachs is spoken to in decimal
-- naira strings. The ledger is the balance. Corrections are new rows.

CREATE TABLE vibez.wallets (
  user_id uuid PRIMARY KEY REFERENCES vibez.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  amount_kobo bigint NOT NULL CHECK (amount_kobo <> 0),
  currency char(3) NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  entry_type text NOT NULL CHECK (entry_type IN (
    'credit_purchase', 'game_room_fee', 'refund', 'promotional_purchase',
    'gift_purchase', 'admin_adjustment', 'reversal', 'plus_purchase', 'promotional_credit'
  )),
  reference text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  related_type text,
  related_id uuid,
  payment_provider text,
  provider_reference text,
  reason text,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_ledger_sign CHECK (
    entry_type IN ('reversal', 'admin_adjustment')
    OR (entry_type IN ('credit_purchase', 'refund', 'promotional_credit') AND amount_kobo > 0)
    OR (entry_type IN ('game_room_fee', 'promotional_purchase', 'gift_purchase', 'plus_purchase') AND amount_kobo < 0)
  )
);
CREATE INDEX wallet_ledger_user_idx ON vibez.wallet_ledger (user_id, created_at);

CREATE FUNCTION vibez.wallet_balance(p_user uuid) RETURNS bigint
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(amount_kobo), 0)::bigint
  FROM vibez.wallet_ledger
  WHERE user_id = p_user;
$$;

CREATE FUNCTION vibez.reject_ledger_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'wallet_ledger is immutable';
END;
$$;

CREATE TRIGGER wallet_ledger_no_update
  BEFORE UPDATE OR DELETE ON vibez.wallet_ledger
  FOR EACH ROW EXECUTE FUNCTION vibez.reject_ledger_mutation();

CREATE FUNCTION vibez.reject_audit_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are immutable';
END;
$$;

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE OR DELETE ON vibez.audit_logs
  FOR EACH ROW EXECUTE FUNCTION vibez.reject_audit_mutation();

CREATE TABLE vibez.credit_bundles (
  code text PRIMARY KEY,
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  credits bigint NOT NULL CHECK (credits > 0),
  bonus_credits bigint NOT NULL DEFAULT 0 CHECK (bonus_credits >= 0),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL
);

CREATE TABLE vibez.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  purpose text NOT NULL CHECK (purpose IN ('topup', 'plus', 'ticket', 'promotion')),
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  currency char(3) NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
  credits bigint,
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'reversed')),
  provider text NOT NULL CHECK (provider IN ('bachs', 'paystack')),
  idempotency_key text NOT NULL UNIQUE,
  provider_checkout_id text,
  provider_payment_id text,
  checkout_url text,
  bundle_code text REFERENCES vibez.credit_bundles (code),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX payment_orders_provider_checkout_idx
  ON vibez.payment_orders (provider, provider_checkout_id)
  WHERE provider_checkout_id IS NOT NULL;
CREATE INDEX payment_orders_user_idx ON vibez.payment_orders (user_id, created_at DESC);

CREATE FUNCTION vibez.payment_orders_lock_identity() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.amount_kobo IS DISTINCT FROM OLD.amount_kobo
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.purpose IS DISTINCT FROM OLD.purpose
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.provider IS DISTINCT FROM OLD.provider
     OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
     OR NEW.credits IS DISTINCT FROM OLD.credits THEN
    RAISE EXCEPTION 'payment order identity columns are immutable';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER payment_orders_identity
  BEFORE UPDATE ON vibez.payment_orders
  FOR EACH ROW EXECUTE FUNCTION vibez.payment_orders_lock_identity();

CREATE TABLE vibez.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  payment_order_id uuid REFERENCES vibez.payment_orders (id),
  outcome text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

CREATE FUNCTION vibez.reject_payment_event_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'payment_events are immutable';
END;
$$;

CREATE TRIGGER payment_events_no_update
  BEFORE UPDATE OR DELETE ON vibez.payment_events
  FOR EACH ROW EXECUTE FUNCTION vibez.reject_payment_event_mutation();

CREATE TABLE vibez.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_order_id uuid REFERENCES vibez.payment_orders (id),
  ledger_entry_id uuid REFERENCES vibez.wallet_ledger (id),
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  actor_id uuid REFERENCES vibez.users (id),
  provider_refund_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.reconciliation_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_reference text NOT NULL,
  payment_order_id uuid REFERENCES vibez.payment_orders (id),
  provider_amount_kobo bigint,
  ledger_amount_kobo bigint,
  status text NOT NULL CHECK (status IN ('matched', 'mismatch', 'missing_local', 'missing_provider')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_reference)
);

CREATE TABLE vibez.idempotency_keys (
  key text PRIMARY KEY,
  user_id uuid REFERENCES vibez.users (id),
  request_hash text NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.room_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL UNIQUE REFERENCES vibez.game_rooms (id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('free_trial', 'paid')),
  amount_kobo bigint NOT NULL CHECK (amount_kobo >= 0),
  ledger_entry_id uuid REFERENCES vibez.wallet_ledger (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.room_charge_reversals (
  room_charge_id uuid PRIMARY KEY REFERENCES vibez.room_charges (id) ON DELETE RESTRICT,
  ledger_entry_id uuid REFERENCES vibez.wallet_ledger (id),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subscriptions --------------------------------------------------------------

CREATE TABLE vibez.subscription_products (
  code text PRIMARY KEY,
  name text NOT NULL,
  amount_kobo bigint NOT NULL CHECK (amount_kobo > 0),
  interval_days integer NOT NULL CHECK (interval_days > 0),
  renewal text NOT NULL CHECK (renewal = 'manual'),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE vibez.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  product_code text NOT NULL REFERENCES vibez.subscription_products (code),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  payment_order_id uuid NOT NULL UNIQUE REFERENCES vibez.payment_orders (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end > period_start)
);
CREATE INDEX user_subscriptions_user_idx ON vibez.user_subscriptions (user_id, period_end DESC);

CREATE TABLE vibez.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES vibez.user_subscriptions (id),
  payment_order_id uuid NOT NULL UNIQUE REFERENCES vibez.payment_orders (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Music, podcasts, promotion (v1 products folded in; v2 rules win) ----------

CREATE TABLE vibez.artist_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES vibez.artist_profiles (id) ON DELETE RESTRICT,
  slug text NOT NULL,
  title text NOT NULL,
  genre text,
  description text NOT NULL DEFAULT '',
  release_date date,
  listening_url text,
  preview_media_id uuid REFERENCES vibez.media_objects (id),
  artwork_media_id uuid REFERENCES vibez.media_objects (id),
  streaming_rights text NOT NULL DEFAULT 'none' CHECK (streaming_rights IN ('none', 'preview', 'licensed')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artist_id, slug)
);

CREATE TABLE vibez.music_rights_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid NOT NULL REFERENCES vibez.tracks (id) ON DELETE CASCADE,
  declarant_id uuid NOT NULL REFERENCES vibez.users (id),
  statement text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  artwork_media_id uuid REFERENCES vibez.media_objects (id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id uuid NOT NULL REFERENCES vibez.podcasts (id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  audio_media_id uuid REFERENCES vibez.media_objects (id),
  duration_ms integer,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'removed')),
  UNIQUE (podcast_id, slug)
);

CREATE TABLE vibez.music_placements (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price_kobo bigint,
  active boolean NOT NULL DEFAULT false
);

CREATE TABLE vibez.placement_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_code text NOT NULL REFERENCES vibez.music_placements (code),
  artist_id uuid NOT NULL REFERENCES vibez.artist_profiles (id),
  track_id uuid REFERENCES vibez.tracks (id),
  payment_order_id uuid REFERENCES vibez.payment_orders (id),
  status text NOT NULL CHECK (status IN (
    'draft', 'submitted', 'in_review', 'approved', 'rejected', 'scheduled', 'live', 'completed', 'cancelled'
  )),
  starts_at timestamptz,
  ends_at timestamptz,
  sponsored boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  name text NOT NULL,
  objective text,
  placement text NOT NULL,
  status text NOT NULL CHECK (status IN (
    'draft', 'submitted', 'in_review', 'approved', 'payment_pending', 'scheduled', 'active',
    'completed', 'rejected', 'paused', 'cancelled', 'expired'
  )),
  budget_kobo bigint CHECK (budget_kobo IS NULL OR budget_kobo >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  payment_order_id uuid REFERENCES vibez.payment_orders (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES vibez.ad_campaigns (id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES vibez.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES vibez.ad_campaigns (id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES vibez.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.community_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES vibez.artist_profiles (id),
  community_id uuid NOT NULL REFERENCES vibez.communities (id),
  status text NOT NULL CHECK (status IN (
    'draft', 'invited', 'accepted', 'rejected', 'delivered', 'disputed', 'completed', 'cancelled'
  )),
  price_kobo bigint,
  payment_order_id uuid REFERENCES vibez.payment_orders (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.campaign_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES vibez.community_campaigns (id) ON DELETE CASCADE,
  evidence_media_id uuid REFERENCES vibez.media_objects (id),
  notes text,
  status text NOT NULL CHECK (status IN ('submitted', 'verified', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Events and tickets ---------------------------------------------------------

CREATE TABLE vibez.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  venue text,
  address text,
  city text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  artwork_media_id uuid REFERENCES vibez.media_objects (id),
  age_rule text,
  refund_policy text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX events_published_idx ON vibez.events (starts_at) WHERE status = 'published';

CREATE TABLE vibez.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES vibez.events (id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  price_kobo bigint NOT NULL CHECK (price_kobo >= 0),
  quantity integer NOT NULL CHECK (quantity >= 0),
  sales_start timestamptz,
  sales_end timestamptz,
  UNIQUE (event_id, code)
);

CREATE TABLE vibez.ticket_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES vibez.events (id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  payment_order_id uuid UNIQUE REFERENCES vibez.payment_orders (id),
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  gross_kobo bigint NOT NULL CHECK (gross_kobo >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES vibez.ticket_orders (id) ON DELETE RESTRICT,
  ticket_type_id uuid NOT NULL REFERENCES vibez.ticket_types (id),
  token_hash text NOT NULL UNIQUE,
  attendee_name text,
  status text NOT NULL CHECK (status IN ('issued', 'void', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.ticket_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES vibez.tickets (id) ON DELETE RESTRICT,
  scanned_by uuid REFERENCES vibez.users (id),
  result text NOT NULL CHECK (result IN ('admitted', 'already_used', 'invalid', 'void')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ticket_scans_one_admission_idx
  ON vibez.ticket_scans (ticket_id) WHERE result = 'admitted';

CREATE TABLE vibez.organiser_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES vibez.events (id) ON DELETE RESTRICT,
  ticket_order_id uuid NOT NULL UNIQUE REFERENCES vibez.ticket_orders (id) ON DELETE RESTRICT,
  gross_kobo bigint NOT NULL,
  platform_fee_kobo bigint NOT NULL,
  processor_fee_kobo bigint NOT NULL,
  organiser_proceeds_kobo bigint NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'settled', 'reversed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (gross_kobo = platform_fee_kobo + processor_fee_kobo + organiser_proceeds_kobo)
);

-- Operations -----------------------------------------------------------------

CREATE TABLE vibez.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE RESTRICT,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_status_idx ON vibez.reports (status, created_at);

CREATE TABLE vibez.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES vibez.reports (id),
  actor_id uuid NOT NULL REFERENCES vibez.users (id),
  action text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON vibez.notifications (user_id, created_at DESC);

CREATE TABLE vibez.notification_preferences (
  user_id uuid NOT NULL REFERENCES vibez.users (id) ON DELETE CASCADE,
  kind text NOT NULL,
  in_app boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT false,
  push boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, kind)
);

CREATE TABLE vibez.editorial_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement text NOT NULL CHECK (placement IN ('hero', 'trending')),
  title text NOT NULL,
  subtitle text,
  cta_label text,
  cta_path text,
  image_media_id uuid REFERENCES vibez.media_objects (id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sponsored boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.outbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_address text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'undelivered', 'failed')),
  provider text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vibez.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES vibez.users (id) ON DELETE SET NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reference data. Not user content. ------------------------------------------

INSERT INTO vibez.permissions (code, description) VALUES
  ('users.view', 'View member accounts'),
  ('users.suspend', 'Suspend or restore member accounts'),
  ('reports.review', 'Review reports'),
  ('posts.moderate', 'Moderate posts'),
  ('payments.review', 'Review payments'),
  ('refunds.initiate', 'Initiate refunds'),
  ('finance.reports', 'View financial reports'),
  ('events.manage', 'Manage events'),
  ('games.manage', 'Manage the game catalogue'),
  ('staff.manage', 'Create staff and assign non-super-admin roles'),
  ('settings.manage', 'Change platform settings'),
  ('audit.view', 'View the audit log');

INSERT INTO vibez.roles (code, description, is_staff) VALUES
  ('member', 'Ordinary member', false),
  ('creator', 'Approved creator. Does not grant staff access.', false),
  ('community_admin', 'Community manager. Scoped by community membership.', false),
  ('event_organiser', 'Approved event organiser.', false),
  ('moderator', 'Content moderator', true),
  ('support', 'Support staff', true),
  ('finance', 'Finance staff', true),
  ('super_admin', 'Full platform authority', true);

INSERT INTO vibez.role_permissions (role_code, permission_code)
SELECT 'super_admin', code FROM vibez.permissions;

INSERT INTO vibez.role_permissions (role_code, permission_code) VALUES
  ('moderator', 'reports.review'),
  ('moderator', 'posts.moderate'),
  ('support', 'users.view'),
  ('finance', 'payments.review'),
  ('finance', 'refunds.initiate'),
  ('finance', 'finance.reports'),
  ('finance', 'audit.view');

INSERT INTO vibez.credit_bundles (code, amount_kobo, credits, bonus_credits, sort_order) VALUES
  ('ngn_500', 50000, 500, 0, 1),
  ('ngn_1000', 100000, 1000, 0, 2),
  ('ngn_2500', 250000, 2500, 0, 3),
  ('ngn_5000', 500000, 5000, 0, 4),
  ('ngn_10000', 1000000, 10000, 0, 5);

INSERT INTO vibez.subscription_products (code, name, amount_kobo, interval_days, renewal) VALUES
  ('vibez_plus', 'Vibez Plus', 200000, 30, 'manual');

INSERT INTO vibez.system_settings (key, value) VALUES
  ('currency', '"NGN"'),
  ('kobo_per_credit', '100'),
  ('game_room_fee_kobo', '1000'),
  ('trial_free_starts', '3'),
  ('trial_window_days', '30'),
  ('plus_price_kobo', '200000'),
  ('plus_interval_days', '30'),
  ('plus_renewal', '"manual"'),
  ('plus_benefits_approved', 'false'),
  ('ticketing_fee_bps', 'null'),
  ('minimum_age', 'null');

INSERT INTO vibez.games (code, name, description, min_players, max_players, formats, supports_solo, enabled, sort_order) VALUES
  ('ludo', 'Ludo', 'Classic race around the board.', 2, 4, '["1v1","2v2","free-for-all"]', false, false, 1),
  ('chess', 'Chess', 'Standard chess.', 2, 2, '["1v1"]', false, false, 2),
  ('checkers', 'Checkers / Draughts', 'Draughts on an 8x8 board.', 2, 2, '["1v1"]', false, false, 3),
  ('connect-four', 'Connect Four', 'Four in a row.', 2, 2, '["1v1"]', false, false, 4),
  ('tic-tac-toe', 'Tic-Tac-Toe', 'Three in a row.', 2, 2, '["1v1"]', false, false, 5),
  ('memory-match', 'Memory Match', 'Flip and match pairs.', 1, 4, '["solo","1v1","free-for-all"]', true, false, 6),
  ('word-battle', 'Word Battle', 'Competing word rounds.', 2, 4, '["1v1","free-for-all"]', false, false, 7),
  ('quick-quiz', 'Quick Quiz', 'Short scored questions.', 1, 8, '["solo","1v1","free-for-all"]', true, false, 8),
  ('would-you-rather', 'Would You Rather', 'Choose and compare.', 2, 8, '["1v1","free-for-all"]', false, false, 9),
  ('truth-or-dare', 'Truth or Dare', 'Turns of truth or dare.', 2, 8, '["free-for-all"]', false, false, 10),
  ('never-have-i-ever', 'Never Have I Ever', 'Social prompt rounds.', 2, 8, '["free-for-all"]', false, false, 11),
  ('emoji-guess', 'Emoji Guess', 'Guess the phrase from emoji.', 2, 8, '["1v1","free-for-all"]', false, false, 12),
  ('picture-guess', 'Picture Guess', 'Guess from a picture.', 2, 8, '["1v1","free-for-all"]', false, false, 13),
  ('story-builder', 'Story Builder', 'Take turns adding to a story.', 2, 8, '["free-for-all"]', false, false, 14),
  ('rapid-fire', 'Rapid Fire Questions', 'Fast question rounds.', 2, 8, '["1v1","free-for-all"]', false, false, 15),
  ('drawing-challenge', 'Drawing Challenge', 'Draw and guess.', 2, 8, '["1v1","free-for-all"]', false, false, 16),
  ('spot-the-difference', 'Spot the Difference', 'Find the changes.', 1, 4, '["solo","1v1"]', true, false, 17),
  ('who-knows-who', 'Who Knows Who?', 'Questions about the group.', 3, 8, '["free-for-all"]', false, false, 18),
  ('classic-cards', 'Classic Cards', 'A simple card game with server-side shuffle.', 2, 4, '["1v1","2v2","free-for-all"]', false, false, 19),
  ('fill-in-the-blank', 'Fill in the Blank', 'Complete the prompt.', 2, 8, '["1v1","free-for-all"]', false, false, 20);

INSERT INTO vibez.music_placements (code, name, description, price_kobo, active) VALUES
  ('featured_music', 'Featured Music', 'Homepage or music feature. Price unset until approved.', NULL, false),
  ('new_release', 'New Release Placement', 'New release slot. Price unset until approved.', NULL, false),
  ('artist_spotlight', 'Artist Spotlight', 'Artist feature. Price unset until approved.', NULL, false),
  ('sponsored_music', 'Sponsored Music', 'Paid placement, always labelled sponsored. Price unset until approved.', NULL, false);
