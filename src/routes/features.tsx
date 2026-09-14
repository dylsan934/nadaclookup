import { createFileRoute } from "@tanstack/react-router";
import Features from "@/pages/Features";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/features")({
  head: () =>
    pageHead({
      title: "NADAC Lookup Features — Drug Search, Compare & Alerts",
      description:
        "Search NADAC drug prices by name or NDC, compare up to 4 drugs side by side, track price history, and get automated alerts. Free basic plan, Pro at $29/mo.",
      path: "/features",
    }),
  component: Features,
});
