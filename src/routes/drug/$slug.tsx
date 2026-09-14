import { createFileRoute } from "@tanstack/react-router";
import DrugPage from "@/pages/DrugPage";
import { supabase } from "@/integrations/supabase/client";
import { slugToSearchTerm } from "@/lib/drug-slug";
import { pageHead } from "@/lib/seo";

interface DrugSummary {
  slug: string;
  drugName: string | null;
  ndc: string | null;
}

export const Route = createFileRoute("/drug/$slug")({
  loader: async ({ params }): Promise<DrugSummary> => {
    const searchTerm = slugToSearchTerm(params.slug);
    let { data } = await supabase
      .from("nadac_drugs")
      .select("drug_name, ndc")
      .ilike("drug_name", searchTerm)
      .order("effective_date", { ascending: false })
      .limit(1);
    if (!data || data.length === 0) {
      const loose = await supabase
        .from("nadac_drugs")
        .select("drug_name, ndc")
        .ilike("drug_name", `${searchTerm}%`)
        .order("effective_date", { ascending: false })
        .limit(1);
      data = loose.data;
    }
    const row = data?.[0];
    return { slug: params.slug, drugName: row?.drug_name ?? null, ndc: row?.ndc ?? null };
  },
  head: ({ loaderData }) => {
    const slug = loaderData?.slug ?? "";
    const drugName = loaderData?.drugName ?? null;
    const canonical = `/drug/${slug}`;
    if (!drugName) {
      return pageHead({
        title: "Drug Not Found | NADAC Lookup",
        description: "We couldn't find NADAC pricing for that drug. Search any drug by name or NDC.",
        path: canonical,
        robots: "noindex, follow",
      });
    }
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Drug",
          name: drugName,
          description: `${drugName} NADAC pharmacy acquisition cost, updated weekly from CMS.`,
          ...(loaderData?.ndc
            ? { code: { "@type": "MedicalCode", code: loaderData.ndc, codingSystem: "NDC" } }
            : {}),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://nadaclookup.com/" },
            { "@type": "ListItem", position: 2, name: "Drugs", item: "https://nadaclookup.com/" },
            {
              "@type": "ListItem",
              position: 3,
              name: `${drugName} NADAC Price`,
              item: `https://nadaclookup.com${canonical}`,
            },
          ],
        },
      ],
    };
    return pageHead({
      title: `${drugName} NADAC Price | NADAC Lookup`.slice(0, 60),
      description: `View the current NADAC unit price, effective date, NDCs, and available price history for ${drugName}.`,
      path: canonical,
      jsonLd,
    });
  },
  component: DrugRouteComponent,
});

function DrugRouteComponent() {
  const data = Route.useLoaderData();
  return <DrugPage initialName={data.drugName ?? ""} />;
}
