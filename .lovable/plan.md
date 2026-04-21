
# Add Site Analytics to Admin Page

## Overview
Add a new "Site Analytics" section to the admin dashboard showing pageviews, unique visitors, and traffic trends using Lovable's built-in production analytics (no third-party setup needed).

## Approach
Use the built-in `analytics--read_project_analytics` data source via a new edge function action. The admin page already calls `admin-dashboard` for stats — we'll add an `analytics` action that returns time-series traffic data, then render it in a new section on the Admin page.

## What Will Be Added

### 1. Backend — extend `admin-dashboard` edge function
Add a new `action=analytics` handler that:
- Accepts `range` param (`7d`, `30d`, `90d`)
- Accepts `granularity` param (`hourly` or `daily`)
- Calls the Lovable analytics API (server-side) and returns:
  - Total pageviews
  - Total unique visitors
  - Daily/hourly time series (date, pageviews, visitors)
  - Top pages (path + view count)

### 2. Frontend — new Analytics section on `/admin`
Add a new card section above or beside the existing "Stats" cards:

- **Top summary tiles**: Total Pageviews, Unique Visitors, Avg. Daily Views (with % change vs previous period)
- **Range selector**: Last 7 days / 30 days / 90 days (Tabs)
- **Line chart**: Pageviews over time (using existing `recharts` from `ui/chart.tsx`)
- **Top pages table**: Path, Views, % of total

### 3. Files

| File | Action |
|------|--------|
| `supabase/functions/admin-dashboard/index.ts` | Add `analytics` action handler |
| `src/pages/Admin.tsx` | Add Analytics section + range state + data fetch |
| `src/components/admin/SiteAnalytics.tsx` | NEW — chart + tiles + top pages table |

## Technical Details

### Edge function snippet
```typescript
if (action === 'analytics') {
  const range = url.searchParams.get('range') || '30d';
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  
  // Fetch from Lovable analytics endpoint using project ID
  const data = await fetchLovableAnalytics(startDate, endDate, days <= 7 ? 'hourly' : 'daily');
  return new Response(JSON.stringify(data), { headers: ... });
}
```

### Chart component
Uses existing `recharts` (already in `ui/chart.tsx`) — `LineChart` with `pageviews` and `uniqueVisitors` series, `XAxis` formatted as date, tooltip with formatted numbers.

### Auth
Reuses the existing admin-role check at the top of the function — no new auth code needed.

## Notes & Limitations
- Lovable production analytics only reflects the **published** site (`nadaclookup.com` / `nadaclookup.lovable.app`), not preview traffic.
- Data may have a short delay (typically <1 hour).
- No PII is collected — only aggregate pageview/visitor counts by path.

## Out of Scope (future)
- Referrer breakdown
- Country/device breakdown
- Conversion funnels (search → signup → upgrade)
- Real-time visitor count
