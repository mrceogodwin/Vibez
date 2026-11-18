import { describe, expect, it } from "vitest";
import { hashPassword, sha256, verifyPassword } from "./password";

describe("password", () => {
  it("verifies the same password and rejects a different one", async () => {
    const hash = await hashPassword("correct horse battery", "pepper");
    expect(await verifyPassword("correct horse battery", hash, "pepper")).toBe(true);
    expect(await verifyPassword("correct horse battery", hash, "other")).toBe(false);
    expect(await verifyPassword("wrong", hash, "pepper")).toBe(false);
  });

  it("hashes tokens the same way twice", () => {
    expect(sha256("abc")).toBe(sha256("abc"));
    expect(sha256("abc")).not.toBe(sha256("abd"));
  });
});
