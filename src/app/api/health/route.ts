import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();
    await sql`SELECT 1 AS ok`;
    return NextResponse.json({ status: "ok", database: "connected" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503 },
    );
  }
}
