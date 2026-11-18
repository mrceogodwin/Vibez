import { beginOAuth } from "@/server/auth/oauth";

export function GET(request: Request) {
  return beginOAuth("google", request);
}
