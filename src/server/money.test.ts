import { describe, expect, it } from "vitest";
import { formatNaira, koboToNairaString, nairaStringToKobo, ROOM_FEE_KOBO, PLUS_PRICE_KOBO } from "./money";

describe("money", () => {
  it("converts the locked prices exactly", () => {
    expect(koboToNairaString(ROOM_FEE_KOBO)).toBe("10.00");
    expect(koboToNairaString(PLUS_PRICE_KOBO)).toBe("2000.00");
    expect(nairaStringToKobo("500.00")).toBe(50_000);
    expect(nairaStringToKobo("2000.00")).toBe(PLUS_PRICE_KOBO);
  });

  it("rejects amounts that are not 2-decimal strings", () => {
    expect(() => nairaStringToKobo("10")).toThrow();
    expect(() => nairaStringToKobo("10.001")).toThrow();
    expect(() => nairaStringToKobo("10.0")).toThrow();
  });

  it("formats naira for display", () => {
    expect(formatNaira(200_000)).toBe("₦2,000");
    expect(formatNaira(1050)).toBe("₦10.50");
    expect(formatNaira(-1000)).toBe("-₦10");
  });
});
