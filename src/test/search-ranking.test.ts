import { describe, expect, it } from "vitest";
import { rankDrugs, toResultGroups, isCombination } from "@/lib/search-ranking";
import { buildCalculatorHref } from "@/lib/drug-params";
import { metforminRows } from "./fixtures";

describe("drug-name relevance", () => {
  it("ranks standalone metformin before combination products", () => {
    const ranked = rankDrugs(metforminRows, "metformin");
    const firstCombo = ranked.findIndex((d) => isCombination(d.drugName));
    const lastStandalone = ranked.map((d) => isCombination(d.drugName)).lastIndexOf(false);
    expect(firstCombo).toBeGreaterThan(lastStandalone);
    expect(ranked[0]!.drugName.startsWith("METFORMIN")).toBe(true);
    for (const n of ["GLIPIZIDE-METFORMIN", "SAXAGLIPTIN-METFORMIN", "GLYBURIDE-METFORMIN", "SITAGLIPTIN-METFORMIN"]) {
      const i = ranked.findIndex((d) => d.drugName.startsWith(n));
      expect(i).toBeGreaterThan(lastStandalone);
    }
  });

  it("groups duplicate METFORMIN HCL 500 MG TABLET package NDCs without changing price", () => {
    const groups = toResultGroups(metforminRows, "metformin");
    const g = groups.filter((x) => x.representative.drugName === "METFORMIN HCL 500 MG TABLET");
    expect(g).toHaveLength(1);
    expect(g[0]!.ndcs.sort()).toEqual(["00378718505", "00378718510", "68382002810"]);
    expect(g[0]!.representative.nadacPerUnit).toBe(0.0123);
    // different strength / ER stay separate
    expect(groups.some((x) => x.representative.drugName.includes("1,000"))).toBe(true);
    expect(groups.some((x) => x.representative.drugName.includes(" ER "))).toBe(true);
  });

  it("does not group rows differing in price", () => {
    const rows = [metforminRows[3]!, { ...metforminRows[4]!, nadacPerUnit: 0.02 }];
    expect(toResultGroups(rows, "metformin")).toHaveLength(2);
  });

  it("exact NDC 00378718505 is first and ungrouped", () => {
    const shuffled = [metforminRows[4]!, metforminRows[5]!, metforminRows[3]!];
    for (const q of ["00378718505", "00378-7185-05"]) {
      const groups = toResultGroups(shuffled, q);
      expect(groups[0]!.representative.ndc).toBe("00378718505");
      expect(groups.every((g) => g.ndcs.length === 1)).toBe(true);
    }
  });

  it("calculator link keeps representative NDC (leading zeros) and drug name", () => {
    const g = toResultGroups(metforminRows, "metformin").find((x) => x.ndcs.length > 1)!;
    const href = buildCalculatorHref({ ndc: g.representative.ndc, drugName: g.representative.drugName, quantity: 30 });
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("ndc")).toBe("00378718505");
    expect(params.get("drug")).toBe("METFORMIN HCL 500 MG TABLET");
    expect(params.get("qty")).toBe("30");
    expect(href).not.toContain("%22");
  });
});
