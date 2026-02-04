
# Free Trial Management Implementation Plan

## Overview
Add the ability for admins to grant users a 1-month free Pro trial directly from the admin dashboard. The trial will automatically expire after 30 days, reverting the user to a free account unless they purchase a Pro subscription.

## Architecture

```text
+-------------------+       +----------------------+       +------------------+
|   Admin Page      |  -->  |  admin-dashboard     |  -->  |  profiles table  |
|   Toggle Button   |       |  (grant-trial)       |       |  trial_ends_at   |
+-------------------+       +----------------------+       +------------------+
                                                                    |
                                                                    v
+-------------------+       +----------------------+       +------------------+
|   User Login      |  -->  |  check-subscription  |  <--  |  Check if trial  |
|   & App Usage     |       |  (modified)          |       |  is still active |
+-------------------+       +----------------------+       +------------------+
```

## Implementation Steps

### 1. Database Changes
Add two new columns to the `profiles` table:
- `trial_ends_at` (timestamp, nullable) - When the trial expires
- `trial_granted_by` (uuid, nullable) - Which admin granted the trial (audit trail)

### 2. Update Backend Function: `admin-dashboard`
Add a new action `grant-trial` that:
- Accepts a `user_id` and `action` (grant/revoke)
- Sets `trial_ends_at` to 30 days from now when granting
- Clears `trial_ends_at` when revoking
- Records which admin granted the trial

### 3. Update Backend Function: `check-subscription`
Modify to check for active trial:
- After checking Stripe subscription, also check `profiles.trial_ends_at`
- If `trial_ends_at` is in the future, treat user as subscribed
- Return `trial_ends_at` in response so frontend can show trial status

### 4. Update AuthContext
Add trial state tracking:
- `isTrialActive` - Whether user has an active trial
- `trialEndsAt` - When the trial expires
- Update `checkSubscription` to handle trial response

### 5. Update Admin Page UI
Add a new column to the users table:
- Show current trial status (Active until date / None)
- Add a toggle/button to grant or revoke trial
- Visual indicator for users with active trials

## Security Measures
1. Only admins can grant/revoke trials (server-side check)
2. Trial data stored in secure `profiles` table with RLS
3. Trial expiration checked server-side in `check-subscription`

---

## Technical Details

### Database Migration

```sql
-- Add trial columns to profiles
ALTER TABLE public.profiles
ADD COLUMN trial_ends_at timestamptz DEFAULT NULL,
ADD COLUMN trial_granted_by uuid DEFAULT NULL;
```

### Modified check-subscription Logic

```text
1. Check Stripe subscription (existing)
2. If not subscribed via Stripe:
   a. Query profiles.trial_ends_at
   b. If trial_ends_at > now(), user is "subscribed" via trial
3. Return:
   - subscribed: true/false
   - is_trial: true/false
   - trial_ends_at: timestamp (if applicable)
```

### Admin UI Component

```text
Users Table Row:
+----------------+----------+---------------+---------------+
| Email          | ...      | Trial Status  | Actions       |
+----------------+----------+---------------+---------------+
| user@email.com | ...      | Until Mar 4   | [Revoke]      |
| user2@test.com | ...      | None          | [Grant Trial] |
+----------------+----------+---------------+---------------+
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| Database migration | Create | Add `trial_ends_at` and `trial_granted_by` columns |
| `supabase/functions/admin-dashboard/index.ts` | Modify | Add grant-trial action |
| `supabase/functions/check-subscription/index.ts` | Modify | Check trial status |
| `src/contexts/AuthContext.tsx` | Modify | Track trial state |
| `src/pages/Admin.tsx` | Modify | Add trial toggle UI |

## User Experience Flow

1. **Admin grants trial**: Click "Grant Trial" button next to user
2. **System**: Sets `trial_ends_at` to 30 days from now
3. **User**: Logs in and sees Pro features unlocked
4. **User**: Sees "Trial ends on [date]" messaging in UI
5. **After 30 days**: Trial expires, user reverts to free
6. **User**: Can then choose to purchase Pro subscription

## Edge Cases Handled
- User already has Stripe subscription: Stripe takes precedence
- Admin revokes trial early: Immediately reverts to free
- Trial expires while user is logged in: Next subscription check updates status
- Multiple trial grants: Extends/resets to 30 days from new grant
