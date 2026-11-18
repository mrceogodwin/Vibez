import { describe, expect, it } from "vitest";
import { interpretCheckout } from "./fulfill";
import { assertLiveChargeAllowed } from "./bachs";
import { HttpError } from "../auth/rbac";

describe("checkout interpretation", () => {
  it("treats a completed checkout with a succeeded charge as paid", () => {
    const result = interpretCheckout({
      status: "completed",
      charge: { status: "succeeded", amount: "500.00", currency: "NGN", payment_id: "ch_1" },
    });
    expect(result.paid).toBe(true);
    expect(result.amount).toBe("500.00");
    expect(result.currency).toBe("NGN");
  });

  it("does not treat an open checkout as paid", () => {
    expect(interpretCheckout({ status: "open", charge: null }).paid).toBe(false);
  });
});

describe("live charge guard", () => {
  it("blocks a live key outside production", () => {
    expect(() => assertLiveChargeAllowed("sk_live_test", {})).toThrow(HttpError);
    expect(() => assertLiveChargeAllowed("sk_sandbox_test", {})).not.toThrow();
    expect(() => assertLiveChargeAllowed("sk_live_test", { VERCEL_ENV: "production" })).not.toThrow();
  });
});
