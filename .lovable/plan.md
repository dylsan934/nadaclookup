## Admin page upgrade

Add engagement data, filters/sorting, and revenue/MRR summary to the admin dashboard. No new admin actions — read-only data additions.

### 1. Engagement columns (in users table)

New columns per user:
- **Lifetime saves** — `profiles.lifetime_saves_count` (already returned, surface it)
- **Alerts received** — count from `price_alerts` per user
- **Last activity** — max of `last_sign_in_at`, most recent `saved_drugs.created_at`, and most recent `price_alerts.sent_at`
- **Notification opt-ins** — compact icons for `notify_weekly_movers` + `notify_saved_drugs` from `profiles`

### 2. Filters + sorting

Above the users table:
- Filter chips: **All / Pro / Trial / Free / Unverified / Admin**
- Sortable column headers: Joined, Last Sign In, Last Activity, Saved Drugs, Lifetime Saves, Alerts
- Existing email search stays

Filtering/sorting handled server-side via new query params (`filter`, `sort`, `order`) on the `users` action.

### 3. Revenue / MRR summary card

New row of summary cards above (or alongside) the existing stats grid:
- **Active Pro subscribers** — count of users with active Stripe subscription
- **MRR** — sum of active subscription prices (one tier at $29/mo → count × $29, with safe fallback that reads the actual Stripe price amount)
- **Active trials** — count of `profiles` with `trial_ends_at > now()`
- **Trial → Paid conversion** — `% of users who had a trial and now have an active subscription`

### Technical details

**Edge function `admin-dashboard`:**
- Extend `getStats` to also return: `activeProCount`, `mrrCents`, `activeTrials`, `trialConversionRate`. Pull Stripe active subscriptions in one pass (`stripe.subscriptions.list({ status: 'active', limit: 100 })`) and sum `items.data[0].price.unit_amount` for MRR; cross-reference customer emails to count trial conversions.
- Extend `getUsers` to:
  - Return `alertsReceivedCount`, `lastActivityAt`, `notifyWeeklyMovers`, `notifySavedDrugs`
  - Accept `filter` (pro|trial|free|unverified|admin), `sort`, `order` params and apply in-memory (sorting/filtering happens after enrichment since Pro status comes from Stripe).
- Continue to compute Stripe Pro status the same way per page (keeps current behavior).

**Frontend `src/pages/Admin.tsx`:**
- Update `UserData` type with the new fields
- Add filter chip row + sortable `<TableHead>` buttons (toggle asc/desc, store `sort`/`order` in state, include in fetch params)
- Add 3 new columns: Lifetime Saves, Alerts, Last Activity (with notification opt-in icons in a compact cell)
- Add a new "Revenue" stat row showing the 4 new cards (with the existing 6 stats kept). Format MRR with `Intl.NumberFormat` USD.

### Out of scope (explicitly skipped)
- CSV export, detail drawer, promote/demote admin, edit notification prefs — user chose "data only"
