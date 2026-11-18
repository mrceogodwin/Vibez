import { describe, expect, it } from "vitest";
import { interpretCheckout } from "./fulfill";
import { assertLiveChargeAllowed, paymentAvailability } from "./bachs";
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
  it("blocks a live key outside production without naming configuration", () => {
    expect(paymentAvailability({}).status).toBe("unavailable");
    expect(paymentAvailability({ BACHS_SECRET_KEY: "sk_live_test" })).toMatchObject({
      enabled: false,
      status: "paused",
      message: "Top-ups are temporarily unavailable.",
    });
    expect(paymentAvailability({ BACHS_SECRET_KEY: "sk_sandbox_test" }).enabled).toBe(true);
    expect(paymentAvailability({ BACHS_SECRET_KEY: "sk_live_test", VERCEL_ENV: "production" }).status).toBe("ready");
    try {
      assertLiveChargeAllowed("sk_live_test", {});
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as Error).message).toBe("Top-ups are temporarily unavailable.");
      expect((error as Error).message).not.toMatch(/SECRET|BACHS_/);
    }
  });
});
