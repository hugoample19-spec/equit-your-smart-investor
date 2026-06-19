# Plan: Google Auth + Smart Notifications + Backend Migration

## Phase 1 — Enable Lovable Cloud
Enable Cloud (creates Supabase project, injects env, generates `@/integrations/supabase/client`, `auth-middleware`, `_authenticated/route.tsx` layout, `attachSupabaseAuth`).

## Phase 2 — Database schema (one migration)

Tables (all in `public`, RLS enabled, GRANTs included):

- `profiles` — `id uuid PK → auth.users`, `display_name`, `avatar_url`, `friend_code char(8) unique`, `starting_balance numeric`, `onboarded bool`, `created_at`. Auto-created via `handle_new_user` trigger on `auth.users` insert; pulls name/photo from Google `raw_user_meta_data`, generates unique 8-digit code.
- `holdings` — `user_id`, `ticker`, `shares`, `avg_cost`. (Portfolio migration.)
- `transactions` — `user_id`, `ticker`, `type` (buy/sell), `shares`, `price`, `executed_at`. (For real perf chart.)
- `friendships` — `user_id`, `friend_id`, `status` (pending/accepted), `created_at`. Unique pair.
- `news_reads` — `user_id`, `read_date date`. Unique. Used by notification engine.
- `leaderboard_snapshots` — `user_id`, `rank`, `return_pct`, `snapshot_date`. Used for ranking-change notifications.
- `notification_prefs` — `user_id PK`, `friend_alerts bool`, `news_reminder bool`, `daily_summary bool`, `push_subscription jsonb` (Web Push endpoint).
- `notifications` — `user_id`, `priority int`, `category`, `title`, `body`, `created_at`, `read_at`. In-app inbox + daily cap source of truth.

RLS: every table scoped to `auth.uid() = user_id`. `profiles` adds permissive `SELECT TO authenticated` (friend lookup by code). `friendships` allows either side to read.

## Phase 3 — Auth UX

- New public route `/auth` with a single primary **"Continuar con Google"** button (Google logo, clean white card matching app design). Email/password collapsed below as secondary.
- Call `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- `supabase--configure_social_auth` for Google in same turn.
- Root `onAuthStateChange` listener filtered to `SIGNED_IN`/`SIGNED_OUT`/`USER_UPDATED`, invalidates router + queries.
- Post-login routing: server fn `getOnboardingStatus` → if `!onboarded`, redirect to `/onboarding/balance`; else `/`.
- New `/onboarding/balance` (under `_authenticated/`) — starting cash input → writes profile, marks onboarded.
- Session persists automatically via Supabase localStorage.

## Phase 4 — Move app data to Supabase

- New `src/lib/portfolio.functions.ts`: `getHoldings`, `addTransaction`, `getTransactions` (all `requireSupabaseAuth`).
- New `src/lib/friends.functions.ts`: `getFriends`, `addFriendByCode`, `getFriendReturns`.
- Rewire `app-context.tsx` to hydrate from server fns via TanStack Query; keep localStorage only as offline cache fallback.
- Wallet, Home, Perfil, Referentes "copy portfolio", chat read from Supabase.

## Phase 5 — Notification engine

**Delivery: Web Push + in-app inbox.**

- Service worker `public/sw.js` for Web Push.
- `requestPushPermission()` helper saves `PushSubscription` to `notification_prefs.push_subscription`.
- Bell icon in header → `/notificaciones` inbox reading `notifications` table.
- Server route `POST /api/public/cron/notifications` (signature-verified with `CRON_SECRET`) — runs hourly via pg_cron. Logic:
  1. **Priority 1 — Friend overtake**: for each user, compare today's return vs each friend's; if a friend just crossed above and not already alerted today → queue with priority 1.
  2. **Priority 2 — News reminder**: if hour ≥ 19 and no row in `news_reads` for today → queue priority 2.
  3. **Priority 3 — Daily summary**: if hour ≥ 21 and (rank change OR |return| ≥ threshold) → queue priority 3.
- Per user per day: select top 2 by priority from queue, insert into `notifications`, push via Web Push (skip categories disabled in prefs).
- `news_reads` row inserted client-side when user opens an article in `/noticias`.

Copy (Spanish, ≤1 emoji):
- P1: `"@{handle} te ha superado en rendimiento esta semana. Tu cartera: X% · La suya: Y%."`
- P2: `"Llevas X días seguidos informándote. Lee una noticia hoy para mantener tu racha."`
- P3a: `"Has subido al puesto #X en el ranking global esta semana 📈"`
- P3b: `"Tu cartera ha cerrado el día en +X%."`

## Phase 6 — Perfil notification settings

New "Notificaciones" card in `/perfil` with 3 switches bound to `notification_prefs`: Alertas de amigos, Recordatorio de noticias, Resumen diario. Also a "Activar notificaciones push" button if permission not granted.

## Technical notes

- `_authenticated/route.tsx` is integration-managed; do not author.
- `supabaseAdmin` only inside cron route handler with `await import()`.
- VAPID keys for Web Push stored as `VAPID_PUBLIC_KEY` (also `VITE_VAPID_PUBLIC_KEY`) + `VAPID_PRIVATE_KEY` secrets.
- Cron triggered by Supabase `pg_cron` hitting the public route hourly with `CRON_SECRET`.
- Daily-cap check: `SELECT count(*) FROM notifications WHERE user_id=$1 AND created_at::date = current_date`.

## Out of scope (confirm if you want included)

- Migrating chat messages to Supabase realtime (currently local-only).
- iOS Web Push requires PWA install; will note but not force install flow.

Estimated scope: large — ~15-20 files created/edited, 1 migration, 2 secrets. Ready to execute on approval.