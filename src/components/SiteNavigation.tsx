import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "Pricing", path: "/pricing" },
  { label: "Movers", path: "/movers" },
  { label: "Resources", path: "/blog" },
  { label: "About", path: "/about" },
];

export const SiteNavigation = () => {
  const location = useLocation();

  return (
    <nav className="border-b border-border/40 bg-background/95 backdrop-blur-sm" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <ul className="flex items-center gap-1 overflow-x-auto py-1 text-sm">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "px-3 py-2 rounded-md transition-colors whitespace-nowrap",
                  location.pathname === item.path
                    ? "text-primary font-medium bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
