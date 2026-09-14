import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, CheckCircle2, DollarSign } from "lucide-react";

const NdcLookup = () => {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is an NDC code?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An NDC (National Drug Code) is a unique 10- or 11-digit, 3-segment identifier assigned by the FDA to every prescription drug, OTC product, and insulin product marketed in the United States. The three segments identify the labeler (manufacturer), the product (strength, dosage form), and the package size.",
        },
      },
      {
        "@type": "Question",
        name: "How do I look up an NDC?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Enter the 11-digit NDC (or the drug name) into the search bar on NADAC Lookup. You'll instantly see the drug's current National Average Drug Acquisition Cost (NADAC), pricing unit, effective date, and recent price history.",
        },
      },
      {
        "@type": "Question",
        name: "What's the difference between NDC lookup and NADAC lookup?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "An NDC lookup identifies what a drug is (labeler, product, package). A NADAC lookup tells you what pharmacies actually pay for it. NADAC Lookup combines both: search by NDC and get the real pharmacy acquisition cost in one step.",
        },
      },
      {
        "@type": "Question",
        name: "Is NDC lookup free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Searching NDCs and viewing the current NADAC price is free. A Pro plan unlocks the unlimited reimbursement calculator, 5-year price history, automated price-change alerts, and unlimited saved drugs.",
        },
      },
    ],
  };

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
                Search Now
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-subtle">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              NDC Lookup with Real Pharmacy Acquisition Cost
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Search any 11-digit NDC and instantly see the current NADAC price — the actual cost pharmacies pay to buy the drug. Free, no signup required.
            </p>
            <Button asChild size="lg" variant="hero">
              <Link to="/">
                Look Up an NDC Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Differentiator strip */}
        <section className="py-10 border-b border-border bg-card/30">
          <div className="container mx-auto px-4 max-w-5xl grid md:grid-cols-3 gap-6 text-center">
            <h2 className="sr-only">Why use this NDC lookup</h2>
            <div>
              <DollarSign className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-foreground mb-1">Real acquisition cost</h3>
              <p className="text-sm text-muted-foreground">Not AWP or WAC. Actual invoice-based NADAC pricing from CMS.</p>
            </div>
            <div>
              <Search className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-foreground mb-1">Search by NDC or name</h3>
              <p className="text-sm text-muted-foreground">145,000+ drugs indexed. Partial NDC matches supported.</p>
            </div>
            <div>
              <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold text-foreground mb-1">Updated weekly</h3>
              <p className="text-sm text-muted-foreground">Synced every Wednesday with the latest CMS NADAC file.</p>
            </div>
          </div>
        </section>

        {/* Main */}
        <main className="py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <article className="prose prose-lg max-w-none">

              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  What an NDC Lookup Actually Tells You
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Most NDC lookup tools — the FDA NDC Directory, DailyMed, and code-database sites — answer one question: <em>what is this drug?</em> You get the labeler, the product name, the strength, and the package size. That's useful for identification, but it leaves the most important question unanswered for pharmacies, PBM auditors, and healthcare buyers: <strong className="text-foreground">what does it cost?</strong>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  NADAC Lookup pairs every NDC with its current National Average Drug Acquisition Cost, so a single search returns both the drug identity <em>and</em> the real per-unit cost pharmacies pay at the wholesale counter.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  How to Look Up an NDC
                </h2>
                <ol className="list-decimal list-inside text-muted-foreground space-y-3 mb-4">
                  <li>Open the <Link to="/" className="text-primary hover:underline">NADAC Lookup search bar</Link>.</li>
                  <li>Enter the 11-digit NDC (e.g. <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-sm">00093-7146-56</code>) or the brand/generic name.</li>
                  <li>Review the current NADAC price, pricing unit (each, mL, gm), and effective date.</li>
                  <li>Click into the drug for a full price-history chart and to set up price-change alerts (Pro).</li>
                </ol>
                <p className="text-muted-foreground leading-relaxed">
                  Both 10-digit and 11-digit NDC formats work. We normalize hyphens, leading zeros, and the common pharmacy "5-4-2" billing format automatically.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Understanding the NDC Format
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Every NDC has three segments:
                </p>
                <div className="bg-card border border-border rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Segment</th>
                        <th className="text-left p-4 font-semibold text-foreground">What it identifies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-4 font-medium text-foreground">Labeler code</td>
                        <td className="p-4 text-muted-foreground">The manufacturer, repackager, or distributor (assigned by the FDA).</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Product code</td>
                        <td className="p-4 text-muted-foreground">The specific strength, dosage form, and formulation.</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-foreground">Package code</td>
                        <td className="p-4 text-muted-foreground">The package size and type (bottle of 30, vial, blister card).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Pharmacy claims usually use the 11-digit "5-4-2" billing format, while FDA labels often print the 10-digit form. Our lookup handles both.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  NDC Lookup vs NADAC Lookup
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  These are two different questions, and most tools only answer one of them:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li><strong className="text-foreground">NDC lookup</strong> — identifies the drug (labeler, product, package).</li>
                  <li><strong className="text-foreground">NADAC lookup</strong> — shows the real per-unit acquisition cost pharmacies pay.</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  NADAC Lookup answers both in a single search. That matters when you're auditing a PBM claim, modeling a 340B opportunity, evaluating a generic switch, or just trying to figure out whether you're being overcharged.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Who Uses NDC + NADAC Lookups
                </h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li><strong className="text-foreground">Independent pharmacies</strong> auditing PBM reimbursement against true cost.</li>
                  <li><strong className="text-foreground">Pharmacy buyers</strong> benchmarking wholesaler invoice prices.</li>
                  <li><strong className="text-foreground">340B program managers</strong> validating ceiling-price spreads.</li>
                  <li><strong className="text-foreground">Healthcare consultants and attorneys</strong> building cost-based reimbursement cases.</li>
                  <li><strong className="text-foreground">Health-plan and Medicaid analysts</strong> modeling drug spend.</li>
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">What is an NDC code?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      A 3-segment FDA identifier (labeler · product · package) assigned to every prescription drug, OTC product, and insulin sold in the US.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">How do I look up an NDC?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Type the 11-digit NDC or drug name into the search bar. You'll see the current NADAC price, pricing unit, and effective date instantly.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">What's the difference between NDC lookup and NADAC lookup?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      NDC lookup identifies the drug. NADAC lookup tells you what pharmacies actually pay for it. NADAC Lookup does both at once.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Is NDC lookup free?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Yes — searching and viewing the current NADAC price is free. Pro ($29/mo) unlocks 5-year history, unlimited saves, and price-change alerts.
                    </p>
                  </div>
                </div>
              </section>

            </article>

            {/* Bottom CTA */}
            <div className="mt-16 text-center py-12 bg-card border border-border rounded-xl">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Look Up an NDC Now
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Free, instant search across 145,000+ NDCs — with real pharmacy acquisition cost included.
              </p>
              <Button asChild size="lg" variant="hero">
                <Link to="/">
                  Search NDC Free
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
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              {" · "}
              <Link to="/what-is-nadac" className="hover:text-foreground transition-colors">What Is NADAC?</Link>
              {" · "}
              <span>NADAC data sourced from CMS</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default NdcLookup;
