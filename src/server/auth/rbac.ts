export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function assertCanGrantRole(
  actor: { id: string; permissions: readonly string[] },
  targetUserId: string,
  role: string,
): void {
  if (actor.id === targetUserId) {
    throw new HttpError(403, "self_grant", "You cannot change your own roles.");
  }
  if (role === "super_admin" || !actor.permissions.includes("staff.manage")) {
    throw new HttpError(403, "forbidden", "You cannot grant that role.");
  }
}

export function emailOnAllowlist(email: string, raw: string | undefined): boolean {
  if (!raw) return false;
  const wanted = email.trim().toLowerCase();
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(wanted);
}
