import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const HomeSEOContent = () => (
  <div className="space-y-12 py-4">
    {/* How the Tool Works */}
    <section>
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
        How Our NADAC Drug Price Lookup Works
      </h2>
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
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
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
            a: "NADAC price search is unlimited and free, with no account needed — visitors also get 1 sample reimbursement calculation. A free account adds 5 reimbursement calculations per calendar month (the allowance resets on the 1st), 1 saved contract rule, and up to 3 saved drugs. Pro ($29/mo) gives unlimited calculations, unlimited contract rules, full price history charts, automated price change alerts, unlimited saves, and priority support."
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
  </div>
);
