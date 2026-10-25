import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ user: null as null | { id: string }, subscribed: false, search: "", start: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: state.user, isSubscribed: state.subscribed }) }));
vi.mock("@/hooks/useStartCheckout", () => ({ useStartCheckout: () => ({ start: state.start, isStarting: false }) }));
vi.mock("@/lib/router-compat", () => ({
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(state.search), vi.fn()],
}));
vi.mock("@/components/SiteNavigation", () => ({ SiteNavigation: () => null }));
vi.mock("@/components/Footer", () => ({ Footer: () => null }));
import Pricing from "@/pages/Pricing";

beforeEach(() => {
  state.user = null;
  state.subscribed = false;
  state.search = "";
  state.start.mockReset();
});

it("carries a visitor's selected annual plan into signup", () => {
  render(<Pricing />);
  fireEvent.click(screen.getByRole("radio", { name: /Annual/ }));
  const link = screen.getByRole("link", { name: "Start 7-Day Free Trial" });
  const auth = new URL(link.getAttribute("href")!, "https://nadaclookup.com");
  expect(auth.searchParams.get("redirect")).toBe("/pricing?plan=annual&checkout=1");
});

it("returns signed-in visitors to the selected plan and waits for an explicit checkout click", () => {
  state.user = { id: "test-user" };
  state.search = "plan=annual&checkout=1";
  render(<Pricing />);
  expect(screen.getByRole("radio", { name: /Annual/ })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("status")).toHaveTextContent("$290/year after 7 days");
  expect(state.start).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Start 7-Day Free Trial" }));
  expect(state.start).toHaveBeenCalledWith("annual");
});

it("gives subscribed customers their watchlist instead of another signup invitation", () => {
  state.user = { id: "test-user" };
  state.subscribed = true;
  render(<Pricing />);
  expect(screen.queryByText("Start 7-Day Free Trial")).toBeNull();
  expect(screen.getByRole("link", { name: "Open your Pro watchlist" })).toHaveAttribute("href", "/saved-drugs");
  expect(screen.queryByText("Most Popular")).toBeNull();
  expect(screen.queryByText("Weekly movers email digest")).toBeNull();
});
