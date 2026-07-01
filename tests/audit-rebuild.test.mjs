import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRebuildPrompt,
  rebuildAuditRequestSchema,
} from "../src/lib/audit-rebuild.ts";

test("accepts three to five bounded question and answer pairs", () => {
  const parsed = rebuildAuditRequestSchema.safeParse({
    answers: [
      { question: "What changed?", answer: "Activation rose from 22% to 31%." },
      { question: "What did you try?", answer: "We interviewed 12 new users." },
      { question: "What failed?", answer: "The first checklist reduced completion." },
    ],
  });

  assert.equal(parsed.success, true);
});

test("rejects empty, oversized, and excessive answers", () => {
  assert.equal(rebuildAuditRequestSchema.safeParse({ answers: [] }).success, false);
  assert.equal(rebuildAuditRequestSchema.safeParse({
    answers: [{ question: "Q", answer: "x".repeat(1001) }],
  }).success, false);
  assert.equal(rebuildAuditRequestSchema.safeParse({
    answers: Array.from({ length: 6 }, (_, index) => ({ question: `Q${index}`, answer: "Answer" })),
  }).success, false);
});

test("rebuild prompt uses supplied facts without inventing or leaving placeholders", () => {
  const prompt = buildRebuildPrompt({
    input: "We changed onboarding and it worked.",
    originalRewrite: "We changed [insert process] and achieved [insert metric].",
    answers: [
      { question: "What process changed?", answer: "We replaced the setup wizard." },
      { question: "What result changed?", answer: "Activation rose from 22% to 31%." },
      { question: "What did you learn?", answer: "Shorter was not better; guided was better." },
    ],
    options: { type: "post", tone: true },
  });

  assert.match(prompt, /Activation rose from 22% to 31%/);
  assert.match(prompt.toLowerCase(), /do not invent/);
  assert.match(prompt.toLowerCase(), /no bracketed placeholders/);
  assert.match(prompt.toLowerCase(), /plain text/);
});
