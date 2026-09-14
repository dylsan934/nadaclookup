import { Link, useLocation } from "@/lib/router-compat";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Reimbursement Calculator", path: "/reimbursement-calculator", highlight: true },
  { label: "Features", path: "/features" },
  { label: "Pricing", path: "/pricing" },
  { label: "Movers", path: "/movers" },
  { label: "Resources", path: "/blog" },
  { label: "About", path: "/about" },
];

export const SiteNavigation = () => {
  const location = useLocation();

  return (
    <nav className="bg-background" aria-label="Main navigation">
      <div className="container mx-auto px-3 md:px-4 py-2">
        <div className="relative bg-card border border-border p-1.5 rounded-2xl shadow-sm overflow-hidden">
          <ul className="flex w-full gap-1 md:gap-0 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="flex-shrink-0 md:flex-1 md:min-w-0">
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2.5 px-3.5 md:px-2 text-sm rounded-xl transition-all duration-200 whitespace-nowrap",
                      isActive
                        ? "font-semibold text-primary-foreground bg-primary shadow-md"
                        : item.highlight
                          ? "font-semibold text-primary hover:bg-primary/10"
                          : "font-medium text-muted-foreground hover:text-primary hover:bg-accent/50"
                    )}
                  >
                    {item.highlight && !isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                    )}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {/* Mobile-only scroll hint */}
          <div className="md:hidden pointer-events-none absolute top-1.5 bottom-1.5 right-1.5 w-6 rounded-r-xl bg-gradient-to-l from-card to-transparent" />
        </div>
      </div>
    </nav>
  );
};
