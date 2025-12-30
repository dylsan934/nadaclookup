import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { DrugResults } from "@/components/DrugResults";
import { DrugData } from "@/components/DrugCard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<DrugData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a drug name or NDC code to search.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setLastSearchTerm(searchTerm);

    try {
      // TODO: Replace with actual API call once backend is set up
      // For now, show a message about needing to set up the backend
      toast({
        title: "Backend Required",
        description: "Connect to Lovable Cloud to enable NADAC data fetching.",
      });
      setResults([]);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Section */}
          <section className="-mt-20 md:-mt-24 relative z-10 mb-12">
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                isLoading={isLoading}
              />
              <p className="text-center text-sm text-muted-foreground mt-4">
                Search by drug name (e.g., "Metformin") or NDC code (e.g., "00093-7212-01")
              </p>
            </div>
          </section>

          {/* Results Section */}
          <section>
            <DrugResults
              drugs={results}
              isLoading={isLoading}
              hasSearched={hasSearched}
              searchTerm={lastSearchTerm}
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
