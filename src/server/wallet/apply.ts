import type { Db } from "../db";
import { HttpError } from "../auth/rbac";
import { ROOM_FEE_KOBO } from "../money";
import { decideRoomCharge } from "./room-charge";

type RoomRow = {
  id: string;
  host_id: string;
  status: "waiting" | "ready" | "starting" | "active" | "completed" | "cancelled";
};

async function lockRoom(db: Db, roomId: string): Promise<RoomRow> {
  const result = await db.query<RoomRow>("SELECT id, host_id, status FROM vibez.game_rooms WHERE id = $1 FOR UPDATE", [
    roomId,
  ]);
  const room = result.rows[0];
  if (!room) throw new HttpError(404, "not_found", "Game room not found.");
  return room;
}

export async function startMatch(db: Db, roomId: string, intent: "start" | "reconnect" | "resume") {
  const room = await lockRoom(db, roomId);
  await db.query("INSERT INTO vibez.wallets (user_id) VALUES ($1) ON CONFLICT DO NOTHING", [room.host_id]);
  await db.query("SELECT user_id FROM vibez.wallets WHERE user_id = $1 FOR UPDATE", [room.host_id]);
  const charged = await db.query("SELECT id FROM vibez.room_charges WHERE room_id = $1", [roomId]);
  const trial = await db.query<{ expires_at: Date; free_starts_granted: number; free_starts_used: number }>(
    "SELECT expires_at, free_starts_granted, free_starts_used FROM vibez.game_trials WHERE user_id = $1 FOR UPDATE",
    [room.host_id],
  );
  const balance = await db.query<{ balance: string }>("SELECT vibez.wallet_balance($1) AS balance", [room.host_id]);
  const trialRow = trial.rows[0];
  const decision = decideRoomCharge({
    roomStatus: room.status,
    intent,
    alreadyCharged: (charged.rowCount ?? 0) > 0,
    trial: trialRow
      ? {
          expiresAt: new Date(trialRow.expires_at),
          freeRemaining: trialRow.free_starts_granted - trialRow.free_starts_used,
        }
      : null,
    balanceKobo: Number(balance.rows[0]?.balance ?? 0),
    now: new Date(),
  });
  if (decision.action === "reject") {
    throw new HttpError(
      402,
      decision.reason,
      decision.reason === "insufficient_balance"
        ? "The room creator does not have enough credits to start this match."
        : "This room cannot be started.",
    );
  }
  if (decision.action === "none") return { charged: false, reason: decision.reason };
  if (decision.action === "free") {
    await db.query("UPDATE vibez.game_trials SET free_starts_used = free_starts_used + 1 WHERE user_id = $1", [
      room.host_id,
    ]);
    await db.query(
      "INSERT INTO vibez.room_charges (room_id, user_id, kind, amount_kobo) VALUES ($1, $2, 'free_trial', 0)",
      [roomId, room.host_id],
    );
  } else {
    const ledger = await db.query<{ id: string }>(
      `INSERT INTO vibez.wallet_ledger
        (user_id, amount_kobo, entry_type, reference, idempotency_key, related_type, related_id, reason)
       VALUES ($1, $2, 'game_room_fee', $3, $4, 'game_room', $5, 'Game room start fee')
       RETURNING id`,
      [room.host_id, -ROOM_FEE_KOBO, `room:${roomId}`, `room-fee:${roomId}`, roomId],
    );
    await db.query(
      "INSERT INTO vibez.room_charges (room_id, user_id, kind, amount_kobo, ledger_entry_id) VALUES ($1, $2, 'paid', $3, $4)",
      [roomId, room.host_id, ROOM_FEE_KOBO, ledger.rows[0].id],
    );
  }
  await db.query("UPDATE vibez.game_rooms SET status = 'active', started_at = now() WHERE id = $1", [roomId]);
  return { charged: true, kind: decision.action };
}

export async function reverseRoomCharge(db: Db, roomId: string, reason: string) {
  const charge = await db.query<{
    id: string;
    user_id: string;
    kind: string;
    amount_kobo: string;
    ledger_entry_id: string | null;
  }>("SELECT id, user_id, kind, amount_kobo, ledger_entry_id FROM vibez.room_charges WHERE room_id = $1 FOR UPDATE", [
    roomId,
  ]);
  const row = charge.rows[0];
  if (!row) return { reversed: false, reason: "no_charge" };
  const existing = await db.query("SELECT 1 FROM vibez.room_charge_reversals WHERE room_charge_id = $1", [row.id]);
  if ((existing.rowCount ?? 0) > 0) return { reversed: false, reason: "already_reversed" };
  let ledgerId: string | null = null;
  if (row.kind === "paid") {
    const ledger = await db.query<{ id: string }>(
      `INSERT INTO vibez.wallet_ledger
        (user_id, amount_kobo, entry_type, reference, idempotency_key, related_type, related_id, reason)
       VALUES ($1, $2, 'reversal', $3, $4, 'room_charge', $5, $6)
       RETURNING id`,
      [row.user_id, Number(row.amount_kobo), `reverse:${row.id}`, `room-reversal:${row.id}`, row.id, reason],
    );
    ledgerId = ledger.rows[0].id;
  } else {
    await db.query(
      `UPDATE vibez.game_trials
       SET free_starts_used = GREATEST(free_starts_used - 1, 0)
       WHERE user_id = $1 AND expires_at > now()`,
      [row.user_id],
    );
  }
  await db.query(
    "INSERT INTO vibez.room_charge_reversals (room_charge_id, ledger_entry_id, reason) VALUES ($1, $2, $3)",
    [row.id, ledgerId, reason],
  );
  await db.query(
    "UPDATE vibez.game_rooms SET status = 'cancelled', cancelled_at = now() WHERE id = $1 AND status = 'active'",
    [roomId],
  );
  return { reversed: true };
}

export async function activateTrial(db: Db, userId: string) {
  const existing = await db.query("SELECT user_id, expires_at, free_starts_granted, free_starts_used FROM vibez.game_trials WHERE user_id = $1", [
    userId,
  ]);
  if ((existing.rowCount ?? 0) > 0) return existing.rows[0];
  const created = await db.query(
    `INSERT INTO vibez.game_trials (user_id, activated_at, expires_at, free_starts_granted)
     VALUES ($1, now(), now() + interval '30 days', 3)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING user_id, expires_at, free_starts_granted, free_starts_used`,
    [userId],
  );
  return created.rows[0] ?? existing.rows[0];
}
