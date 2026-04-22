

# Add New Blog Post: "How to Calculate Reimbursement from NADAC"

## Overview
Add a 6th article to the Resources/Blog section, dated 2026-04-22 (today), covering how Medicaid and other payers reimburse pharmacies using a NADAC + dispensing fee formula.

## Changes

### 1. `src/pages/Blog.tsx`
Prepend a new entry to the `articles` array:
- **slug**: `calculate-reimbursement-from-nadac`
- **title**: "How to Calculate Reimbursement from NADAC"
- **date**: `2026-04-22`
- **excerpt**: Short summary explaining the NADAC + dispensing fee reimbursement model used by Medicaid and select payers.

### 2. `src/pages/BlogArticle.tsx`
Add a new entry to the article content map keyed by the slug, including:
- SEO-optimized title + meta description targeting keywords: "NADAC reimbursement", "pharmacy reimbursement formula", "Medicaid pharmacy reimbursement", "dispensing fee".
- Article body with these H2 sections:
  1. **The NADAC Reimbursement Formula** — `Reimbursement = NADAC × Quantity Dispensed + Professional Dispensing Fee`
  2. **Who Pays Pharmacies Using NADAC?** — State Medicaid FFS programs, some Medicaid managed care plans, a growing number of commercial PBM contracts.
  3. **Understanding the Professional Dispensing Fee** — typical state ranges ($9–$13), how states set them via cost-of-dispensing surveys.
  4. **Worked Example** — e.g., 90 tablets of Metformin 500mg at NADAC $0.0234/unit + $10.50 dispensing fee = $12.61 total reimbursement.
  5. **Why This Matters for Independent Pharmacies** — comparing to PBM contracts that pay below NADAC, identifying underwater claims.
  6. **How to Use NADAC Lookup to Verify Reimbursement** — internal CTA back to the lookup tool.
- Internal links to: homepage `/`, `/blog/nadac-vs-wac-explained`, `/blog/nadac-for-pbm-negotiations`.

### 3. `public/sitemap.xml`
Add a new `<url>` entry for `/blog/calculate-reimbursement-from-nadac` with `lastmod` of 2026-04-22.

## Information Needed From You

To make the article most accurate and useful, please confirm (or I'll use sensible defaults shown):

1. **Tone/depth** — Educational overview for pharmacy owners (default), or more technical/regulatory deep-dive?
2. **Specific states to highlight** — Should I cite specific state Medicaid dispensing fees (e.g., Texas $10.50, California $10.05, New York $10.08), or keep it generic with a typical range?
3. **Mention competitors/PBMs by name** — OK to reference major PBMs (CVS Caremark, Express Scripts, OptumRx) when discussing under-NADAC reimbursement, or keep it generic?
4. **Length** — Match existing articles (~600–900 words, default), or longer pillar-style (~1,500+ words)?

If you don't answer, I'll proceed with: educational tone, generic state range with 1–2 examples, generic PBM references, ~800 words.

