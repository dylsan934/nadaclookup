import { useMemo, useState } from "react";
import { DrugData } from "./DrugCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, TableIcon } from "lucide-react";

interface DrugComparisonTableProps {
  drugs: DrugData[];
}

interface DrugGroup {
  ingredientName: string;
  strength: string;
  dosageForm: string;
  packages: PackageInfo[];
}

interface PackageInfo {
  ndc: string;
  packageSize: number;
  packageDescription: string;
  nadacPrice: number;
  unitCost: number;
  effectiveDate: string;
  pricingUnit: string;
}

// Extract ingredient name (first word or words before strength)
const extractIngredientName = (drugName: string): string => {
  const match = drugName.match(/^([A-Z][A-Z\s-]+?)(?:\s+\d|$)/i);
  return match ? match[1].trim() : drugName.split(" ")[0];
};

// Extract strength from drug name
const extractStrength = (drugName: string): string => {
  const match = drugName.match(/(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)\s*(MG|MCG|ML|G|%|UNIT|IU)/i);
  return match ? `${match[1]} ${match[2].toUpperCase()}` : "N/A";
};

// Extract dosage form from drug name
const extractDosageForm = (drugName: string): string => {
  const name = drugName.toUpperCase();
  if (name.includes("TABLET") || name.includes("TAB ")) return "Tablet";
  if (name.includes("CAPSULE") || name.includes("CAP ")) return "Capsule";
  if (name.includes("SOLUTION") || name.includes("SOLN")) return "Solution";
  if (name.includes("SUSPENSION") || name.includes("SUSP")) return "Suspension";
  if (name.includes("SYRUP")) return "Syrup";
  if (name.includes("INJECTION") || name.includes("INJ ")) return "Injection";
  if (name.includes("VIAL")) return "Vial";
  if (name.includes("SYRINGE")) return "Syringe";
  if (name.includes("CREAM")) return "Cream";
  if (name.includes("OINTMENT")) return "Ointment";
  if (name.includes("GEL")) return "Gel";
  if (name.includes("PATCH")) return "Patch";
  if (name.includes("SPRAY")) return "Spray";
  if (name.includes("DROPS")) return "Drops";
  return "Other";
};

// Extract package size from NDC (typically the last segment indicates quantity)
const extractPackageSize = (ndc: string, drugName: string): number => {
  // Try to extract from drug name first
  const sizeMatch = drugName.match(/(\d+)\s*(?:CT|COUNT|PACK|PK|EA|EACH|UNIT)/i);
  if (sizeMatch) return parseInt(sizeMatch[1], 10);
  
  // Use last segment of NDC as fallback
  const ndcParts = ndc.replace(/-/g, "").slice(-2);
  const size = parseInt(ndcParts, 10);
  return size > 0 ? size : 1;
};

// Extract package description from drug name
const extractPackageDescription = (drugName: string): string => {
  // Look for package info at the end
  const parts = drugName.split(/\s+/);
  const lastPart = parts[parts.length - 1];
  
  // Check for common package descriptors
  if (/\d+CT|\d+PACK|\d+EA/i.test(drugName)) {
    const match = drugName.match(/(\d+\s*(?:CT|COUNT|PACK|PK|EA|EACH|UNIT))/i);
    return match ? match[1] : lastPart;
  }
  
  return lastPart;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
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

export const DrugComparisonTable = ({ drugs }: DrugComparisonTableProps) => {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Group drugs by ingredient, strength, and dosage form
  const groupedDrugs = useMemo(() => {
    const groups = new Map<string, DrugGroup>();

    drugs.forEach((drug) => {
      const ingredientName = extractIngredientName(drug.drugName);
      const strength = extractStrength(drug.drugName);
      const dosageForm = extractDosageForm(drug.drugName);
      const groupKey = `${ingredientName}|${strength}|${dosageForm}`;

      const packageSize = extractPackageSize(drug.ndc, drug.drugName);
      const unitCost = drug.nadacPerUnit; // Already per unit from NADAC

      const packageInfo: PackageInfo = {
        ndc: drug.ndc,
        packageSize,
        packageDescription: extractPackageDescription(drug.drugName),
        nadacPrice: drug.nadacPerUnit,
        unitCost,
        effectiveDate: drug.effectiveDate,
        pricingUnit: drug.pricingUnit,
      };

      if (groups.has(groupKey)) {
        groups.get(groupKey)!.packages.push(packageInfo);
      } else {
        groups.set(groupKey, {
          ingredientName,
          strength,
          dosageForm,
          packages: [packageInfo],
        });
      }
    });

    // Sort packages within each group by unit cost
    groups.forEach((group) => {
      group.packages.sort((a, b) => a.unitCost - b.unitCost);
    });

    return Array.from(groups.values());
  }, [drugs]);

  if (drugs.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end">
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as "table" | "card")}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem value="table" aria-label="Table view" className="gap-2 data-[state=on]:bg-background">
            <TableIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="card" aria-label="Card view" className="gap-2 data-[state=on]:bg-background">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Cards</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Grouped Results */}
      {groupedDrugs.map((group, groupIndex) => (
        <Card key={`${group.ingredientName}-${group.strength}-${group.dosageForm}-${groupIndex}`} className="overflow-hidden">
          {/* Group Header */}
          <div className="bg-muted/50 px-4 py-3 border-b border-border">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{group.ingredientName}</h3>
              <Badge variant="secondary">{group.strength}</Badge>
              <Badge variant="outline">{group.dosageForm}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {group.packages.length} package{group.packages.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Table View */}
          {viewMode === "table" && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">NDC</TableHead>
                    <TableHead className="min-w-[100px]">Package</TableHead>
                    <TableHead className="min-w-[120px]">Description</TableHead>
                    <TableHead className="text-right min-w-[100px]">NADAC Price</TableHead>
                    <TableHead className="text-right min-w-[100px]">Unit Cost</TableHead>
                    <TableHead className="text-right min-w-[100px]">Effective Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.packages.map((pkg, pkgIndex) => {
                    const isBestValue = pkgIndex === 0 && group.packages.length > 1;
                    return (
                      <TableRow key={pkg.ndc} className={isBestValue ? "bg-accent/50" : ""}>
                        <TableCell className="font-mono text-sm">{pkg.ndc}</TableCell>
                        <TableCell>{pkg.packageSize} {pkg.pricingUnit}s</TableCell>
                        <TableCell className="text-muted-foreground">{pkg.packageDescription}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatPrice(pkg.nadacPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-semibold tabular-nums text-primary">
                              {formatPrice(pkg.unitCost)}
                            </span>
                            {isBestValue && (
                              <Badge variant="default" className="text-xs shrink-0">
                                Best Value
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {formatDate(pkg.effectiveDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Card View */}
          {viewMode === "card" && (
            <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.packages.map((pkg, pkgIndex) => {
                const isBestValue = pkgIndex === 0 && group.packages.length > 1;
                return (
                  <div
                    key={pkg.ndc}
                    className={`p-4 rounded-lg border ${
                      isBestValue
                        ? "border-primary bg-accent/50"
                        : "border-border bg-card"
                    }`}
                  >
                    {isBestValue && (
                      <Badge variant="default" className="text-xs mb-2">
                        Best Value
                      </Badge>
                    )}
                    <p className="font-mono text-sm text-muted-foreground">{pkg.ndc}</p>
                    <p className="font-semibold mt-1">
                      {pkg.packageSize} {pkg.pricingUnit}s
                    </p>
                    <p className="text-xs text-muted-foreground">{pkg.packageDescription}</p>
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">NADAC</span>
                        <span className="font-semibold tabular-nums">{formatPrice(pkg.nadacPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-muted-foreground">Unit Cost</span>
                        <span className="font-semibold tabular-nums text-primary">
                          {formatPrice(pkg.unitCost)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground text-right mt-2">
                        {formatDate(pkg.effectiveDate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
