import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Search, Calendar, DollarSign, Pill, ChevronRight, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { drugNameToSlug, slugToSearchTerm, drugNameRoot } from "@/lib/drug-slug";

interface NadacRow {
  ndc: string;
  drug_name: string;
  nadac_per_unit: number;
  effective_date: string;
  pricing_unit: string | null;
  pharmacy_type: string | null;
}

interface RelatedDrug {
  drug_name: string;
  nadac_per_unit: number;
  pricing_unit: string | null;
  effective_date: string;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4 }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

const DrugPage = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<NadacRow[]>([]);
  const [related, setRelated] = useState<RelatedDrug[]>([]);
  const [resolvedName, setResolvedName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const searchTerm = slugToSearchTerm(slug);

      // Fetch all NDCs matching this drug name (case-insensitive, latest effective_date)
      const { data: matches } = await supabase
        .from("nadac_drugs")
        .select("ndc, drug_name, nadac_per_unit, effective_date, pricing_unit, pharmacy_type")
        .ilike("drug_name", searchTerm)
        .order("effective_date", { ascending: false })
        .limit(25);

      let resolved = (matches || []) as NadacRow[];

      // Fallback: if exact ilike yields nothing, try a looser prefix match
      if (resolved.length === 0) {
        const { data: loose } = await supabase
          .from("nadac_drugs")
          .select("ndc, drug_name, nadac_per_unit, effective_date, pricing_unit, pharmacy_type")
          .ilike("drug_name", `${searchTerm}%`)
          .order("effective_date", { ascending: false })
          .limit(25);
        resolved = (loose || []) as NadacRow[];
      }

      if (cancelled) return;
      setRows(resolved);

      const canonicalName = resolved[0]?.drug_name || searchTerm.toUpperCase();
      setResolvedName(canonicalName);

      // Related drugs: same root token, distinct names, latest pricing
      const root = drugNameRoot(canonicalName);
      if (root) {
        const { data: rel } = await supabase
          .from("nadac_drugs")
          .select("drug_name, nadac_per_unit, pricing_unit, effective_date")
          .ilike("drug_name", `${root}%`)
          .order("effective_date", { ascending: false })
          .limit(60);

        const seen = new Set<string>([canonicalName.toUpperCase()]);
        const distinct: RelatedDrug[] = [];
        for (const r of rel || []) {
          const key = r.drug_name.toUpperCase();
          if (seen.has(key)) continue;
          seen.add(key);
          distinct.push(r as RelatedDrug);
          if (distinct.length >= 6) break;
        }
        if (!cancelled) setRelated(distinct);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canonical = `https://nadaclookup.com/drug/${slug}`;
  const displayName = resolvedName || slugToSearchTerm(slug).toUpperCase();
  const pageTitle = `${displayName} NADAC Price | NADAC Lookup`.slice(0, 60);
  const pageDesc = `Check the latest NADAC price for ${displayName}. Updated weekly. Built for independent pharmacies to compare acquisition costs.`;

  const primary = rows[0];

  const jsonLd = primary
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Drug",
            name: displayName,
            description: `${displayName} NADAC pharmacy acquisition cost, updated weekly from CMS.`,
            code: { "@type": "MedicalCode", code: primary.ndc, codingSystem: "NDC" },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://nadaclookup.com/" },
              { "@type": "ListItem", position: 2, name: "Drugs", item: "https://nadaclookup.com/" },
              { "@type": "ListItem", position: 3, name: `${displayName} NADAC Price`, item: canonical },
            ],
          },
        ],
      }
    : undefined;

  // Drug not found
  if (!loading && rows.length === 0) {
    return (
      <>
        <SEOHead
          title={`Drug Not Found | NADAC Lookup`}
          description="We couldn't find NADAC pricing for that drug. Search any drug by name or NDC."
          canonical={canonical}
        />
        <div className="min-h-screen flex flex-col bg-background">
          <SiteNavigation />
          <main className="flex-1 container mx-auto px-4 py-16 max-w-2xl text-center">
            <h1 className="text-2xl font-bold text-foreground mb-3">Drug not found</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't locate NADAC pricing for "{slugToSearchTerm(slug)}". Try searching by full drug name or NDC code.
            </p>
            <Button asChild>
              <Link to="/">
                <Search className="h-4 w-4 mr-2" /> Search NADAC Lookup
              </Link>
            </Button>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title={pageTitle} description={pageDesc} canonical={canonical} jsonLd={jsonLd} />
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNavigation />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/" className="hover:text-foreground">Drugs</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground truncate">{displayName}</span>
          </nav>

          {/* H1 */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {displayName} NADAC Price (Updated Weekly)
          </h1>

          {/* Intro */}
          <p className="text-muted-foreground leading-relaxed mb-8">
            {displayName} is tracked in the CMS National Average Drug Acquisition Cost (NADAC) file — the most accurate
            benchmark of what U.S. pharmacies actually pay for this medication. Independent pharmacies use NADAC to
            verify reimbursement, identify underwater claims, and negotiate better terms with PBMs.
          </p>

          {/* Current NADAC pricing card */}
          {loading ? (
            <Card className="p-6 mb-8 animate-pulse h-32" />
          ) : primary ? (
            <Card className="p-6 mb-8 bg-card border-border">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Current NADAC</p>
                  <p className="text-3xl font-bold text-primary tabular-nums">{formatPrice(primary.nadac_per_unit)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    per {primary.pricing_unit?.toLowerCase() || "unit"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline">{primary.pharmacy_type || "Pharmacy"}</Badge>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 justify-end">
                    <Calendar className="h-3 w-3" /> Effective {formatDate(primary.effective_date)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">NDC: {primary.ndc}</p>
                </div>
              </div>

              {rows.length > 1 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    All NDCs for {displayName}
                  </p>
                  <div className="space-y-2">
                    {rows.slice(0, 10).map((r) => (
                      <div key={r.ndc} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                        <span className="font-mono text-xs text-muted-foreground">{r.ndc}</span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatPrice(r.nadac_per_unit)} <span className="text-xs font-normal text-muted-foreground">/ {r.pricing_unit?.toLowerCase()}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild variant="default">
                  <Link to={`/reimbursement-calculator?ndc=${encodeURIComponent(primary.ndc)}&drug=${encodeURIComponent(displayName)}`}>
                    <Calculator className="h-4 w-4 mr-2" /> Calculate reimbursement for this NDC
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/?search=${encodeURIComponent(displayName)}`}>
                    <Search className="h-4 w-4 mr-2" /> Open in NADAC Lookup
                  </Link>
                </Button>
              </div>
            </Card>
          ) : null}

          {/* SEO content section */}
          <section className="prose prose-sm max-w-none mb-12">
            <h2 className="text-xl font-bold text-foreground mb-3">
              How pharmacies use NADAC pricing for {displayName}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              NADAC represents the average invoice cost pharmacies pay for {displayName}, based on a monthly survey of
              retail community pharmacies conducted by CMS. Because the data is sourced directly from real pharmacy
              invoices — not manufacturer list prices like WAC or AWP — it offers the most accurate view of true
              acquisition cost for {displayName}.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Independent pharmacies use the {displayName} NADAC price to evaluate whether reimbursement from Medicaid,
              Medicare Part D, and commercial PBMs covers their cost plus a fair professional dispensing fee. When the
              reimbursement rate falls below NADAC, the claim is "underwater" — and the pharmacy loses money on that
              prescription. Tracking weekly NADAC updates for {displayName} helps owners spot these losses early and
              dispute them with payers.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              NADAC pricing for {displayName} updates every Wednesday. Pharmacies that monitor these changes can
              renegotiate wholesaler contracts when costs spike, adjust cash-pay pricing, and build stronger cases when
              auditing PBM reimbursement against real acquisition costs.
            </p>
          </section>

          {/* Related Drugs */}
          {related.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-4">Related NADAC Drug Prices</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.drug_name}
                    to={`/drug/${drugNameToSlug(r.drug_name)}`}
                    className="block p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                      {r.drug_name} NADAC Price
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(r.nadac_per_unit)} / {r.pricing_unit?.toLowerCase()}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Learn About NADAC */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">Learn More About NADAC Pricing</h2>
            <ul className="space-y-2.5">
              <li>
                <Link to="/what-is-nadac" className="text-primary hover:underline inline-flex items-center gap-1">
                  What NADAC pricing means for your pharmacy <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/blog/nadac-vs-wac-explained" className="text-primary hover:underline inline-flex items-center gap-1">
                  NADAC vs WAC vs AWP: which benchmark to trust <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/blog/calculate-reimbursement-from-nadac" className="text-primary hover:underline inline-flex items-center gap-1">
                  How to calculate pharmacy reimbursement from NADAC <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/how-often-does-nadac-update" className="text-primary hover:underline inline-flex items-center gap-1">
                  Why NADAC prices change every week <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <Link to="/blog/improve-pharmacy-margins" className="text-primary hover:underline inline-flex items-center gap-1">
                  Use NADAC trends to improve pharmacy margins <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </section>

          {/* CTA */}
          <Card className="p-6 bg-primary/5 border-primary/20 text-center">
            <Pill className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Search any drug using the NADAC Lookup Tool
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Free, weekly-updated NADAC pricing for every drug in the CMS database.
            </p>
            <Button asChild>
              <Link to="/">
                <Search className="h-4 w-4 mr-2" /> Open NADAC Lookup
              </Link>
            </Button>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default DrugPage;
