import { fail, json, secureRequest } from "@/server/http";
import { getPool } from "@/server/db";
import { logout, readToken, sessionCookie } from "@/server/auth/service";

export async function POST(request: Request) {
  try {
    await logout(getPool(), readToken(request));
    return json({ ok: true }, 200, {
      "set-cookie": sessionCookie("", 0, secureRequest(request)),
    });
  } catch (error) {
    return fail(error);
  }
}
