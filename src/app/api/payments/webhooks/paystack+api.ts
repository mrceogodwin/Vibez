import { json } from "@/server/http";
import { verifyPaystackSignature } from "@/server/payments/signature";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!secret) {
    return json(
      { error: { code: "not_configured", message: "This payment provider is not active." } },
      503,
    );
  }
  const raw = await request.text();
  if (!verifyPaystackSignature(raw, request.headers.get("x-paystack-signature"), secret)) {
    return json({ error: { code: "invalid_signature", message: "Webhook signature was rejected." } }, 400);
  }
  return json(
    {
      error: {
        code: "not_selected",
        message: "The signature is valid, but Paystack is not the active provider. Vibez will not credit a wallet from this webhook.",
      },
    },
    501,
  );
}
