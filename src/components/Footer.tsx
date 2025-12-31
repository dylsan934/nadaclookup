import { ExternalLink, Shield } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/40 py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Data sourced from{" "}
              <a 
                href="https://www.medicaid.gov/medicaid/nadac" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 hover:underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
              >
                Medicaid.gov NADAC
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
          <p className="text-muted-foreground/70">
            Updated weekly • For informational purposes only
          </p>
        </div>
      </div>
    </footer>
  );
};
