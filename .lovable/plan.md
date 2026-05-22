## Goal
Surface in the admin dashboard whether each user has an active **Stripe free trial** (the 14‑day trial attached to checkout), separate from the legacy admin‑granted trial.

## Why it's not there today
The `admin-dashboard` edge function only fetches Stripe subscriptions with `status: 'active'`. Stripe trial subscriptions report `status: 'trialing'`, so they're invisible to the dashboard. The current "Trial" column only reflects `profiles.trial_ends_at` (admin‑granted trials, now retired).

## Changes

### `supabase/functions/admin-dashboard/index.ts`
- Extend the Stripe subscriptions sweep to also include `status: 'trialing'` (run a second `subscriptions.list` pass, or switch to `status: 'all'` and filter in code to `active`/`trialing`).
- Build a new `stripeTrialByEmail` map capturing `{ trialEnd: ISO, status: 'trialing' }` from subs where `sub.status === 'trialing'` and `sub.trial_end` is set.
- On each enriched user row, add:
  - `stripeTrialing: boolean`
  - `stripeTrialEnd: string | null`
- Treat `stripeTrialing` users as Pro for `isProMember` (they have an active sub) **or** keep Pro strictly paid and add a new bucket — see Question 1.
- Add a new filter case `'stripe-trial'` that returns users where `stripeTrialing === true`.
- Stats: add `stripeActiveTrials` count (and optionally retire `activeTrials`/`trialConversionRate` since manual trial granting is gone — see Question 2).

### `src/pages/Admin.tsx`
- Extend `UserData` with `stripeTrialing` and `stripeTrialEnd`.
- Replace (or augment) the existing "Trial" column to show a "Stripe Trial — until {date}" badge when `stripeTrialing` is true.
- Add a "Stripe Trial" filter chip alongside Pro / Free / Unverified / Admin.
- Update the "Active Trials" stat card to read from `stripeActiveTrials`.

## Open questions
1. Should a user currently on a Stripe trial be counted as **Pro** in stats and the Pro filter, or shown as a distinct **Trial** segment?
2. Now that admin‑granted trials are gone, should I remove the legacy `trial_ends_at`‑based "Trial" column/filter/stat entirely, or keep them for historical visibility?
