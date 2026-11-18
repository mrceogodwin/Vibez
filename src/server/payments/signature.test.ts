import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signBachsBody, verifyBachsSignature, verifyPaystackSignature } from "./signature";

const secret = "whsec_test";
const body = JSON.stringify({ id: "evt_1", type: "collection.succeeded" });

describe("Bachs signatures", () => {
  it("accepts a current V2 signature and a second v1 during rotation", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const { v1 } = signBachsBody(secret, body, timestamp);
    const header = `t=${timestamp},v1=deadbeef,v1=${v1}`;
    expect(verifyBachsSignature(body, new Headers({ "x-bachs-signature-v2": header }), secret).ok).toBe(true);
  });

  it("rejects a forged signature", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const result = verifyBachsSignature(
      body,
      new Headers({ "x-bachs-signature-v2": `t=${timestamp},v1=${"ab".repeat(32)}` }),
      secret,
    );
    expect(result).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a stale delivery", () => {
    const timestamp = Math.floor(Date.now() / 1000) - 600;
    const { v2 } = signBachsBody(secret, body, timestamp);
    const result = verifyBachsSignature(body, new Headers({ "x-bachs-signature-v2": v2 }), secret);
    expect(result).toEqual({ ok: false, reason: "stale" });
  });

  it("accepts the legacy header when V2 is absent", () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const { v1 } = signBachsBody(secret, body, timestamp);
    const result = verifyBachsSignature(
      body,
      new Headers({ "x-bachs-signature": v1, "x-bachs-timestamp": String(timestamp) }),
      secret,
    );
    expect(result.ok).toBe(true);
  });
});

describe("Paystack signatures", () => {
  it("checks the sha512 header", () => {
    const header = createHmac("sha512", "psk").update(body).digest("hex");
    expect(verifyPaystackSignature(body, header, "psk")).toBe(true);
    expect(verifyPaystackSignature(body, header, "other")).toBe(false);
  });
});
