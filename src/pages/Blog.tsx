import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";

const articles = [
  {
    slug: "pbm-cost-plus-dispensing-fee-audit",
    title: "PBM Cost-Plus + Dispensing Fee: Auditing Your Claims",
    excerpt: "A new wave of PBM contracts pays acquisition cost plus a flat dispensing fee. Here's the formula, the most common underpayment traps, and a 5-step claim audit using NADAC Lookup.",
    date: "2026-05-16",
  },
  {
    slug: "calculate-reimbursement-from-nadac",
    title: "How to Calculate Reimbursement from NADAC",
    excerpt: "How Medicaid and select payers reimburse pharmacies using the NADAC plus a professional dispensing fee — with a worked example and tips for spotting underwater claims.",
    date: "2026-04-22",
  },
  {
    slug: "improve-pharmacy-margins",
    title: "How to Use NADAC Trends to Improve Pharmacy Margins",
    excerpt: "Learn how independent pharmacies use weekly NADAC data to identify cost-saving opportunities, negotiate better wholesaler rates, and protect against underwater claims.",
    date: "2026-04-10",
  },
  {
    slug: "latest-nadac-price-changes",
    title: "Latest NADAC Price Changes for Independent Pharmacies",
    excerpt: "A breakdown of recent NADAC price movements across common generics, brand-name drugs, and specialty medications — and what pharmacies should do about it.",
    date: "2026-04-08",
  },
  {
    slug: "nadac-vs-wac-explained",
    title: "NADAC vs Wholesale Acquisition Cost (WAC) Explained",
    excerpt: "Understand the key differences between NADAC, WAC, and AWP — and why NADAC is the most accurate benchmark for pharmacy drug acquisition costs.",
    date: "2026-04-01",
  },
  {
    slug: "nadac-for-pbm-negotiations",
    title: "Using NADAC Data to Strengthen PBM Reimbursement Negotiations",
    excerpt: "How to leverage transparent NADAC pricing to identify underwater claims and negotiate fairer reimbursement terms with pharmacy benefit managers.",
    date: "2026-03-25",
  },
  {
    slug: "nadac-lookup-by-ndc",
    title: "How to Look Up NADAC Prices by NDC Code",
    excerpt: "A step-by-step guide to searching NADAC drug prices using 11-digit NDC codes for precise product-level pricing information.",
    date: "2026-03-18",
  },
];

const Blog = () => (
  <>
    <SEOHead
      title="NADAC Pricing Resources & Blog | Pharmacy Drug Cost Insights"
      description="Expert articles on NADAC drug pricing, pharmacy margin improvement, PBM negotiations, and acquisition cost trends for independent pharmacies."
      canonical="https://nadaclookup.com/blog"
    />
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">NADAC Pricing Resources</h1>
        <p className="text-muted-foreground mb-10">Insights and guides for independent pharmacies on drug acquisition costs, pricing trends, and margin optimization.</p>
        <div className="space-y-6">
          {articles.map((a) => (
            <Link key={a.slug} to={`/blog/${a.slug}`} className="block group">
              <article className="bg-card border border-border rounded-xl p-6 transition-shadow hover:shadow-md">
                <time className="text-xs text-muted-foreground">{a.date}</time>
                <h2 className="text-lg font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">{a.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-sm text-primary mt-3 font-medium">
                  Read the full article: {a.title} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default Blog;
