import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, DollarSign, BarChart3, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HomeSEOContent = () => (
  <div className="space-y-16 py-8">
    {/* What is NADAC */}
    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
        What Is NADAC?
      </h2>
      <p className="text-muted-foreground leading-relaxed">
        NADAC (National Average Drug Acquisition Cost) is a weekly drug pricing benchmark published by CMS, based on actual invoice data from retail pharmacies across the United States. It reflects the true average price pharmacies pay for prescription medications — making it far more accurate than AWP or WAC. Learn more in our{" "}
        <Link to="/what-is-nadac" className="text-primary hover:underline">complete NADAC guide</Link>.
      </p>
    </section>

    {/* Why Use NADAC */}
    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
        Why Use NADAC Pricing for Your Independent Pharmacy?
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        The National Average Drug Acquisition Cost (NADAC) is the gold standard for understanding what pharmacies actually pay for medications.
        Unlike inflated AWP benchmarks, NADAC reflects real invoice data collected weekly from thousands of retail pharmacies nationwide.
        Independent pharmacy owners use our <strong className="text-foreground">free NADAC pricing lookup tool</strong> to make smarter purchasing, pricing, and reimbursement decisions every day.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <DollarSign className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-2">Improve Pharmacy Margins</h3>
          <p className="text-sm text-muted-foreground">
            Compare your wholesaler invoices against current NADAC drug prices to identify overpayments and optimize acquisition costs. Even small per-unit savings add up across thousands of fills.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <Shield className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-2">Strengthen PBM Negotiations</h3>
          <p className="text-sm text-muted-foreground">
            Arm yourself with transparent NADAC data when negotiating reimbursement rates with PBMs. Identify underwater claims where reimbursement falls below your drug acquisition cost.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <Clock className="h-8 w-8 text-primary mb-3" />
          <h3 className="font-semibold text-foreground mb-2">Time Your Purchases</h3>
          <p className="text-sm text-muted-foreground">
            Track NADAC price trends weekly to buy ahead of increases and stock up when prices drop. Pro users get full price history charts and automated alerts for significant changes.
          </p>
        </div>
      </div>
    </section>

    {/* How the Tool Works */}
    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
        How Our NADAC Drug Price Lookup Works
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Search by drug name (e.g., "Metformin", "Lisinopril") or by NDC code to instantly view current NADAC prices per unit.
        Our database syncs weekly with official CMS data so you always have the latest pricing.
      </p>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
          <div>
            <h3 className="font-semibold text-foreground">Search NADAC by Drug Name or NDC</h3>
            <p className="text-sm text-muted-foreground">Enter any drug name or 11-digit NDC code. Results appear instantly with NADAC per-unit pricing, effective date, and dosage form.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
          <div>
            <h3 className="font-semibold text-foreground">Compare Drug Prices Side by Side</h3>
            <p className="text-sm text-muted-foreground">Select up to 4 drugs from your results to compare prices, dosage forms, and calculate total costs at different quantities.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
          <div>
            <h3 className="font-semibold text-foreground">Save Drugs & Track Prices (Pro)</h3>
            <p className="text-sm text-muted-foreground">
              With a <Link to="/pricing" className="text-primary hover:underline">Pro subscription at $29/mo</Link>, save unlimited drugs, access full price history charts, and receive automatic alerts when NADAC prices change significantly.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* FAQ with Schema.org markup */}
    <section>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
        Frequently Asked Questions About NADAC Pricing
      </h2>
      <div className="space-y-4">
        {[
          {
            q: "What is NADAC pricing?",
            a: "NADAC pricing (National Average Drug Acquisition Cost) is a weekly pricing benchmark published by CMS based on actual pharmacy invoice data. It's the most accurate reflection of what pharmacies pay for drugs and is used by many state Medicaid programs for reimbursement calculations."
          },
          {
            q: "How often are NADAC prices updated?",
            a: "NADAC prices are updated every Wednesday by CMS. Our database syncs weekly so you always have access to the latest pricing data."
          },
          {
            q: "Can I look up NADAC prices by NDC code?",
            a: "Yes. You can search by either drug name or 11-digit NDC code. This makes it easy to find exact pricing for specific drug products."
          },
          {
            q: "What's the difference between free and Pro features?",
            a: "Free users get unlimited NADAC price lookups, drug comparison, and can save up to 3 drugs. Pro users ($29/mo) get unlimited saves, full price history charts, automated price change alerts, and priority support."
          },
          {
            q: "How is NADAC different from AWP or WAC?",
            a: "AWP (Average Wholesale Price) and WAC (Wholesale Acquisition Cost) are manufacturer-set list prices that often don't reflect actual costs. NADAC is based on real pharmacy invoice data, making it far more accurate for understanding true acquisition costs."
          },
        ].map((faq, i) => (
          <details key={i} className="group bg-card border border-border rounded-lg">
            <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-foreground">
              {faq.q}
              <ArrowRight className="h-4 w-4 transition-transform group-open:rotate-90 text-muted-foreground" />
            </summary>
            <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>

    {/* Resources Links */}
    <section className="bg-card border border-border rounded-xl p-8 text-center">
      <h2 className="text-xl font-bold text-foreground mb-2">Learn More About NADAC Pricing</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Explore our resources to become an expert in pharmacy drug acquisition costs.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link to="/what-is-nadac">What Is NADAC?</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/how-often-does-nadac-update">NADAC Update Schedule</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/blog/nadac-vs-wac-explained">NADAC vs WAC Explained</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/blog/improve-pharmacy-margins">Improve Pharmacy Margins</Link>
        </Button>
      </div>
    </section>
  </div>
);
