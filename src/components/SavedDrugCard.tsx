import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Calculator, Tag, StickyNote, Check, X, Plus, Lock, Crown, History } from "lucide-react";
import { Category, getCategoryColors } from "./CategoryManager";
import { useAuth } from "@/contexts/AuthContext";
import { PriceHistoryModal } from "@/components/PriceHistoryModal";

interface DrugPrice {
  nadac_per_unit: number;
  effective_date: string;
  pricing_unit: string;
}

interface SavedDrug {
  id: string;
  ndc: string;
  drug_name: string;
  notes: string | null;
  alerts_enabled: boolean;
  calculator_qty: number | null;
  created_at: string;
}

interface SavedDrugCardProps {
  drug: SavedDrug;
  price?: DrugPrice;
  categories: Category[];
  drugCategories: string[];
  allCategories: Category[];
  onRemove: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onToggleCategory: (drugId: string, categoryId: string, isAdding: boolean) => Promise<void>;
  onUpdateQuantity: (id: string, qty: number | null) => Promise<void>;
  onUpgrade?: () => void;
}

export const SavedDrugCard = ({
  drug,
  price,
  categories,
  drugCategories,
  allCategories,
  onRemove,
  onUpdateNotes,
  onToggleCategory,
  onUpdateQuantity,
  onUpgrade,
}: SavedDrugCardProps) => {
  const { isSubscribed } = useAuth();
  const [quantity, setQuantity] = useState(drug.calculator_qty?.toString() || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(drug.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setQuantity(drug.calculator_qty?.toString() || "");
  }, [drug.calculator_qty]);

  useEffect(() => {
    setNotes(drug.notes || "");
  }, [drug.notes]);

  const formatPrice = (priceVal: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(priceVal);
  };

  const formatTotalPrice = (priceVal: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(priceVal);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const parsedQuantity = parseFloat(quantity) || 0;
  const totalPrice = parsedQuantity * (price?.nadac_per_unit || 0);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(drug.id, notes);
      setIsEditingNotes(false);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelNotes = () => {
    setNotes(drug.notes || "");
    setIsEditingNotes(false);
  };

  const availableCategories = allCategories.filter(
    (cat) => !drugCategories.includes(cat.id)
  );

  return (
    <Card className="p-4 hover:shadow-md hover:border-border transition-all duration-200">
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-foreground leading-snug">
              {drug.drug_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              NDC: <span className="font-mono">{drug.ndc}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(drug.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((category) => {
            const colors = getCategoryColors(category.color);
            return (
              <Badge
                key={category.id}
                variant="outline"
                className={`${colors.bg} ${colors.text} ${colors.border} text-xs font-normal cursor-pointer group`}
                onClick={() => onToggleCategory(drug.id, category.id, false)}
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {category.name}
                <X className="h-2.5 w-2.5 ml-1 opacity-50 group-hover:opacity-100" />
              </Badge>
            );
          })}
          {availableCategories.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 bg-popover border border-border shadow-lg" align="start">
                <div className="space-y-1">
                  {availableCategories.map((category) => {
                    const colors = getCategoryColors(category.color);
                    return (
                      <button
                        key={category.id}
                        onClick={() => onToggleCategory(drug.id, category.id, true)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-sm text-left"
                      >
                        <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Price and Calculator */}
        {price && (
          <div className="pt-3 border-t border-border/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-lg font-bold text-primary tabular-nums">
                  {formatPrice(price.nadac_per_unit)}
                </span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {price.pricing_unit}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(price.effective_date)}
                </span>
              </div>
            </div>

            {/* Price History Button - Premium Only */}
            {isSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPriceHistory(true)}
                className="w-full justify-center gap-2"
              >
                <History className="h-4 w-4" />
                View Price History
              </Button>
            ) : (
              <button
                onClick={onUpgrade}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors w-full group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/50">
                    <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Price history is a Pro feature</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Crown className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Upgrade</span>
                </div>
              </button>
            )}

            {/* Calculator - Free for all users */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">Calculate:</span>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuantity(val);
                    // Debounce the save
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current);
                    }
                    debounceRef.current = setTimeout(() => {
                      const numVal = parseFloat(val);
                      onUpdateQuantity(drug.id, isNaN(numVal) ? null : numVal);
                    }, 500);
                  }}
                  className="w-20 h-8 text-sm"
                  min="0"
                  step="any"
                />
                <span className="text-xs text-muted-foreground">{price.pricing_unit}s</span>
              </div>
              {parsedQuantity > 0 && (
                <div className="text-right sm:pl-4 sm:border-l border-border/50">
                  <span className="text-xs text-muted-foreground mr-2">Total:</span>
                  <span className="text-base font-bold text-primary tabular-nums">
                    {formatTotalPrice(totalPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Notes */}
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
          </div>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this drug..."
                className="min-h-[80px] text-sm resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{notes.length}/500</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelNotes}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="h-7 text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {isSavingNotes ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="w-full text-left p-2 rounded-md border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              {drug.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{drug.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Click to add notes...</p>
              )}
            </button>
          )}
        </div>
      </div>

      <PriceHistoryModal
        open={showPriceHistory}
        onOpenChange={setShowPriceHistory}
        ndc={drug.ndc}
        drugName={drug.drug_name}
      />
    </Card>
  );
};
