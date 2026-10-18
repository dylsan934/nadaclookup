import { createFileRoute } from "@tanstack/react-router";
import { weeklyPublicationQuery } from "@/lib/weekly-publication.query";
import Index, { faqJsonLd } from "@/pages/Index";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: ({context}) => context.queryClient.ensureQueryData(weeklyPublicationQuery),
  head: () =>
    pageHead({
      title: "Free NADAC Pricing Lookup by Drug or NDC | NADAC Lookup",
      description:
        "Search current NADAC drug prices by drug name or NDC using weekly CMS data. Compare unit costs and estimate pharmacy reimbursement.",
      path: "/",
      jsonLd: faqJsonLd,
    }),
  component: Index,
});
