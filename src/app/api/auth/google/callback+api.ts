import { fail, secureRequest } from "@/server/http";
import { finishGoogle } from "@/server/auth/oauth";
import { sessionCookie } from "@/server/auth/service";

export async function GET(request: Request) {
  try {
    const session = await finishGoogle(request);
    if (session instanceof Response) return session;
    return new Response(null, {
      status: 302,
      headers: {
        location: "/home",
        "set-cookie": sessionCookie(session.token, session.maxAge, secureRequest(request)),
      },
    });
  } catch (error) {
    return fail(error);
  }
}
