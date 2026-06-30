import assert from "node:assert/strict";
import test from "node:test";

import { getCheckoutEntitlement, getInvoiceEntitlement } from "../src/lib/billing-entitlements.ts";

const env = {
  STRIPE_PRICE_QUICK_FIX: "price_quick",
  STRIPE_PRICE_VOICE_AUDIT: "price_voice",
  STRIPE_PRICE_MONTHLY_AUDIT: "price_monthly",
};

test("one-time checkout grants credits immediately", () => {
  assert.deepEqual(getCheckoutEntitlement("price_quick", 1, env), {
    credits: 3,
    enablesVoiceProfile: false,
    reason: "purchase_quick_fix",
  });
});

test("Voice Audit checkout grants credits and Voice Profile access", () => {
  assert.deepEqual(getCheckoutEntitlement("price_voice", 1, env), {
    credits: 10,
    enablesVoiceProfile: true,
    reason: "purchase_voice_audit",
  });
});

test("monthly checkout waits for invoice.paid to grant credits", () => {
  assert.equal(getCheckoutEntitlement("price_monthly", 1, env), null);
  assert.deepEqual(getInvoiceEntitlement("price_monthly", env), {
    credits: 30,
    enablesVoiceProfile: false,
    reason: "renewal_monthly_audit",
  });
});
