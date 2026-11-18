# Schema

The executable definition is `db/migrations/0001_vibez_schema.sql`. This note is the relationship map. All tables are in schema `vibez`.

## Identity

`users` is the account. `profiles`, `user_settings`, and `wallets` are 1:1. `sessions`, `auth_tokens`, and `oauth_accounts` belong to a user. `user_roles` joins `users` to `roles`. `role_permissions` joins `roles` to `permissions`. Deleting a user does not cascade into the ledger, profile, or audit history.

## Social and messaging

`follows` is a pair of users. `posts` belong to an author and can have `post_media`, `comments`, `reactions`, `bookmarks`, `post_shares`, and `post_hashtags`. There is no video post kind. `conversations` have `conversation_members` and `messages`. A voice note is a message plus `voice_notes.duration_ms` capped at 30000. `blocks` hide accounts from each other at the data layer once those features are built.

## Communities, music, events

`communities` have members, posts, and rules. `artist_profiles` have `tracks` and `music_rights_declarations`. `tracks.streaming_rights` defaults to `none`. `podcasts` have episodes whose audio is a `media_objects` row, not a bytea column. `events` have `ticket_types`, `ticket_orders`, `tickets`, and `ticket_scans`. One admission scan per ticket is a partial unique index. `organiser_settlements` check that gross equals platform fee plus processor fee plus organiser proceeds.

## Games

`games` holds the 20 launch titles and their formats. Rows are inserted disabled. `game_rooms` have players, ordered `game_events`, snapshots, and one `game_results` row. `game_trials` is one row per user. `room_charges` is unique per room. `room_charge_reversals` is unique per charge.

## Money

`wallet_ledger.user_id` references `users` and cannot be updated or deleted. `payment_orders` reference a user and, for top-ups, a `credit_bundles` row. `payment_events` are unique on `(provider, event_id)` and immutable. `user_subscriptions.payment_order_id` is unique, so one payment activates one Plus period. `refunds` and `reconciliation_records` point at orders and, when present, a ledger row.

## Operations

`audit_logs` are immutable. `reports` can have `moderation_actions`. `notifications` belong to a user. `editorial_features` are the only source for Home heroes. `system_settings` holds the fee, trial, and Plus numbers. `outbound_emails` records delivery attempts without storing the raw token in the body column used by signup (the body stored there is the word `verification`).
