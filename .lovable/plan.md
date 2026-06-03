## Goal

Build a logged-in-only **Pharmacy Reimbursement Calculator** at `/reimbursement-calculator` that lets pharmacy users pull NADAC ingredient cost for any drug/NDC, apply a saved contract rule (PBM, Medicaid, LTC, cash), and see estimated reimbursement vs. actual paid claim with margin.

## Route & access

- New route: `/reimbursement-calculator` → `src/pages/ReimbursementCalculator.tsx`
- Logged-out users see a locked card: "Create a free account or log in to use the Pharmacy Reimbursement Calculator" with **Log In** and **Create Free Account** buttons (links to `/auth`). No calculator UI rendered.
- Add **"Reimbursement Calculator"** to `SiteNavigation.tsx` (between Movers and Resources).

## Database (one migration)

**`reimbursement_rules`** — user-saved contract rules
- `id, user_id, name, cost_basis` (enum: `nadac`, `nadac_adjusted`, `manual`)
- `adjustment_type` (enum: `plus_pct`, `minus_pct`, `none`)
- `percentage_value, multiplier, dispensing_fee, flat_adjustment`
- `minimum_reimbursement, maximum_reimbursement` (nullable)
- `notes, is_default` (only one default per user, enforced via partial unique index)
- `created_at, updated_at`
- RLS: user owns rows; `GRANT` for `authenticated` + `service_role`

**`reimbursement_calculations`** — Pro-only history
- `id, user_id, drug_name, ndc, nadac_unit_price, nadac_effective_date, quantity, ingredient_cost, rule_id, rule_name_snapshot, estimated_reimbursement, actual_reimbursement, difference, gross_margin, margin_percentage, notes, created_at`
- RLS: user owns rows

Reuse existing `nadac_drugs` table and `search-nadac` edge function for drug lookup — no changes there.

## Page layout (mobile-first, single column on mobile, 2-col on `md+`)

**Header**: Title + subtitle + educational disclaimer link.

**Left column — Calculator**
1. Drug/NDC search (reuse `SearchBar` + `search-nadac` pattern from `Index.tsx`)
2. Selected drug card (name, NDC, strength, NADAC unit price, effective date, stale-date warning if >60 days)
3. Quantity dispensed input (decimal allowed, ≥0)
4. Auto-calculated ingredient cost (read-only)
5. Contract rule selector (dropdown of user's saved rules + "Create new rule…")
6. Actual reimbursement received (optional)
7. Notes (optional)

**Right column — Results card**
- Drug, NDC, NADAC unit price, quantity, ingredient cost
- Selected rule + human-readable formula string ("NADAC + 10% + $10.65")
- Estimated reimbursement (bold, large)
- If actual entered: difference, gross margin, margin %
- Color indicators: green (margin healthy), yellow (low margin <5%), red (below ingredient cost)
- Warnings: actual < ingredient cost; estimated < ingredient cost; stale/missing NADAC date
- Pro-only **Save calculation** + **Export/Print** buttons (locked for free)

**Below**
- **Saved contract rules** table with edit/duplicate/delete/set-default
- **Rule templates** section (4 examples: NADAC+0%, NADAC+10%, NADAC-2%, Manual+10%) — "Use as template" duplicates into a new editable rule
- **Calculation history** (Pro only) — list with re-load action

## Rule create/edit modal

Friendly builder, no formula typing:
- Name
- Cost basis dropdown
- Adjustment type dropdown (plus % / minus % / none) → percentage field → auto-shows multiplier
- Dispensing fee, flat adjustment
- **Advanced contract settings** accordion: min reimbursement, max cap, notes, set-as-default toggle
- Pro gate: free user already has 1 rule → save shows upgrade modal with copy:
  *"Free accounts can save 1 reimbursement rule. Upgrade to Pro to save unlimited contract rules for different PBMs, Medicaid plans, LTC contracts, and cash pricing formulas."*

## Calculation logic (`src/lib/reimbursement.ts`)

Pure functions, fully unit-testable:

```text
ingredientCost = unitPrice * qty (or manual override if cost_basis = manual)
base = ingredientCost * multiplier   (multiplier=1 when adjustment_type=none)
raw = base + dispensingFee + (flatAdjustment ?? 0)
final = clamp(raw, minimum, maximum)
grossMargin = (actualReimbursement ?? estimated) - ingredientCost
marginPct = grossMargin / (actualReimbursement ?? estimated) * 100
```

Formula string is generated from rule fields for display.

## Free vs Pro gating

Uses existing `useAuth().isSubscribed`:
- Free: 1 rule max, no history save, no export, no rule comparison, no min/max/flat fields (gated in modal with Pro badge)
- Pro: unlimited rules, default rule, save history, export/print, side-by-side compare (Phase 2 — out of scope below)

Upgrade modal reuses existing `UpgradeModal` component.

## SEO

Logged-in utility page — `noindex` via Helmet (don't want it indexed; gated content). Title: "Pharmacy Reimbursement Calculator — NADAC Lookup".

## Validation

- Quantity ≥ 0 (decimals allowed)
- Dispensing fee ≥ 0
- Percentage 0–1000
- Min ≤ Max if both set
- Zod schemas for rule create/edit and calculator inputs
- Currency formatted to 2 decimals; NADAC unit price up to 4 decimals

## Files touched

**New**
- `src/pages/ReimbursementCalculator.tsx`
- `src/components/reimbursement/LockedAccessCard.tsx`
- `src/components/reimbursement/DrugPicker.tsx` (wraps existing search)
- `src/components/reimbursement/CalculatorForm.tsx`
- `src/components/reimbursement/ResultsCard.tsx`
- `src/components/reimbursement/RuleSelector.tsx`
- `src/components/reimbursement/RuleEditorModal.tsx`
- `src/components/reimbursement/SavedRulesTable.tsx`
- `src/components/reimbursement/RuleTemplates.tsx`
- `src/components/reimbursement/CalculationHistory.tsx` (Pro)
- `src/lib/reimbursement.ts` (pure calc + formula formatter)
- `src/hooks/useReimbursementRules.ts`
- Migration: `reimbursement_rules` + `reimbursement_calculations` tables

**Edited**
- `src/App.tsx` (add route)
- `src/components/SiteNavigation.tsx` (add nav item)
- `public/sitemap-static.xml` — **not added** (noindex page)

## Out of scope (Phase 2)

- Side-by-side multi-rule comparison view
- Actual PDF/CSV export implementation (button stub only; opens print dialog for v1)
- Bulk calculations / claim file upload
- Any MAC/GER/BER/DIR modeling

## Order of work

1. Migration (rules + calculations + RLS + grants)
2. `reimbursement.ts` pure calc lib
3. Page shell + locked-access gate + nav item
4. Rule editor modal + saved rules table + free-tier gate
5. Calculator form + results card (with warnings/color indicators)
6. Pro history save + templates + print button
