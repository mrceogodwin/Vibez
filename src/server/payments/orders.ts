import type { Db } from "../db";
import { withTx } from "../db";
import { HttpError } from "../auth/rbac";
import type { PaymentClient } from "./fulfill";
import { verifyBachsSignature } from "./signature";
import { processPaymentEvent } from "./fulfill";

export async function createTopup(
  db: Db,
  input: { userId: string; email: string; name: string; bundleCode: string; origin: string },
  client: PaymentClient,
) {
  const bundle = await db.query<{ code: string; amount_kobo: string; credits: string }>(
    "SELECT code, amount_kobo, credits FROM vibez.credit_bundles WHERE code = $1 AND active = true",
    [input.bundleCode],
  );
  const row = bundle.rows[0];
  if (!row) throw new HttpError(400, "bundle", "That credit bundle is not available.");
  return openOrder(db, client, {
    ...input,
    purpose: "topup",
    amountKobo: Number(row.amount_kobo),
    credits: Number(row.credits),
    bundleCode: row.code,
  });
}

export async function createPlusCheckout(
  db: Db,
  input: { userId: string; email: string; name: string; origin: string },
  client: PaymentClient,
) {
  const product = await db.query<{ amount_kobo: string }>(
    "SELECT amount_kobo FROM vibez.subscription_products WHERE code = 'vibez_plus' AND active = true",
  );
  if (!product.rows[0]) throw new HttpError(503, "plus", "Vibez Plus is not available.");
  return openOrder(db, client, {
    ...input,
    purpose: "plus",
    amountKobo: Number(product.rows[0].amount_kobo),
    credits: null,
    bundleCode: null,
  });
}

async function openOrder(
  db: Db,
  client: PaymentClient,
  input: {
    userId: string;
    email: string;
    name: string;
    origin: string;
    purpose: "topup" | "plus";
    amountKobo: number;
    credits: number | null;
    bundleCode: string | null;
  },
) {
  const idempotencyKey = crypto.randomUUID();
  const order = await db.query<{ id: string }>(
    `INSERT INTO vibez.payment_orders
      (user_id, purpose, amount_kobo, credits, status, provider, idempotency_key, bundle_code)
     VALUES ($1, $2, $3, $4, 'pending', 'bachs', $5, $6)
     RETURNING id`,
    [input.userId, input.purpose, input.amountKobo, input.credits, idempotencyKey, input.bundleCode],
  );
  const orderId = order.rows[0].id;
  try {
    const checkout = await client.createCheckout({
      amountKobo: input.amountKobo,
      reference: orderId,
      idempotencyKey: orderId,
      successUrl: `${input.origin}/wallet?payment=return&order=${orderId}`,
      cancelUrl: `${input.origin}/wallet?payment=cancel&order=${orderId}`,
      email: input.email,
      name: input.name,
    });
    await db.query(
      "UPDATE vibez.payment_orders SET provider_checkout_id = $2, checkout_url = $3 WHERE id = $1",
      [orderId, checkout.checkoutId, checkout.checkoutUrl],
    );
    return { orderId, checkoutUrl: checkout.checkoutUrl };
  } catch (error) {
    await db.query("UPDATE vibez.payment_orders SET status = 'failed' WHERE id = $1 AND status = 'pending'", [orderId]);
    throw error;
  }
}

export async function handleBachsWebhook(
  raw: string,
  headers: { get(name: string): string | null },
  deps: { secret: string; client: PaymentClient; nowMs?: number },
) {
  const verified = verifyBachsSignature(raw, headers, deps.secret, deps.nowMs);
  if (!verified.ok) return { status: 400, outcome: verified.reason };
  let payload: { id?: string; type?: string };
  try {
    payload = JSON.parse(raw) as { id?: string; type?: string };
  } catch {
    return { status: 400, outcome: "bad_payload" };
  }
  if (!payload.id || !payload.type) return { status: 400, outcome: "bad_payload" };
  return withTx((tx) =>
    processPaymentEvent(tx, {
      provider: "bachs",
      eventId: payload.id!,
      eventType: payload.type!,
      payload: payload as Record<string, unknown>,
      client: deps.client,
    }),
  );
}
