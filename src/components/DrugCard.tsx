import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();

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
      className="p-4 sm:p-6 shadow-card hover:shadow-glow transition-all duration-300 border-border/50 bg-card animate-slide-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col gap-4">
        {/* Top row: Drug info and expand icon */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-foreground line-clamp-2">
              {drug.drugName}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              NDC: <span className="font-mono text-xs sm:text-sm">{drug.ndc}</span>
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {!user && (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Middle row: Badges and price */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">
              {drug.pricingUnit}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground text-xs">
              {drug.pharmacyType}
            </Badge>
          </div>
          
          <div className="text-right">
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {formatPrice(drug.nadacPerUnit)}
            </p>
            <p className="text-xs text-muted-foreground">
              Effective: {formatDate(drug.effectiveDate)}
            </p>
          </div>
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
          {user ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Calculate Total</span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 sm:w-32 sm:flex-none"
                    min="0"
                    step="any"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">{drug.pricingUnit}s</span>
                </div>
                {parsedQuantity > 0 && (
                  <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="text-xl font-bold text-primary">{formatTotalPrice(totalPrice)}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sign in to use the quantity calculator
              </p>
              <Link to="/auth" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="default">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
