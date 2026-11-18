import { HttpError } from "../auth/rbac";
import { koboToNairaString } from "../money";
import { interpretCheckout, type PaymentClient } from "./fulfill";

const TOP_UP_UNAVAILABLE = "Top-ups are temporarily unavailable.";

export type PaymentAvailability = {
  enabled: boolean;
  status: "ready" | "paused" | "unavailable";
  message: string;
};

export function paymentAvailability(
  env: Record<string, string | undefined> = process.env,
  log = false,
): PaymentAvailability {
  const secret = env.BACHS_SECRET_KEY ?? "";
  const report = (reason: string, status: PaymentAvailability["status"]): PaymentAvailability => {
    if (log) console.error(`payments_unavailable reason=${reason}`);
    return { enabled: false, status, message: TOP_UP_UNAVAILABLE };
  };
  if (!secret) return report("missing_provider", "unavailable");
  if (!secret.startsWith("sk_live_") && !secret.startsWith("sk_sandbox_")) return report("unrecognised_key", "unavailable");
  const live = secret.startsWith("sk_live_");
  const allowed = env.VERCEL_ENV === "production" || env.BACHS_ALLOW_LIVE === "true";
  if (live && !allowed) return report("live_disabled", "paused");
  return { enabled: true, status: "ready", message: "" };
}

export function bachsBaseUrl(secret: string): string {
  if (secret.startsWith("sk_sandbox_")) return "https://sandbox-api.bachs.io";
  if (secret.startsWith("sk_live_")) return "https://api.bachs.io";
  console.error("payments_unavailable reason=unrecognised_key");
  throw new HttpError(503, "not_configured", TOP_UP_UNAVAILABLE);
}

export function assertLiveChargeAllowed(secret: string, env: Record<string, string | undefined> = process.env) {
  const availability = paymentAvailability({ ...env, BACHS_SECRET_KEY: secret }, true);
  if (!availability.enabled) {
    throw new HttpError(availability.status === "paused" ? 403 : 503, availability.status, availability.message);
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
