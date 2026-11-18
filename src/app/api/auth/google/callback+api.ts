import { fail } from "@/server/http";
import { finishGoogle } from "@/server/auth/oauth";

export async function GET(request: Request) {
  try {
    const result = await finishGoogle(request);
    return result;
  } catch (error) {
    return fail(error);
  }
}
