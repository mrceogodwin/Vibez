import assert from "node:assert/strict";
import test from "node:test";
import {
  decideFulfillment,
  feeKobo,
  inventoryFits,
  paystackSignature,
  signaturesMatch,
} from "./pay.ts";

test("fee uses the configured basis points", () => {
  assert.equal(feeKobo(10_000_00, 500), 50_000);
  assert.equal(feeKobo(100, 0), 0);
});

test("paystack signatures must match the raw body", () => {
  const sig = paystackSignature("secret", '{"event":"charge.success"}');
  assert.equal(signaturesMatch(sig, sig), true);
  assert.equal(signaturesMatch(sig, paystackSignature("other", '{"event":"charge.success"}')), false);
  assert.equal(signaturesMatch(sig, ""), false);
});

test("tickets are issued once, only for a verified amount", () => {
  assert.equal(
    decideFulfillment({
      orderStatus: "pending",
      providerStatus: "success",
      paidAmountKobo: 1500,
      expectedAmountKobo: 1500,
      alreadyHasTickets: false,
    }),
    "issue",
  );
  assert.equal(
    decideFulfillment({
      orderStatus: "paid",
      providerStatus: "success",
      paidAmountKobo: 1500,
      expectedAmountKobo: 1500,
      alreadyHasTickets: true,
    }),
    "already",
  );
  assert.equal(
    decideFulfillment({
      orderStatus: "pending",
      providerStatus: "success",
      paidAmountKobo: 100,
      expectedAmountKobo: 1500,
      alreadyHasTickets: false,
    }),
    "reject",
  );
  assert.equal(
    decideFulfillment({
      orderStatus: "pending",
      providerStatus: "abandoned",
      paidAmountKobo: null,
      expectedAmountKobo: 1500,
      alreadyHasTickets: false,
    }),
    "reject",
  );
});

test("inventory cannot be oversold", () => {
  assert.equal(inventoryFits(8, 10, 2), true);
  assert.equal(inventoryFits(8, 10, 3), false);
  assert.equal(inventoryFits(0, 1, 0), false);
});
