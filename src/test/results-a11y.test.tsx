import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupedNdcList } from "@/components/GroupedNdcList";

vi.mock("@/lib/router-compat", () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));
vi.mock("@/components/DrugCard", () => ({
  DrugCard: ({ drug }: { drug: { drugName: string } }) => <div data-testid="card">{drug.drugName}</div>,
}));
vi.mock("@/components/ResultsFilters", () => ({ ResultsFilters: () => null }));
vi.mock("@/components/CompareButton", () => ({ CompareButton: () => null }));
vi.mock("@/components/DrugComparisonModal", () => ({ DrugComparisonModal: () => null }));

import { DrugResults } from "@/components/DrugResults";

describe("keyboard accessibility", () => {
  it("expands grouped NDCs with the keyboard", async () => {
    const user = userEvent.setup();
    render(<GroupedNdcList representativeNdc="00378718505" ndcs={["00378718505", "00378718510", "68382002810"]} />);
    const btn = screen.getByRole("button", { name: /view 3 ndcs/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).toBeNull();
    await user.tab();
    expect(btn).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(btn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["00378718505", "00378718510", "68382002810"]);
    await user.keyboard(" ");
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("hides the toggle for a single NDC", () => {
    render(<GroupedNdcList representativeNdc="00378718505" ndcs={["00378718505"]} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders 20 results, then Load more via keyboard", async () => {
    const user = userEvent.setup();
    const drugs = Array.from({ length: 45 }, (_, i) => ({
      ndc: String(i).padStart(11, "0"), drugName: `METFORMIN HCL ${i + 1} MG TABLET`,
      nadacPerUnit: 0.01, effectiveDate: "2026-09-23", pricingUnit: "EA", pharmacyType: "N",
    }));
    render(<DrugResults drugs={drugs} isLoading={false} hasSearched searchTerm="metformin" />);
    expect(screen.getAllByTestId("card")).toHaveLength(20);
    const more = screen.getByRole("button", { name: /load more results/i });
    more.focus();
    await user.keyboard("{Enter}");
    expect(screen.getAllByTestId("card")).toHaveLength(40);
    screen.getByRole("button", { name: /load more results/i }).focus();
    await user.keyboard(" ");
    expect(screen.getAllByTestId("card")).toHaveLength(45);
    expect(screen.queryByRole("button", { name: /load more results/i })).toBeNull();
  });
});
