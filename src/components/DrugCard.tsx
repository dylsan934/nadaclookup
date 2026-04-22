import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Lock, Heart, Crown, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/UpgradeModal";
import { FreeAccountModal } from "@/components/FreeAccountModal";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";
import { cn } from "@/lib/utils";

// CMS NADAC explanation/footnote codes
const NADAC_EXPLANATION_CODES: Record<string, string> = {
  "1": "Survey-based pricing",
  "2": "Pricing based on previous NADAC",
  "3": "Pricing based on similar package size",
  "4": "Pricing based on weighted average of all package sizes",
  "5": "Rate adjustment applied",
  "6": "Methodology change",
  "7": "Pricing based on RED BOOK markup",
  "8": "No change from previous NADAC",
};

const formatExplanation = (raw: string): string => {
  if (!raw) return "";
  const codes = raw.split(/[,\s]+/).map(c => c.trim()).filter(Boolean);
  const labels = codes.map(c => NADAC_EXPLANATION_CODES[c]).filter(Boolean);
  if (labels.length === 0) {
    // Not a code list — show raw text only if it looks like prose
    return /[a-zA-Z]{4,}/.test(raw) ? raw : "";
  }
  return labels.join(" · ");
};

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
  isSelected?: boolean;
  onToggleSelect?: () => void;
  selectionDisabled?: boolean;
}

export const DrugCard = ({ drug, index, isSelected, onToggleSelect, selectionDisabled }: DrugCardProps) => {
  const [quantity, setQuantity] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFreeAccountModal, setShowFreeAccountModal] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [upgradeFeatureHighlight, setUpgradeFeatureHighlight] = useState<string>();
  const { user, isSubscribed, canSaveDrug, lifetimeSavesCount, freeSaveLimit, refreshSavesCount } = useAuth();

  // Check if user is logged in (can save with limits)
  const isLoggedIn = !!user;
  // Subscribers get full access, free users can save up to limit
  const canAccessSaveFeature = isLoggedIn && (isSubscribed || canSaveDrug);
  // Price history is premium-only
  const canAccessPriceHistory = user && isSubscribed;

  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, drug.ndc]);

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
    if (!user) {
      // Not logged in - show free account modal
      setShowFreeAccountModal(true);
      return;
    }

    // If trying to save (not unsave) and limit reached
    if (!isSaved && !isSubscribed && !canSaveDrug) {
      setUpgradeFeatureHighlight(`You've used all ${freeSaveLimit} free saves. Unlock unlimited saves and full price history with Pro — start your 14-day free trial.`);
      setShowUpgradeModal(true);
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        // Allow unsaving - but don't reduce counter
        const { error } = await supabase
          .from("saved_drugs")
          .delete()
          .eq("ndc", drug.ndc)
          .eq("user_id", user.id);

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
        // Refresh the saves count in context
        await refreshSavesCount();
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

  // Example preview values for blurred state
  const previewQuantity = 90;
  const previewTotal = previewQuantity * drug.nadacPerUnit;

  return (
    <>
      <Card 
        className={cn(
          "p-4 sm:p-5 transition-all duration-200 bg-card animate-slide-up",
          isSelected 
            ? "border-primary ring-1 ring-primary/20" 
            : "hover:border-border"
        )}
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="flex flex-col gap-2.5">
          {/* Top row: Drug info, save, compare */}
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
              <label
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                  isSelected 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  selectionDisabled && !isSelected && "opacity-50 cursor-not-allowed"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect?.()}
                  disabled={selectionDisabled}
                  className={cn(
                    "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                    selectionDisabled && !isSelected && "cursor-not-allowed"
                  )}
                />
                <span className="text-xs font-medium hidden sm:inline">Compare</span>
              </label>
              {isLoggedIn ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={isSaving || (!isSaved && !isSubscribed && !canSaveDrug)}
                  className={`h-8 w-8 ${isSaved ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"} ${!isSaved && !isSubscribed && !canSaveDrug ? "opacity-50" : ""}`}
                  title={!isSaved && !isSubscribed && !canSaveDrug ? "Save limit reached - upgrade to save more" : isSaved ? "Remove from saved" : "Save drug"}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                  title="Create account to save drugs"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Middle row: Pharmacy badge and price */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              {drug.pharmacyType}
            </Badge>
            
            <div className="text-right">
              <p className="text-lg sm:text-xl font-bold text-primary tabular-nums">
                {formatPrice(drug.nadacPerUnit)}
              </p>
              <p className="text-xs text-muted-foreground">
                per {drug.pricingUnit?.toLowerCase() || "unit"} · {formatDate(drug.effectiveDate)}
              </p>
            </div>
          </div>

          {drug.explanation && formatExplanation(drug.explanation) && (
            <p className="text-xs text-muted-foreground border-t border-border/50 pt-2.5 leading-relaxed">
              {formatExplanation(drug.explanation)}
            </p>
          )}

          {/* Always-visible: Price History + Calculator */}
          <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row gap-3 sm:items-start">
            {/* Price History Button */}
            <div className="sm:w-auto">
              {canAccessPriceHistory ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPriceHistory(true)}
                  className="w-full sm:w-auto justify-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Price History
                </Button>
              ) : (
                <button
                  onClick={(e) => handleLockedClick(e, "Upgrade to view historical pricing trends")}
                  className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors w-full sm:w-auto"
                >
                  <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-muted-foreground">Price history (Pro)</span>
                </button>
              )}
            </div>

            {/* Calculator */}
            <div className="flex items-center gap-2 flex-1 sm:justify-end">
              <Calculator className="h-4 w-4 text-primary shrink-0" />
              <Input
                type="number"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-9 w-20"
                min="0"
                step="any"
              />
              {parsedQuantity > 0 ? (
                <div className="text-right">
                  <p className="text-sm font-bold text-primary tabular-nums leading-tight">{formatTotalPrice(totalPrice)}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">total</p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">= total</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        featureHighlight={upgradeFeatureHighlight}
      />

      <FreeAccountModal
        open={showFreeAccountModal}
        onOpenChange={setShowFreeAccountModal}
      />

      <PriceHistoryModal
        open={showPriceHistory}
        onOpenChange={setShowPriceHistory}
        ndc={drug.ndc}
        drugName={drug.drugName}
      />
    </>
  );
};
