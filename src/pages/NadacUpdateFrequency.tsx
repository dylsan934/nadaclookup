import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, Calendar, TrendingUp, RefreshCw, HelpCircle } from "lucide-react";

const NadacUpdateFrequency = () => {
  return (
    <>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="text-xl font-semibold text-foreground hover:text-primary transition-colors">
              NADAC Lookup
            </Link>
            <Button asChild variant="default" size="sm">
              <Link to="/">
                <Search className="w-4 h-4 mr-2" />
                Search Prices
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-subtle">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              How Often Does NADAC Update?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              NADAC prices are updated <strong className="text-foreground">weekly every Wednesday</strong> by the Centers for Medicare & Medicaid Services (CMS).
            </p>
            <Button asChild size="lg" variant="hero">
              <Link to="/">
                Check Current NADAC Prices
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Quick Answer Box */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <Calendar className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Quick Answer
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">NADAC updates every Wednesday.</strong> The Centers for Medicare & Medicaid Services (CMS) publishes new NADAC pricing data weekly, reflecting the latest pharmacy acquisition costs collected through national surveys.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <article className="prose prose-lg max-w-none">
              
              {/* Section 1: What Day */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground m-0">
                    What Day Does NADAC Update?
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  NADAC prices are released every <strong className="text-foreground">Wednesday</strong>. This consistent weekly schedule allows pharmacies, healthcare organizations, and researchers to plan their pricing reviews and purchasing decisions accordingly.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The update process follows this typical timeline:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li><strong className="text-foreground">Throughout the week:</strong> Pharmacies submit survey responses with actual acquisition costs</li>
                  <li><strong className="text-foreground">Monday–Tuesday:</strong> Myers and Stauffer LC processes and analyzes the data</li>
                  <li><strong className="text-foreground">Wednesday:</strong> New NADAC prices are published and made publicly available</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  The effective date listed on each NADAC entry indicates when that particular price became active, allowing users to track historical pricing changes over time.
                </p>
              </section>

              {/* Section 2: Why Prices Change */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground m-0">
                    Why Do NADAC Prices Change Weekly?
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  NADAC prices fluctuate from week to week due to various market factors that affect the pharmaceutical supply chain. Understanding these factors helps pharmacies anticipate and respond to price changes.
                </p>
                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  Common Reasons for Price Changes
                </h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-3 mb-4">
                  <li>
                    <strong className="text-foreground">Manufacturer price adjustments:</strong> Drug manufacturers may raise or lower wholesale prices based on production costs, market demand, or competitive pressures
                  </li>
                  <li>
                    <strong className="text-foreground">Generic competition:</strong> When new generic versions enter the market, prices often decrease significantly
                  </li>
                  <li>
                    <strong className="text-foreground">Supply chain disruptions:</strong> Shortages or manufacturing issues can cause temporary price spikes
                  </li>
                  <li>
                    <strong className="text-foreground">Seasonal demand:</strong> Some medications experience price fluctuations based on seasonal usage patterns
                  </li>
                  <li>
                    <strong className="text-foreground">Contract negotiations:</strong> Large-scale purchasing agreements between manufacturers and wholesalers can shift market prices
                  </li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Because NADAC is based on actual pharmacy invoices, it reflects these real-world market dynamics more accurately than other pricing benchmarks like AWP or WAC.
                </p>
              </section>

              {/* Section 3: How Pharmacies Use Updates */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <RefreshCw className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground m-0">
                    How Pharmacies Use Weekly NADAC Updates
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pharmacy professionals rely on weekly NADAC updates for critical business decisions. Here's how the data is typically used:
                </p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  Purchasing Decisions
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Pharmacies compare their wholesaler invoices against NADAC to ensure they're receiving competitive pricing. Significant deviations may indicate opportunities to negotiate better rates or switch suppliers.
                </p>

                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  Reimbursement Verification
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Many state Medicaid programs use NADAC as the basis for pharmacy reimbursement. Pharmacies monitor weekly updates to ensure reimbursements align with current acquisition costs and identify potential underwater claims.
                </p>

                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  Margin Analysis
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  By tracking NADAC trends, pharmacies can analyze profit margins on specific drugs and adjust their dispensing practices or negotiate with payers when margins become unsustainable.
                </p>

                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  Formulary Management
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Healthcare organizations use NADAC data to make informed formulary decisions, selecting therapeutically equivalent options that offer better value.
                </p>
              </section>

              {/* Section 4: FAQ */}
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl md:text-3xl font-semibold text-foreground m-0">
                    NADAC Update FAQs
                  </h2>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      What time on Wednesday does NADAC update?
                    </h3>
                    <p className="text-muted-foreground">
                      NADAC data is typically published by CMS during regular business hours on Wednesday. The exact time may vary, but new data is usually available by early afternoon Eastern Time.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Are NADAC updates ever delayed?
                    </h3>
                    <p className="text-muted-foreground">
                      While rare, updates may be delayed due to federal holidays or technical issues. CMS typically announces any significant delays through official channels.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      How far back does NADAC historical data go?
                    </h3>
                    <p className="text-muted-foreground">
                      NADAC data has been collected since 2013. Historical files are available through CMS and can be useful for analyzing long-term pricing trends.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Do all drugs have NADAC prices?
                    </h3>
                    <p className="text-muted-foreground">
                      No, not all drugs have NADAC prices. NADAC only includes drugs that are dispensed by retail community pharmacies and have sufficient survey data. Some specialty or limited-distribution drugs may not be included.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      What's the difference between NADAC and other pricing benchmarks?
                    </h3>
                    <p className="text-muted-foreground">
                      NADAC reflects actual pharmacy acquisition costs, while AWP (Average Wholesale Price) and WAC (Wholesale Acquisition Cost) are manufacturer-set prices. Learn more on our{" "}
                      <Link to="/what-is-nadac" className="text-primary hover:underline">
                        What Is NADAC
                      </Link>{" "}
                      page.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Can I get alerts when NADAC prices change?
                    </h3>
                    <p className="text-muted-foreground">
                      Yes! With a free account on nadaclookup.com, you can save drugs to your watchlist and receive notifications when prices change significantly.
                    </p>
                  </div>
                </div>
              </section>

            </article>

            {/* Bottom CTA */}
            <div className="mt-16 text-center py-12 bg-card border border-border rounded-xl">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Check Current NADAC Prices Now
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Search the latest NADAC pricing data and track price changes with our free lookup tool.
              </p>
              <Button asChild size="lg" variant="hero">
                <Link to="/">
                  Search NADAC Prices Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8 bg-card/30">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} NADAC Lookup. All rights reserved.</p>
            <p className="mt-2">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              {" · "}
              <Link to="/what-is-nadac" className="hover:text-foreground transition-colors">
                What Is NADAC
              </Link>
              {" · "}
              <span>NADAC data sourced from CMS</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default NadacUpdateFrequency;
