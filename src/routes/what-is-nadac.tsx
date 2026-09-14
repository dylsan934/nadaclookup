import { createFileRoute } from "@tanstack/react-router";
import WhatIsNadac from "@/pages/WhatIsNadac";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/what-is-nadac")({
  head: () =>
    pageHead({
      title: "What Is NADAC? | National Average Drug Acquisition Cost Explained",
      description:
        "Learn what NADAC pricing is, how it is calculated, and why pharmacies use it. Includes a free NADAC lookup tool.",
      path: "/what-is-nadac",
      ogType: "article",
    }),
  component: WhatIsNadac,
});
