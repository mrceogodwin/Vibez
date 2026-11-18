import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 300;

export type SignatureResult = { ok: true; timestamp: number } | { ok: false; reason: string };

function digest(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

export function verifyBachsSignature(
  rawBody: string,
  headers: { get(name: string): string | null },
  secret: string,
  nowMs = Date.now(),
): SignatureResult {
  if (!secret) return { ok: false, reason: "missing_secret" };
  const v2 = headers.get("x-bachs-signature-v2");
  const v1 = headers.get("x-bachs-signature");
  const timestampHeader = headers.get("x-bachs-timestamp");

  let timestamp = timestampHeader ?? "";
  const signatures: string[] = [];
  if (v2) {
    const parts = v2.split(",").map((part) => part.split("="));
    for (const [key, value] of parts) {
      if (key === "t" && value) timestamp = value;
      if (key === "v1" && value) signatures.push(value);
    }
  } else if (v1) {
    signatures.push(v1);
  }

  if (!timestamp || signatures.length === 0) return { ok: false, reason: "missing_signature" };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "bad_timestamp" };
  if (Math.abs(nowMs / 1000 - ts) > TOLERANCE_SECONDS) return { ok: false, reason: "stale" };

  const expected = digest(secret, timestamp, rawBody);
  if (!signatures.some((signature) => safeEqualHex(expected, signature))) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true, timestamp: ts };
}

export function signBachsBody(secret: string, rawBody: string, timestamp: number): { v1: string; v2: string } {
  const v1 = digest(secret, String(timestamp), rawBody);
  return { v1, v2: `t=${timestamp},v1=${v1}` };
}

export function verifyPaystackSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, header);
}
