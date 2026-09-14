import { createFileRoute } from "@tanstack/react-router";
import ReimbursementCalculator from "@/pages/ReimbursementCalculator";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reimbursement-calculator")({
  head: () =>
    pageHead({
      title: "Pharmacy Reimbursement Calculator | NADAC Lookup",
      description:
        "Estimate pharmacy reimbursement and margin using current NADAC pricing, quantity dispensed, contract formulas, dispensing fees, and actual claim payment.",
      path: "/reimbursement-calculator",
    }),
  component: ReimbursementCalculator,
});
