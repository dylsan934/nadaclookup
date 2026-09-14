import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      title: "About NADAC Lookup — Pharmacy Pricing Transparency",
      description:
        "NADAC Lookup helps independent pharmacists access current drug acquisition costs from official CMS data. Learn about our mission to bring pricing transparency to pharmacy.",
      path: "/about",
    }),
  component: About,
});
