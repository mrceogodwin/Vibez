import { ROOM_FEE_KOBO } from "../money";

export type RoomStatus = "waiting" | "ready" | "starting" | "active" | "completed" | "cancelled";

export type ChargeDecision =
  | { action: "none"; reason: "not_a_start" | "cancelled" | "already_finished" | "already_charged" }
  | { action: "free" }
  | { action: "debit"; amountKobo: number }
  | { action: "reject"; reason: "insufficient_balance" | "bad_status" };

export function decideRoomCharge(input: {
  roomStatus: RoomStatus;
  intent: "start" | "reconnect" | "resume";
  alreadyCharged: boolean;
  trial: { expiresAt: Date; freeRemaining: number } | null;
  balanceKobo: number;
  now: Date;
}): ChargeDecision {
  if (input.intent !== "start") return { action: "none", reason: "not_a_start" };
  if (input.roomStatus === "cancelled") return { action: "none", reason: "cancelled" };
  if (input.roomStatus === "active" || input.roomStatus === "completed") {
    return { action: "none", reason: "already_finished" };
  }
  if (input.alreadyCharged) return { action: "none", reason: "already_charged" };
  if (input.roomStatus !== "waiting" && input.roomStatus !== "ready" && input.roomStatus !== "starting") {
    return { action: "reject", reason: "bad_status" };
  }
  const trialUsable =
    input.trial !== null && input.trial.expiresAt.getTime() > input.now.getTime() && input.trial.freeRemaining > 0;
  if (trialUsable) return { action: "free" };
  if (input.balanceKobo < ROOM_FEE_KOBO) return { action: "reject", reason: "insufficient_balance" };
  return { action: "debit", amountKobo: ROOM_FEE_KOBO };
}
