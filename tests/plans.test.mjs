import assert from "node:assert/strict";
import test from "node:test";

import {
  getPlanByPriceId,
  getPlanBySlug,
  PLAN_CATALOG,
} from "../src/lib/plans.ts";

test("catalog exposes the three public plans", () => {
  assert.deepEqual(Object.keys(PLAN_CATALOG), ["quick-fix", "voice-audit", "monthly-audit"]);
});

test("voice audit grants ten credits and Voice Profile access", () => {
  const plan = getPlanBySlug("voice-audit");

  assert.equal(plan.credits, 10);
  assert.equal(plan.enablesVoiceProfile, true);
  assert.equal(plan.recurring, false);
});

test("monthly audit grants thirty recurring credits", () => {
  const plan = getPlanBySlug("monthly-audit");

  assert.equal(plan.credits, 30);
  assert.equal(plan.recurring, true);
});

test("price lookup only accepts configured server-side price IDs", () => {
  const env = {
    STRIPE_PRICE_QUICK_FIX: "price_quick",
    STRIPE_PRICE_VOICE_AUDIT: "price_voice",
    STRIPE_PRICE_MONTHLY_AUDIT: "price_monthly",
  };

  assert.equal(getPlanByPriceId("price_voice", env)?.slug, "voice-audit");
  assert.equal(getPlanByPriceId("price_unknown", env), null);
});
