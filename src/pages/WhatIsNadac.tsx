import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";

const WhatIsNadac = () => {
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
              What Is NADAC?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Understanding the National Average Drug Acquisition Cost and how it impacts pharmacy pricing nationwide.
            </p>
            <Button asChild size="lg" variant="hero">
              <Link to="/">
                Search NADAC Prices Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Main Content */}
        <main className="py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <article className="prose prose-lg max-w-none">
              
              {/* Section 1 */}
              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  What Does NADAC Stand For?
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  NADAC stands for <strong className="text-foreground">National Average Drug Acquisition Cost</strong>. It is a pricing benchmark published by the Centers for Medicare & Medicaid Services (CMS) that reflects the average price pharmacies pay to acquire prescription drugs from wholesalers and manufacturers.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Unlike other pricing benchmarks, NADAC is based on actual invoice prices reported by pharmacies across the United States, making it one of the most accurate representations of real-world drug costs.
                </p>
              </section>

              {/* Section 2 */}
              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  How NADAC Pricing Is Calculated
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  NADAC pricing is calculated through a voluntary survey of retail community pharmacies conducted by Myers and Stauffer LC on behalf of CMS. The process involves:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Weekly surveys sent to a random sample of pharmacies</li>
                  <li>Collection of actual invoice prices for drug purchases</li>
                  <li>Statistical analysis to determine the national average</li>
                  <li>Weekly updates published every Wednesday</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  The survey captures acquisition costs net of discounts, rebates, and other price concessions, providing a transparent view of what pharmacies actually pay for medications.
                </p>
              </section>

              {/* Section 3 */}
              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Why NADAC Matters for Pharmacies
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  NADAC is increasingly important for pharmacies for several reasons:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li><strong className="text-foreground">Medicaid Reimbursement:</strong> Many state Medicaid programs use NADAC as the basis for pharmacy reimbursement</li>
                  <li><strong className="text-foreground">Cost Transparency:</strong> Helps pharmacies understand fair acquisition costs and identify potential savings</li>
                  <li><strong className="text-foreground">Contract Negotiations:</strong> Provides leverage when negotiating with wholesalers and PBMs</li>
                  <li><strong className="text-foreground">Profitability Analysis:</strong> Enables pharmacies to assess margins on individual drugs</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Understanding NADAC pricing helps pharmacies make informed purchasing decisions and ensure they receive fair reimbursement for the medications they dispense.
                </p>
              </section>

              {/* Section 4 */}
              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  NADAC vs AWP vs WAC
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  There are several drug pricing benchmarks used in the pharmaceutical industry. Here's how they compare:
                </p>
                <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Benchmark</th>
                        <th className="text-left p-4 font-semibold text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-4 font-medium text-foreground">NADAC</td>
                        <td className="p-4 text-muted-foreground">Actual pharmacy acquisition costs from surveys</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">AWP</td>
                        <td className="p-4 text-muted-foreground">Average Wholesale Price – manufacturer-set list price, often inflated</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">WAC</td>
                        <td className="p-4 text-muted-foreground">Wholesale Acquisition Cost – manufacturer price to wholesalers before discounts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  NADAC is generally considered the most accurate reflection of actual pharmacy costs because it's based on real transaction data rather than list prices set by manufacturers.
                </p>
              </section>

              {/* Section 5 */}
              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Where to Find NADAC Prices
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  NADAC data is publicly available and can be accessed through several sources:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li><strong className="text-foreground">CMS Medicaid.gov:</strong> The official source for NADAC files updated weekly</li>
                  <li><strong className="text-foreground">Data.gov:</strong> Open data portal with historical NADAC information</li>
                  <li><strong className="text-foreground">NADAC Lookup Tools:</strong> User-friendly search tools that make finding prices easier</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  While raw data files are available for download, using a dedicated lookup tool saves time and provides instant access to current pricing information.
                </p>
              </section>

              {/* Section 6 */}
              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Free NADAC Lookup Tool
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our free NADAC lookup tool makes it easy to search and find current drug acquisition costs. Simply enter a drug name or NDC to instantly view:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Current NADAC price per unit</li>
                  <li>Effective date of pricing</li>
                  <li>Pricing unit information</li>
                  <li>Saved drugs with price change alerts</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you're a pharmacist checking acquisition costs, a healthcare administrator analyzing drug spending, or a researcher studying pharmaceutical pricing, our tool provides quick access to the data you need.
                </p>
              </section>

            </article>

            {/* Bottom CTA */}
            <div className="mt-16 text-center py-12 bg-card border border-border rounded-xl">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Ready to Look Up NADAC Prices?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Search thousands of drug prices instantly with our free NADAC lookup tool.
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
              <span>NADAC data sourced from CMS</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default WhatIsNadac;
