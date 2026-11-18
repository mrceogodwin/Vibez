import { json } from "@/server/http";
import { getPool } from "@/server/db";
import { currentUser, readToken } from "@/server/auth/service";
import { formatNaira, creditsFromKobo } from "@/server/money";

export async function GET(request: Request) {
  const user = await currentUser(getPool(), readToken(request));
  if (!user) return json({ user: null });
  return json({
    user: {
      ...user,
      balanceLabel: formatNaira(user.balanceKobo),
      credits: creditsFromKobo(user.balanceKobo),
    },
  });
}
