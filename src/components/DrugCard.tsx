import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

export interface DrugData {
  ndc: string;
  drugName: string;
  nadacPerUnit: number;
  effectiveDate: string;
  pricingUnit: string;
  pharmacyType: string;
  explanation?: string;
}

interface DrugCardProps {
  drug: DrugData;
  index: number;
}

export const DrugCard = ({ drug, index }: DrugCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quantity, setQuantity] = useState<string>("");

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

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const parsedQuantity = parseFloat(quantity) || 0;
  const totalPrice = parsedQuantity * drug.nadacPerUnit;

  return (
    <Card 
      className="p-6 shadow-card hover:shadow-glow transition-all duration-300 border-border/50 bg-card animate-slide-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate">
            {drug.drugName}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            NDC: <span className="font-mono">{drug.ndc}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {drug.pricingUnit}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {drug.pharmacyType}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right lg:min-w-[140px]">
            <p className="text-2xl font-bold text-primary">
              {formatPrice(drug.nadacPerUnit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Effective: {formatDate(drug.effectiveDate)}
            </p>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {drug.explanation && (
        <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
          {drug.explanation}
        </p>
      )}

      {isExpanded && (
        <div 
          className="mt-4 pt-4 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Calculate Total</span>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <Input
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-32"
                min="0"
                step="any"
              />
              <span className="text-sm text-muted-foreground">{drug.pricingUnit}s</span>
            </div>
            {parsedQuantity > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Price</p>
                <p className="text-xl font-bold text-primary">{formatTotalPrice(totalPrice)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
