import { describe, expect, it } from "vitest";
import { memberLabel } from "./editorial";

describe("memberLabel", () => {
  it("uses the real count", () => {
    expect(memberLabel(0)).toBe("0 members");
    expect(memberLabel(1)).toBe("1 member");
    expect(memberLabel(24500)).toBe("24,500 members");
  });
});
