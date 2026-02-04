import { Button } from "@/components/ui/button";
import { Scale, X } from "lucide-react";

interface CompareButtonProps {
  count: number;
  onCompare: () => void;
  onClear: () => void;
}

export const CompareButton = ({ count, onCompare, onClear }: CompareButtonProps) => {
  if (count < 2) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg">
        <Scale className="h-4 w-4" />
        <span className="font-medium">
          Compare {count} Drug{count !== 1 ? 's' : ''}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={onCompare}
          className="ml-2 h-7 px-3 text-xs"
        >
          View
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClear}
          className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
