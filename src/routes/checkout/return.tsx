import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { verifyPayment } from "@/lib/platform.functions";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>) => ({
    reference: typeof search.reference === "string" ? search.reference : "",
  }),
  component: ReturnPage,
});

function ReturnPage() {
  const { reference } = Route.useSearch();
  const [message, setMessage] = useState("Checking your payment…");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!reference) {
      setMessage("Missing payment reference.");
      return;
    }
    verifyPayment({ data: { reference } })
      .then((result) => {
        if (result.ok) {
          setOk(true);
          setMessage(result.already ? "This payment was already confirmed. Your tickets are unchanged." : "Payment confirmed. Your tickets are ready.");
        } else {
          setMessage(result.error);
        }
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not verify the payment."));
  }, [reference]);

  return (
    <AppFrame>
      <div className="empty">
        <h2>{ok ? "You're in" : "Payment"}</h2>
        <p>{message}</p>
        {ok ? <Link className="btn" to="/tickets">View tickets</Link> : <Link className="btn ghost" to="/events">Back to events</Link>}
      </div>
    </AppFrame>
  );
}
