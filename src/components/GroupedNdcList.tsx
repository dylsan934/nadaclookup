import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupedNdcListProps {
  representativeNdc: string;
  ndcs: string[];
}

/** Shows one representative NDC; discloses all grouped package NDCs on demand. */
export const GroupedNdcList = ({ representativeNdc, ndcs }: GroupedNdcListProps) => {
  const [open, setOpen] = useState(false);
  const listId = useId();
  return (
    <div className="text-muted-foreground text-xs mt-1">
      <p>
        NDC: <span className="font-mono">{representativeNdc}</span>
        {ndcs.length > 1 && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
            className="ml-2 inline-flex items-center gap-0.5 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {open ? "Hide" : "View"} {ndcs.length} NDCs
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden="true" />
          </button>
        )}
      </p>
      {ndcs.length > 1 && (
        <ul id={listId} hidden={!open} aria-label="Package NDCs in this group" className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5 font-mono">
          {ndcs.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
    </div>
  );
};
