import type { RankableDrug } from "@/lib/search-ranking";
const row = (ndc: string, drugName: string, price = 0.0123): RankableDrug => ({
  ndc, drugName, nadacPerUnit: price, effectiveDate: "2026-09-23", pricingUnit: "EA", pharmacyType: "N",
});
export const metforminRows: RankableDrug[] = [
  row("00093104801", "GLIPIZIDE-METFORMIN 5-500 MG TAB", 0.21),
  row("00378022801", "SAXAGLIPTIN-METFORMIN ER 5-1000", 3.2),
  row("00093504501", "GLYBURIDE-METFORMIN 5-500 MG TAB", 0.15),
  row("00378718505", "METFORMIN HCL 500 MG TABLET"),
  row("00378718510", "METFORMIN HCL 500 MG TABLET"),
  row("68382002810", "METFORMIN HCL 500 MG TABLET"),
  row("00378718701", "METFORMIN HCL 1,000 MG TABLET", 0.0201),
  row("00093726701", "METFORMIN HCL ER 500 MG TABLET", 0.031),
  row("00006007561", "SITAGLIPTIN-METFORMIN 50-500", 9.1),
];
