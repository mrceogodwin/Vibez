# Vibez requirements checklist

Statuses: Not started, In progress, Implemented, Tested, Verified in staging, Verified in production.

A row is Tested only when an automated test or a checked migration passed in this run. Nothing is verified in staging or production yet. The preview deploy is recorded in the phase report after it is checked.

## Foundation

| Requirement | Status |
| --- | --- |
| Expo SDK 58, Expo Router, one web/iOS/Android codebase | Implemented |
| Vercel web deploy via the Expo server adapter, production left untouched | In progress |
| PWA manifest, icons, and service worker | Implemented |
| `eas.json` and bundle id `ng.vibez.app`, no store submission | Implemented |
| Neon schema `vibez` with FKs, checks, and indexes | Tested |
| Production `public` data left in place | Tested |
| Design tokens and shared controls | Implemented |
| Onboarding, Get Started, login, signup, forgot password, reset, verify | Implemented |
| Authenticated shell and Home on real queries, empty when the tables are empty | Implemented |
| Email/password auth, verification, sessions, recovery | Tested |
| Google sign-in flow, disabled until keys exist | Implemented |
| Apple sign-in route, disabled until keys exist | Implemented |
| RBAC, no self-grant, Super Admin only from `SUPER_ADMIN_EMAILS` | Tested |
| Bachs checkout, server retrieve, signed idempotent webhook | Tested |
| Paystack adapter signature check, not the active fulfiller | Tested |
| Immutable ledger and server-side balance | Tested |
| ₦10 room fee, free starts, no reconnect charge, reversal | Tested |
| Plus ₦2,000 / 30 days, manual, no recurring charge | Implemented |
| R2 upload that fails clearly when unset | Tested |
| Lint, typecheck, unit and integration tests | Tested |

## Social, profiles, Discover

| Requirement | Status |
| --- | --- |
| Profiles, follow, privacy, username URLs | Not started |
| Text, photo, and carousel posts, no video posts | Not started |
| Reactions, comments, bookmarks, shares, hashtags | Not started |
| Feed ranking and a chronological option | Not started |
| Discover search that respects blocks and privacy | Not started |
| Notifications and preferences | Not started |
| Report and block | Not started |

## Messaging and communities

| Requirement | Status |
| --- | --- |
| Direct, group, and community chat | Not started |
| Voice notes capped at 30 seconds | Not started |
| Delivery and read receipts, mute, archive, requests | Not started |
| Communities, roles, rules, posts, invitations | Not started |

## Games

| Requirement | Status |
| --- | --- |
| Catalogue of the 20 games, disabled until each is built | Implemented |
| Rooms, seats, ready state, join codes, matchmaking | Not started |
| Server-authoritative moves, timers, reconnect | Not started |
| Room charge only when a match starts | Tested |
| Trial of 3 starts for 30 days, not started at signup | Tested |
| In-game chat and voice notes | Not started |
| Results and history, no video replay | Not started |
| Ludo, Chess, Checkers, Connect Four, Tic-Tac-Toe | Not started |
| Memory Match, Word Battle, Quick Quiz, Would You Rather, Truth or Dare | Not started |
| Never Have I Ever, Emoji Guess, Picture Guess, Story Builder, Rapid Fire | Not started |
| Drawing Challenge, Spot the Difference, Who Knows Who, Classic Cards, Fill in the Blank | Not started |
| Load test of 100 concurrent rooms | Not started |

## Music, podcasts, promotion

| Requirement | Status |
| --- | --- |
| Music discovery separate from licensed streaming | Not started |
| Artist profiles and permanent URLs | Not started |
| Rights declaration, takedown, repeat infringer | Not started |
| Placements with prices unset and inactive | Implemented |
| Podcast shows, episodes, and playback | Not started |
| Community Music Push without private member data, payouts disabled | Not started |
| Advertising placements and real impression/click rows | Not started |

## Events and tickets

| Requirement | Status |
| --- | --- |
| Event listings and ticket types | Not started |
| Checkout, server-side ticket issue, QR validation | Not started |
| Organiser settlement split, commission unset | Implemented |
| Refunds | Not started |

## Wallet, Plus, and admin money

| Requirement | Status |
| --- | --- |
| Bundles ₦500, ₦1,000, ₦2,500, ₦5,000, ₦10,000, no bonus | Implemented |
| Credits do not expire when Plus ends | Implemented |
| Duplicate webhook does not double-credit | Tested |
| Failed and forged webhooks do not credit | Tested |
| Amount mismatch does not credit | Tested |
| Reconciliation job | Not started |
| Dispute auto-debit | Not started |
| Plus benefits | Not started |
| Control Room | Not started |
| Staff provisioning and audit of sensitive actions | Not started |
| Financial reports | Not started |

## Trust

| Requirement | Status |
| --- | --- |
| Rate limits for signup, login, and reset | Tested |
| Same-origin check for cookie mutations | Implemented |
| Account suspension status | Implemented |
| Account deletion workflow | Not started |
| Age policy | Not started |
| Terms, privacy, refund, and music policies beyond the draft pages | Not started |
| Moderation queue and appeals | Not started |
| Backups and a tested restore | Not started |
