import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { assertSameOrigin, resetPassword } from "@/server/auth/service";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = (await request.json()) as { token?: string; password?: string };
    return json(await resetPassword(getPool(), body.token || "", body.password || ""));
  } catch (error) {
    return fail(error);
  }
}
