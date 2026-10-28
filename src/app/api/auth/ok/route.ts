import { NextResponse } from "next/server";

export function GET() {
  const configured = Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
  return NextResponse.json(
    { status: configured ? "configured" : "setup_required", provider: "Better Auth + Neon" },
    { status: configured ? 200 : 503 },
  );
}
