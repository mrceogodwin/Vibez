import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { requireUser } from "@/server/auth/service";
import { joinCommunity } from "@/server/communities";

export async function POST(request: Request) {
  try {
    const user = await requireUser(getPool(), request);
    const body = await request.json();
    return json(await joinCommunity(getPool(), user.id, body));
  } catch (error) {
    return fail(error);
  }
}
