import { createFileRoute } from "@tanstack/react-router";
import NadacIntelligenceAlternative from "@/pages/NadacIntelligenceAlternative";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/nadac-intelligence-alternative")({
  head: () =>
    pageHead({
      title: "NADAC Lookup vs NADAC Intelligence — Honest Comparison",
      description:
        "NADAC Intelligence is a $9.99/mo NADAC database for analysts. NADAC Lookup adds a reimbursement calculator with your contract formulas, built for independent pharmacies.",
      path: "/nadac-intelligence-alternative",
    }),
  component: NadacIntelligenceAlternative,
});
