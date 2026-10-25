import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proAuthPath } from "@/lib/pro-checkout";
import { sanitizeInternalPath } from "@/lib/safe-redirect";
import { oauthReturnPath } from "@/lib/oauth-return-path";

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), info: vi.fn(), error: vi.fn(), track: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock("sonner", () => ({ toast: { info: mocks.info, error: mocks.error } }));
vi.mock("@heycatch/sdk", () => ({ analytics: { trackEvent: mocks.track } }));
import { useStartCheckout } from "@/hooks/useStartCheckout";

const assign = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  const browser = Object.create(window);
  Object.defineProperty(browser, "location", { value: { assign } });
  vi.stubGlobal("window", browser);
  assign.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("Pro conversion flow", () => {
  it.each(["monthly", "annual"] as const)("preserves %s through an internal auth return URL", (plan) => {
    const auth = new URL(proAuthPath(plan), "https://nadaclookup.com");
    expect(auth.pathname).toBe("/auth");
    expect(auth.searchParams.get("mode")).toBe("signup");
    const destination = sanitizeInternalPath(auth.searchParams.get("redirect"));
    expect(oauthReturnPath(destination)).toBe(destination);
    const pricing = new URL(destination!, auth.origin);
    expect(pricing.pathname).toBe("/pricing");
    expect(pricing.searchParams.get("plan")).toBe(plan);
    expect(pricing.searchParams.get("checkout")).toBe("1");
  });

  it("opens annual checkout in the same tab even when analytics fails", async () => {
    mocks.track.mockImplementation(() => { throw new Error("analytics unavailable"); });
    mocks.invoke.mockResolvedValue({ data: { url: "https://checkout.stripe.com/c/pay/test" } });
    const { result } = renderHook(() => useStartCheckout());
    await act(() => result.current.start("annual"));
    expect(mocks.invoke).toHaveBeenCalledWith("create-checkout", { body: { plan: "annual" } });
    expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/test");
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("prevents duplicate requests while checkout is loading", async () => {
    let complete!: (value: unknown) => void;
    mocks.invoke.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    const { result } = renderHook(() => useStartCheckout());
    let pending!: Promise<void>;
    act(() => { pending = result.current.start(); void result.current.start(); });
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    expect(result.current.isStarting).toBe(true);
    await act(async () => {
      complete({ data: { url: "https://checkout.stripe.com/c/pay/test" } });
      await pending;
    });
    expect(result.current.isStarting).toBe(false);
  });

  it.each([{}, { url: "javascript:alert(1)" }, { url: "https://checkout.stripe.com.evil.test/pay" }])("shows a recoverable error for invalid responses: %j", async (data) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.invoke.mockResolvedValue({ data });
    const { result } = renderHook(() => useStartCheckout());
    await act(() => result.current.start());
    expect(assign).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledWith("checkout_failed", { plan: "monthly" });
    expect(result.current.isStarting).toBe(false);
  });

  it("sends past-due customers to billing management rather than claiming Pro is active", async () => {
    mocks.invoke.mockResolvedValue({ data: { alreadySubscribed: true, status: "past_due" } });
    const { result } = renderHook(() => useStartCheckout());
    await act(() => result.current.start());
    expect(assign).not.toHaveBeenCalled();
    expect(mocks.info).toHaveBeenCalledWith(expect.stringContaining("needs attention"));
  });
});
