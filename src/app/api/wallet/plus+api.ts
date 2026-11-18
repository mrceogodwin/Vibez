import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { assertSameOrigin, publicOrigin, requireUser } from "@/server/auth/service";
import { assertLiveChargeAllowed, bachsClient } from "@/server/payments/bachs";
import { createPlusCheckout } from "@/server/payments/orders";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(getPool(), request);
    const secret = process.env.BACHS_SECRET_KEY ?? "";
    assertLiveChargeAllowed(secret);
    const result = await createPlusCheckout(
      getPool(),
      { userId: user.id, email: user.email, name: user.displayName, origin: publicOrigin(request) },
      bachsClient(secret),
    );
    return json(result);
  } catch (error) {
    return fail(error);
  }
}
