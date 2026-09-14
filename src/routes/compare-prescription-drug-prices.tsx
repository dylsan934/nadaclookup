import { createFileRoute } from "@tanstack/react-router";
import CompareDrugPrices from "@/pages/CompareDrugPrices";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/compare-prescription-drug-prices")({
  head: () =>
    pageHead({
      title: "How to Compare Prescription Drug Prices (NADAC Guide)",
      description:
        "Compare prescription drug prices using NADAC — the government's actual acquisition cost data. A neutral alternative to coupon apps and insurer pricing tools.",
      path: "/compare-prescription-drug-prices",
    }),
  component: CompareDrugPrices,
});
