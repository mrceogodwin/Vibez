import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { requireUser } from "@/server/auth/service";
import { creditsFromKobo, formatNaira } from "@/server/money";

export async function GET(request: Request) {
  try {
    const user = await requireUser(getPool(), request);
    const bundles = await getPool().query(
      "SELECT code, amount_kobo, credits, bonus_credits FROM vibez.credit_bundles WHERE active ORDER BY sort_order",
    );
    const entries = await getPool().query(
      `SELECT id, amount_kobo, entry_type, reason, created_at
       FROM vibez.wallet_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
      [user.id],
    );
    const live = process.env.BACHS_SECRET_KEY?.startsWith("sk_live_") === true;
    const allowed = process.env.VERCEL_ENV === "production" || process.env.BACHS_ALLOW_LIVE === "true";
    return json({
      balanceKobo: user.balanceKobo,
      balanceLabel: formatNaira(user.balanceKobo),
      credits: creditsFromKobo(user.balanceKobo),
      plusUntil: user.plusUntil,
      bundles: bundles.rows,
      entries: entries.rows,
      payments: !process.env.BACHS_SECRET_KEY
        ? { enabled: false, message: "Bachs is not configured. Set BACHS_SECRET_KEY." }
        : live && !allowed
          ? { enabled: false, message: "Live Bachs charges are disabled outside production." }
          : { enabled: true, message: "Payments are confirmed by Bachs on the server, not by this page." },
    });
  } catch (error) {
    return fail(error);
  }
}
