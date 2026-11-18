import { ZodError } from "zod";
import { HttpError } from "./auth/rbac";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers });
}

export function fail(error: unknown) {
  if (error instanceof HttpError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }
  if (error instanceof ZodError) {
    return json({ error: { code: "invalid", message: error.issues[0]?.message ?? "Check the form and try again." } }, 400);
  }
  console.error(error);
  return json({ error: { code: "server", message: "Something went wrong." } }, 500);
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
}

export function secureRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return proto === "https" || new URL(request.url).protocol === "https:";
}
