import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Search, BarChart3, Bell, ArrowRight, Scale, BookmarkCheck, Mail, TrendingUp, Calculator } from "lucide-react";

const Features = () => (
  <>
    <SEOHead
      title="NADAC Lookup Features — Drug Search, Compare & Alerts"
      description="Search NADAC drug prices by name or NDC, compare up to 4 drugs side by side, track price history, and get automated alerts. Free basic plan, Pro at $29/mo."
      canonical="https://nadaclookup.com/features"
    />
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Pharmacy Drug Pricing Tools Built for Independents
        </h1>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Everything you need to monitor NADAC drug acquisition costs, compare prices, and protect your margins — all sourced from official weekly CMS data.
        </p>
        <div className="space-y-8">
          {[
            { icon: Calculator, title: "Unlimited Reimbursement Calculator (Pro)", desc: "Estimate reimbursement and margin on every prescription using NADAC plus your own PBM, Medicaid, or LTC contract formulas. Save rules per payer. Free accounts get 1 calculation." },
            { icon: BarChart3, title: "Full Price History Charts (Pro)", desc: "Visualize NADAC price trends over time for any saved drug. Spot seasonality, generic entry price drops, and manufacturer increases." },
            { icon: Bell, title: "Automated Price Change Alerts (Pro)", desc: "Get notified when NADAC prices change significantly on your saved drugs. Set custom thresholds for large-change-only alerts." },
            { icon: BookmarkCheck, title: "Unlimited Saved Drugs (Pro)", desc: "Free users can save up to 3 drugs. Pro users get unlimited saves with notes and category organization." },
            { icon: TrendingUp, title: "Weekly Top 10 Price Movers (Pro)", desc: "See the full top 10 biggest NADAC price increases and decreases every week, ranked by percent change. Free accounts preview the #1 mover in each list." },
            { icon: Mail, title: "Weekly Movers Email Digest (Pro)", desc: "Get the complete top 10 increases and decreases delivered to your inbox every Wednesday, right after the CMS data update." },
            { icon: Search, title: "Instant NADAC Price Search", desc: "Search by drug name or 11-digit NDC code. Results include NADAC per-unit price, effective date, dosage form, and pricing unit — updated every Wednesday." },
            { icon: Scale, title: "Side-by-Side Drug Comparison", desc: "Select up to 4 drugs from search results and compare prices, dosage forms, and total costs at custom quantities in a clean table view." },
          ].map((f, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <f.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-lg">{f.title}</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center py-10 bg-card border border-border rounded-xl">
          <h3 className="text-xl font-semibold text-foreground mb-2">Start Searching NADAC Prices Now</h3>
          <p className="text-sm text-muted-foreground mb-4">Free to use — no account required for basic lookups.</p>
          <div className="flex justify-center gap-3">
            <Button asChild><Link to="/">Search Prices <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
            <Button asChild variant="outline"><Link to="/pricing">View Pro Plan</Link></Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default Features;
