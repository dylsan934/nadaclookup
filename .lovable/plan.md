## Summary
Add "Unlimited use of reimbursement calculator" as a new Pro feature and reorder all Pro feature lists with the highest-converting features at the top, since the reimbursement calculator is now the primary conversion driver.

## Proposed Feature Order (top to bottom)
1. **Unlimited use of reimbursement calculator** — NEW. Main driver; directly answers "am I losing money on this claim?"
2. **Full NADAC price history charts** — Visual, high-perceived-value proof
3. **Automated price change alerts** — Proactive money-saving feature
4. **Unlimited saved drugs** — Core utility
5. **Weekly Top 10 movers (increases & decreases)**
6. **Weekly movers email digest**
7. **Custom alert thresholds**
8. **Drug categories & notes**
9. **Priority support**
10. **Everything in Free** — Always last

## Free plan updates
Add "1 free reimbursement calculation" to the Free plan list so visitors immediately understand the contrast between free and Pro.

## Files to update
1. `src/pages/Pricing.tsx` — Pro card feature list + Free card + SEO description
2. `src/components/HomePricing.tsx` — Pro card feature list + Free card
3. `src/components/UpgradeModal.tsx` — Pro feature bullets in the upgrade modal
4. `src/components/FreeAccountModal.tsx` — Pro feature bullets in the free-account modal
5. `src/pages/Features.tsx` — Add reimbursement calculator as a Pro feature block
6. `src/pages/NdcLookup.tsx` — FAQ answer mentioning Pro features
7. `src/components/HomeSEOContent.tsx` — SEO paragraph mentioning Pro features

No database or backend changes required. All edits are static marketing copy.