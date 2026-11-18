import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decodeJwt } from "jose";
import { buildAppleClientSecret, handoff } from "./oauth";

describe("oauth handoff", () => {
  it("returns the session token to the native app", () => {
    const response = handoff(new Request("https://vibez.ng/api/auth/google/callback"), { token: "native-token", maxAge: 60 }, true);
    expect(response.headers.get("location")).toBe("vibez://auth?token=native-token");
  });

  it("sets the browser cookie and sends the web app home", () => {
    const response = handoff(new Request("https://vibez.ng/api/auth/google/callback"), { token: "web-token", maxAge: 60 }, false);
    expect(response.headers.get("location")).toBe("/home");
    expect(response.headers.get("set-cookie")).toContain("vibez_session=");
  });
});

describe("Apple client secret", () => {
  it("signs a short-lived ES256 client secret", async () => {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const jwt = await buildAppleClientSecret({
      APPLE_TEAM_ID: "TEAMID",
      APPLE_CLIENT_ID: "ng.vibez.app",
      APPLE_KEY_ID: "KEYID",
      APPLE_PRIVATE_KEY: pem,
    });
    const payload = decodeJwt(jwt);
    expect(payload.iss).toBe("TEAMID");
    expect(payload.sub).toBe("ng.vibez.app");
    expect(payload.aud).toBe("https://appleid.apple.com");
  });
});
