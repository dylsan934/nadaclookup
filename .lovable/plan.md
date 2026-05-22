## Fix crowded mobile nav tabs

The `SiteNavigation` pill bar forces all 6 items into equal-width slots (`flex-1 min-w-0`) on every breakpoint. At 393px each tab is ~60px wide with 8px padding, so labels touch each other and the pill looks cramped.

### Change

In `src/components/SiteNavigation.tsx`:

- **Mobile (default):** Switch items to natural width + horizontal scroll. Add comfortable horizontal padding (`px-3.5`) and a small gap between items so they breathe. Container already has `overflow-x-auto no-scrollbar` — just remove `flex-1 min-w-0` from `<li>` at the mobile breakpoint.
- **Desktop (`md:` and up):** Keep current equal-width behavior (`md:flex-1`) so the pill fills the row like today.
- Add a tiny right-edge fade gradient on mobile only, as a visual hint that the row scrolls (matches the rounded card look).
- Slightly reduce the outer container's left/right padding on mobile (`px-3 md:px-4`) so the pill itself has more room.

No route/label changes, no new dependencies, no behavior change on desktop.

### Files
- `src/components/SiteNavigation.tsx` — single-file edit
