import { createFileRoute } from "@tanstack/react-router";
import DrugPage from "@/pages/DrugPage";
import { fetchRelatedDrugs, resolveDrugNameForSlug, type RelatedDrugLink } from "@/lib/drug-related";
import { pageHead, SITE_URL } from "@/lib/seo";

interface DrugSummary {
  slug: string;
  drugName: string | null;
  ndc: string | null;
  related: RelatedDrugLink[];
}

export const Route = createFileRoute("/drug/$slug")({
  loader: async ({ params }): Promise<DrugSummary> => {
    const row = await resolveDrugNameForSlug(params.slug);
    const related = row ? await fetchRelatedDrugs(row.drug_name).catch(() => []) : [];
    return { slug: params.slug, drugName: row?.drug_name ?? null, ndc: row?.ndc ?? null, related };
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
          "@type": "WebPage",
          "@id": `${SITE_URL}${canonical}`,
          url: `${SITE_URL}${canonical}`,
          name: `${drugName} NADAC Price`,
          isPartOf: { "@id": `${SITE_URL}/#website` },
          publisher: { "@id": `${SITE_URL}/#organization` },
          about: { "@type": "Drug", name: drugName },
        },
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
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Drugs", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 3, name: `${drugName} NADAC Price`, item: `${SITE_URL}${canonical}` },
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
  return <DrugPage initialName={data.drugName ?? ""} initialRelated={data.related} />;
}
