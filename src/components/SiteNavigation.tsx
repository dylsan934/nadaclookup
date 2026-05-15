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
    <nav className="bg-background" aria-label="Main navigation">
      <div className="container mx-auto px-4 py-2">
        <div className="relative bg-card border border-border p-1.5 rounded-2xl shadow-sm overflow-hidden">
          <ul className="flex w-full overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <li key={item.path} className="flex-1 min-w-0">
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center justify-center py-2.5 px-2 text-sm rounded-xl transition-all duration-200 whitespace-nowrap",
                    location.pathname === item.path
                      ? "font-semibold text-primary-foreground bg-primary shadow-md"
                      : "font-medium text-muted-foreground hover:text-primary hover:bg-accent/50"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
