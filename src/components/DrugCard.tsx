import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, ChevronDown, ChevronUp, Lock, Bookmark, BookmarkCheck, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/UpgradeModal";

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
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureHighlight, setUpgradeFeatureHighlight] = useState<string>();
  const { user, isSubscribed } = useAuth();

  useEffect(() => {
    if (user && isSubscribed) {
      checkIfSaved();
    }
  }, [user, isSubscribed, drug.ndc]);

  const checkIfSaved = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_drugs")
        .select("id")
        .eq("ndc", drug.ndc)
        .maybeSingle();

      if (!error && data) {
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error checking saved status:", error);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !isSubscribed) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from("saved_drugs")
          .delete()
          .eq("ndc", drug.ndc);

        if (error) throw error;
        setIsSaved(false);
        toast.success("Drug removed from saved list");
      } else {
        const { error } = await supabase
          .from("saved_drugs")
          .insert({
            user_id: user.id,
            ndc: drug.ndc,
            drug_name: drug.drugName,
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success("Drug saved to your list");
      }
    } catch (error) {
      console.error("Error saving drug:", error);
      toast.error("Failed to save drug");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockedClick = (e: React.MouseEvent, feature: string) => {
    e.stopPropagation();
    setUpgradeFeatureHighlight(feature);
    setShowUpgradeModal(true);
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

  // Premium features are locked for non-subscribers
  const canAccessPremium = user && isSubscribed;

  // Example preview values for blurred state
  const previewQuantity = 90;
  const previewTotal = previewQuantity * drug.nadacPerUnit;

  return (
    <>
      <Card 
        className="p-4 sm:p-5 hover:shadow-md hover:border-border transition-all duration-200 cursor-pointer bg-card animate-slide-up"
        style={{ animationDelay: `${index * 40}ms` }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col gap-3">
          {/* Top row: Drug info and expand icon */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug">
                {drug.drugName}
              </h3>
              <p className="text-muted-foreground text-xs mt-1">
                NDC: <span className="font-mono">{drug.ndc}</span>
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              {/* Save button - only for premium users */}
              {canAccessPremium && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`h-8 w-8 ${isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              )}
              {/* Locked save button for non-subscribers - clickable */}
              {!canAccessPremium && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleLockedClick(e, "Never miss a price change—get alerts when costs shift")}
                  className="h-8 w-8 text-muted-foreground/50 hover:text-muted-foreground"
                >
                  <div className="relative">
                    <Bookmark className="h-4 w-4" />
                    <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />
                  </div>
                </Button>
              )}
              <div className="p-1.5 rounded-md hover:bg-muted transition-colors">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Middle row: Badges and price */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs font-normal">
                {drug.pricingUnit}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                {drug.pharmacyType}
              </Badge>
            </div>
            
            <div className="text-right">
              <p className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                {formatPrice(drug.nadacPerUnit)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(drug.effectiveDate)}
              </p>
            </div>
          </div>
        </div>
        
        {drug.explanation && (
          <p className="mt-3 text-xs text-muted-foreground border-t border-border/50 pt-3 leading-relaxed">
            {drug.explanation}
          </p>
        )}

        {isExpanded && (
          <div 
            className="mt-4 pt-4 border-t border-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Premium user - full calculator access */}
            {canAccessPremium && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Calculator className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Calculate Total</span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="flex-1 sm:w-28 sm:flex-none h-10"
                      min="0"
                      step="any"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">{drug.pricingUnit}s</span>
                  </div>
                  {parsedQuantity > 0 && (
                    <div className="text-left sm:text-right pt-2 sm:pt-0 sm:pl-4 sm:border-l border-t sm:border-t-0 border-border/50">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary tabular-nums">{formatTotalPrice(totalPrice)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Non-subscriber preview - blurred calculator with sample data */}
            {!canAccessPremium && (
              <div 
                className="relative cursor-pointer group"
                onClick={(e) => handleLockedClick(e, "Upgrade to calculate costs for any quantity")}
              >
                {/* Blurred preview content */}
                <div className="flex flex-col gap-4 select-none pointer-events-none blur-[2px] opacity-60">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Calculator className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Calculate Total</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 sm:w-28 sm:flex-none h-10 px-3 flex items-center bg-muted rounded-md border">
                        <span className="text-sm text-muted-foreground">{previewQuantity}</span>
                      </div>
                      <span className="text-sm text-muted-foreground shrink-0">{drug.pricingUnit}s</span>
                    </div>
                    <div className="text-left sm:text-right pt-2 sm:pt-0 sm:pl-4 sm:border-l border-t sm:border-t-0 border-border/50">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary tabular-nums">{formatTotalPrice(previewTotal)}</p>
                    </div>
                  </div>
                </div>

                {/* Overlay with lock and CTA */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-background/95 backdrop-blur-sm rounded-lg border border-amber-200 dark:border-amber-800 shadow-lg group-hover:border-amber-300 dark:group-hover:border-amber-700 transition-colors">
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50">
                      <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      Calculate true acquisition cost instantly
                    </span>
                    <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        featureHighlight={upgradeFeatureHighlight}
      />
    </>
  );
};
