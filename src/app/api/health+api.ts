import { json } from "@/server/http";
import { getPool } from "@/server/db";
import { paymentAvailability } from "@/server/payments/bachs";

export async function GET() {
  try {
    const tables = await getPool().query<{ n: number }>(
      "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'vibez' AND table_type = 'BASE TABLE'",
    );
    return json({
      ok: true,
      service: "vibez",
      schema: "vibez",
      tables: tables.rows[0]?.n ?? 0,
      payments: paymentAvailability().status,
    });
  } catch {
    return json({ ok: false, service: "vibez", error: "database_unavailable" }, 503);
  }
}
