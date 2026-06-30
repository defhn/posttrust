import assert from "node:assert/strict";
import test from "node:test";

import { auditRequestSchema } from "../src/lib/audit-input.ts";

test("Post accepts up to 3,000 characters", () => {
  assert.equal(auditRequestSchema.safeParse({ content: "A".repeat(3000), type: "post" }).success, true);
  assert.equal(auditRequestSchema.safeParse({ content: "A".repeat(3001), type: "post" }).success, false);
});

test("Article accepts up to 12,000 characters", () => {
  assert.equal(auditRequestSchema.safeParse({ content: "A".repeat(12000), type: "article" }).success, true);
  assert.equal(auditRequestSchema.safeParse({ content: "A".repeat(12001), type: "article" }).success, false);
});

test("both content types require at least 80 characters", () => {
  assert.equal(auditRequestSchema.safeParse({ content: "A".repeat(79), type: "post" }).success, false);
  assert.equal(auditRequestSchema.safeParse({ content: "A".repeat(79), type: "article" }).success, false);
});
