## Remove admin "Grant Trial" feature

Stripe already offers a 14-day trial on checkout (`subscription_data.trial_period_days: 14` in `create-checkout`). Admins no longer need to grant trials manually. Existing grandfathered trials must continue working until their `trial_ends_at` date.

### Changes

**`supabase/functions/admin-dashboard/index.ts`**
- Remove the `action === 'grant-trial'` block from the request router.
- Delete the `handleTrialAction` helper.
- Keep `getUsers` returning `trialEndsAt` / `isTrialActive` and `getStats` returning `activeTrials` + `trialConversionRate` so admins can still observe trial activity read-only.

**`src/pages/Admin.tsx`**
- Remove the **Actions** column header and cell (Grant Trial / Revoke buttons).
- Remove `handleTrialAction`, `processingTrialUserId` state, and the `Gift` / `X` icon imports they used.
- Keep the **Trial** column, the **Trial** filter chip, and the **Active Trials** stat card.

### What stays untouched
- `profiles.trial_ends_at` and `profiles.trial_granted_by` columns — existing trial rows preserved.
- `check-subscription` — still honors `trial_ends_at`, so users currently on a granted trial keep Pro access until expiry.
- `create-checkout` — Stripe trial unchanged.
