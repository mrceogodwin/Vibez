import { describe, expect, it } from "vitest";
import { assertCanGrantRole, emailOnAllowlist, HttpError } from "./rbac";

describe("rbac", () => {
  const admin = { id: "admin", permissions: ["staff.manage"] };
  const staff = { id: "staff", permissions: ["payments.review"] };

  it("stops a person granting a role to themselves", () => {
    expect(() => assertCanGrantRole(admin, "admin", "moderator")).toThrow(HttpError);
  });

  it("stops staff without staff.manage from granting anything", () => {
    expect(() => assertCanGrantRole(staff, "other", "finance")).toThrow(HttpError);
  });

  it("stops even a super admin from granting super_admin through this function", () => {
    expect(() => assertCanGrantRole(admin, "other", "super_admin")).toThrow(HttpError);
  });

  it("allows a super admin to grant an ordinary staff role to someone else", () => {
    expect(() => assertCanGrantRole(admin, "other", "finance")).not.toThrow();
  });

  it("matches the super admin allowlist case-insensitively", () => {
    expect(emailOnAllowlist("Ada@Vibez.ng", "ada@vibez.ng, other@vibez.ng")).toBe(true);
    expect(emailOnAllowlist("nope@vibez.ng", "ada@vibez.ng")).toBe(false);
    expect(emailOnAllowlist("ada@vibez.ng", undefined)).toBe(false);
  });
});
