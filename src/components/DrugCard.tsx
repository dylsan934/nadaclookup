import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
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

  return (
    <Card 
      className="p-6 shadow-card hover:shadow-glow transition-all duration-300 border-border/50 bg-card animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
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
        
        <div className="text-right lg:min-w-[140px]">
          <p className="text-2xl font-bold text-primary">
            {formatPrice(drug.nadacPerUnit)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Effective: {formatDate(drug.effectiveDate)}
          </p>
        </div>
      </div>
      
      {drug.explanation && (
        <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
          {drug.explanation}
        </p>
      )}
    </Card>
  );
};
