import assert from "node:assert/strict";
import test from "node:test";

import { createAuditSummary } from "../src/lib/audit-history.ts";

test("creates a safe history summary from stored JSON", () => {
  const summary = createAuditSummary({
    input: "A concrete founder story about changing onboarding after five customer calls.",
    options: JSON.stringify({ type: "post" }),
    result: JSON.stringify({ overallScore: 42, verdict: "Specific but missing one result." }),
  });

  assert.equal(summary.type, "post");
  assert.equal(summary.score, 58);
  assert.match(summary.excerpt, /concrete founder story/);
});

test("falls back safely when legacy JSON is invalid", () => {
  const summary = createAuditSummary({ input: "Draft", options: "bad", result: "bad" });

  assert.equal(summary.type, "post");
  assert.equal(summary.score, null);
  assert.equal(summary.verdict, "Audit result unavailable");
});
