import { fail, json, clientIp, secureRequest } from "@/server/http";
import { getPool } from "@/server/db";
import { createEmailSender } from "@/server/email";
import { assertSameOrigin, publicOrigin, sessionCookie, signUp } from "@/server/auth/service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await request.json();
    const result = await signUp(getPool(), createEmailSender(), body, publicOrigin(request), clientIp(request));
    return json(result);
  } catch (error) {
    return fail(error);
  }
}

export { secureRequest, sessionCookie };
