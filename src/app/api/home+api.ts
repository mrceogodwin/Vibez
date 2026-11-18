import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { loadHome } from "@/server/home";
import { currentUser, readToken } from "@/server/auth/service";

export async function GET(request: Request) {
  try {
    const filter = new URL(request.url).searchParams.get("filter") || "for_you";
    const viewer = await currentUser(getPool(), readToken(request));
    return json(await loadHome(getPool(), filter, viewer?.id ?? null));
  } catch (error) {
    return fail(error);
  }
}
