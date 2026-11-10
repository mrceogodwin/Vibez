import { createHmac, timingSafeEqual } from "node:crypto";

/** Flat fee in kobo from a basis-point setting. 500 bps = 5%. */
export function feeKobo(subtotalKobo: number, feeBps: number) {
  const subtotal = Math.max(0, Math.round(subtotalKobo));
  const bps = Math.max(0, Math.round(feeBps));
  return Math.round((subtotal * bps) / 10_000);
}

export function paystackSignature(secret: string, rawBody: string) {
  return createHmac("sha512", secret).update(rawBody).digest("hex");
}

export function signaturesMatch(expectedHex: string, receivedHex: string) {
  try {
    const a = Buffer.from(expectedHex, "utf8");
    const b = Buffer.from(receivedHex, "utf8");
    if (a.length !== b.length || a.length === 0) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * What to do after Paystack's verify API has been consulted.
 * Tickets are issued only when the provider reports success for the exact amount
 * and this order has not already been fulfilled.
 */
export function decideFulfillment(input: {
  orderStatus: string;
  providerStatus: string | null;
  paidAmountKobo: number | null;
  expectedAmountKobo: number;
  alreadyHasTickets: boolean;
}): "issue" | "already" | "reject" {
  if (input.alreadyHasTickets || input.orderStatus === "paid") return "already";
  if (input.providerStatus !== "success") return "reject";
  if (input.paidAmountKobo == null) return "reject";
  if (Math.round(input.paidAmountKobo) !== Math.round(input.expectedAmountKobo)) return "reject";
  return "issue";
}

export function inventoryFits(sold: number, quantity: number, qty: number) {
  return qty > 0 && sold + qty <= quantity;
}
