import { useParams, Link, Navigate } from "@/lib/router-compat";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const articles: Record<string, { title: string; description: string; content: JSX.Element }> = {
  "calculate-reimbursement-from-nadac": {
    title: "How to Calculate Reimbursement from NADAC | NADAC Lookup",
    description: "How Medicaid and PBMs calculate pharmacy reimbursement using NADAC plus a dispensing fee. Includes the formula, examples, and underwater-claim tips.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For independent pharmacies, knowing exactly how a payer calculates your reimbursement is just as important as knowing your acquisition cost. A growing number of payers — led by state Medicaid programs — now reimburse pharmacies using a transparent formula built around NADAC plus a professional dispensing fee.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">The NADAC Reimbursement Formula</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          At its simplest, the formula looks like this:
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
          <code className="text-foreground text-sm">Reimbursement = (NADAC per unit × Quantity Dispensed) + Professional Dispensing Fee</code>
        </div>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The ingredient cost portion is meant to cover what you actually paid for the drug, while the dispensing fee is meant to cover the cost of professional services — counseling, labeling, verification, and overhead. This structure is endorsed by CMS as the most accurate way to reimburse pharmacies.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Who Pays Pharmacies Using NADAC?</h2>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li><strong className="text-foreground">State Medicaid fee-for-service (FFS) programs</strong> — the majority of states now use NADAC as the primary ingredient cost benchmark for FFS claims.</li>
          <li><strong className="text-foreground">Medicaid managed care plans</strong> — many MCOs are required (or choose) to follow the same FFS methodology, including NADAC + dispensing fee.</li>
          <li><strong className="text-foreground">Select commercial PBM contracts</strong> — a small but growing number of transparent PBM arrangements use NADAC-based reimbursement instead of MAC or AWP discounts.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For a deeper comparison of pricing benchmarks, see our breakdown of <Link to="/blog/nadac-vs-wac-explained" className="text-primary hover:underline">NADAC vs WAC</Link>.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Understanding the Professional Dispensing Fee</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Professional dispensing fees are set by each state Medicaid agency, typically informed by a cost-of-dispensing (COD) survey of in-state pharmacies. As of recent CMS-approved state plan amendments, dispensing fees generally fall in the <strong className="text-foreground">$9 to $13 per prescription</strong> range. A few examples:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li>Many states pay around <strong className="text-foreground">$10.00–$10.50</strong> per prescription for most pharmacies.</li>
          <li>Some states use a tiered fee, paying higher rates to pharmacies that serve rural or low-volume areas.</li>
          <li>Specialty and 340B claims may use different dispensing fees.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Always check your state Medicaid provider manual for the exact dispensing fee that applies to your pharmacy.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Worked Example</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Suppose you dispense 90 tablets of Metformin 500 mg with a NADAC of <strong className="text-foreground">$0.0234 per unit</strong>, and your state Medicaid pays a <strong className="text-foreground">$10.50</strong> dispensing fee.
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4 text-sm">
          <div className="text-muted-foreground">Ingredient cost: 90 × $0.0234 = <strong className="text-foreground">$2.11</strong></div>
          <div className="text-muted-foreground">Dispensing fee: <strong className="text-foreground">$10.50</strong></div>
          <div className="text-muted-foreground mt-2 pt-2 border-t border-border">Total reimbursement: <strong className="text-foreground">$12.61</strong></div>
        </div>
        <p className="text-muted-foreground leading-relaxed mb-4">
          If your actual acquisition cost is at or below NADAC, the dispensing fee is what produces your margin on this claim.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Why This Matters for Independent Pharmacies</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Many commercial PBM contracts reimburse below NADAC — sometimes far below — and pair that with a dispensing fee of $0 to $1. When you compare those payments to the transparent NADAC + dispensing fee model used by Medicaid, it becomes obvious which contracts are leaving you underwater.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Tracking reimbursement against NADAC weekly is one of the strongest data points you can bring to <Link to="/blog/nadac-for-pbm-negotiations" className="text-primary hover:underline">PBM contract negotiations</Link>.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">How to Use NADAC Lookup to Verify Reimbursement</h2>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
          <li>Search the drug or NDC on <Link to="/" className="text-primary hover:underline">NADAC Lookup</Link> to get the current per-unit NADAC.</li>
          <li>Multiply by the quantity dispensed to get the expected ingredient cost.</li>
          <li>Add your state Medicaid (or contracted) dispensing fee.</li>
          <li>Compare the total to what the payer actually paid — any shortfall is a flag for appeal or contract review.</li>
        </ol>
        <p className="text-muted-foreground leading-relaxed mb-4">
          With <Link to="/pricing" className="text-primary hover:underline">NADAC Lookup Pro ($29/mo)</Link>, you can save your most-dispensed drugs, see full price history, and get alerts when NADAC changes — so your reimbursement math always uses the latest data.
        </p>
      </>
    ),
  },
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
    title: "Latest NADAC Price Changes for Pharmacies | NADAC Lookup",
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
    title: "NADAC vs WAC vs AWP: Drug Pricing Explained",
    description: "Compare NADAC, WAC, and AWP drug-pricing benchmarks and understand how independent pharmacies use them to evaluate reimbursement.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The pharmaceutical industry uses several pricing benchmarks, but they're not all created equal. Understanding the difference between NADAC and WAC is essential for any pharmacy professional managing drug costs.
        </p>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 mb-6">
          <p className="font-semibold text-foreground mb-2">The short answer</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">NADAC</strong> is built from actual pharmacy invoice data collected weekly by CMS, so it reflects what pharmacies really pay after discounts. <strong className="text-foreground">WAC</strong> is the manufacturer's list price before discounts — a "sticker price" that typically runs higher, especially for generics. For reimbursement checks, purchasing decisions, and PBM negotiations, NADAC is the more accurate benchmark.
          </p>
        </div>
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
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">NADAC vs WAC: Which Reflects Real Pharmacy Cost?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          NADAC reflects real pharmacy cost because CMS builds it from actual invoice data submitted by retail pharmacies. WAC is a manufacturer-published list price, so it sits above what most pharmacies pay once wholesaler discounts and contract terms are applied. If your question is "what did this drug actually cost my pharmacy?", NADAC is the closer answer.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Is WAC Higher Than NADAC?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For most generic drugs WAC is meaningfully higher than NADAC, since generics carry the deepest wholesaler discounts off list price. For brand drugs the two run closer together, because brand acquisition cost tends to track list price with smaller concessions. Compare both on a specific NDC rather than assuming a fixed spread.
        </p>
        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Which Should Pharmacies Use?</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          For day-to-day cost analysis, reimbursement verification, and wholesaler negotiations, <strong className="text-foreground">NADAC is the better benchmark</strong>. It reflects real market prices rather than artificial list prices. Use our free <Link to="/" className="text-primary hover:underline">NADAC lookup tool</Link> to search current prices by drug name or NDC code, or run a claim through the <Link to="/reimbursement-calculator" className="text-primary hover:underline">reimbursement calculator</Link>.
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
  "pbm-cost-plus-dispensing-fee-audit": {
    title: "Audit PBM Cost-Plus + Dispensing Fee Claims | NADAC",
    description: "A new PBM cost-plus plus professional dispensing fee reimbursement model is rolling out. Learn the formula and how to use NADAC Lookup to audit every claim for underpayment.",
    content: (
      <>
        <p className="text-muted-foreground leading-relaxed mb-4">
          A growing wave of PBM contracts — driven by employer demand for transparency and recent state and federal reforms — has moved away from opaque MAC and AWP-minus pricing toward a <strong className="text-foreground">cost-plus model</strong>: the pharmacy is paid its actual acquisition cost plus a flat professional dispensing fee. On paper, that's a fairer deal for independents. In practice, you only capture that fairness if you audit every claim.
        </p>
        <p className="text-muted-foreground leading-relaxed mb-4">
          This guide breaks down the new model and shows you exactly how to use NADAC Lookup to verify each reimbursement and catch underpayments before they pile up.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">What "Cost-Plus + Dispensing Fee" Actually Means</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Under the new model, your reimbursement is calculated as:
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
          <code className="text-foreground text-sm">Reimbursement = (Acquisition Cost per unit × Quantity) + Professional Dispensing Fee</code>
        </div>
        <p className="text-muted-foreground leading-relaxed mb-4">
          The "acquisition cost" benchmark is typically NADAC — the CMS-published, invoice-based price that updates every Wednesday. The dispensing fee is contract-specific but usually lands in the <strong className="text-foreground">$9 to $12</strong> range, mirroring the Medicaid professional dispensing fee methodology. For background on how that fee is set and how Medicaid programs use the same structure, see <Link to="/blog/calculate-reimbursement-from-nadac" className="text-primary hover:underline">Calculate Reimbursement from NADAC</Link>.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Why You Still Need to Audit Every Claim</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Even under a transparent cost-plus contract, underpayments happen — and they usually fall into three buckets:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li><strong className="text-foreground">Stale NADAC reference.</strong> The PBM priced your claim against an older NADAC effective date. If the price went up Wednesday and your claim was adjudicated using last week's NADAC, you're underwater on the ingredient cost.</li>
          <li><strong className="text-foreground">Wrong NDC mapping.</strong> The PBM applied NADAC for a generic equivalent or a different package size instead of the NDC you actually dispensed.</li>
          <li><strong className="text-foreground">Missing or reduced dispensing fee.</strong> Some plans quietly carve out specialty, 90-day, or 340B claims and pay a lower fee than the contract states.</li>
        </ul>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Each of these is appealable — but only if you spot it. That's where a weekly audit habit pays for itself.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">A 5-Minute Per-Claim Audit Using NADAC Lookup</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Pull your remittance for any cost-plus contract claim, then walk through these steps:
        </p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-3 mb-4">
          <li>
            <strong className="text-foreground">Search the exact NDC dispensed</strong> on <Link to="/" className="text-primary hover:underline">NADAC Lookup</Link>. Using the 11-digit NDC (not just the drug name) ensures you're comparing the same product the PBM should have priced — see <Link to="/blog/nadac-lookup-by-ndc" className="text-primary hover:underline">how to look up by NDC</Link>.
          </li>
          <li>
            <strong className="text-foreground">Check the effective date.</strong> Confirm the NADAC effective date is on or before the fill date on your claim. If your claim used an older NADAC than what was published the prior Wednesday, that's an audit flag.
          </li>
          <li>
            <strong className="text-foreground">Calculate expected ingredient cost.</strong> Multiply NADAC per unit by the quantity dispensed. Compare to the ingredient cost paid on the remittance — any shortfall greater than a rounding penny is recoverable.
          </li>
          <li>
            <strong className="text-foreground">Add the contracted dispensing fee.</strong> Verify the PBM paid the full fee specified in your contract, not a reduced specialty or chain-equivalent rate.
          </li>
          <li>
            <strong className="text-foreground">Sum and compare.</strong> Expected reimbursement = (NADAC × qty) + dispensing fee. If the PBM paid less, file an appeal with the NADAC entry, effective date, and your calculation as supporting evidence.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Worked Example</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          You dispense 30 tablets of Atorvastatin 20 mg under a cost-plus contract with a $10.50 dispensing fee. NADAC for the NDC on the fill date is <strong className="text-foreground">$0.0412 per unit</strong>. The PBM paid you $1.05 ingredient + $10.50 fee = $11.55 total.
        </p>
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4 text-sm">
          <div className="text-muted-foreground">Expected ingredient: 30 × $0.0412 = <strong className="text-foreground">$1.24</strong></div>
          <div className="text-muted-foreground">Dispensing fee: <strong className="text-foreground">$10.50</strong></div>
          <div className="text-muted-foreground mt-2 pt-2 border-t border-border">Expected total: <strong className="text-foreground">$11.74</strong></div>
          <div className="text-muted-foreground">Actual paid: <strong className="text-foreground">$11.55</strong></div>
          <div className="text-muted-foreground mt-2 pt-2 border-t border-border">Shortfall: <strong className="text-foreground">$0.19</strong> — recoverable via appeal</div>
        </div>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Nineteen cents sounds trivial. Multiply it across hundreds of claims a week on the dozens of high-volume generics that move price most often, and the recoverable revenue is meaningful.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Scaling the Audit: Catch the Movers First</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          You can't audit every claim manually, but you don't need to. The highest-risk claims are the ones where NADAC moved this week — those are most likely to be priced against a stale benchmark. Start your audit there:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li>Check the <Link to="/movers" className="text-primary hover:underline">Weekly Movers</Link> page every Wednesday after CMS publishes new NADAC data. The top 10 increases are the drugs most likely to be underpaid this week.</li>
          <li>Cross-reference those movers against your dispensing volume. Any drug in both lists deserves an immediate spot-check.</li>
          <li>Pull the matching remittances and run the 5-step audit above.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">Make the Audit Automatic with Pro</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          <Link to="/pricing" className="text-primary hover:underline">NADAC Lookup Pro ($29/mo)</Link> turns this from a manual task into a routine:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
          <li><strong className="text-foreground">Save your top-dispensed drugs</strong> so they're one click away each Wednesday.</li>
          <li><strong className="text-foreground">Price change alerts</strong> notify you the moment NADAC moves on a drug you stock — before any claim gets paid against the new number.</li>
          <li><strong className="text-foreground">Full 5-year price history</strong> makes documenting a trend trivial when you escalate to contract renegotiation.</li>
          <li><strong className="text-foreground">Weekly movers email digest</strong> delivers the top 10 increases and decreases straight to your inbox every Wednesday morning.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-foreground mt-8 mb-3">The Bottom Line</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Cost-plus PBM contracts are a real win for independent pharmacies — but only if you treat the contract as a floor, not a ceiling. Audit weekly, document every shortfall, and use the data to push back. The same NADAC numbers that justify your reimbursement also justify your appeals. For broader strategy on bringing this data to the negotiating table, see <Link to="/blog/nadac-for-pbm-negotiations" className="text-primary hover:underline">Using NADAC for PBM Negotiations</Link>.
        </p>
      </>
    ),
  },
};

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : null;

  if (!article) return <Navigate to="/blog" replace />;

  const canonical = `https://nadaclookup.com/blog/${slug}`;
  const headline = article.title.split(" | ")[0];
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description: article.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: { "@type": "Organization", name: "NADAC Lookup" },
    publisher: { "@type": "Organization", name: "NADAC Lookup" },
  };

  return (
    <>
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
