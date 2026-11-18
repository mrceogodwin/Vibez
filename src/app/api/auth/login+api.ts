import { fail, json, clientIp, secureRequest } from "@/server/http";
import { getPool } from "@/server/db";
import { assertSameOrigin, login, sessionCookie } from "@/server/auth/service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await login(getPool(), await request.json(), clientIp(request), request.headers.get("user-agent") || "");
    const native = request.headers.get("x-vibez-client") === "native";
    return json({ ok: true, token: native ? session.token : undefined }, 200, {
      "set-cookie": sessionCookie(session.token, session.maxAge, secureRequest(request)),
    });
  } catch (error) {
    return fail(error);
  }
}
