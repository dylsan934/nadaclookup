## Goal

- Expand weekly movers to top 10 increases + 10 decreases
- Free users (signed in): see only the #1 mover in each list, the other 9 blurred with upgrade CTA
- Signed-out: keep current sign-up prompt
- Pro users: see all 10 + receive a weekly email when a new list publishes

## Site impact of going to top 10

- Payload: ~2 KB extra in `weekly_movers.top_increases/decreases` JSONB. Negligible.
- Page perf: data is precomputed weekly; rendering 20 rows total is trivial.
- UX: longer scroll on `/movers`. Free users still see only 1 row visible (rest blurred), so the upgrade pressure actually increases — "1 of 10" is a stronger hook than "1 of 5".
- SEO: page is auth-gated, no SEO impact.

## Changes

### 1. Edge function — `weekly-movers/index.ts`
- Change `slice(0, 5)` → `slice(0, 10)` for both increases and decreases.
- Next Wednesday's cron run will populate the new size; existing rows stay at 5 until then (UI handles either length).

### 2. Page — `src/pages/WeeklyMovers.tsx`
- Flip free-tier visibility: show **#1 (biggest mover)** unblurred, blur ranks #2–#10.
- Update overlay copy: "9 more locked — Upgrade to Pro to see the full top 10".
- Signed-out branch: unchanged.

### 3. Pro weekly email
- New transactional template `weekly-movers-digest.tsx` — full top 10 increases + decreases, drug name / % change / new price, link to `/movers`.
- New edge function `send-movers-digest`: queries latest `weekly_movers` row, fetches all Pro subscribers' emails (via service role from `auth.users` joined with active subscriptions), invokes `send-transactional-email` per recipient with idempotency key `movers-digest-${effective_date}-${user_id}`.
- Cron: schedule `send-movers-digest` to run shortly after the existing Wed 6AM UTC sync (e.g., Wed 6:30 AM UTC) via pg_cron.
- Respects `profiles.notify_saved_drugs` toggle? → propose adding a separate `notify_weekly_movers` boolean (default true) so users can opt out independently.

### 4. Database migration
- Add `notify_weekly_movers boolean not null default true` to `profiles`.

### 5. Prereq
- Requires Lovable Email infrastructure (domain + setup_email_infra + transactional scaffold). If not yet set up, I'll prompt for the email domain setup dialog before deploying the digest function.

## Open question

- Should the email also respect `notify_large_changes_only` / `large_change_threshold` from `profiles`, or is the weekly digest always the full top 10 regardless of those existing alert preferences? Default assumption: always full top 10 — the digest is separate from per-saved-drug alerts.
