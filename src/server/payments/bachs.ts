import { HttpError } from "../auth/rbac";
import { koboToNairaString } from "../money";
import { interpretCheckout, type PaymentClient } from "./fulfill";

export function bachsBaseUrl(secret: string): string {
  if (secret.startsWith("sk_sandbox_")) return "https://sandbox-api.bachs.io";
  if (secret.startsWith("sk_live_")) return "https://api.bachs.io";
  throw new HttpError(500, "bachs_key", "BACHS_SECRET_KEY must start with sk_live_ or sk_sandbox_.");
}

export function assertLiveChargeAllowed(secret: string, env: Record<string, string | undefined> = process.env) {
  if (!secret) {
    throw new HttpError(503, "not_configured", "Bachs is not configured. Set BACHS_SECRET_KEY.");
  }
  if (secret.startsWith("sk_live_") && env.BACHS_ALLOW_LIVE !== "true" && env.VERCEL_ENV !== "production") {
    throw new HttpError(
      403,
      "live_disabled",
      "Live Bachs charges are disabled outside production so this environment cannot take real payments.",
    );
  }
}

export function bachsClient(secret: string, fetchImpl: typeof fetch = fetch): PaymentClient {
  const base = bachsBaseUrl(secret);
  return {
    async createCheckout(input) {
      const response = await fetchImpl(`${base}/v1/checkout-sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
          "Idempotency-Key": input.idempotencyKey,
        },
        body: JSON.stringify({
          pricing: { currency: "NGN", amount: koboToNairaString(input.amountKobo), price_type: "fixed" },
          payment_method_types: ["NGN_CARD", "NGN_BANK_TRANSFER"],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          reference: input.reference,
          customer: { email: input.email, name: input.name },
          metadata: { order_id: input.reference },
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { checkout_id?: string; checkout_url?: string; detail?: string };
      if (!response.ok || !body.checkout_id || !body.checkout_url) {
        throw new HttpError(502, "bachs_error", body.detail || "Bachs could not start the checkout.");
      }
      return { checkoutId: body.checkout_id, checkoutUrl: body.checkout_url };
    },
    async retrieveCheckout(checkoutId) {
      const response = await fetchImpl(`${base}/v1/checkout-sessions/${encodeURIComponent(checkoutId)}`, {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new HttpError(502, "bachs_error", "Bachs could not confirm this payment.");
      return interpretCheckout(body);
    },
  };
}

export function paystackConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.PAYSTACK_SECRET_KEY);
}
