import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";

export type SortOption = "relevance" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
export type DosageFilter = "all" | "tablet" | "capsule" | "solution" | "injection" | "cream" | "other";
export type BrandFilter = "all" | "generic" | "brand";

interface ResultsFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  dosageFilter: DosageFilter;
  onDosageFilterChange: (filter: DosageFilter) => void;
  brandFilter: BrandFilter;
  onBrandFilterChange: (filter: BrandFilter) => void;
  strengthFilter: string;
  onStrengthFilterChange: (filter: string) => void;
  availableStrengths: string[];
  totalResults: number;
}

export const ResultsFilters = ({
  sortBy,
  onSortChange,
  dosageFilter,
  onDosageFilterChange,
  brandFilter,
  onBrandFilterChange,
  strengthFilter,
  onStrengthFilterChange,
  availableStrengths,
  totalResults,
}: ResultsFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    dosageFilter !== "all",
    brandFilter !== "all",
    strengthFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    onDosageFilterChange("all");
    onBrandFilterChange("all");
    onStrengthFilterChange("all");
  };

  return (
    <div className="space-y-3">
      {/* Main controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">Sort:</span>
          <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
            <SelectTrigger className="w-[160px] h-9 bg-card">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div className="p-4 bg-card rounded-lg border border-border/50 shadow-soft animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Dosage Form Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Dosage Form</label>
              <Select value={dosageFilter} onValueChange={(value: DosageFilter) => onDosageFilterChange(value)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="All forms" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  <SelectItem value="all">All Forms</SelectItem>
                  <SelectItem value="tablet">Tablets</SelectItem>
                  <SelectItem value="capsule">Capsules</SelectItem>
                  <SelectItem value="solution">Solutions</SelectItem>
                  <SelectItem value="injection">Injections</SelectItem>
                  <SelectItem value="cream">Creams/Ointments</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Brand vs Generic Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Brand/Generic</label>
              <Select value={brandFilter} onValueChange={(value: BrandFilter) => onBrandFilterChange(value)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="generic">Generic Only</SelectItem>
                  <SelectItem value="brand">Brand Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Strength Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Strength</label>
              <Select value={strengthFilter} onValueChange={onStrengthFilterChange}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="All strengths" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50 max-h-60">
                  <SelectItem value="all">All Strengths</SelectItem>
                  {availableStrengths.map((strength) => (
                    <SelectItem key={strength} value={strength}>
                      {strength}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active:</span>
          {dosageFilter !== "all" && (
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDosageFilterChange("all")}
            >
              {dosageFilter.charAt(0).toUpperCase() + dosageFilter.slice(1)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {brandFilter !== "all" && (
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onBrandFilterChange("all")}
            >
              {brandFilter.charAt(0).toUpperCase() + brandFilter.slice(1)}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
          {strengthFilter !== "all" && (
            <Badge 
              variant="secondary" 
              className="cursor-pointer hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onStrengthFilterChange("all")}
            >
              {strengthFilter}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
