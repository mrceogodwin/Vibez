import { fail } from "@/server/http";
import { finishApple } from "@/server/auth/oauth";

export async function GET(request: Request) {
  try {
    return await finishApple(request);
  } catch (error) {
    return fail(error);
  }
}
