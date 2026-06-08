import { Link } from "react-router-dom";
import { Calculator, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CalculatorHeroPromo = () => {
  return (
    <section className="container mx-auto px-4 pt-6 md:pt-10">
      <div className="max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-background p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
              <Calculator className="h-3.5 w-3.5" />
              New · Pharmacy Tool
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
              Know exactly what every prescription pays — before you fill it.
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-4">
              Estimate reimbursement and margin using NADAC ingredient cost and your own contract formulas. Save rules per PBM, Medicaid plan, or LTC contract.
            </p>
            <ul className="grid sm:grid-cols-2 gap-y-1.5 text-sm text-muted-foreground mb-5">
              {[
                "Auto-pulls NADAC unit price",
                "Apply your contract formula",
                "Spot underwater claims",
                "Save rules per payer",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link to="/reimbursement-calculator">
                  Open Reimbursement Calculator <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/pricing">See Pro features</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
