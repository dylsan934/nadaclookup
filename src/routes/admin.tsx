import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({
  head: () =>
    pageHead({
      title: "Admin Dashboard — NADAC Lookup",
      description: "Internal administration dashboard.",
      path: "/admin",
      robots: "noindex, nofollow",
    }),
  component: Admin,
});
