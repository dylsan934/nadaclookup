
# Louisiana Medicaid Reimbursement Feature Implementation Plan

## Overview
Implement a Pro-only Louisiana Medicaid reimbursement intelligence feature that integrates Federal Upper Limit (FUL) pricing data with existing NADAC data to calculate estimated ingredient reimbursement, dispensing fees, and pharmacy margins.

## Architecture

```text
+-------------------+       +----------------------+       +------------------+
|   CMS FUL Data    |  -->  |  sync-ful            |  -->  |  ful_prices      |
|   (Weekly CSV)    |       |  (edge function)     |       |  table           |
+-------------------+       +----------------------+       +------------------+
                                                                    |
                                     +------------------------------+
                                     v
+-------------------+       +----------------------+       +------------------+
|   Search Results  |  <--  |  search-nadac        |  <--  |  JOIN nadac +    |
|   + LA Medicaid   |       |  (enhanced)          |       |  ful_prices      |
+-------------------+       +----------------------+       +------------------+
                                    |
                                    v
                            +------------------+
                            |  Calculate LA    |
                            |  Reimbursement:  |
                            |  min(NADAC, FUL, |
                            |  Est. WAC) + Fee |
                            +------------------+
```

---

## Data Flow

1. **Weekly FUL Sync**: New cron job fetches CMS FUL CSV data every Wednesday (same pattern as NADAC)
2. **Search Enhancement**: `search-nadac` LEFT JOINs FUL data and calculates reimbursement server-side
3. **UI Display**: Pro users see LA Medicaid Reimbursement panel in DrugCard
4. **Admin Management**: Admin can view sync status and manually upload FUL CSV

---

## Database Design

### New Table: `ful_prices`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() |
| ndc_11 | text | NOT NULL, INDEXED |
| ful_unit_price | numeric | NOT NULL |
| package_size | numeric | DEFAULT 1 |
| effective_date | date | NOT NULL |
| source_file_date | date | NOT NULL |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**Constraints:**
- UNIQUE(ndc_11, effective_date) - prevent duplicates
- INDEX on ndc_11 for fast lookups

**RLS Policies:**
- Public SELECT (FUL is government data)
- No INSERT/UPDATE/DELETE for regular users

---

## Reimbursement Calculation Logic

### Constants
```
DISPENSING_FEE = $11.81
WAC_BRAND_MULTIPLIER = 1.20
WAC_GENERIC_MULTIPLIER = 1.08
WAC_UNKNOWN_MULTIPLIER = 1.15
```

### Brand/Generic Detection
Use NADAC drug name patterns:
- **Generic indicators**: Contains "HCL", "SODIUM", "HYDROCHLORIDE", ends with chemical suffixes
- **Brand indicators**: Single capitalized word, registered trademark patterns
- Default to "unknown" for ambiguous cases

### Calculation Flow
```
1. estimated_wac = nadac_price * WAC_MULTIPLIER
   - Brand: * 1.20
   - Generic: * 1.08  
   - Unknown: * 1.15

2. ingredient_cost = MIN(nadac_price, ful_price?, estimated_wac)

3. reimbursement_total = ingredient_cost + dispensing_fee

4. estimated_margin = reimbursement_total - nadac_price
```

---

## Implementation Steps

### Phase 1: Database Setup
- Create `ful_prices` table with proper indexes
- Enable RLS with public read access
- Add updated_at trigger

### Phase 2: FUL Sync Edge Function
Create `sync-ful` edge function:
- Fetch CMS FUL CSV from official source
- Parse and normalize NDC to 11-digit format
- Upsert records with duplicate handling
- Validation: row count threshold, schema check
- Error handling: keep previous data on failure
- Logging for admin visibility

### Phase 3: FUL Sync Cron Job
- Add new cron job running every Wednesday at 7 AM UTC (1 hour after NADAC)
- Use same pg_cron + pg_net pattern

### Phase 4: Enhance search-nadac Function
- LEFT JOIN ful_prices on normalized NDC
- Add reimbursement calculation logic server-side
- Return new fields in response:
  - `fulPriceUnit`, `fulEffectiveDate`
  - `estimatedWac`, `drugType` (brand/generic/unknown)
  - `ingredientCost`, `ingredientCostSource`
  - `dispensingFee`, `laReimbursement`, `estimatedMargin`

### Phase 5: Update Frontend Types
Extend `DrugData` interface with new pricing fields.

### Phase 6: Create LA Medicaid Reimbursement Panel
New component for DrugCard expanded view:
- Shows all pricing sources (NADAC, FUL, Est. WAC)
- Highlights lowest cost source
- Displays dispensing fee, total reimbursement, margin
- Includes disclaimer text
- Pro-gated with upgrade prompt for free users

### Phase 7: Admin Dashboard Updates
Add "FUL Data Management" section:
- Last sync date and status
- Row count
- Manual CSV upload override
- Validation error log display

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/sync-ful/index.ts` | Weekly FUL data sync from CMS |
| `supabase/functions/upload-ful/index.ts` | Admin manual CSV upload |
| `src/components/LAMedicaidPanel.tsx` | Reimbursement display component |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/search-nadac/index.ts` | Add FUL JOIN and reimbursement calculation |
| `src/components/DrugCard.tsx` | Add LAMedicaidPanel in expanded view |
| `src/lib/nadac-api.ts` | Update types for new response fields |
| `src/pages/Admin.tsx` | Add FUL data management section |
| `supabase/config.toml` | Add sync-ful and upload-ful function configs |

---

## Extended DrugData Interface

```typescript
export interface DrugData {
  // Existing fields
  ndc: string;
  drugName: string;
  nadacPerUnit: number;
  effectiveDate: string;
  pricingUnit: string;
  pharmacyType: string;
  explanation?: string;
  
  // New FUL and reimbursement fields
  fulPriceUnit?: number;
  fulEffectiveDate?: string;
  drugType?: 'brand' | 'generic' | 'unknown';
  estimatedWac?: number;
  ingredientCost?: number;
  ingredientCostSource?: 'NADAC' | 'FUL' | 'WAC';
  dispensingFee?: number;
  laReimbursement?: number;
  estimatedMargin?: number;
  marginPercent?: number;
}
```

---

## UI Component: LA Medicaid Panel

```text
+--------------------------------------------------+
|  Louisiana Medicaid Reimbursement Estimate       |
|  [Pro Badge]                                     |
+--------------------------------------------------+
|                                                  |
|  Price Comparison:                               |
|  +-----------------------+---------------------+ |
|  | NADAC (per unit)      | $0.0234            | |
|  | FUL (per unit)        | $0.0256            | |
|  | Est. WAC (Generic)    | $0.0253            | |
|  +-----------------------+---------------------+ |
|                                                  |
|  Reimbursement Calculation:                      |
|  +-----------------------+---------------------+ |
|  | Ingredient Cost       | $0.0234 (NADAC)*   | |
|  | Dispensing Fee        | $11.81             | |
|  | Est. Reimbursement    | $11.83             | |
|  +-----------------------+---------------------+ |
|                                                  |
|  Estimated Margin: $11.81 (99.8%)               |
|                                                  |
|  * Using lowest available price                  |
|  Estimate only - actual reimbursement may vary   |
|  by claim and payer rules.                       |
+--------------------------------------------------+
```

---

## Admin FUL Management Section

```text
+--------------------------------------------------+
|  FUL Price Data                                  |
+--------------------------------------------------+
|                                                  |
|  Status: Active                                  |
|  Last Sync: Feb 5, 2026 at 7:00 AM UTC          |
|  Records: 12,456                                 |
|  Source File Date: Feb 4, 2026                   |
|                                                  |
|  Manual Upload:                                  |
|  [Choose CSV File] [Upload]                      |
|                                                  |
|  Expected Format: ndc_11, ful_unit_price,        |
|  package_size, effective_date                    |
+--------------------------------------------------+
```

---

## Validation Rules

### FUL Sync Validation
1. **Row count threshold**: Warn if new dataset has <80% of previous row count
2. **Schema validation**: Verify required columns exist before processing
3. **Data integrity**: Validate NDC format, numeric prices, date format
4. **Rollback protection**: Keep previous snapshot if import fails

### NDC Normalization
- Strip dashes from NDC
- Pad with leading zeros to 11 digits
- Match format used in nadac_drugs table

---

## Performance Considerations

- Index `ndc_11` in `ful_prices` for O(log n) lookups
- LEFT JOIN at query time (not materialized view) for simplicity
- Limit FUL join to matching NDCs only
- Server-side calculation to minimize client processing
- Target: <10% increase in search response time

---

## Security Measures

1. FUL data is public read (government pricing data)
2. Upload endpoint requires admin role verification
3. CSV parsing with input validation
4. File size limit on manual upload (5MB max)
5. Edge function execution timeout handling

---

## Edge Cases

1. **No FUL price available**: Display "N/A" and use NADAC vs WAC comparison only
2. **NDC format mismatch**: Normalize both sides before joining
3. **Multiple FUL records per NDC**: Use most recent by effective_date
4. **Stale FUL data**: Show effective date for transparency
5. **Brand/generic misclassification**: Use "unknown" multiplier as fallback
6. **Zero or negative prices**: Skip invalid records during sync

---

## Cron Schedule

| Job | Schedule | Time (UTC) | Purpose |
|-----|----------|------------|---------|
| weekly-nadac-sync | 0 6 * * 3 | Wed 6 AM | Existing NADAC sync |
| weekly-ful-sync | 0 7 * * 3 | Wed 7 AM | New FUL sync (1hr after NADAC) |

---

## Disclaimer Language

> "Estimate only — actual reimbursement may vary by claim and payer rules. Louisiana Medicaid ingredient cost is calculated as the lowest of NADAC, FUL, or estimated WAC. This tool is for informational purposes only and does not guarantee actual reimbursement amounts."
