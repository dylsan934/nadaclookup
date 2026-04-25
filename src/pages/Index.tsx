import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { DrugResults } from "@/components/DrugResults";
import { DataStatus } from "@/components/DataStatus";
import { HomeSEOContent } from "@/components/HomeSEOContent";
import { HomePricing } from "@/components/HomePricing";
import { PopularDrugLinks } from "@/components/PopularDrugLinks";
import { DrugData } from "@/components/DrugCard";
import { nadacApi } from "@/lib/nadac-api";
import { useToast } from "@/hooks/use-toast";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is NADAC and why does it matter for pharmacies?", acceptedAnswer: { "@type": "Answer", text: "NADAC (National Average Drug Acquisition Cost) is a weekly pricing benchmark published by CMS based on actual pharmacy invoice data. It's the most accurate reflection of what pharmacies pay for drugs." }},
    { "@type": "Question", name: "How often are NADAC prices updated?", acceptedAnswer: { "@type": "Answer", text: "NADAC prices are updated every Wednesday by CMS." }},
    { "@type": "Question", name: "Can I look up NADAC prices by NDC code?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can search by either drug name or 11-digit NDC code." }},
    { "@type": "Question", name: "How is NADAC different from AWP or WAC?", acceptedAnswer: { "@type": "Answer", text: "AWP and WAC are manufacturer-set list prices. NADAC is based on real pharmacy invoice data, making it far more accurate for understanding true acquisition costs." }},
  ],
};

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
  
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { checkDataStatus(); }, []);

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

  const handleSearch = async (overrideSearchTerm?: string) => {
    const termToSearch = overrideSearchTerm ?? searchTerm;
    
    if (!termToSearch.trim()) {
      toast({ title: "Search term required", description: "Please enter a drug name or NDC code to search.", variant: "destructive" });
      return;
    }

    if (!dataStatus.hasData) {
      toast({ title: "No Data Available", description: "Please sync the NADAC database first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setLastSearchTerm(termToSearch);
    if (overrideSearchTerm) setSearchTerm(overrideSearchTerm);

    try {
      const response = await nadacApi.search(termToSearch);
      if (response.success && response.data) {
        setResults(response.data);
        if (response.data.length === 0) {
          toast({ title: "No Results", description: `No drugs found matching "${searchTerm}".` });
        }
      } else {
        toast({ title: "Search failed", description: response.error || "An error occurred while searching.", variant: "destructive" });
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({ title: "Search failed", description: "An error occurred while searching. Please try again.", variant: "destructive" });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <Header />
      <SiteNavigation />
      
      {/* Sticky Search Bar */}
      <div 
        className={`sticky top-0 z-50 bg-background/98 backdrop-blur-lg transition-all duration-200 ${
          isScrolled ? 'shadow-sm border-b border-border/60' : ''
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-center text-sm text-muted-foreground">
            Search by drug name (e.g., "Metformin") or NDC code (e.g., "00093-7212-01")
          </p>

          <DataStatus hasData={dataStatus.hasData} lastUpdate={dataStatus.lastUpdate} totalRecords={dataStatus.totalRecords} isLoading={isCheckingStatus} />

          <section className="pt-2">
            <DrugResults drugs={results} isLoading={isLoading} hasSearched={hasSearched} searchTerm={lastSearchTerm} />
          </section>

          {/* Pricing section */}
          <HomePricing />

          {/* SEO content below search results */}
          {!hasSearched && <HomeSEOContent />}

          {/* Popular drug pages — internal linking for programmatic SEO */}
          {!hasSearched && <PopularDrugLinks />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
