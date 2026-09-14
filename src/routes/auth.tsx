import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/auth")({
  head: () =>
    pageHead({
      title: "Sign In or Create Account — NADAC Lookup",
      description: "Sign in to your NADAC Lookup account or create a free account.",
      path: "/auth",
      robots: "noindex, nofollow",
    }),
  component: Auth,
});
