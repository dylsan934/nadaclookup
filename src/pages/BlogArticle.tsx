import { useParams, Link, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

const articles: Record<string, { title: string; description: string; content: JSX.Element }> = {
  "improve-pharmacy-margins": {
    title: "How to Use NADAC Trends to Improve Pharmacy Margins | NADAC Lookup",
    description: "Learn how independent pharmacies leverage weekly NADAC data to optimize drug acquisition costs and improve dispensing margins.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For independent pharmacy owners, every cent per unit matters. With reimbursement rates shrinking and PBM pressure mounting, understanding your true drug acquisition cost is critical — and that's exactly what NADAC provides.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">What Is NADAC and Why Should You Track It?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          NADAC (National Average Drug Acquisition Cost) is published weekly by CMS and reflects actual invoice prices pharmacies pay. Unlike AWP, which is often inflated, NADAC gives you a transparent, market-based cost benchmark. By monitoring NADAC trends with a <Link to="/" className="text-primary hover:underline">NADAC lookup tool</Link>, you can spot price drops before your wholesaler passes them along.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Three Ways to Use NADAC Data for Better Margins</h2>
        <h3 className="text-xl font-semibold text-foreground mt-6 mb-2">1. Audit Your Wholesaler Invoices</h3>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Compare what you're paying per unit against the current NADAC price. If your cost consistently exceeds NADAC, you have negotiating leverage — or it may be time to explore secondary wholesalers.
        </p>
        <h3 className="text-xl font-semibold text-foreground mt-6 mb-2">2. Identify Underwater Claims</h3>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Cross-reference PBM reimbursement against NADAC to find drugs where you're dispensing at a loss. Our <Link to="/pricing" className="text-primary hover:underline">Pro plan ($29/mo)</Link> includes price change alerts so you're notified the moment a NADAC price shifts significantly.
        </p>
        <h3 className="text-xl font-semibold text-foreground mt-6 mb-2">3. Time Your Generic Purchases</h3>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Generic drug prices can swing 20–50% within weeks. By tracking NADAC price history, you can stock up when prices dip and reduce orders when costs spike.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Getting Started</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Start by searching your top-dispensed drugs on <Link to="/" className="text-primary hover:underline">NADAC Lookup</Link>. Compare the NADAC per-unit price against your actual acquisition cost. Even saving $0.01/unit on high-volume generics like Metformin or Lisinopril can mean hundreds of dollars per month in improved margin.
        </p>
      </>
    ),
  },
  "latest-nadac-price-changes": {
    title: "Latest NADAC Price Changes for Independent Pharmacies | NADAC Lookup",
    description: "Stay informed on recent NADAC price movements across common generics and brand-name drugs. Learn what price changes mean for your pharmacy.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          NADAC prices are updated every Wednesday by CMS, and even small changes can impact your pharmacy's bottom line. Here's what pharmacists should know about staying on top of weekly price movements.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Why Weekly NADAC Changes Matter</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A 5% increase on a high-volume generic you dispense 500 times a month can cost you hundreds of dollars if your reimbursement rates lag behind. Conversely, catching a price drop early lets you negotiate better terms or adjust your purchasing strategy.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">How to Monitor NADAC Price Changes</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li>Use a <Link to="/" className="text-primary hover:underline">NADAC lookup tool</Link> to search your most-dispensed drugs weekly</li>
          <li>Save drugs to your watchlist and enable price change alerts with <Link to="/pricing" className="text-primary hover:underline">NADAC Lookup Pro ($29/mo)</Link></li>
          <li>Compare price trends over time with full price history charts</li>
          <li>Review the effective date on each NADAC entry to confirm you're seeing the latest data</li>
        </ul>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">What to Do When Prices Change</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          <strong className="text-foreground">Price increase?</strong> Check if your PBM reimbursement has adjusted. If not, flag the drug for a reimbursement appeal. Consider buying ahead if you expect continued increases.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          <strong className="text-foreground">Price decrease?</strong> Ensure your wholesaler is passing along savings. Look for opportunities to stock up at the lower cost.
        </p>
      </>
    ),
  },
  "nadac-vs-wac-explained": {
    title: "NADAC vs WAC (Wholesale Acquisition Cost) Explained | NADAC Lookup",
    description: "Understand the key differences between NADAC and WAC drug pricing benchmarks. Learn which one better reflects actual pharmacy acquisition costs.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The pharmaceutical industry uses several pricing benchmarks, but they're not all created equal. Understanding the difference between NADAC and WAC is essential for any pharmacy professional managing drug costs.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">What Is WAC (Wholesale Acquisition Cost)?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          WAC is the manufacturer's list price to wholesalers <em>before</em> any discounts, rebates, or other price concessions. Think of it as the "sticker price" — it rarely reflects what pharmacies actually pay.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">What Is NADAC?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          NADAC (National Average Drug Acquisition Cost) is based on actual pharmacy invoice data collected through weekly surveys by CMS. It captures what pharmacies <em>really</em> pay after all discounts and concessions — making it far more useful for cost analysis.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Key Differences at a Glance</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                <th className="text-left p-4 font-semibold text-foreground">NADAC</th>
                <th className="text-left p-4 font-semibold text-foreground">WAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr><td className="p-4 font-medium text-foreground">Data source</td><td className="p-4">Actual pharmacy invoices</td><td className="p-4">Manufacturer list price</td></tr>
              <tr><td className="p-4 font-medium text-foreground">Discounts included</td><td className="p-4">Yes</td><td className="p-4">No</td></tr>
              <tr><td className="p-4 font-medium text-foreground">Update frequency</td><td className="p-4">Weekly (Wednesdays)</td><td className="p-4">Varies</td></tr>
              <tr><td className="p-4 font-medium text-foreground">Published by</td><td className="p-4">CMS</td><td className="p-4">Manufacturers</td></tr>
              <tr><td className="p-4 font-medium text-foreground">Accuracy for pharmacies</td><td className="p-4">High</td><td className="p-4">Low</td></tr>
            </tbody>
          </table>
        </div>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Which Should Pharmacies Use?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For day-to-day cost analysis, reimbursement verification, and wholesaler negotiations, <strong className="text-foreground">NADAC is the better benchmark</strong>. It reflects real market prices rather than artificial list prices. Use our free <Link to="/" className="text-primary hover:underline">NADAC lookup tool</Link> to search current prices by drug name or NDC code.
        </p>
      </>
    ),
  },
  "nadac-for-pbm-negotiations": {
    title: "Using NADAC Data for PBM Reimbursement Negotiations | NADAC Lookup",
    description: "Learn how independent pharmacies use NADAC pricing data to negotiate fairer PBM reimbursement rates and identify underwater prescription claims.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Pharmacy benefit manager (PBM) reimbursement rates don't always keep pace with actual drug costs. NADAC data gives independent pharmacies the transparency they need to push back on unfair rates.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Identifying Underwater Claims</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          An "underwater" claim occurs when your PBM reimburses you less than your actual acquisition cost. By comparing PBM payments against <Link to="/" className="text-primary hover:underline">current NADAC prices</Link>, you can identify exactly which drugs are losing money — and by how much.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Building Your Case with Data</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          When approaching PBMs for rate adjustments, come prepared with specific examples showing your acquisition cost (backed by NADAC) versus their reimbursement. Track trends with <Link to="/pricing" className="text-primary hover:underline">NADAC Lookup Pro</Link> price history charts for compelling visual evidence.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Taking Action</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li>Run weekly reports comparing your top 50 dispensed drugs against NADAC</li>
          <li>Flag any drug where reimbursement is below NADAC + a reasonable dispensing fee</li>
          <li>Document trends — if a drug's NADAC has risen 15% but reimbursement hasn't moved, that's your evidence</li>
          <li>Present findings in contract renewal negotiations</li>
        </ul>
      </>
    ),
  },
  "nadac-lookup-by-ndc": {
    title: "How to Look Up NADAC Prices by NDC Code | NADAC Lookup",
    description: "Step-by-step guide to searching NADAC drug prices using 11-digit NDC codes for product-level pricing accuracy.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          While searching by drug name is convenient, looking up NADAC prices by NDC (National Drug Code) gives you exact product-level pricing — critical when comparing different manufacturers, package sizes, or formulations of the same drug.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">What Is an NDC Code?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          An NDC is a unique 10- or 11-digit code assigned to each drug product. It identifies the manufacturer (labeler), product formulation, and package size. Format: <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-sm">XXXXX-XXXX-XX</code>.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">How to Search NADAC by NDC</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
          <li>Go to <Link to="/" className="text-primary hover:underline">NADAC Lookup</Link></li>
          <li>Enter the full NDC code (e.g., "00093-7212-01") in the search bar</li>
          <li>View the NADAC per-unit price, effective date, and dosage form</li>
          <li>Use the comparison feature to compare multiple NDCs side by side</li>
        </ol>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">When to Use NDC vs Drug Name Search</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li><strong className="text-foreground">Use NDC</strong> when you need pricing for a specific manufacturer's product</li>
          <li><strong className="text-foreground">Use drug name</strong> when comparing across all manufacturers of a medication</li>
          <li><strong className="text-foreground">Pro tip:</strong> Search by drug name first, then use the comparison tool to evaluate NDCs side by side</li>
        </ul>
      </>
    ),
  },
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : null;

  if (!article) return <Navigate to="/blog" replace />;

  return (
    <>
      <SEOHead
        title={article.title}
        description={article.description}
        canonical={`https://nadaclookup.com/blog/${slug}`}
        type="article"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNavigation />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Resources
          </Link>
          <article className="prose prose-lg max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{article.title.split(" | ")[0]}</h1>
            {article.content}
          </article>
          <div className="mt-12 text-center py-10 bg-card border border-border rounded-xl">
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Look Up NADAC Prices?</h3>
            <p className="text-muted-foreground mb-4 text-sm">Search current drug acquisition costs instantly — free.</p>
            <Button asChild>
              <Link to="/">Search NADAC Prices <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogArticle;
