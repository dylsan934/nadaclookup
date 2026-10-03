import { useEffect, useMemo, useState } from "react";
import { extractStrength, detectDosageForm, toResultGroups } from "@/lib/search-ranking";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "@/lib/router-compat";
import { DrugCard, DrugData } from "./DrugCard";
import { ResultsFilters, SortOption, DosageFilter } from "./ResultsFilters";
import { CompareButton } from "./CompareButton";
import { DrugComparisonModal } from "./DrugComparisonModal";
import { FileSearch, Loader2 } from "lucide-react";

interface DrugResultsProps {
  drugs: DrugData[];
  isLoading: boolean;
  hasSearched: boolean;
  searchTerm: string;
}

export const PAGE_SIZE = 20;

export const DrugResults = ({ drugs, isLoading, hasSearched, searchTerm }: DrugResultsProps) => {
  // Sort/filter state lives in the URL so browser Back restores the same view.
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = (searchParams.get("sort") ?? "relevance") as SortOption;
  const dosageFilter = (searchParams.get("form") ?? "all") as DosageFilter;
  const strengthFilter = searchParams.get("strength") ?? "all";
  const setParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };
  const setSortBy = (v: SortOption) => setParam("sort", v, "relevance");
  const setDosageFilter = (v: DosageFilter) => setParam("form", v, "all");
  const setStrengthFilter = (v: string) => setParam("strength", v, "all");
  const [selectedForCompare, setSelectedForCompare] = useState<DrugData[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Toggle drug selection for comparison
  const toggleDrugSelection = (drug: DrugData) => {
    setSelectedForCompare(prev => {
      const isSelected = prev.some(d => d.ndc === drug.ndc);
      if (isSelected) {
        return prev.filter(d => d.ndc !== drug.ndc);
      }
      if (prev.length >= 4) return prev; // Max 4 drugs
      return [...prev, drug];
    });
  };

  const removeDrugFromCompare = (ndc: string) => {
    setSelectedForCompare(prev => prev.filter(d => d.ndc !== ndc));
  };

  const clearComparison = () => {
    setSelectedForCompare([]);
    setShowComparison(false);
  };

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

  // Rank, then group package NDCs, then filter and sort the groups.
  const filteredAndSortedGroups = useMemo(() => {
    let result = toResultGroups(drugs, searchTerm);
    if (dosageFilter !== "all") {
      result = result.filter(g => detectDosageForm(g.representative.drugName) === dosageFilter);
    }
    if (strengthFilter !== "all") {
      result = result.filter(g => extractStrength(g.representative.drugName) === strengthFilter);
    }
    const r = (g: (typeof result)[number]) => g.representative;
    switch (sortBy) {
      case "price-asc": result.sort((a, b) => r(a).nadacPerUnit - r(b).nadacPerUnit); break;
      case "price-desc": result.sort((a, b) => r(b).nadacPerUnit - r(a).nadacPerUnit); break;
      case "name-asc": result.sort((a, b) => r(a).drugName.localeCompare(r(b).drugName)); break;
      case "name-desc": result.sort((a, b) => r(b).drugName.localeCompare(r(a).drugName)); break;
      default: break; // relevance — keep ranked order
    }
    return result;
  }, [drugs, searchTerm, sortBy, dosageFilter, strengthFilter]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [drugs, sortBy, dosageFilter, strengthFilter]);
  const visibleGroups = filteredAndSortedGroups.slice(0, visibleCount);
  const remaining = filteredAndSortedGroups.length - visibleGroups.length;

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
          {filteredAndSortedGroups.length !== drugs.length && (
            <span className="ml-1">
              (<span className="font-semibold text-foreground">{filteredAndSortedGroups.length}</span> product{filteredAndSortedGroups.length !== 1 ? "s" : ""})
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
        strengthFilter={strengthFilter}
        onStrengthFilterChange={setStrengthFilter}
        availableStrengths={availableStrengths}
        totalResults={filteredAndSortedGroups.length}
      />

      {/* Results list */}
      {filteredAndSortedGroups.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No results match your filters.</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3" aria-label="Search results">
            {visibleGroups.map((group, index) => {
              const drug = group.representative;
              return (
                <li key={group.key}>
                  <DrugCard
                    drug={drug}
                    index={index % PAGE_SIZE}
                    groupNdcs={group.ndcs}
                    isSelected={selectedForCompare.some(d => d.ndc === drug.ndc)}
                    onToggleSelect={() => toggleDrugSelection(drug)}
                    selectionDisabled={selectedForCompare.length >= 4 && !selectedForCompare.some(d => d.ndc === drug.ndc)}
                  />
                </li>
              );
            })}
          </ul>
          {remaining > 0 && (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="outline" onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                Load more results ({remaining} more)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Compare button and modal */}
      <CompareButton
        count={selectedForCompare.length}
        onCompare={() => setShowComparison(true)}
        onClear={clearComparison}
      />
      
      <DrugComparisonModal
        open={showComparison}
        onOpenChange={setShowComparison}
        drugs={selectedForCompare}
        onRemove={removeDrugFromCompare}
        onClearAll={clearComparison}
      />
    </div>
  );
};
