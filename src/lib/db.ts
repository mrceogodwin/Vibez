import "server-only";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.VIBEZ_DATABASE_URL || process.env.DATABASE_URL;

export function getDb() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return neon(connectionString);
}
