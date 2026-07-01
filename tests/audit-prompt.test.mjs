import assert from "node:assert/strict";
import test from "node:test";

import { buildAuditPrompt } from "../src/lib/audit-prompt.ts";

test("audit prompt covers authority, evidence, forced lessons, and engagement bait", () => {
  const { systemInstruction, userPrompt } = buildAuditPrompt(
    "Harvard asks this question. Only 1% get it right. What this taught me about B2B sales.",
    { type: "post", audience: "B2B founders", goal: "Conversation", tone: true },
  );

  for (const phrase of [
    "borrowed authority",
    "unsupported statistics",
    "forced business lesson",
    "low-value engagement bait",
    "grounded in exact evidence",
    "must not introduce new factual or universal claims",
    "performative hustle",
    "humblebrag",
    "faux vulnerability",
    "do not classify a genuine request for help",
  ]) {
    assert.match(systemInstruction.toLowerCase(), new RegExp(phrase));
  }

  for (const category of [
    "empty_language",
    "cliches",
    "fake_expert",
    "missing_experience",
    "missing_evidence",
    "templated_structure",
    "overly_perfect",
  ]) {
    assert.match(systemInstruction, new RegExp(`"${category}"`));
  }

  assert.match(userPrompt, /Harvard asks this question/);
  assert.match(userPrompt, /B2B founders/);
});
