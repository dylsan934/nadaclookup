
# On-Demand Pricing History Implementation Plan

## Overview
This plan implements user-triggered historical pricing for specific drugs. When a user searches for a drug and wants to see its price history, they can click a "View Price History" button that fetches historical data from the CMS Medicaid API on-demand.

## Key Design Decisions

### Data Source
The CMS Medicaid API provides access to yearly NADAC datasets (2013-present). Each year has its own dataset ID:
- 2026: `fbb83258-11c7-47f5-8b18-5f8e79f7e704`
- 2025: Similar pattern (to be discovered via API)
- Historical years follow same pattern

### Approach: On-Demand Fetch (Not Stored)
Instead of importing millions of historical records into the database, we'll:
1. Fetch historical data from CMS API when requested
2. Display it in a modal/expandable section
3. Cache results temporarily in-browser (session storage) to avoid repeated API calls
4. Not persist historical data to avoid storage bloat

This keeps the database lean while providing access to years of pricing history.

---

## Implementation Steps

### Step 1: Create Price History Edge Function
Create a new edge function `get-price-history` that:
- Accepts an NDC code and optional year range
- Queries the CMS Medicaid API for historical prices
- Returns an array of price points with dates
- Handles multiple year datasets (2024, 2025, 2026)

**API Query Pattern:**
```
GET https://data.medicaid.gov/api/1/datastore/query/{dataset_id}/0/download
  ?conditions[0][property]=ndc&conditions[0][value]={ndc}&conditions[0][operator]==
  &format=csv&limit=500
```

### Step 2: Add Price History API Function
Update `src/lib/nadac-api.ts` to add a new function:
```typescript
async getPriceHistory(ndc: string, years: number = 2): Promise<PriceHistoryResponse>
```

This will:
- Call the new edge function
- Parse and format the response
- Return sorted historical price data

### Step 3: Create Price History Chart Component
Create `src/components/PriceHistoryChart.tsx`:
- Use Recharts (already installed) for visualization
- Display a line chart showing price over time
- Show key metrics: current price, highest, lowest, % change
- Include a data table view option

### Step 4: Create Price History Modal Component
Create `src/components/PriceHistoryModal.tsx`:
- Modal dialog to display price history
- Loading state while fetching data
- Error handling for API failures
- Time range selector (1 year, 2 years, all available)

### Step 5: Update DrugCard Component
Modify `src/components/DrugCard.tsx` to:
- Add "View Price History" button in expanded state
- Trigger modal on click
- Pass NDC to history modal

### Step 6: Update SavedDrugCard Component
Modify `src/components/SavedDrugCard.tsx` to:
- Add "Price History" button for saved drugs
- Allow quick access to historical pricing for tracked medications

---

## New Files to Create

1. **`supabase/functions/get-price-history/index.ts`**
   - Edge function to fetch historical data from CMS API
   - Handles multiple dataset years
   - Normalizes and returns price history

2. **`src/components/PriceHistoryChart.tsx`**
   - Recharts-based price visualization
   - Line chart with tooltips
   - Price change indicators

3. **`src/components/PriceHistoryModal.tsx`**
   - Dialog wrapper for price history
   - Loading/error states
   - Time range controls

---

## Files to Modify

1. **`src/lib/nadac-api.ts`**
   - Add `getPriceHistory()` function
   - Add TypeScript interfaces for history data

2. **`src/components/DrugCard.tsx`**
   - Add price history button
   - Import and use PriceHistoryModal

3. **`src/components/SavedDrugCard.tsx`**
   - Add price history button
   - Import and use PriceHistoryModal

4. **`supabase/config.toml`**
   - Register new edge function

---

## Technical Details

### Price History Data Structure
```typescript
interface PriceHistoryPoint {
  date: string;           // YYYY-MM-DD
  price: number;          // NADAC per unit
  pricingUnit: string;    // EA, ML, GM
}

interface PriceHistoryResponse {
  success: boolean;
  ndc: string;
  drugName: string;
  history: PriceHistoryPoint[];
  stats: {
    currentPrice: number;
    highestPrice: number;
    lowestPrice: number;
    percentChange: number;  // Over the period
    dataPoints: number;
  };
  error?: string;
}
```

### Dataset IDs for Historical Years
The edge function will attempt to query these datasets:
- 2026: `fbb83258-11c7-47f5-8b18-5f8e79f7e704`
- 2025: Will be discovered dynamically or hardcoded
- 2024: Will be discovered dynamically or hardcoded

### User Experience Flow
1. User searches for a drug (e.g., "Metformin")
2. Results display with current price
3. User clicks to expand a drug card
4. "View Price History" button appears
5. Click opens modal with loading spinner
6. Chart displays with 1-2 years of weekly price data
7. User can toggle between chart and table view
8. User can select different time ranges

---

## Estimated Data Volumes
- Each drug has ~52 price points per year (weekly updates)
- Fetching 2 years = ~104 data points per drug
- Minimal bandwidth (~5-10KB per request)
- No database storage required for historical data

---

## Premium Feature Consideration
Price history could be:
- **Option A**: Free for all users (recommended for engagement)
- **Option B**: Limited to 1 year for free, full history for premium
- **Option C**: Premium-only feature

Recommendation: Make it free to increase engagement and demonstrate value, driving conversions through other premium features.
