import { DrugData } from "./DrugCard";
import { DrugComparisonTable } from "./DrugComparisonTable";
import { Button } from "@/components/ui/button";
import { Scale, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface DrugComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drugs: DrugData[];
  onRemove: (ndc: string) => void;
  onClearAll: () => void;
}

export const DrugComparisonModal = ({
  open,
  onOpenChange,
  drugs,
  onRemove,
  onClearAll,
}: DrugComparisonModalProps) => {
  const isMobile = useIsMobile();

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto py-4">
        {drugs.length > 0 ? (
          <DrugComparisonTable drugs={drugs} onRemove={onRemove} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drugs to compare</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select drugs from the search results to compare them
            </p>
          </div>
        )}
      </div>
      
      {drugs.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
          <p className="text-xs text-muted-foreground">
            ★ = Lowest price
          </p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Compare Drugs ({drugs.length})
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Compare Drugs ({drugs.length})
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
