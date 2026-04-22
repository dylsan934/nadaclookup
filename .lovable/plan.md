

# Always-Expanded Drug Cards + Cleanup

## Goal
Show all drug card information at once (no click-to-expand) and remove the confusing "1" badge in the middle of the card. Condense layout so it stays compact.

## Changes

### 1. `src/components/DrugCard.tsx`
- **Remove expand/collapse behavior**: delete `isExpanded` state, the `onClick` toggle on the `<Card>`, and the `ChevronUp`/`ChevronDown` button. The card is no longer a clickable surface.
- **Always render the inner section** (price history button + calculator) that was previously gated behind `isExpanded`.
- **Remove the confusing "1" / pricing-unit badge**: drop the `<Badge>{drug.pricingUnit}</Badge>` from the middle row (this is the small badge that displays values like `1`, `EA`, `ML` and isn't meaningful to users). Keep the pharmacy type badge. The pricing unit is still shown contextually next to the quantity input (`{drug.pricingUnit}s`) and in the per-unit price label.
- **Condense layout for the always-open state**:
  - Tighten vertical spacing (`gap-3` → `gap-2.5`, reduce `pt-4` on the inner section to `pt-3`).
  - Change the per-unit price label from just a date underneath to `"per {pricingUnit}"` + small date, so users understand what the price represents now that the unit badge is gone.
  - Make the Price History button and Calculator sit on a single row on `sm+` screens (button left, calculator right) to reduce vertical footprint. Stack on mobile.
  - Move the "Compare" checkbox up next to the Save/heart button (top-right cluster) instead of its own bottom row with a divider — saves a full row of height.
- **Remove unused imports**: `ChevronDown`, `ChevronUp`.

### 2. No changes to `DrugResults.tsx`, comparison logic, or save logic
All existing props (`isSelected`, `onToggleSelect`, `selectionDisabled`) keep working — only their placement in the card changes.

## Result
- Single tap is no longer required to see price history access, calculator, and full details.
- The mystery "1" badge is gone.
- Card height stays roughly similar to today's collapsed state by consolidating the compare row into the header and putting price-history + calculator side-by-side on desktop.

