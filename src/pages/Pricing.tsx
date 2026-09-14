import { Link } from "react-router-dom";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowRight } from "lucide-react";

const Pricing = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "NADAC Lookup Pro",
    description: "Professional NADAC drug pricing tools for independent pharmacies",
    offers: {
      "@type": "Offer",
      price: "29.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNavigation />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Simple, Transparent Pricing for Pharmacies
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start with free NADAC lookups. Upgrade to Pro when you need full price history, unlimited saves, and automated alerts — less than the cost of one mispriced prescription.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-xl font-bold text-foreground mb-1">Free</h2>
              <p className="text-3xl font-bold text-foreground">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mt-2 mb-6">Perfect for occasional lookups</p>
              <ul className="space-y-3 text-sm">
                {["Unlimited NADAC price searches", "5 reimbursement calculations/month", "Search by drug name or NDC", "Side-by-side drug comparison", "Save up to 3 drugs", "Weekly updated CMS data"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-muted-foreground"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full mt-8" variant="outline">
                <Link to="/">Start Searching Free</Link>
              </Button>
            </div>
            {/* Pro */}
            <div className="bg-card border-2 border-primary rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Crown className="h-3 w-3" /> Most Popular</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Pro</h2>
              <p className="text-3xl font-bold text-foreground">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="text-sm text-muted-foreground mt-2 mb-6">For serious pharmacy professionals</p>
              <ul className="space-y-3 text-sm">
                {["Unlimited use of reimbursement calculator", "Full NADAC price history charts", "Automated price change alerts", "Unlimited saved drugs", "Weekly Top 10 movers (increases & decreases)", "Weekly movers email digest", "Custom alert thresholds", "Drug categories & notes", "Priority support", "Everything in Free"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-muted-foreground"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full mt-8">
                <Link to="/auth?mode=signup">Start 7-Day Free Trial</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Pricing;
