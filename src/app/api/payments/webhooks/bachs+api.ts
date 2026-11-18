import { fail, json } from "@/server/http";
import { bachsClient } from "@/server/payments/bachs";
import { handleBachsWebhook } from "@/server/payments/orders";

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.BACHS_WEBHOOK_SECRET ?? "";
  if (!secret) {
    console.error("webhook_unavailable provider=bachs reason=missing_signing_secret");
    return json({ error: { code: "not_configured", message: "Webhook is not ready." } }, 500);
  }
  try {
    const key = process.env.BACHS_SECRET_KEY ?? "";
    const result = await handleBachsWebhook(raw, request.headers, { secret, client: bachsClient(key) });
    if (result.status === 400) {
      return json({ error: { code: "invalid_signature", message: "Webhook signature was rejected." } }, 400);
    }
    return json({ outcome: result.outcome }, result.status);
  } catch (error) {
    return fail(error);
  }
}
