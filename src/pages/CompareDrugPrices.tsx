import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, CheckCircle2 } from "lucide-react";

const faqs = [
  {
    q: "What is NADAC and why use it to compare prices?",
    a: "NADAC (National Average Drug Acquisition Cost) is a CMS benchmark based on actual invoice prices paid by U.S. retail pharmacies. It's a neutral, government-published baseline — not a coupon, not a list price — which makes it ideal for honest price comparison.",
  },
  {
    q: "Is NADAC the price I'll pay at the pharmacy?",
    a: "No. NADAC is what pharmacies pay to acquire the drug. Your out-of-pocket cost depends on the pharmacy's markup, your insurance, and any coupons. NADAC is the floor — it tells you whether a quoted price is reasonable.",
  },
  {
    q: "How often does NADAC update?",
    a: "CMS publishes new NADAC files every Wednesday. NADAC Lookup syncs the same morning so the prices you compare are always current within the week.",
  },
  {
    q: "How is NADAC different from GoodRx or my insurer's price?",
    a: "GoodRx shows negotiated cash-discount prices at participating pharmacies. Insurer tools show your plan-specific copay. NADAC shows the underlying acquisition cost — useful for spotting markups and comparing strengths or generics on an apples-to-apples basis.",
  },
  {
    q: "Can I compare multiple drugs side-by-side?",
    a: "Yes. Search a drug, open it, and use Compare to add other strengths, forms, or alternatives. The comparison view shows current NADAC, unit price, and recent changes for each.",
  },
  {
    q: "Can I track price changes over time?",
    a: "Yes. Save a drug to get in-app alerts when its NADAC changes. Pro accounts unlock 5 years of price history and unlimited saves.",
  },
];

const CompareDrugPrices = () => {
  const canonical = "https://nadaclookup.com/compare-prescription-drug-prices";

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "How to Compare Prescription Drug Prices",
    description:
      "A neutral, NADAC-based guide to comparing prescription drug prices in the United States.",
    author: { "@type": "Organization", name: "NADAC Lookup" },
    publisher: { "@type": "Organization", name: "NADAC Lookup" },
    mainEntityOfPage: canonical,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nadaclookup.com/" },
      { "@type": "ListItem", position: 2, name: "Compare Prescription Drug Prices", item: canonical },
    ],
  };

  return (
    <>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              to="/"
              className="text-xl font-semibold text-foreground hover:text-primary transition-colors"
            >
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

        {/* Hero */}
        <section className="py-16 md:py-24 bg-gradient-subtle">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span className="mx-2">/</span>
              <span>Compare Drug Prices</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              How to Compare Prescription Drug Prices
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              A neutral, step-by-step guide using NADAC — the government's actual drug
              acquisition cost data — so you can compare prices without the noise of coupons
              or insurer markups.
            </p>
            <Button asChild size="lg" variant="hero">
              <Link to="/">
                Compare Prices Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </section>

        <main className="py-12 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Problem */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Why comparing drug prices is harder than it should be
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Most price-comparison sources are built around their own business model.
                Coupon apps show negotiated cash prices at partner pharmacies. Insurer
                portals show what your plan will charge. Pharmacy websites show retail.
                None of them tells you what the drug actually costs the pharmacy to buy —
                which is the only number that lets you judge whether a quoted price is fair.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                NADAC fills that gap. Published weekly by CMS, it's a survey-based average
                of what U.S. retail pharmacies actually pay for each drug. It's the closest
                thing to a neutral price benchmark for prescription medications.
              </p>
            </section>

            {/* Comparison table */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                NADAC vs. coupon apps vs. insurer pricing
              </h2>
              <div className="bg-card border border-border rounded-lg overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-foreground">Source</th>
                      <th className="text-left p-4 font-semibold text-foreground">What it measures</th>
                      <th className="text-left p-4 font-semibold text-foreground">Updates</th>
                      <th className="text-left p-4 font-semibold text-foreground">Best for</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-4 font-medium text-foreground">NADAC (CMS)</td>
                      <td className="p-4 text-muted-foreground">Pharmacy acquisition cost</td>
                      <td className="p-4 text-muted-foreground">Weekly</td>
                      <td className="p-4 text-muted-foreground">Neutral price benchmark</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Coupon apps</td>
                      <td className="p-4 text-muted-foreground">Negotiated cash discount</td>
                      <td className="p-4 text-muted-foreground">Daily</td>
                      <td className="p-4 text-muted-foreground">Uninsured cash payment</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Insurer portal</td>
                      <td className="p-4 text-muted-foreground">Your plan's copay</td>
                      <td className="p-4 text-muted-foreground">Plan-year</td>
                      <td className="p-4 text-muted-foreground">In-network copay estimate</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Pharmacy retail</td>
                      <td className="p-4 text-muted-foreground">Sticker price + markup</td>
                      <td className="p-4 text-muted-foreground">Varies</td>
                      <td className="p-4 text-muted-foreground">Walk-in cash price</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The most useful workflow is to start with NADAC to set a baseline, then
                compare it against any coupon or copay quote you've been given.
              </p>
            </section>

            {/* Steps */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                Step-by-step: comparing drug prices with NADAC
              </h2>
              <ol className="space-y-6">
                {[
                  {
                    title: "Search the drug by name or NDC",
                    body: "Type the generic or brand name into the lookup. You'll see every strength, form, and package size with a published NADAC.",
                  },
                  {
                    title: "Read the per-unit NADAC, not just the total",
                    body: "Tablets, mL, and grams are priced per pricing unit. Comparing per-unit cost is the only way to compare different pack sizes fairly.",
                  },
                  {
                    title: "Compare strengths and generics side-by-side",
                    body: "Open Compare to stack a 10 mg vs. 20 mg, or a brand vs. its generic equivalent. Big per-unit gaps usually mean a cheaper option exists.",
                  },
                  {
                    title: "Check the price trend",
                    body: "NADAC moves weekly. A drug trending up may justify filling a 90-day supply now; a drug trending down may be worth waiting on.",
                  },
                  {
                    title: "Save the drug and set alerts",
                    body: "Save anything you take regularly to get in-app alerts when its NADAC changes. Pro unlocks 5 years of history and unlimited saves.",
                  },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* Inline CTA */}
            <section className="mb-12">
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-3">
                  Try it: look up any drug
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Search by name or NDC to see the current NADAC, recent changes, and
                  side-by-side comparison.
                </p>
                <Button asChild size="lg" variant="hero">
                  <Link to="/">
                    <Search className="w-5 h-5 mr-2" />
                    Open the NADAC Lookup
                  </Link>
                </Button>
              </div>
            </section>

            {/* Why NADAC */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Why a NADAC-based comparison is more honest
              </h2>
              <ul className="space-y-3">
                {[
                  "Government-sourced — published weekly by CMS, not a private vendor",
                  "Based on real invoices reported by U.S. retail pharmacies",
                  "Not tied to any pharmacy, PBM, insurer, or coupon network",
                  "Updated frequently enough to catch shortages and price spikes",
                  "Works the same for every drug — no opaque discount math",
                ].map((point, i) => (
                  <li key={i} className="flex gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* FAQ */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
                Frequently asked questions
              </h2>
              <div className="space-y-6">
                {faqs.map((f, i) => (
                  <div key={i} className="border-b border-border pb-6 last:border-b-0">
                    <h3 className="font-semibold text-foreground mb-2">{f.q}</h3>
                    <p className="text-muted-foreground leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Related */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Keep reading
              </h2>
              <ul className="grid sm:grid-cols-2 gap-3">
                {[
                  { to: "/what-is-nadac", label: "What is NADAC?" },
                  { to: "/blog/nadac-vs-wac-explained", label: "NADAC vs. WAC explained" },
                  { to: "/how-often-does-nadac-update", label: "How often does NADAC update?" },
                  { to: "/movers", label: "This week's biggest NADAC movers" },
                  { to: "/ndc-lookup", label: "Look up a drug by NDC" },
                  { to: "/pricing", label: "Pro: 5 years of price history" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="block p-4 rounded-lg border border-border bg-card hover:border-primary transition-colors text-foreground"
                    >
                      {l.label}
                      <ArrowRight className="w-4 h-4 inline ml-2 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Bottom CTA */}
            <div className="mt-16 text-center py-12 bg-card border border-border rounded-xl">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Start comparing drug prices now
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Free, neutral, and based on the government's own pharmacy acquisition data.
              </p>
              <Button asChild size="lg" variant="hero">
                <Link to="/">
                  Open NADAC Lookup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </main>

        <footer className="border-t border-border py-8 bg-card/30">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} NADAC Lookup. All rights reserved.</p>
            <p className="mt-2">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              {" · "}
              <span>NADAC data sourced from CMS</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default CompareDrugPrices;
