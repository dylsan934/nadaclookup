
# Drug Comparison View Implementation Plan

## Overview
Add a comparison view feature that allows users to select multiple drugs from search results and view them side-by-side in a table format. This enables easy comparison of prices, dosage forms, and other attributes across different drug options.

## Architecture

```text
+-------------------+       +----------------------+       +------------------+
|   DrugResults     |  -->  |  Comparison State    |  -->  |  ComparisonView  |
|   (checkboxes)    |       |  (selected drugs)    |       |  (side-by-side)  |
+-------------------+       +----------------------+       +------------------+
        |                            |                            |
        v                            v                            v
  Select up to 4             "Compare (N)" button          Table/card layout
  drugs to compare           appears when N >= 2           with key metrics
```

## User Experience Flow

1. User searches for a drug (e.g., "Metformin")
2. Results appear with a checkbox on each drug card
3. User selects 2-4 drugs they want to compare
4. A floating "Compare (N)" button appears at the bottom
5. Clicking "Compare" opens a modal/drawer with side-by-side comparison
6. User can see prices, dosage forms, pricing units, and effective dates aligned
7. User can remove drugs from comparison or add more from results

## Implementation Steps

### 1. Create Comparison Context/State
Track selected drugs for comparison in the `DrugResults` component:
- `selectedForComparison: DrugData[]` - array of selected drugs (max 4)
- Functions to add/remove drugs from comparison

### 2. Create DrugComparisonView Component
A new component that displays drugs side-by-side:
- **Header row**: Drug names
- **NDC row**: NDC codes
- **Price row**: NADAC per unit (highlighted for lowest)
- **Dosage Form row**: Tablet, Capsule, etc.
- **Pricing Unit row**: EA, ML, GM, etc.
- **Effective Date row**: When price was set
- **Calculator row**: Enter quantity, see total for each

### 3. Update DrugCard Component
Add a checkbox/select button for comparison mode:
- Checkbox appears on the left side of each card
- Visual indicator when drug is selected
- Disable selection when 4 drugs are already selected

### 4. Add Floating Compare Button
A sticky/floating button that appears when 2+ drugs are selected:
- Shows count of selected drugs
- Opens comparison modal when clicked
- Option to clear selection

### 5. Create Comparison Modal
A dialog/sheet that shows the comparison table:
- Responsive design (horizontal scroll on mobile)
- Highlight best price in green
- Action buttons: Clear, Close
- Option to save comparison (future enhancement)

## Component Structure

```text
src/components/
├── DrugResults.tsx          # Add comparison state
├── DrugCard.tsx             # Add checkbox for selection
├── CompareButton.tsx        # NEW: Floating compare button
├── DrugComparisonView.tsx   # NEW: Side-by-side comparison
└── DrugComparisonModal.tsx  # NEW: Modal wrapper
```

## UI Mockup

```text
+------------+------------+------------+
| METFORMIN  | METFORMIN  | METFORMIN  |
| 500MG TAB  | 850MG TAB  | 1000MG TAB |
+------------+------------+------------+
| NDC        |            |            |
| 00093...   | 00093...   | 00093...   |
+------------+------------+------------+
| Price/Unit |            |            |
| $0.0234*   | $0.0312    | $0.0289    |
+------------+------------+------------+
| Form       |            |            |
| Tablet     | Tablet     | Tablet     |
+------------+------------+------------+
| Unit       |            |            |
| EA         | EA         | EA         |
+------------+------------+------------+
| Quantity   |            |            |
| [  90  ]   | [  90  ]   | [  90  ]   |
+------------+------------+------------+
| Total      |            |            |
| $2.11*     | $2.81      | $2.60      |
+------------+------------+------------+
* = Lowest price (highlighted in green)
```

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/CompareButton.tsx` | Floating button showing selection count |
| `src/components/DrugComparisonModal.tsx` | Modal containing comparison view |
| `src/components/DrugComparisonTable.tsx` | Table layout for side-by-side comparison |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/DrugResults.tsx` | Add comparison state, pass to DrugCard |
| `src/components/DrugCard.tsx` | Add checkbox for selection |

### State Management

```typescript
// In DrugResults.tsx
const [selectedForCompare, setSelectedForCompare] = useState<DrugData[]>([]);
const [showComparison, setShowComparison] = useState(false);

const toggleDrugSelection = (drug: DrugData) => {
  setSelectedForCompare(prev => {
    const isSelected = prev.some(d => d.ndc === drug.ndc);
    if (isSelected) {
      return prev.filter(d => d.ndc !== drug.ndc);
    }
    if (prev.length >= 4) return prev; // Max 4 drugs
    return [...prev, drug];
  });
};
```

### DrugCard Checkbox Props

```typescript
interface DrugCardProps {
  drug: DrugData;
  index: number;
  isSelected?: boolean;           // NEW
  onToggleSelect?: () => void;    // NEW
  selectionDisabled?: boolean;    // NEW: true when 4 drugs selected
}
```

### Comparison Table Structure

```typescript
interface ComparisonTableProps {
  drugs: DrugData[];
  onRemove: (ndc: string) => void;
}

// Rows to display:
const comparisonRows = [
  { label: "NDC", key: "ndc" },
  { label: "Price/Unit", key: "nadacPerUnit", format: "currency" },
  { label: "Dosage Form", key: "dosageForm", computed: true },
  { label: "Pricing Unit", key: "pricingUnit" },
  { label: "Effective Date", key: "effectiveDate", format: "date" },
];
```

## Responsive Design

- **Desktop**: Full table with all drugs visible side-by-side
- **Tablet**: Horizontal scroll if more than 3 drugs
- **Mobile**: 
  - Use Sheet (drawer from bottom) instead of Dialog
  - Horizontal scroll for comparison table
  - Sticky first column with row labels

## Edge Cases

1. **Less than 2 drugs selected**: Compare button disabled/hidden
2. **More than 4 drugs**: Selection disabled for additional drugs
3. **Search cleared**: Clear comparison selection
4. **Same drug twice**: Prevent duplicate selection (by NDC)
5. **Different strengths**: Allow comparing different strengths of same drug

## Future Enhancements (not in this phase)

- Save comparison for later reference
- Share comparison via link
- Export comparison as PDF/image
- Price history comparison overlay
- Add drugs from saved list to comparison
