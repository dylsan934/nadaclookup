import { createFileRoute } from "@tanstack/react-router";
import WeeklyMovers from "@/pages/WeeklyMovers";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/movers")({
  head: () =>
    pageHead({
      title: "Weekly NADAC Price Changes and Movers | NADAC Lookup",
      description:
        "Review the largest weekly NADAC drug-price increases and decreases using current CMS acquisition-cost data.",
      path: "/movers",
    }),
  component: WeeklyMovers,
});
