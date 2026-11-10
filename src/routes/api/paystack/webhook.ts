import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { webhookTrusted, fulfillReference } = await import("@/lib/platform/data.server");
        const trusted = webhookTrusted(raw, request.headers.get("x-paystack-signature"));
        if (!trusted.ok) {
          return new Response(trusted.error, { status: trusted.error.includes("not configured") ? 503 : 401 });
        }
        let reference = "";
        try {
          const body = JSON.parse(raw) as { data?: { reference?: string } };
          reference = body.data?.reference ?? "";
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!reference) return new Response("Missing reference", { status: 400 });
        const result = await fulfillReference(reference);
        return Response.json(result);
      },
    },
  },
});
