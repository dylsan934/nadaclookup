import { createFileRoute } from "@tanstack/react-router";
import Unsubscribe from "@/pages/Unsubscribe";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/unsubscribe")({
  head: () =>
    pageHead({
      title: "Unsubscribe — NADAC Lookup",
      description: "Manage your email preferences.",
      path: "/unsubscribe",
      robots: "noindex, follow",
    }),
  component: Unsubscribe,
});
