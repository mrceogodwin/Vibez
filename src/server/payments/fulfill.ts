import type { Db } from "../db";
import { HttpError } from "../auth/rbac";
import { nairaStringToKobo } from "../money";

export type RetrievedCheckout = {
  status: string;
  amount: string | null;
  currency: string | null;
  paymentId: string | null;
  paid: boolean;
};

export type PaymentClient = {
  createCheckout(input: {
    amountKobo: number;
    reference: string;
    idempotencyKey: string;
    successUrl: string;
    cancelUrl: string;
    email: string;
    name: string;
  }): Promise<{ checkoutId: string; checkoutUrl: string }>;
  retrieveCheckout(checkoutId: string): Promise<RetrievedCheckout>;
};

export function interpretCheckout(body: {
  status?: string;
  amount?: string;
  currency?: string;
  payment_id?: string;
  pricing?: { amount?: string; currency?: string };
  charge?: { status?: string; amount?: string; currency?: string; payment_id?: string } | null;
}): RetrievedCheckout {
  const charge = body.charge ?? undefined;
  const status = String(body.status ?? charge?.status ?? "");
  const paid =
    /^(completed|complete|succeeded|paid)$/i.test(status) ||
    /^(completed|complete|succeeded|paid)$/i.test(String(charge?.status ?? ""));
  return {
    status,
    amount: charge?.amount ?? body.amount ?? body.pricing?.amount ?? null,
    currency: (charge?.currency ?? body.currency ?? body.pricing?.currency ?? null)?.toUpperCase() ?? null,
    paymentId: charge?.payment_id ?? body.payment_id ?? null,
    paid,
  };
}

type OrderRow = {
  id: string;
  user_id: string;
  purpose: string;
  amount_kobo: string;
  credits: string | null;
  status: string;
  provider_checkout_id: string | null;
};

function eventData(payload: Record<string, unknown>) {
  const data = (payload.data ?? {}) as Record<string, unknown>;
  return {
    reference: typeof data.reference === "string" ? data.reference : null,
    checkoutId: typeof data.checkout_id === "string" ? data.checkout_id : null,
  };
}

export async function processPaymentEvent(
  db: Db,
  input: { provider: "bachs" | "paystack"; eventId: string; eventType: string; payload: Record<string, unknown>; client: PaymentClient },
): Promise<{ status: number; outcome: string }> {
  const { reference, checkoutId } = eventData(input.payload);
  const found = await db.query<OrderRow>(
    `SELECT id, user_id, purpose, amount_kobo, credits, status, provider_checkout_id
     FROM vibez.payment_orders
     WHERE id::text = $1 OR ($2::text IS NOT NULL AND provider_checkout_id = $2)
     LIMIT 1`,
    [reference, checkoutId],
  );
  const order = found.rows[0];
  if (!order) return { status: 500, outcome: "unknown_order" };

  const failing = ["collection.failed", "checkout.expired", "charge.failed"].includes(input.eventType);
  if (failing) {
    await insertEvent(db, input, order.id, "failed");
    if (order.status === "pending") {
      await db.query("UPDATE vibez.payment_orders SET status = 'failed' WHERE id = $1 AND status = 'pending'", [order.id]);
    }
    return { status: 200, outcome: "failed" };
  }

  const success = ["collection.succeeded", "checkout.completed", "charge.success"].includes(input.eventType);
  if (!success) {
    await insertEvent(db, input, order.id, "ignored");
    return { status: 200, outcome: "ignored" };
  }
  if (!order.provider_checkout_id && !checkoutId) {
    await insertEvent(db, input, order.id, "missing_checkout");
    return { status: 200, outcome: "missing_checkout" };
  }
  const retrieved = await input.client.retrieveCheckout(order.provider_checkout_id ?? checkoutId!);
  if (!retrieved.paid) {
    await insertEvent(db, input, order.id, "not_confirmed");
    return { status: 200, outcome: "not_confirmed" };
  }
  if (!retrieved.amount || retrieved.currency !== "NGN") {
    await insertEvent(db, input, order.id, "amount_mismatch");
    return { status: 200, outcome: "amount_mismatch" };
  }
  let paidKobo: number;
  try {
    paidKobo = nairaStringToKobo(retrieved.amount);
  } catch {
    await insertEvent(db, input, order.id, "amount_mismatch");
    return { status: 200, outcome: "amount_mismatch" };
  }
  if (paidKobo !== Number(order.amount_kobo)) {
    await insertEvent(db, input, order.id, "amount_mismatch");
    return { status: 200, outcome: "amount_mismatch" };
  }

  const inserted = await insertEvent(db, input, order.id, "fulfilled");
  if (!inserted) return { status: 200, outcome: "duplicate" };
  if (order.purpose === "topup") {
    const credits = Number(order.credits ?? 0);
    if (credits * 100 !== paidKobo) throw new HttpError(500, "bundle_mismatch", "Bundle credits do not match the payment.");
    await db.query(
      `INSERT INTO vibez.wallet_ledger
        (user_id, amount_kobo, entry_type, reference, idempotency_key, related_type, related_id, payment_provider, provider_reference, reason)
       VALUES ($1, $2, 'credit_purchase', $3::text, $4, 'payment_order', $3::uuid, $5, $6, 'Credit purchase')
       ON CONFLICT (idempotency_key) DO NOTHING`,
      [order.user_id, paidKobo, order.id, `credit:${order.id}`, input.provider, retrieved.paymentId],
    );
  } else if (order.purpose === "plus") {
    await db.query(
      `INSERT INTO vibez.user_subscriptions (user_id, product_code, period_start, period_end, payment_order_id)
       SELECT $1, 'vibez_plus', start_at, start_at + interval '30 days', $2
       FROM (
         SELECT GREATEST(now(), COALESCE(MAX(period_end), now())) AS start_at
         FROM vibez.user_subscriptions
         WHERE user_id = $1 AND product_code = 'vibez_plus'
       ) bounds
       ON CONFLICT (payment_order_id) DO NOTHING`,
      [order.user_id, order.id],
    );
    await db.query(
      `INSERT INTO vibez.subscription_events (user_id, event_type, payload)
       VALUES ($1, 'plus_activated', jsonb_build_object('payment_order_id', $2::text))`,
      [order.user_id, order.id],
    );
  }
  await db.query(
    "UPDATE vibez.payment_orders SET status = 'succeeded', provider_payment_id = COALESCE($2, provider_payment_id) WHERE id = $1",
    [order.id, retrieved.paymentId],
  );
  return { status: 200, outcome: "fulfilled" };
}

async function insertEvent(
  db: Db,
  input: { provider: string; eventId: string; eventType: string; payload: Record<string, unknown> },
  orderId: string,
  outcome: string,
): Promise<boolean> {
  const result = await db.query(
    `INSERT INTO vibez.payment_events (provider, event_id, event_type, payment_order_id, outcome, payload)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     ON CONFLICT (provider, event_id) DO NOTHING
     RETURNING id`,
    [input.provider, input.eventId, input.eventType, orderId, outcome, JSON.stringify(input.payload)],
  );
  return (result.rowCount ?? 0) > 0;
}
