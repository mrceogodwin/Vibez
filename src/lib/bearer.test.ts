import { describe, expect, it } from "vitest";
import { bearerHeader } from "./bearer";

describe("bearer header", () => {
  it("formats a stored native token and ignores an empty one", () => {
    expect(bearerHeader("abc")).toBe("Bearer abc");
    expect(bearerHeader(null)).toBeNull();
    expect(bearerHeader("")).toBeNull();
  });
});
