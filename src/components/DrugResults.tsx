import { useState, useMemo } from "react";
import { DrugCard, DrugData } from "./DrugCard";
import { ResultsFilters, SortOption, DosageFilter, BrandFilter } from "./ResultsFilters";
import { FileSearch, Loader2 } from "lucide-react";

interface DrugResultsProps {
  drugs: DrugData[];
  isLoading: boolean;
  hasSearched: boolean;
  searchTerm: string;
}

// Helper to extract strength from drug name (e.g., "METFORMIN HCL 500 MG TABLET" -> "500 MG")
const extractStrength = (drugName: string): string => {
  const match = drugName.match(/(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)\s*(MG|MCG|ML|G|%|UNIT|IU)/i);
  return match ? `${match[1]} ${match[2].toUpperCase()}` : "";
};

// Helper to detect dosage form
const detectDosageForm = (drugName: string): DosageFilter => {
  const name = drugName.toUpperCase();
  if (name.includes("TABLET") || name.includes("TAB ")) return "tablet";
  if (name.includes("CAPSULE") || name.includes("CAP ")) return "capsule";
  if (name.includes("SOLUTION") || name.includes("SOLN") || name.includes("SYRUP") || name.includes("SUSPENSION") || name.includes("ORAL LIQUID")) return "solution";
  if (name.includes("INJECTION") || name.includes("INJ ") || name.includes("VIAL") || name.includes("SYRINGE")) return "injection";
  if (name.includes("CREAM") || name.includes("OINTMENT") || name.includes("GEL") || name.includes("TOPICAL")) return "cream";
  return "other";
};

// Helper to detect if brand or generic (simplified heuristic)
const detectBrandType = (drugName: string): BrandFilter => {
  // Brand names are typically single words, generics often have chemical suffixes
  const genericIndicators = ["HCL", "SODIUM", "SULFATE", "CHLORIDE", "ACETATE", "PHOSPHATE", "TARTRATE", "MALEATE", "FUMARATE", "CITRATE"];
  const upperName = drugName.toUpperCase();
  
  for (const indicator of genericIndicators) {
    if (upperName.includes(indicator)) return "generic";
  }
  
  // If name starts with a typical generic suffix pattern, likely generic
  if (/^[A-Z]+\s+(HCL|ER|SR|XR|CR|DR|IR|LA|SA)/i.test(drugName)) return "generic";
  
  return "all"; // Can't determine with certainty
};

export const DrugResults = ({ drugs, isLoading, hasSearched, searchTerm }: DrugResultsProps) => {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [dosageFilter, setDosageFilter] = useState<DosageFilter>("all");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");
  const [strengthFilter, setStrengthFilter] = useState<string>("all");

  // Extract available strengths from current results
  const availableStrengths = useMemo(() => {
    const strengths = new Set<string>();
    drugs.forEach(drug => {
      const strength = extractStrength(drug.drugName);
      if (strength) strengths.add(strength);
    });
    return Array.from(strengths).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      return numA - numB;
    });
  }, [drugs]);

  // Filter and sort drugs
  const filteredAndSortedDrugs = useMemo(() => {
    let result = [...drugs];

    // Apply dosage form filter
    if (dosageFilter !== "all") {
      result = result.filter(drug => detectDosageForm(drug.drugName) === dosageFilter);
    }

    // Apply brand/generic filter
    if (brandFilter !== "all") {
      result = result.filter(drug => {
        const type = detectBrandType(drug.drugName);
        return type === brandFilter || type === "all";
      });
    }

    // Apply strength filter
    if (strengthFilter !== "all") {
      result = result.filter(drug => extractStrength(drug.drugName) === strengthFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.nadacPerUnit - b.nadacPerUnit);
        break;
      case "price-desc":
        result.sort((a, b) => b.nadacPerUnit - a.nadacPerUnit);
        break;
      case "name-asc":
        result.sort((a, b) => a.drugName.localeCompare(b.drugName));
        break;
      case "name-desc":
        result.sort((a, b) => b.drugName.localeCompare(a.drugName));
        break;
      default:
        // relevance - keep original order
        break;
    }

    return result;
  }, [drugs, sortBy, dosageFilter, brandFilter, strengthFilter]);

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
      {/* Results header with count */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Found <span className="font-semibold text-foreground">{drugs.length}</span> result{drugs.length !== 1 ? 's' : ''} for "{searchTerm}"
          {filteredAndSortedDrugs.length !== drugs.length && (
            <span className="ml-1">
              (showing <span className="font-semibold text-foreground">{filteredAndSortedDrugs.length}</span>)
            </span>
          )}
        </p>
      </div>

      {/* Filter and sort controls */}
      <ResultsFilters
        sortBy={sortBy}
        onSortChange={setSortBy}
        dosageFilter={dosageFilter}
        onDosageFilterChange={setDosageFilter}
        brandFilter={brandFilter}
        onBrandFilterChange={setBrandFilter}
        strengthFilter={strengthFilter}
        onStrengthFilterChange={setStrengthFilter}
        availableStrengths={availableStrengths}
        totalResults={filteredAndSortedDrugs.length}
      />

      {/* Results list */}
      {filteredAndSortedDrugs.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No results match your filters.</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedDrugs.map((drug, index) => (
            <DrugCard key={`${drug.ndc}-${index}`} drug={drug} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};
