import { useSuspenseQuery } from "@tanstack/react-query";
import { weeklyPublicationQuery } from "@/lib/weekly-publication.query";
import { visiblePublication } from "@/lib/weekly-publication";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@/lib/router-compat";
import { Header } from "@/components/Header";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { SearchBar } from "@/components/SearchBar";
import { DrugResults } from "@/components/DrugResults";
import { DataStatus } from "@/components/DataStatus";
import { SearchResultPreview } from "@/components/SearchResultPreview";
import { HomeSEOContent } from "@/components/HomeSEOContent";
import { HomeProUpsell } from "@/components/HomeProUpsell";
import { PopularDrugLinks } from "@/components/PopularDrugLinks";
import { WelcomeTrialModal } from "@/components/WelcomeTrialModal";
import { DrugData } from "@/components/DrugCard";
import { nadacApi, type DataStatusInfo } from "@/lib/nadac-api";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "@/lib/router-compat";
import { useWebMCP } from 'use-webmcp-tool';
import { runWebMCPTool } from '@/lib/webmcp-telemetry';

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is NADAC pricing?", acceptedAnswer: { "@type": "Answer", text: "NADAC pricing (National Average Drug Acquisition Cost) is a weekly pricing benchmark published by CMS based on actual pharmacy invoice data. It's the most accurate reflection of what pharmacies pay for drugs." }},
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
  
  const {data:publication} = useSuspenseQuery(weeklyPublicationQuery);
  const visible = visiblePublication(publication);
  const dataStatus: DataStatusInfo = { hasData:publication.totalRecords>0,totalRecords:publication.totalRecords,lastUpdate:publication.currentDate ?? undefined,lastSyncAt:publication.completedAt ?? undefined,pendingDate:publication.pendingDate ?? undefined,biggestMover:visible.biggestMover };
  const isCheckingStatus = false;

  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Show a confirmation when returning from a successful checkout
  useEffect(() => {
    if (searchParams.get("subscription") === "success") {
      toast({
        title: "Your Pro trial is active!",
        description: "Enjoy 7 days of full access. You can manage or cancel anytime from your account.",
      });
      const next = new URLSearchParams(searchParams);
      next.delete("subscription");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = useCallback(async (overrideSearchTerm?: string) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, dataStatus.hasData, toast]);

  // The query lives in the URL (?q=...) so browser Back restores the results.
  const runSearchRef = useRef(handleSearch);
  runSearchRef.current = handleSearch;
  const restoredRef = useRef<string | null>(null);
  const urlQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    if (!dataStatus.hasData) return;
    if (restoredRef.current === urlQuery) return;
    restoredRef.current = urlQuery;
    if (!urlQuery) {
      setSearchTerm("");
      setResults([]);
      setHasSearched(false);
      setLastSearchTerm("");
      return;
    }
    setSearchTerm(urlQuery);
    void runSearchRef.current(urlQuery);
  }, [urlQuery, dataStatus.hasData]);

  const handleSearchAndSync = (overrideSearchTerm?: string) => {
    if (overrideSearchTerm !== undefined && typeof overrideSearchTerm !== 'string') throw new Error('Search must be a drug name or NDC string.');
    const term = (overrideSearchTerm ?? searchTerm).trim();
    if (!term) { void handleSearch(overrideSearchTerm); return; }
    if (term === urlQuery) { void handleSearch(term); return; }
    // Pushes a history entry so Back returns to the previous search.
    const next = new URLSearchParams(searchParams);
    next.set("q", term);
    setSearchParams(next);
  };

  useWebMCP({
    name: 'search_drugs',
    description: 'Change the open page to search for a drug name or NDC; read the displayed results once loading finishes.',
    enabled: !isLoading && dataStatus.hasData,
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Drug name or NDC to search.' } }, required: ['query'] },
    execute: ({ query }: { query: string }) => runWebMCPTool('search_drugs', () => {
      if (typeof query !== 'string' || !query.trim()) throw new Error('Provide a nonempty drug name or NDC.');
      if (isLoading || !dataStatus.hasData) throw new Error('Search is currently unavailable.');
      handleSearchAndSync(query);
      return 'Search requested. Read displayed results after loading completes.';
    }),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <Header heroTitleAsH1 />
      <SiteNavigation />

      {/* Sticky Search Bar */}
      <div 
        className={`sticky top-0 z-50 bg-background/98 backdrop-blur-lg transition-all duration-200 ${
          isScrolled ? 'shadow-sm border-b border-border/60' : ''
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={handleSearchAndSync} isLoading={isLoading} />
          </div>
        </div>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <p className="text-center text-sm text-muted-foreground">
            Search by drug name (e.g., "Metformin") or NDC code (e.g., "00093-7212-01") ·{" "}
            <Link to="/reimbursement-calculator" className="text-primary hover:underline">
              Open reimbursement calculator
            </Link>
          </p>

          <DataStatus hasData={dataStatus.hasData} lastUpdate={dataStatus.lastUpdate} totalRecords={dataStatus.totalRecords} lastSyncAt={dataStatus.lastSyncAt} biggestMover={dataStatus.biggestMover} pendingDate={dataStatus.pendingDate} isLoading={isCheckingStatus} />

          <section className="pt-2">
            <DrugResults drugs={results} isLoading={isLoading} hasSearched={hasSearched} searchTerm={lastSearchTerm} />
          </section>

          {!hasSearched && (
            <>
              <SearchResultPreview />
              <HomeSEOContent />
              <HomeProUpsell />
              <PopularDrugLinks />
            </>
          )}
        </div>
      </main>

      <Footer />
      <WelcomeTrialModal />
    </div>
  );
};

export default Index;
