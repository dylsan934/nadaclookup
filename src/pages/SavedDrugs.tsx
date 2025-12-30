import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Crown, Loader2 } from "lucide-react";
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

export default function SavedDrugs() {
  const { user, isSubscribed, session } = useAuth();
  const navigate = useNavigate();
  const [savedDrugs, setSavedDrugs] = useState<SavedDrug[]>([]);
  const [drugPrices, setDrugPrices] = useState<Record<string, DrugPrice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">Saved Drugs</h1>
              <Badge className="bg-primary/10 text-primary">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Prices
            </Button>
          </div>

          {savedDrugs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No saved drugs yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Search for drugs and save them to monitor their NADAC prices.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate("/")}
              >
                Search Drugs
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {savedDrugs.map((drug) => {
                const price = drugPrices[drug.ndc];
                return (
                  <Card key={drug.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{drug.drug_name}</h3>
                      <p className="text-sm text-muted-foreground">NDC: {drug.ndc}</p>
                      {price && (
                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-lg font-bold text-primary">
                            {formatPrice(price.nadac_per_unit)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {price.pricing_unit}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            as of {formatDate(price.effective_date)}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(drug.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
