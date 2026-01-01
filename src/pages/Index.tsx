import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { DrugResults } from "@/components/DrugResults";
import { DataStatus } from "@/components/DataStatus";
import { DrugData } from "@/components/DrugCard";
import { nadacApi } from "@/lib/nadac-api";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<DrugData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [dataStatus, setDataStatus] = useState({
    hasData: false,
    lastUpdate: undefined as string | undefined,
    totalRecords: 0,
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { toast } = useToast();

  // Track scroll for sticky shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check data status on mount
  useEffect(() => {
    checkDataStatus();
  }, []);

  const checkDataStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const status = await nadacApi.getDataStatus();
      setDataStatus(status);
    } catch (error) {
      console.error('Failed to check data status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      toast({
        title: "Syncing NADAC Data",
        description: "This may take a minute. Please wait...",
      });

      const result = await nadacApi.syncData();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: result.message || `Successfully synced ${result.totalRecords} records.`,
        });
        await checkDataStatus();
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync NADAC data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "An error occurred while syncing data.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearch = async (overrideSearchTerm?: string) => {
    const termToSearch = overrideSearchTerm ?? searchTerm;
    
    if (!termToSearch.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a drug name or NDC code to search.",
        variant: "destructive",
      });
      return;
    }

    if (!dataStatus.hasData) {
      toast({
        title: "No Data Available",
        description: "Please sync the NADAC database first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setLastSearchTerm(termToSearch);
    
    // Update the input field if using override term
    if (overrideSearchTerm) {
      setSearchTerm(overrideSearchTerm);
    }

    try {
      const response = await nadacApi.search(termToSearch);
      
      if (response.success && response.data) {
        setResults(response.data);
        if (response.data.length === 0) {
          toast({
            title: "No Results",
            description: `No drugs found matching "${searchTerm}".`,
          });
        }
      } else {
        toast({
          title: "Search failed",
          description: response.error || "An error occurred while searching.",
          variant: "destructive",
        });
        setResults([]);
      }
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
      
      {/* Sticky Search Bar */}
      <div 
        className={`sticky top-0 z-50 bg-background/98 backdrop-blur-lg transition-all duration-200 ${
          isScrolled 
            ? 'shadow-sm border-b border-border/60' 
            : ''
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Search hint */}
          <p className="text-center text-sm text-muted-foreground">
            Search by drug name (e.g., "Metformin") or NDC code (e.g., "00093-7212-01")
          </p>

          {/* Data Status */}
          <DataStatus
            hasData={dataStatus.hasData}
            lastUpdate={dataStatus.lastUpdate}
            totalRecords={dataStatus.totalRecords}
            isLoading={isCheckingStatus}
            isSyncing={isSyncing}
            onSync={handleSync}
          />

          {/* Results Section */}
          <section className="pt-2">
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
