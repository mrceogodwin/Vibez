import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { loadHome } from "@/server/home";

export async function GET(request: Request) {
  try {
    const filter = new URL(request.url).searchParams.get("filter") || "for_you";
    return json(await loadHome(getPool(), filter));
  } catch (error) {
    return fail(error);
  }
}
