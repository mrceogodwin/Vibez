import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { verifyEmail } from "@/server/auth/service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    return json(await verifyEmail(getPool(), body.token || ""));
  } catch (error) {
    return fail(error);
  }
}
