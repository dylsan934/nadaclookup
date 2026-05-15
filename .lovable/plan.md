## Goal

When the displayed movers are from an older snapshot (because CMS has only published small incremental batches since), show a clear notice that newer NADAC data exists but the latest **bulk** snapshot with significant movers is what's shown.

## Changes

**`src/pages/WeeklyMovers.tsx`**

1. Also fetch the latest `effective_date` from `nadac_drugs` (single row, ordered desc).
2. Compare it to the displayed `currentDate` (latest weekly_movers row with `total_changed > 0`).
3. If they differ, render an info banner above the two cards:

   > New NADAC data was published on **{latestDataDate}**, but it was a small incremental update. The movers below reflect the most recent full weekly snapshot ({currentDate} vs {previousDate}) where meaningful price changes occurred. Movers will refresh when CMS releases the next full snapshot.

4. Use a subtle `Card` with an `Info` icon (lucide), `bg-primary/5 border-primary/20` styling consistent with the rest of the site.
5. If they match, no banner — current behavior is fine.

## Out of scope

- No backend / edge function changes.
- No copy changes to the existing header subtitle.
