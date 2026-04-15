import { ExternalLink, Mail, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-muted/30 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 text-sm text-muted-foreground">
          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs" aria-label="Footer navigation">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Resources</Link>
            <Link to="/what-is-nadac" className="hover:text-foreground transition-colors">What Is NADAC?</Link>
            <Link to="/how-often-does-nadac-update" className="hover:text-foreground transition-colors">Update Schedule</Link>
            <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          </nav>

          {/* Main footer row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
              © {new Date().getFullYear()} NADAC Lookup • Updated weekly • For informational purposes only
            </p>
          </div>
          
          {/* Contact row */}
          <div className="flex justify-center sm:justify-start pt-2 border-t border-border/40">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Mail className="h-3 w-3" />
              Contact:{" "}
              <a 
                href="mailto:info@nadaclookup.com"
                className="hover:text-primary hover:underline underline-offset-2 transition-colors"
              >
                info@nadaclookup.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
