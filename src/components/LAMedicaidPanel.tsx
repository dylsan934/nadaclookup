import { Crown, Lock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LAMedicaidPanelProps {
  nadacPerUnit: number;
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
  isPro: boolean;
  onUpgradeClick?: () => void;
}

export const LAMedicaidPanel = ({
  nadacPerUnit,
  fulPriceUnit,
  fulEffectiveDate,
  drugType = 'unknown',
  estimatedWac,
  ingredientCost,
  ingredientCostSource,
  dispensingFee = 11.81,
  laReimbursement,
  estimatedMargin,
  marginPercent,
  isPro,
  onUpgradeClick,
}: LAMedicaidPanelProps) => {
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price);
  };

  const formatCurrency = (price: number | undefined) => {
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getDrugTypeLabel = (type: string) => {
    switch (type) {
      case 'brand': return 'Brand';
      case 'generic': return 'Generic';
      default: return 'Unknown';
    }
  };

  // Locked state for non-Pro users
  if (!isPro) {
    return (
      <button
        onClick={onUpgradeClick}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-lg border border-amber-200/50 dark:border-amber-700/30 hover:shadow-md transition-all w-full group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Louisiana Medicaid Reimbursement</p>
            <p className="text-xs text-muted-foreground">Pro feature — see estimated margins</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform">
          <Crown className="h-4 w-4" />
          <span className="text-sm font-medium">Upgrade</span>
        </div>
      </button>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>Louisiana Medicaid Reimbursement Estimate</span>
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Comparison Table */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Price Comparison</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className={cn(
                  "border-b border-border",
                  ingredientCostSource === 'NADAC' && "bg-primary/5"
                )}>
                  <td className="px-3 py-2 text-muted-foreground">NADAC (per unit)</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">
                    {formatPrice(nadacPerUnit)}
                    {ingredientCostSource === 'NADAC' && (
                      <span className="ml-2 text-xs text-primary">✓ lowest</span>
                    )}
                  </td>
                </tr>
                <tr className={cn(
                  "border-b border-border",
                  ingredientCostSource === 'FUL' && "bg-primary/5"
                )}>
                  <td className="px-3 py-2 text-muted-foreground">
                    FUL (per unit)
                    {fulEffectiveDate && (
                      <span className="text-xs text-muted-foreground/70 ml-1">
                        as of {formatDate(fulEffectiveDate)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium">
                    {formatPrice(fulPriceUnit)}
                    {ingredientCostSource === 'FUL' && (
                      <span className="ml-2 text-xs text-primary">✓ lowest</span>
                    )}
                  </td>
                </tr>
                <tr className={cn(
                  ingredientCostSource === 'WAC' && "bg-primary/5"
                )}>
                  <td className="px-3 py-2 text-muted-foreground">
                    Est. WAC ({getDrugTypeLabel(drugType)})
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="inline h-3 w-3 ml-1 text-muted-foreground/50" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">
                            Estimated Wholesale Acquisition Cost based on NADAC × 
                            {drugType === 'brand' ? ' 1.20 (brand)' : 
                             drugType === 'generic' ? ' 1.08 (generic)' : 
                             ' 1.15 (unknown type)'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium">
                    {formatPrice(estimatedWac)}
                    {ingredientCostSource === 'WAC' && (
                      <span className="ml-2 text-xs text-primary">✓ lowest</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reimbursement Calculation */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Reimbursement Calculation</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 text-muted-foreground">
                    Ingredient Cost
                    <span className="text-xs text-muted-foreground/70 ml-1">
                      ({ingredientCostSource || 'NADAC'})*
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium">
                    {formatPrice(ingredientCost)}
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-3 py-2 text-muted-foreground">Dispensing Fee</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">
                    {formatCurrency(dispensingFee)}
                  </td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-3 py-2 font-medium text-foreground">Est. Reimbursement</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-primary">
                    {formatCurrency(laReimbursement)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Margin Display */}
        {estimatedMargin !== undefined && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30">
            <span className="text-sm font-medium text-foreground">Estimated Margin</span>
            <div className="text-right">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(estimatedMargin)}
              </span>
              {marginPercent !== undefined && (
                <span className="ml-2 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                  ({formatPercent(marginPercent)})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          * Using lowest available price source. Estimate only — actual reimbursement may vary by claim and payer rules. 
          Louisiana Medicaid ingredient cost is calculated as the lowest of NADAC, FUL, or estimated WAC.
        </p>
      </CardContent>
    </Card>
  );
};
