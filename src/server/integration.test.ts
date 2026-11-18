import { afterAll, describe, expect, it } from "vitest";
import { getPool, withTx } from "./db";
import { signUp, verifyEmail, login, currentUser, readToken, resendVerification } from "./auth/service";
import { createEmailSender } from "./email";
import { handleBachsWebhook, createTopup } from "./payments/orders";
import { signBachsBody } from "./payments/signature";
import { startMatch, reverseRoomCharge, activateTrial } from "./wallet/apply";
import type { PaymentClient } from "./payments/fulfill";

const enabled = Boolean(process.env.DATABASE_URL);
const secret = "whsec_phase1";

function paidClient(amount = "500.00"): PaymentClient {
  return {
    async createCheckout() {
      const checkoutId = `chk_${crypto.randomUUID()}`;
      return { checkoutId, checkoutUrl: `https://checkout.bachs.io/c/${checkoutId}` };
    },
    async retrieveCheckout() {
      return { status: "completed", amount, currency: "NGN", paymentId: "ch_test", paid: true };
    },
  };
}

async function insertUser(prefix: string) {
  const email = `${prefix}-${crypto.randomUUID()}@example.test`;
  const username = `t${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const created = await getPool().query<{ id: string }>(
    `INSERT INTO vibez.users (email, display_name, username, email_verified_at, password_hash)
     VALUES ($1, 'Integration test', $2, now(), 'x') RETURNING id`,
    [email, username],
  );
  const id = created.rows[0].id;
  await getPool().query("INSERT INTO vibez.profiles (user_id) VALUES ($1)", [id]);
  await getPool().query("INSERT INTO vibez.wallets (user_id) VALUES ($1)", [id]);
  await getPool().query("INSERT INTO vibez.user_roles (user_id, role_code) VALUES ($1, 'member')", [id]);
  return id;
}

async function balance(userId: string) {
  const result = await getPool().query<{ balance: string }>("SELECT vibez.wallet_balance($1) AS balance", [userId]);
  return Number(result.rows[0].balance);
}

describe.skipIf(!enabled)("phase 1 database", () => {
  afterAll(async () => {
    await getPool().end();
  });

  it("keeps the existing public catalogue", async () => {
    const events = await getPool().query<{ n: number }>("SELECT count(*)::int AS n FROM public.events");
    const legacy = await getPool().query<{ n: number }>("SELECT count(*)::int AS n FROM public.curators");
    expect(events.rows[0].n).toBeGreaterThan(0);
    expect(legacy.rows[0].n).toBeGreaterThan(0);
  });

  it("rejects ledger updates and deletes", async () => {
    const userId = await insertUser("ledger");
    const inserted = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.wallet_ledger (user_id, amount_kobo, entry_type, reference, idempotency_key, reason)
       VALUES ($1, 50000, 'credit_purchase', 'seed', $2, 'test credit') RETURNING id`,
      [userId, `seed:${userId}`],
    );
    await expect(
      getPool().query("UPDATE vibez.wallet_ledger SET amount_kobo = 1 WHERE id = $1", [inserted.rows[0].id]),
    ).rejects.toThrow(/immutable/);
    await expect(getPool().query("DELETE FROM vibez.wallet_ledger WHERE id = $1", [inserted.rows[0].id])).rejects.toThrow(
      /immutable/,
    );
  });

  it("credits a verified top-up once and ignores a duplicate, a failure, a forgery, and a mismatch", async () => {
    const userId = await insertUser("pay");
    const order = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.payment_orders
        (user_id, purpose, amount_kobo, credits, status, provider, idempotency_key, provider_checkout_id)
       VALUES ($1, 'topup', 50000, 500, 'pending', 'bachs', $2, $3) RETURNING id`,
      [userId, `idem:${userId}`, `chk-${userId}-ok`],
    );
    const payload = JSON.stringify({
      id: `evt-${userId}`,
      type: "collection.succeeded",
      data: { reference: order.rows[0].id, checkout_id: `chk-${userId}-ok` },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const { v2 } = signBachsBody(secret, payload, timestamp);
    const headers = new Headers({ "x-bachs-signature-v2": v2 });
    const first = await handleBachsWebhook(payload, headers, { secret, client: paidClient() });
    const second = await handleBachsWebhook(payload, headers, { secret, client: paidClient() });
    expect(first.outcome).toBe("fulfilled");
    expect(second.outcome).toBe("duplicate");
    expect(await balance(userId)).toBe(50_000);
    const rows = await getPool().query("SELECT count(*)::int AS n FROM vibez.wallet_ledger WHERE user_id = $1", [userId]);
    expect(rows.rows[0].n).toBe(1);

    const failedOrder = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.payment_orders
        (user_id, purpose, amount_kobo, credits, status, provider, idempotency_key, provider_checkout_id)
       VALUES ($1, 'topup', 100000, 1000, 'pending', 'bachs', $2, $3) RETURNING id`,
      [userId, `idem-fail:${userId}`, `chk-${userId}-fail`],
    );
    const failedBody = JSON.stringify({
      id: `evt-fail-${userId}`,
      type: "collection.failed",
      data: { reference: failedOrder.rows[0].id },
    });
    const failedSig = signBachsBody(secret, failedBody, timestamp);
    const failed = await handleBachsWebhook(failedBody, new Headers({ "x-bachs-signature-v2": failedSig.v2 }), {
      secret,
      client: paidClient(),
    });
    expect(failed.outcome).toBe("failed");
    expect(await balance(userId)).toBe(50_000);

    const forged = await handleBachsWebhook(payload, new Headers({ "x-bachs-signature-v2": `t=${timestamp},v1=${"ab".repeat(32)}` }), {
      secret,
      client: paidClient(),
    });
    expect(forged.status).toBe(400);
    expect(await balance(userId)).toBe(50_000);

    const mismatchOrder = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.payment_orders
        (user_id, purpose, amount_kobo, credits, status, provider, idempotency_key, provider_checkout_id)
       VALUES ($1, 'topup', 50000, 500, 'pending', 'bachs', $2, $3) RETURNING id`,
      [userId, `idem-bad:${userId}`, `chk-${userId}-bad`],
    );
    const mismatchBody = JSON.stringify({
      id: `evt-bad-${userId}`,
      type: "collection.succeeded",
      data: { reference: mismatchOrder.rows[0].id, checkout_id: `chk-${userId}-bad` },
    });
    const mismatchSig = signBachsBody(secret, mismatchBody, timestamp);
    const mismatch = await handleBachsWebhook(mismatchBody, new Headers({ "x-bachs-signature-v2": mismatchSig.v2 }), {
      secret,
      client: paidClient("1.00"),
    });
    expect(mismatch.outcome).toBe("amount_mismatch");
    expect(await balance(userId)).toBe(50_000);
  });

  it("charges a room once, skips reconnects, and reverses a failed start", async () => {
    const userId = await insertUser("room");
    await getPool().query(
      `INSERT INTO vibez.wallet_ledger (user_id, amount_kobo, entry_type, reference, idempotency_key, reason)
       VALUES ($1, 5000, 'credit_purchase', 'seed', $2, 'test')`,
      [userId, `seed-room:${userId}`],
    );
    const room = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.game_rooms (game_code, host_id, join_code, visibility, status)
       VALUES ('chess', $1, $2, 'private', 'ready') RETURNING id`,
      [userId, crypto.randomUUID().slice(0, 8)],
    );
    const roomId = room.rows[0].id;
    const started = await withTx((tx) => startMatch(tx, roomId, "start"));
    expect(started).toMatchObject({ charged: true, kind: "debit" });
    expect(await balance(userId)).toBe(4_000);
    const again = await withTx((tx) => startMatch(tx, roomId, "start"));
    const reconnect = await withTx((tx) => startMatch(tx, roomId, "reconnect"));
    expect(again).toMatchObject({ charged: false });
    expect(reconnect).toMatchObject({ charged: false });
    expect(await balance(userId)).toBe(4_000);
    await withTx((tx) => reverseRoomCharge(tx, roomId, "platform failed to keep the match up"));
    expect(await balance(userId)).toBe(5_000);
    const entries = await getPool().query<{ entry_type: string; amount_kobo: string }>(
      "SELECT entry_type, amount_kobo FROM vibez.wallet_ledger WHERE user_id = $1 ORDER BY created_at",
      [userId],
    );
    expect(entries.rows.map((row) => row.entry_type)).toEqual(["credit_purchase", "game_room_fee", "reversal"]);
  });

  it("does not charge a cancelled room and spends each free start once", async () => {
    const userId = await insertUser("trial");
    await withTx((tx) => activateTrial(tx, userId));
    const cancelled = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.game_rooms (game_code, host_id, join_code, visibility, status)
       VALUES ('chess', $1, $2, 'private', 'cancelled') RETURNING id`,
      [userId, crypto.randomUUID().slice(0, 8)],
    );
    const skipped = await withTx((tx) => startMatch(tx, cancelled.rows[0].id, "start"));
    expect(skipped).toMatchObject({ charged: false, reason: "cancelled" });
    for (let i = 0; i < 3; i += 1) {
      const room = await getPool().query<{ id: string }>(
        `INSERT INTO vibez.game_rooms (game_code, host_id, join_code, visibility, status)
         VALUES ('chess', $1, $2, 'private', 'ready') RETURNING id`,
        [userId, crypto.randomUUID().slice(0, 8)],
      );
      const result = await withTx((tx) => startMatch(tx, room.rows[0].id, "start"));
      expect(result).toMatchObject({ kind: "free" });
    }
    const fourth = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.game_rooms (game_code, host_id, join_code, visibility, status)
       VALUES ('chess', $1, $2, 'private', 'ready') RETURNING id`,
      [userId, crypto.randomUUID().slice(0, 8)],
    );
    await expect(withTx((tx) => startMatch(tx, fourth.rows[0].id, "start"))).rejects.toThrow(/credits/);
    expect(await balance(userId)).toBe(0);
  });

  it("signs up, verifies, and logs in against the ledger balance", async () => {
    const sender = {
      async send() {
        return { delivered: false, error: "test sink" };
      },
    };
    const email = `signup-${crypto.randomUUID()}@example.test`;
    const created = await signUp(
      getPool(),
      sender,
      { email, password: "correct horse battery", displayName: "Ada Okonkwo", username: `ada${crypto.randomUUID().slice(0, 6)}` },
      "http://localhost:8081",
      "127.0.0.1",
    );
    expect(created.verificationPath).toContain("token=");
    const token = new URL(`http://localhost${created.verificationPath}`).searchParams.get("token");
    await verifyEmail(getPool(), token!);
    const session = await login(getPool(), { email, password: "correct horse battery" }, "127.0.0.1", "vitest");
    const user = await currentUser(getPool(), session.token);
    expect(user?.email).toBe(email);
    expect(user?.balanceKobo).toBe(0);
    expect(user?.roles).toContain("member");
    expect(readToken(new Request("http://localhost", { headers: { cookie: `vibez_session=${session.token}` } }))).toBe(
      session.token,
    );
    const checkout = await createTopup(
      getPool(),
      { userId: user!.id, email, name: "Ada Okonkwo", bundleCode: "ngn_500", origin: "http://localhost:8081" },
      paidClient(),
    );
    expect(checkout.checkoutUrl).toContain("https://checkout.bachs.io/");
  });

  it("sends a fresh verification link when the first email was not delivered", async () => {
    const email = `resend-${crypto.randomUUID()}@example.test`;
    const sender = { async send() { return { delivered: false, error: "test sink" }; } };
    await signUp(
      getPool(),
      sender,
      { email, password: "correct horse battery", displayName: "Resend User", username: `re${crypto.randomUUID().slice(0, 8)}` },
      "http://localhost:8081",
      "127.0.0.1",
    );
    const again = await resendVerification(getPool(), sender, email, "http://localhost:8081", "127.0.0.2");
    expect(again.verificationPath).toContain("token=");
    const token = new URL(`http://localhost${again.verificationPath}`).searchParams.get("token");
    expect((await verifyEmail(getPool(), token!)).ok).toBe(true);
  });

  it("does not deliver mail when Resend is not configured", async () => {
    const result = await createEmailSender({}) .send({ to: "a@b.co", subject: "Hi", text: "Hi" });
    expect(result.delivered).toBe(false);
    expect(result.error).toBe("Email delivery is not configured.");
    expect(result.error).not.toMatch(/RESEND|EMAIL_FROM/);
  });
});
