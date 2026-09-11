import { useState } from "react";
import { DrugData } from "./DrugCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSourceDateShort } from "@/lib/format-date";

interface DrugComparisonTableProps {
  drugs: DrugData[];
  onRemove: (ndc: string) => void;
}

// Helper to detect dosage form from drug name
const detectDosageForm = (drugName: string): string => {
  const name = drugName.toUpperCase();
  if (name.includes("TABLET") || name.includes("TAB ")) return "Tablet";
  if (name.includes("CAPSULE") || name.includes("CAP ")) return "Capsule";
  if (name.includes("SOLUTION") || name.includes("SOLN") || name.includes("SYRUP") || name.includes("SUSPENSION")) return "Solution";
  if (name.includes("INJECTION") || name.includes("INJ ") || name.includes("VIAL") || name.includes("SYRINGE")) return "Injection";
  if (name.includes("CREAM") || name.includes("OINTMENT") || name.includes("GEL") || name.includes("TOPICAL")) return "Topical";
  return "Other";
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(price);
};

const formatTotalPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatDate = (dateStr: string) => formatSourceDateShort(dateStr);

export const DrugComparisonTable = ({ drugs, onRemove }: DrugComparisonTableProps) => {
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  // Find lowest price
  const lowestPrice = Math.min(...drugs.map(d => d.nadacPerUnit));

  const getQuantity = (ndc: string) => parseFloat(quantities[ndc] || "0") || 0;

  const handleQuantityChange = (ndc: string, value: string) => {
    setQuantities(prev => ({ ...prev, [ndc]: value }));
  };

  // Calculate totals and find lowest
  const totals = drugs.map(drug => ({
    ndc: drug.ndc,
    total: getQuantity(drug.ndc) * drug.nadacPerUnit,
  }));
  const nonZeroTotals = totals.filter(t => t.total > 0);
  const lowestTotal = nonZeroTotals.length > 0 ? Math.min(...nonZeroTotals.map(t => t.total)) : 0;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr>
            <th className="sticky left-0 bg-background text-left text-xs font-medium text-muted-foreground p-3 w-28">
              &nbsp;
            </th>
            {drugs.map(drug => (
              <th key={drug.ndc} className="text-left p-3 min-w-[140px]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
                      {drug.drugName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(drug.ndc)}
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* NDC Row */}
          <tr className="border-t border-border/50">
            <td className="sticky left-0 bg-background text-xs font-medium text-muted-foreground p-3">
              NDC
            </td>
            {drugs.map(drug => (
              <td key={drug.ndc} className="p-3">
                <span className="font-mono text-xs text-muted-foreground">{drug.ndc}</span>
              </td>
            ))}
          </tr>

          {/* Price Row */}
          <tr className="border-t border-border/50 bg-muted/30">
            <td className="sticky left-0 bg-muted/30 text-xs font-medium text-muted-foreground p-3">
              Price/Unit
            </td>
            {drugs.map(drug => (
              <td key={drug.ndc} className="p-3">
                <span className={cn(
                  "font-bold tabular-nums",
                  drug.nadacPerUnit === lowestPrice 
                    ? "text-primary" 
                    : "text-foreground"
                )}>
                  {formatPrice(drug.nadacPerUnit)}
                  {drug.nadacPerUnit === lowestPrice && (
                    <span className="ml-1.5 text-xs font-normal">★</span>
                  )}
                </span>
              </td>
            ))}
          </tr>

          {/* Dosage Form Row */}
          <tr className="border-t border-border/50">
            <td className="sticky left-0 bg-background text-xs font-medium text-muted-foreground p-3">
              Form
            </td>
            {drugs.map(drug => (
              <td key={drug.ndc} className="p-3">
                <span className="text-sm text-foreground">{detectDosageForm(drug.drugName)}</span>
              </td>
            ))}
          </tr>

          {/* Pricing Unit Row */}
          <tr className="border-t border-border/50">
            <td className="sticky left-0 bg-background text-xs font-medium text-muted-foreground p-3">
              Unit
            </td>
            {drugs.map(drug => (
              <td key={drug.ndc} className="p-3">
                <span className="text-sm text-foreground">{drug.pricingUnit}</span>
              </td>
            ))}
          </tr>

          {/* Effective Date Row */}
          <tr className="border-t border-border/50">
            <td className="sticky left-0 bg-background text-xs font-medium text-muted-foreground p-3">
              Effective
            </td>
            {drugs.map(drug => (
              <td key={drug.ndc} className="p-3">
                <span className="text-xs text-muted-foreground">{formatDate(drug.effectiveDate)}</span>
              </td>
            ))}
          </tr>

          {/* Quantity Input Row */}
          <tr className="border-t border-border/50 bg-muted/30">
            <td className="sticky left-0 bg-muted/30 text-xs font-medium text-muted-foreground p-3">
              Quantity
            </td>
            {drugs.map(drug => (
              <td key={drug.ndc} className="p-3">
                <Input
                  type="number"
                  placeholder="0"
                  value={quantities[drug.ndc] || ""}
                  onChange={(e) => handleQuantityChange(drug.ndc, e.target.value)}
                  className="h-8 w-20 text-sm"
                  min="0"
                  step="any"
                />
              </td>
            ))}
          </tr>

          {/* Total Row */}
          <tr className="border-t border-border">
            <td className="sticky left-0 bg-background text-xs font-medium text-muted-foreground p-3">
              Total
            </td>
            {drugs.map(drug => {
              const qty = getQuantity(drug.ndc);
              const total = qty * drug.nadacPerUnit;
              const isLowest = total > 0 && total === lowestTotal;
              
              return (
                <td key={drug.ndc} className="p-3">
                  {qty > 0 ? (
                    <span className={cn(
                      "font-bold tabular-nums",
                      isLowest 
                        ? "text-primary" 
                        : "text-foreground"
                    )}>
                      {formatTotalPrice(total)}
                      {isLowest && <span className="ml-1.5 text-xs font-normal">★</span>}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
