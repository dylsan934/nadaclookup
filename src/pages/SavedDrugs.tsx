import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RefreshCw, Crown, Loader2, ArrowUpDown, Bell, ArrowLeft, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";

interface SavedDrug {
  id: string;
  ndc: string;
  drug_name: string;
  created_at: string;
}

interface DrugPrice {
  nadac_per_unit: number;
  effective_date: string;
  pricing_unit: string;
}

type SortOption = "name-asc" | "name-desc" | "ndc-asc" | "ndc-desc" | "price-asc" | "price-desc";

export default function SavedDrugs() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [savedDrugs, setSavedDrugs] = useState<SavedDrug[]>([]);
  const [drugPrices, setDrugPrices] = useState<Record<string, DrugPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isSubscribed) {
      navigate("/");
      return;
    }
    fetchSavedDrugs();
  }, [user, isSubscribed, navigate]);

  const fetchSavedDrugs = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_drugs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedDrugs(data || []);

      // Fetch current prices for each drug
      if (data && data.length > 0) {
        await fetchDrugPrices(data.map(d => d.ndc));
      }
    } catch (error) {
      console.error("Error fetching saved drugs:", error);
      toast.error("Failed to load saved drugs");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDrugPrices = async (ndcs: string[]) => {
    const prices: Record<string, DrugPrice> = {};
    
    for (const ndc of ndcs) {
      try {
        const { data, error } = await supabase
          .from("nadac_drugs")
          .select("nadac_per_unit, effective_date, pricing_unit")
          .eq("ndc", ndc)
          .order("effective_date", { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          prices[ndc] = data;
        }
      } catch (error) {
        console.error(`Error fetching price for NDC ${ndc}:`, error);
      }
    }
    
    setDrugPrices(prices);
  };

  const sortedDrugs = useMemo(() => {
    return [...savedDrugs].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.drug_name.localeCompare(b.drug_name);
        case "name-desc":
          return b.drug_name.localeCompare(a.drug_name);
        case "ndc-asc":
          return a.ndc.localeCompare(b.ndc);
        case "ndc-desc":
          return b.ndc.localeCompare(a.ndc);
        case "price-asc": {
          const priceA = drugPrices[a.ndc]?.nadac_per_unit ?? Infinity;
          const priceB = drugPrices[b.ndc]?.nadac_per_unit ?? Infinity;
          return priceA - priceB;
        }
        case "price-desc": {
          const priceA = drugPrices[a.ndc]?.nadac_per_unit ?? -Infinity;
          const priceB = drugPrices[b.ndc]?.nadac_per_unit ?? -Infinity;
          return priceB - priceA;
        }
        default:
          return 0;
      }
    });
  }, [savedDrugs, drugPrices, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSavedDrugs();
    setIsRefreshing(false);
    toast.success("Prices refreshed");
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_drugs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSavedDrugs(prev => prev.filter(d => d.id !== id));
      toast.success("Drug removed from saved list");
    } catch (error) {
      console.error("Error removing drug:", error);
      toast.error("Failed to remove drug");
    }
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading saved drugs...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Search
          </Button>

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookmarkCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Saved Drugs</h1>
                <p className="text-sm text-muted-foreground">
                  {savedDrugs.length} drug{savedDrugs.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[160px] h-9 bg-card">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg">
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="ndc-asc">NDC (Ascending)</SelectItem>
                  <SelectItem value="ndc-desc">NDC (Descending)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Alerts info */}
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Price Change Alerts Active</p>
                <p className="text-xs text-muted-foreground">
                  You'll receive email alerts when prices change by more than 1%
                </p>
              </div>
            </div>
          </Card>

          {/* Drug list */}
          {savedDrugs.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <BookmarkCheck className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No saved drugs yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search for drugs and save them to monitor their NADAC prices.
                  </p>
                </div>
                <Button onClick={() => navigate("/")}>
                  Search Drugs
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedDrugs.map((drug) => {
                const price = drugPrices[drug.ndc];
                return (
                  <Card key={drug.id} className="p-4 hover:shadow-md hover:border-border transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base text-foreground leading-snug">
                          {drug.drug_name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          NDC: <span className="font-mono">{drug.ndc}</span>
                        </p>
                        {price && (
                          <div className="mt-3 flex flex-wrap items-center gap-3">
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
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(drug.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
