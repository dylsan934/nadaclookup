import shot from "@/assets/screenshot-search-result.png";

/** Real search-result screenshot so visitors see the output before searching. */
export const SearchResultPreview = ({ caption = "What a search returns: per-unit NADAC price, effective date, and a quick total for your quantity." }: { caption?: string }) => (
  <figure className="rounded-xl border border-border/60 bg-muted/20 p-3">
    <img
      src={shot}
      width={1472}
      height={454}
      loading="lazy"
      alt="Search result for Metformin HCL 500 mg tablet, NDC 00378718505, showing a NADAC price of $0.0145 per tablet effective Sep 23, 2026, and a $1.31 total for 90 tablets"
      className="w-full h-auto rounded-lg"
    />
    <figcaption className="text-xs text-muted-foreground text-center mt-2">{caption}</figcaption>
  </figure>
);
