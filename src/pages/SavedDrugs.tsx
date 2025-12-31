import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Loader2, ArrowUpDown, Bell, ArrowLeft, BookmarkCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { CategoryManager, Category, getCategoryColors } from "@/components/CategoryManager";
import { SavedDrugCard } from "@/components/SavedDrugCard";

interface SavedDrug {
  id: string;
  ndc: string;
  drug_name: string;
  notes: string | null;
  created_at: string;
}

interface DrugPrice {
  nadac_per_unit: number;
  effective_date: string;
  pricing_unit: string;
}

interface DrugCategoryLink {
  saved_drug_id: string;
  category_id: string;
}

type SortOption = "name-asc" | "name-desc" | "ndc-asc" | "ndc-desc" | "price-asc" | "price-desc";

export default function SavedDrugs() {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [savedDrugs, setSavedDrugs] = useState<SavedDrug[]>([]);
  const [drugPrices, setDrugPrices] = useState<Record<string, DrugPrice>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [drugCategoryLinks, setDrugCategoryLinks] = useState<DrugCategoryLink[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
    fetchAllData();
  }, [user, isSubscribed, navigate]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchSavedDrugs(),
      fetchCategories(),
      fetchDrugCategoryLinks(),
    ]);
    setIsLoading(false);
  };

  const fetchSavedDrugs = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_drugs")
        .select("id, ndc, drug_name, notes, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedDrugs(data || []);

      if (data && data.length > 0) {
        await fetchDrugPrices(data.map((d) => d.ndc));
      }
    } catch (error) {
      console.error("Error fetching saved drugs:", error);
      toast.error("Failed to load saved drugs");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("drug_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDrugCategoryLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_drug_categories")
        .select("saved_drug_id, category_id");

      if (error) throw error;
      setDrugCategoryLinks(data || []);
    } catch (error) {
      console.error("Error fetching drug category links:", error);
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
          .maybeSingle();

        if (!error && data) {
          prices[ndc] = data;
        }
      } catch (error) {
        console.error(`Error fetching price for NDC ${ndc}:`, error);
      }
    }

    setDrugPrices(prices);
  };

  // Category CRUD
  const handleCreateCategory = async (name: string, color: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("drug_categories")
      .insert({ name, color, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    setCategories((prev) => [...prev, data]);
  };

  const handleUpdateCategory = async (id: string, name: string, color: string) => {
    const { error } = await supabase
      .from("drug_categories")
      .update({ name, color })
      .eq("id", id);

    if (error) throw error;
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, color } : c))
    );
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("drug_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setDrugCategoryLinks((prev) => prev.filter((l) => l.category_id !== id));
    if (selectedCategory === id) {
      setSelectedCategory("all");
    }
  };

  // Drug category assignment
  const handleToggleCategory = async (drugId: string, categoryId: string, isAdding: boolean) => {
    if (isAdding) {
      const { error } = await supabase
        .from("saved_drug_categories")
        .insert({ saved_drug_id: drugId, category_id: categoryId });

      if (error) throw error;
      setDrugCategoryLinks((prev) => [
        ...prev,
        { saved_drug_id: drugId, category_id: categoryId },
      ]);
    } else {
      const { error } = await supabase
        .from("saved_drug_categories")
        .delete()
        .eq("saved_drug_id", drugId)
        .eq("category_id", categoryId);

      if (error) throw error;
      setDrugCategoryLinks((prev) =>
        prev.filter(
          (l) => !(l.saved_drug_id === drugId && l.category_id === categoryId)
        )
      );
    }
  };

  // Update notes
  const handleUpdateNotes = async (drugId: string, notes: string) => {
    const { error } = await supabase
      .from("saved_drugs")
      .update({ notes: notes || null })
      .eq("id", drugId);

    if (error) {
      toast.error("Failed to save notes");
      throw error;
    }

    setSavedDrugs((prev) =>
      prev.map((d) => (d.id === drugId ? { ...d, notes: notes || null } : d))
    );
    toast.success("Notes saved");
  };

  // Remove drug
  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_drugs").delete().eq("id", id);
      if (error) throw error;
      setSavedDrugs((prev) => prev.filter((d) => d.id !== id));
      toast.success("Drug removed from saved list");
    } catch (error) {
      console.error("Error removing drug:", error);
      toast.error("Failed to remove drug");
    }
  };

  // Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  // Get category IDs for a drug
  const getDrugCategoryIds = (drugId: string) => {
    return drugCategoryLinks
      .filter((l) => l.saved_drug_id === drugId)
      .map((l) => l.category_id);
  };

  // Get categories for a drug
  const getDrugCategories = (drugId: string) => {
    const categoryIds = getDrugCategoryIds(drugId);
    return categories.filter((c) => categoryIds.includes(c.id));
  };

  // Filter and sort
  const filteredAndSortedDrugs = useMemo(() => {
    let result = [...savedDrugs];

    // Filter by category
    if (selectedCategory !== "all") {
      const drugIdsInCategory = drugCategoryLinks
        .filter((l) => l.category_id === selectedCategory)
        .map((l) => l.saved_drug_id);
      result = result.filter((d) => drugIdsInCategory.includes(d.id));
    }

    // Sort
    result.sort((a, b) => {
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

    return result;
  }, [savedDrugs, drugPrices, sortBy, selectedCategory, drugCategoryLinks]);

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
                  {savedDrugs.length} drug{savedDrugs.length !== 1 ? "s" : ""} saved
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
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
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

          {/* Categories section */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Categories</span>
            </div>
            <CategoryManager
              categories={categories}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          </Card>

          {/* Category filter tabs */}
          {categories.length > 0 && (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="all"
                  className="h-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  All ({savedDrugs.length})
                </TabsTrigger>
                {categories.map((category) => {
                  const count = drugCategoryLinks.filter(
                    (l) => l.category_id === category.id
                  ).length;
                  const colors = getCategoryColors(category.color);
                  return (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className={`h-8 data-[state=active]:${colors.bg} data-[state=active]:${colors.text}`}
                    >
                      {category.name} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          )}

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
                <Button onClick={() => navigate("/")}>Search Drugs</Button>
              </div>
            </Card>
          ) : filteredAndSortedDrugs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No drugs in this category.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDrugs.map((drug) => (
                <SavedDrugCard
                  key={drug.id}
                  drug={drug}
                  price={drugPrices[drug.ndc]}
                  categories={getDrugCategories(drug.id)}
                  drugCategories={getDrugCategoryIds(drug.id)}
                  allCategories={categories}
                  onRemove={handleRemove}
                  onUpdateNotes={handleUpdateNotes}
                  onToggleCategory={handleToggleCategory}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
