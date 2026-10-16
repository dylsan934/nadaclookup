import { Link } from "@/lib/router-compat";
import { Header } from "@/components/Header";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Minus, ArrowRight, Calculator, Bell, History, Search } from "lucide-react";

/**
 * Fair, factual comparison with NADAC Intelligence (nadacpricing.com).
 * Competitor facts verified against their pricing page on 2026-10-16.
 * Keep claims sourced and update this page if their offer changes.
 */

type Cell = { v: string; yes?: boolean };

const Row = ({ label, us, them }: { label: string; us: Cell; them: Cell }) => (
  <tr className="border-b border-border/60 last:border-0">
    <th scope="row" className="text-left font-medium text-foreground py-3 pr-4 align-top">{label}</th>
    <td className="py-3 pr-4 align-top">
      <span className="inline-flex items-start gap-1.5 text-sm">
        {us.yes === true && <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />}
        {us.yes === false && <Minus className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
        <span className={us.yes === false ? "text-muted-foreground" : "text-foreground"}>{us.v}</span>
      </span>
    </td>
    <td className="py-3 align-top">
      <span className="inline-flex items-start gap-1.5 text-sm">
        {them.yes === true && <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />}
        {them.yes === false && <Minus className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
        <span className={them.yes === false ? "text-muted-foreground" : "text-foreground"}>{them.v}</span>
      </span>
    </td>
  </tr>
);

const NadacIntelligenceAlternative = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <SiteNavigation />

    <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-12">

        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            NADAC Lookup vs. NADAC Intelligence
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Both tools search NADAC pricing. The difference is who they're built for — and what you can do with the number once you find it.
          </p>
        </section>

        {/* Honest summary */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-xl font-semibold text-foreground">The short version</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">NADAC Intelligence</strong> (nadacpricing.com) is a capable NADAC database aimed at analysts, buyers, and PBMs. It offers a free tier, full price history, CSV exports, a REST API, and AI-assistant integrations, with Premium at $9.99/month (first month free, verified October 2026).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">NADAC Lookup</strong> is built by a practicing pharmacist specifically for independent pharmacies. Beyond free unlimited search, its centerpiece is a <Link to="/reimbursement-calculator" className="text-primary hover:underline">reimbursement calculator</Link> that applies your actual PBM, Medicaid, or LTC contract formulas to NADAC — so you can see what a claim will pay and spot underwater claims before you fill them.
          </p>
        </section>

        {/* Comparison table */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Side by side</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">NADAC Lookup</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">NADAC Intelligence</th>
                </tr>
              </thead>
              <tbody className="px-4 [&_td]:px-4 [&_th]:px-4">
                <Row label="Free drug & NDC search" us={{ v: "Unlimited, no account needed", yes: true }} them={{ v: "60K+ drugs, free tier", yes: true }} />
                <Row label="Reimbursement calculator with your contract formulas" us={{ v: "Yes — save rules per PBM, Medicaid plan, or LTC contract", yes: true }} them={{ v: "Not offered", yes: false }} />
                <Row label="Built for" us={{ v: "Independent pharmacists, owners, and managers", yes: true }} them={{ v: "Analysts, buyers, and PBMs", yes: true }} />
                <Row label="Price history charts" us={{ v: "Full history (Pro)", yes: true }} them={{ v: "Full history, free tier included", yes: true }} />
                <Row label="Price-change alerts & watchlist" us={{ v: "Yes — automated alerts (Pro)", yes: true }} them={{ v: "Yes — unlimited on Premium", yes: true }} />
                <Row label="Weekly biggest movers report" us={{ v: "Yes, free", yes: true }} them={{ v: "Not listed", yes: false }} />
                <Row label="CSV export" us={{ v: "Saved calculations export (Pro)", yes: true }} them={{ v: "Yes (Premium)", yes: true }} />
                <Row label="REST API & AI-assistant integrations" us={{ v: "Not offered", yes: false }} them={{ v: "Yes (Premium)", yes: true }} />
                <Row label="Paid plan price" us={{ v: "$29/mo or $290/yr (2 months free)" }} them={{ v: "$9.99/mo" }} />
                <Row label="Free trial" us={{ v: "7 days, card required, 30-day money-back guarantee" }} them={{ v: "First month free, card required" }} />
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            NADAC Intelligence details from their public pricing page, checked October 16, 2026. Their offer may have changed since.
          </p>
        </section>

        {/* When each fits */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">NADAC Intelligence may fit better if you…</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Need a REST API or CSV exports to feed your own analysis pipeline</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Want AI-assistant (Claude/ChatGPT) integrations with the data</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Do market-level analysis as a buyer, analyst, or PBM — not per-claim decisions at the counter</li>
            </ul>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">NADAC Lookup is built for you if you…</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Calculator className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Want to check what a claim will <em>pay</em> — not just what the drug costs — using your own contract formulas</li>
              <li className="flex gap-2"><Search className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Need a fast answer at the counter: search by name or NDC, no account required</li>
              <li className="flex gap-2"><Bell className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Want alerts when NADAC moves on drugs you dispense, so MAC appeals don't miss the window</li>
              <li className="flex gap-2"><History className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />Run an independent pharmacy and want a tool built by someone who works in one</li>
            </ul>
          </div>
        </section>

        {/* Why the price difference */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">Why does NADAC Lookup cost more?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Honestly: if all you need is a NADAC number and a price chart, their $9.99 Premium plan is a good deal, and we'll say so. What you're paying for with NADAC Lookup Pro is the workflow around the number — the contract-rule calculator that turns NADAC into an expected reimbursement and margin, per-payer rule storage, and alerts tuned to a dispensing pharmacy's week. One underwater claim caught before submission can pay for months of the subscription.
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Common questions</h2>
          <div className="space-y-3">
            {[
              {
                q: "Is NADAC Lookup's data as accurate as NADAC Intelligence's?",
                a: "Both tools draw from the same source: the CMS NADAC dataset, published weekly. NADAC Lookup syncs every Wednesday, so the underlying prices are identical — the difference is what each tool lets you do with them.",
              },
              {
                q: "Can I try NADAC Lookup without paying?",
                a: "Yes. Search is unlimited and free with no account. You get one sample reimbursement calculation as a guest, and a free account adds 5 calculations per month, one saved contract rule, and a 3-drug watchlist.",
              },
              {
                q: "Does NADAC Lookup have an API?",
                a: "No. If you need programmatic access to NADAC data, NADAC Intelligence's Premium plan includes a REST API and is the better fit for that use case.",
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

        {/* CTA */}
        <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-background p-8 text-center space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Try the calculator free</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Search any drug, apply your contract formula, and see the expected reimbursement — your first calculation is free, no account needed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/reimbursement-calculator">Open the calculator <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </section>

      </div>
    </main>

    <Footer />
  </div>
);

export default NadacIntelligenceAlternative;
