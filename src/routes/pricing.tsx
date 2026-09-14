import { createFileRoute } from "@tanstack/react-router";
import Pricing from "@/pages/Pricing";
import { pageHead } from "@/lib/seo";

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "NADAC Lookup Pro",
  description: "Professional NADAC drug pricing tools for independent pharmacies",
  offers: {
    "@type": "Offer",
    price: "29.00",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
};

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead({
      title: "NADAC Lookup Pricing — Free Search & $29/mo Pro Plan",
      description:
        "Free unlimited NADAC drug price searches. Upgrade to Pro for $29/mo to unlock the reimbursement calculator, full price history charts, automated alerts, and unlimited saves.",
      path: "/pricing",
      jsonLd: productJsonLd,
    }),
  component: Pricing,
});
