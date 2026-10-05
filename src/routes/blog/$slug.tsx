import { createFileRoute } from "@tanstack/react-router";
import BlogArticle, { articles, buildArticleJsonLd } from "@/pages/BlogArticle";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => ({ slug: params.slug }),
  head: ({ loaderData }) => {
    const slug = loaderData?.slug ?? "";
    const article = articles[slug];
    if (!article) {
      return pageHead({
        title: "Article Not Found | NADAC Lookup",
        description: "This article could not be found. Browse all NADAC pricing resources.",
        path: "/blog",
        robots: "noindex, follow",
      });
    }
    const canonical = `/blog/${slug}`;
    const articleJsonLd = buildArticleJsonLd(slug) ?? undefined;
    return pageHead({
      title: article.title,
      description: article.description,
      path: canonical,
      ogType: "article",
      jsonLd: articleJsonLd,
    });
  },
  component: BlogArticle,
});
