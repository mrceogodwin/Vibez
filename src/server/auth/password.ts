import { randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from "node:crypto";

function scrypt(password: string, salt: Buffer, keyLen: number, options: { N: number; r: number; p: number }) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCb(password, salt, keyLen, options, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

const N = 16384;
const r = 8;
const p = 1;
const keyLen = 32;

export async function hashPassword(password: string, pepper: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(`${password}${pepper}`, salt, keyLen, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string, pepper: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, rr, pp, salt, hash] = parts;
  const key = await scrypt(`${password}${pepper}`, Buffer.from(salt, "base64url"), keyLen, {
    N: Number(n),
    r: Number(rr),
    p: Number(pp),
  });
  const expected = Buffer.from(hash, "base64url");
  if (expected.length !== key.length) return false;
  return timingSafeEqual(expected, key);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}
