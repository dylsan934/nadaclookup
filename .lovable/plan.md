
# Make the Reimbursement Calculator the Conversion Engine

Goal: Reposition the Pharmacy Reimbursement Calculator as the primary value driver and convert more free users to Pro.

## Part 1 — Make the calculator front and center

### 1. Homepage hero restructure
Today the homepage leads with a generic NADAC search bar. Change the hero to a two-tab interface:

```
[ Reimbursement Calculator ]  [ NADAC Lookup ]
```

- Calculator tab is selected by default.
- Live, fully usable mini-calculator embedded in the hero (drug search → NDC → quantity → instant estimated reimbursement & margin).
- Logged-out users can run 1–2 calculations, then hit a soft gate: "Sign up free to save rules and unlock unlimited calculations."
- New H1: "Know exactly what every prescription pays — before you fill it."
- Sub-headline focused on margin protection, not data lookup.

### 2. Navigation priority
- Rename nav item "Calculator" → "Reimbursement Calculator" and move it to position 2 (right after Home).
- Style it with a subtle accent (dot, badge, or primary color) so it visually pops vs other nav items.
- Add a persistent top-right CTA button: "Try the Calculator" (shown on every marketing page).

### 3. Dedicated landing page polish
Upgrade `/reimbursement-calculator` with conversion sections above and below the tool:
- Hero with screenshot/animation of a real calculation
- "How it works" 3-step
- Social proof block (testimonials / pharmacy count / claims analyzed)
- Comparison table: Free vs Pro for the calculator specifically
- FAQ targeting reimbursement search intent (SEO + trust)

### 4. Cross-promotion from existing high-traffic pages
- On every Drug Page (`/drug/:slug`), add a "Calculate reimbursement for this NDC" CTA card next to the NADAC price — one click deep-links into the calculator with that NDC preloaded.
- On NDC Lookup results, add a "Run reimbursement →" button on each result row.
- On Weekly Movers, add inline CTA: "See how this price change affects your reimbursement."

## Part 2 — Conversion rate optimization

### 5. Strategic paywalls inside the calculator
Free users can calculate, but Pro-gated moments create natural upgrade triggers:
- Saving more than 1 rule → upgrade modal
- Saving calculation history → upgrade modal
- Exporting CSV from Saved Calculations → upgrade modal
- Bulk calculation (paste multiple NDCs) → Pro-only
- Multi-payer comparison (run same drug across all saved rules at once) → Pro-only
Each modal shows the specific feature being gated + a "Start 7-day free trial" CTA.

### 6. Value reinforcement after each calculation
After a calculation runs, show a small contextual card:
- "This calculation saved you ~X minutes of manual work."
- "Pro users have run N calculations this month."
- "Save this rule to reuse it on every claim →"

### 7. Pricing page improvements
- Anchor with annual pricing first (show monthly savings).
- Add a calculator-specific value column showing Pro unlocks.
- Add a money-back / cancel-anytime line.
- Add 2–3 short testimonials from pharmacy owners.

### 8. Trust + urgency signals (sitewide)
- Header strip with live count: "Tracking X NDCs · Updated [last sync date]"
- Footer trust row: "Data sourced from CMS NADAC · Updated weekly"
- Exit-intent modal on pricing page offering a one-time discount code (Pro plan only).

### 9. Onboarding funnel for new signups
After a free user signs up:
- Forced 60-second onboarding: pick one drug, enter one rule, see the reimbursement.
- End screen: "Want to do this for unlimited claims? Start your 7-day Pro trial."
- Email day-1: "Here's the calculation you ran — see what you'd save on Pro."
- Email day-3: case study of a pharmacy recovering $X/month.
- Email day-7: trial offer expiring.

### 10. Analytics + measurement
Instrument key events so we can iterate:
- `hero_calculator_used`, `calculator_completed`, `rule_save_blocked`, `csv_export_blocked`, `upgrade_modal_shown`, `pricing_page_view`, `checkout_started`, `pro_subscribed`.
- Add a simple funnel view in `/admin` so you can see weekly conversion rate per step.

## Technical Notes

- Hero tab component: shared `<HeroCalculator />` reusing logic from `src/lib/reimbursement.ts` and `useReimbursementRules`, but accepting an `embedded` prop that hides save controls when logged out.
- Deep-link support: extend `/reimbursement-calculator` to read `?ndc=` and `?drug=` query params and prefill state.
- Paywall modal: extract existing upgrade modal into reusable `<ProUpgradeModal feature="..." />`.
- Analytics: add a small `track(event, props)` helper writing to a new `analytics_events` table (or reuse existing if present), with RLS scoped to admin reads.
- All copy/CTA changes are presentation-only; no schema changes needed for Part 1 items 1–4.

## Suggested rollout order

1. Items 1, 2, 4 (highest-leverage placement changes).
2. Items 5, 6 (paywall + reinforcement — direct conversion lift).
3. Items 3, 7, 8 (trust + landing polish).
4. Items 9, 10 (onboarding + analytics for ongoing optimization).

Want me to proceed with this full scope, or trim to just Part 1 (placement) first?
