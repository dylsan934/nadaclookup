import { createFileRoute } from "@tanstack/react-router";
import NadacUpdateFrequency from "@/pages/NadacUpdateFrequency";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/how-often-does-nadac-update")({
  head: () =>
    pageHead({
      title: "How Often Does NADAC Update? | Weekly Schedule",
      description:
        "NADAC prices update weekly every Wednesday. Learn why prices change, how pharmacies use updates, and when to check for new data.",
      path: "/how-often-does-nadac-update",
      ogType: "article",
    }),
  component: NadacUpdateFrequency,
});
