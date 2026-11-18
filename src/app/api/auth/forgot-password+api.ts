import { fail, json, clientIp } from "@/server/http";
import { getPool } from "@/server/db";
import { createEmailSender } from "@/server/email";
import { assertSameOrigin, publicOrigin, requestPasswordReset } from "@/server/auth/service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json()) as { email?: string };
    return json(
      await requestPasswordReset(getPool(), createEmailSender(), body.email || "", publicOrigin(request), clientIp(request)),
    );
  } catch (error) {
    return fail(error);
  }
}
