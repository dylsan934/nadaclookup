## Root Cause

`supabase/functions/create-checkout/index.ts` only blocks when the user has a Stripe subscription with `status: "active"`. A user on the 14-day free trial has `status: "trialing"`, which the check misses entirely. Every time they click "Start 14-Day Free Trial" again, a brand new Stripe Checkout session is created and (once they complete it) a new `trialing` subscription is attached to the same customer — hence multiple free trials within minutes.

Contributing factors:
1. No check for `status: "trialing"` (or `status: "all"` filtered) before creating the session.
2. No idempotency key on `stripe.checkout.sessions.create`, so even fast double-clicks can produce duplicate sessions.
3. The 4 frontend call sites (`HomePricing`, `UpgradeModal`, `PremiumFeatureGate`, `SavedDrugs`) don't disable the button or guard against double-invoke while the request is in flight.
4. We never persist `stripe_customer_id` / `stripe_subscription_id`, so every check makes a fresh `customers.list` round-trip. This isn't the cause of duplication (Stripe dedupes customers by email here), but it's worth fixing for reliability.

The existing `active`-only filter in `check-subscription` is also why the AuthContext's `isSubscribed` flag stays `false` for trialing users on some paths, making the upgrade buttons keep appearing for someone who already has a trial.

## Fix Plan

### 1. `supabase/functions/create-checkout/index.ts`
- Replace the `status: "active"` query with two queries (or `status: "all"` filtered in code) that block when an existing subscription is in any non-terminal state: `active`, `trialing`, `past_due`, `incomplete`, `unpaid`.
- If found, return `{ url: null, alreadySubscribed: true, status }` with HTTP 200 instead of throwing, so the frontend can show a clear toast.
- Add an idempotency key to `stripe.checkout.sessions.create({ ... }, { idempotencyKey: \`checkout_${user.id}_${ymdHour}\` })` so rapid retries within the same hour return the same session.
- Reuse the resolved `customerId` (already done) and pass `metadata: { app_user_id: user.id }` on both customer creation (when applicable) and the session for traceability.

### 2. `supabase/functions/check-subscription/index.ts`
- Include `status: "trialing"` alongside `active` when deciding `subscribed: true`, and return `is_stripe_trial: true` + `trial_ends_at` from `subscription.trial_end` so the AuthContext correctly treats trialing users as Pro. (Matches what the admin dashboard already does.)

### 3. Frontend guards (4 files)
Add an `isStarting` state and disable the trial button while the request is in flight, plus handle the `alreadySubscribed` response with a toast and a refresh of subscription state:
- `src/components/HomePricing.tsx` — `handleStartTrial`
- `src/components/UpgradeModal.tsx` — `handleUpgrade`
- `src/components/PremiumFeatureGate.tsx` — `handleSubscribe`
- `src/pages/SavedDrugs.tsx` — `handleUpgrade`

### 4. Database — store Stripe IDs (additive, non-breaking)
Add two nullable columns to `public.profiles`:
- `stripe_customer_id text`
- `stripe_subscription_id text`

Populate them from `create-checkout` (customer) and `check-subscription` (subscription) whenever discovered. Future calls prefer the stored ID over `stripe.customers.list({ email })`, which is faster and removes the email-collision edge case. No RLS changes needed — `profiles` already restricts to `auth.uid() = user_id`, and the edge functions use the service role.

## Out of Scope
- Webhook-driven subscription sync (the user's existing pattern is polling via `check-subscription`; we keep it).
- Cleaning up duplicate Stripe subscriptions already created for affected users — that's a manual step (see verification below).

## Verification

After deploying:
1. **Stripe Dashboard → Customers → your test email**: confirm only one customer record, and under Subscriptions only one row with status `trialing` or `active`.
2. Click "Start 14-Day Free Trial" rapidly 5× in the app:
   - First click → opens Checkout in a new tab.
   - Subsequent clicks while pending → button disabled, no new request.
   - After completing checkout, clicking again → toast "You already have an active trial / subscription", no new Stripe objects.
3. In Stripe Dashboard → Developers → Logs, filter by `POST /v1/checkout/sessions` — repeated calls within the same hour with the same idempotency key return the same `cs_…` ID instead of creating new sessions.
4. For users already duplicated: in Stripe Dashboard, cancel the extra `trialing` subscriptions manually (Subscriptions → … → Cancel immediately). Going forward the guard prevents recurrence.

## Summary of Changes
- `supabase/functions/create-checkout/index.ts` — block trialing/past_due/incomplete, add idempotency key, persist `stripe_customer_id`.
- `supabase/functions/check-subscription/index.ts` — recognize `trialing` as subscribed, persist `stripe_subscription_id`.
- `supabase/migrations/<new>` — add `stripe_customer_id`, `stripe_subscription_id` to `profiles`.
- 4 frontend components — disable trial button while pending, handle `alreadySubscribed` response.
