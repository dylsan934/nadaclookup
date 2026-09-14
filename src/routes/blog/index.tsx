import { createFileRoute } from "@tanstack/react-router";
import Blog from "@/pages/Blog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    pageHead({
      title: "NADAC Pricing Resources & Blog | Pharmacy Drug Cost Insights",
      description:
        "Expert articles on NADAC drug pricing, pharmacy margin improvement, PBM negotiations, and acquisition cost trends for independent pharmacies.",
      path: "/blog",
    }),
  component: Blog,
});
