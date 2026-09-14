import { createFileRoute } from "@tanstack/react-router";
import SavedDrugs from "@/pages/SavedDrugs";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/saved-drugs")({
  head: () =>
    pageHead({
      title: "Saved Drugs — NADAC Lookup",
      description: "Your saved drugs with current NADAC pricing.",
      path: "/saved-drugs",
      robots: "noindex, nofollow",
    }),
  component: SavedDrugs,
});
