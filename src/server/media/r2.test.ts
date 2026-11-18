import { describe, expect, it } from "vitest";
import { r2UnavailableMessage, readR2Config } from "./r2";

describe("r2 config", () => {
  it("stays unconfigured until every variable is present", () => {
    expect(readR2Config({})).toBeNull();
    expect(r2UnavailableMessage()).toContain("R2_BUCKET");
    expect(
      readR2Config({
        R2_ACCOUNT_ID: "a",
        R2_ACCESS_KEY_ID: "b",
        R2_SECRET_ACCESS_KEY: "c",
        R2_BUCKET: "d",
        R2_PUBLIC_URL: "https://cdn.example",
      })?.bucket,
    ).toBe("d");
  });
});
