import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { SITE_URL } from "@/lib/seo";
import NotFound from "@/pages/NotFound";
import appCss from "../styles.css?url";

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "NADAC Lookup",
  url: SITE_URL,
  description:
    "Free pharmacy drug acquisition cost lookup tool. Search current NADAC prices by drug name or NDC code with weekly CMS data updates.",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free basic NADAC price lookups" },
    {
      "@type": "Offer",
      price: "29.00",
      priceCurrency: "USD",
      description: "Pro plan with price history, unlimited saves, and alerts",
    },
  ],
  creator: { "@type": "Organization", name: "NADAC Lookup", url: SITE_URL },
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "Free NADAC Pricing Lookup by Drug or NDC | NADAC Lookup" },
      {
        name: "description",
        content:
          "Search current NADAC drug prices by drug name or NDC using weekly CMS data. Compare unit costs and estimate pharmacy reimbursement.",
      },
      { name: "author", content: "NADAC Lookup" },
      { name: "google-site-verification", content: "Uu97wYHwsMcBUIm794EIRNgsSJ6Epczw-vTZ1Mexbpg" },
      { name: "twitter:site", content: "@NADACLookup" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(webApplicationJsonLd) }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Outlet />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-foreground mb-2">This page didn&apos;t load</h1>
        <p className="text-muted-foreground mb-6">
          Something went wrong on our end. You can try again or head back home.
        </p>
        <div className="flex justify-center gap-3">
          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
          >
            Try again
          </button>
          <a
            className="px-4 py-2 rounded-md border border-border bg-card text-foreground text-sm font-medium"
            href="/"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
