import { createFileRoute } from "@tanstack/react-router";
import NdcLookup from "@/pages/NdcLookup";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ndc-lookup")({
  head: () =>
    pageHead({
      title: "NDC Lookup with NADAC Acquisition Cost | Free Tool",
      description:
        "Free NDC lookup with real pharmacy acquisition cost. Search any 11-digit NDC and instantly see the current NADAC price, pricing unit, and effective date.",
      path: "/ndc-lookup",
    }),
  component: NdcLookup,
});
