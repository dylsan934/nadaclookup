import { createFileRoute } from "@tanstack/react-router";
import SavedDrugs from "@/pages/SavedDrugs";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/saved-drugs")({
  head: () =>
    pageHead({
      title: "Watchlist — NADAC Lookup",
      description: "Your watchlist drugs with current NADAC pricing.",
      path: "/saved-drugs",
      robots: "noindex, nofollow",
    }),
  component: SavedDrugs,
});
