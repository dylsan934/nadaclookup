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
  
  const [dataStatus, setDataStatus] = useState({
    hasData: false,
    lastUpdate: undefined as string | undefined,
    totalRecords: 0,
  });
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { toast } = useToast();

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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
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
    setLastSearchTerm(searchTerm);

    try {
      const response = await nadacApi.search(searchTerm);
      
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
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Search Section */}
          <section className="-mt-20 md:-mt-24 relative z-10 mb-8">
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

          {/* Data Status */}
          <section className="mb-8">
            <DataStatus
              hasData={dataStatus.hasData}
              lastUpdate={dataStatus.lastUpdate}
              totalRecords={dataStatus.totalRecords}
              isLoading={isCheckingStatus}
              isSyncing={isSyncing}
              onSync={handleSync}
            />
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
