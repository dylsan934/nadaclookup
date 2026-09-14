import { createFileRoute } from "@tanstack/react-router";
import SavedCalculations from "@/pages/SavedCalculations";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/saved-calculations")({
  head: () =>
    pageHead({
      title: "Saved Calculations | NADAC Lookup",
      description: "View, search, and export your saved pharmacy reimbursement calculations.",
      path: "/saved-calculations",
      robots: "noindex, nofollow",
    }),
  component: SavedCalculations,
});
