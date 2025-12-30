import { DrugCard, DrugData } from "./DrugCard";
import { FileSearch, Loader2 } from "lucide-react";

interface DrugResultsProps {
  drugs: DrugData[];
  isLoading: boolean;
  hasSearched: boolean;
  searchTerm: string;
}

export const DrugResults = ({ drugs, isLoading, hasSearched, searchTerm }: DrugResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground">Searching NADAC database...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-6">
          <FileSearch className="h-10 w-10 text-accent-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Search for Drug Pricing
        </h3>
        <p className="text-muted-foreground max-w-md">
          Enter a drug name or NDC code above to find current NADAC pricing information.
        </p>
      </div>
    );
  }

  if (drugs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <FileSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Results Found
        </h3>
        <p className="text-muted-foreground max-w-md">
          No drugs matching "{searchTerm}" were found. Try a different search term or NDC code.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">
          Found <span className="font-semibold text-foreground">{drugs.length}</span> result{drugs.length !== 1 ? 's' : ''} for "{searchTerm}"
        </p>
      </div>
      <div className="space-y-3">
        {drugs.map((drug, index) => (
          <DrugCard key={`${drug.ndc}-${index}`} drug={drug} index={index} />
        ))}
      </div>
    </div>
  );
};
