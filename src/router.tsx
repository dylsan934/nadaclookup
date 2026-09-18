import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Plain URLSearchParams serialization: query values stay literal strings
    // (no JSON quoting), so NDCs keep leading zeros and qty=30 stays qty=30.
    parseSearch: (searchStr: string) => Object.fromEntries(new URLSearchParams(searchStr)),
    stringifySearch: (search: Record<string, unknown>) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(search ?? {})) {
        if (value === undefined || value === null || value === "") continue;
        params.set(key, typeof value === "string" ? value : String(value));
      }
      const qs = params.toString();
      return qs ? `?${qs}` : "";
    },
    defaultPreloadStaleTime: 0,
  });

  return router;
};
