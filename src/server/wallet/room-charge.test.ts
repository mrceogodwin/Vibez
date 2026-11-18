import { describe, expect, it } from "vitest";
import { ROOM_FEE_KOBO } from "../money";
import { decideRoomCharge } from "./room-charge";

const now = new Date("2026-11-18T12:00:00Z");
const base = {
  roomStatus: "ready" as const,
  intent: "start" as const,
  alreadyCharged: false,
  trial: null,
  balanceKobo: 5_000,
  now,
};

describe("room charge decisions", () => {
  it("does not charge a room cancelled before start", () => {
    expect(decideRoomCharge({ ...base, roomStatus: "cancelled" }).action).toBe("none");
  });

  it("does not charge a reconnect or a resume", () => {
    expect(decideRoomCharge({ ...base, intent: "reconnect" })).toMatchObject({ reason: "not_a_start" });
    expect(decideRoomCharge({ ...base, intent: "resume" })).toMatchObject({ reason: "not_a_start" });
  });

  it("does not charge a room that already started or was already charged", () => {
    expect(decideRoomCharge({ ...base, roomStatus: "active" })).toMatchObject({ reason: "already_finished" });
    expect(decideRoomCharge({ ...base, alreadyCharged: true })).toMatchObject({ reason: "already_charged" });
  });

  it("uses a free start only inside the window", () => {
    const trial = { expiresAt: new Date("2026-12-01T00:00:00Z"), freeRemaining: 2 };
    expect(decideRoomCharge({ ...base, trial, balanceKobo: 0 })).toEqual({ action: "free" });
    expect(decideRoomCharge({ ...base, trial: { ...trial, freeRemaining: 0 } })).toEqual({
      action: "debit",
      amountKobo: ROOM_FEE_KOBO,
    });
    expect(
      decideRoomCharge({
        ...base,
        balanceKobo: 0,
        trial: { expiresAt: new Date("2026-11-01T00:00:00Z"), freeRemaining: 3 },
      }),
    ).toEqual({ action: "reject", reason: "insufficient_balance" });
  });

  it("debits exactly 1000 kobo when the trial is not usable", () => {
    expect(decideRoomCharge(base)).toEqual({ action: "debit", amountKobo: 1000 });
    expect(decideRoomCharge({ ...base, balanceKobo: 999 })).toEqual({
      action: "reject",
      reason: "insufficient_balance",
    });
  });
});
