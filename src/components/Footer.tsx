import { ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Data sourced from{" "}
            <a 
              href="https://www.medicaid.gov/medicaid/nadac" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Medicaid.gov NADAC
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p>
            Updated weekly • For informational purposes only
          </p>
        </div>
      </div>
    </footer>
  );
};
