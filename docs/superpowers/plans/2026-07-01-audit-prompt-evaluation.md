# Audit Prompt Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the production Gemini audit prompt and compare it with one stored audit using the same input.

**Architecture:** Extract deterministic prompt construction from the Gemini call so it can be unit tested. Keep the existing JSON contract and production API unchanged. Use a temporary local evaluation script for a read-only Neon replay and write only a redacted Markdown report.

**Tech Stack:** TypeScript, Node test runner, Gemini 2.5 Flash, Drizzle ORM, Neon Postgres, Zod.

---

### Task 1: Prompt Contract Test

**Files:**
- Create: `tests/audit-prompt.test.mjs`
- Modify: `src/lib/gemini.ts`

- [ ] Add a failing test that imports `buildAuditPrompt`, builds a Post prompt, and asserts that it contains borrowed authority, unsupported statistics, forced business lessons, engagement bait, evidence-grounded annotations, and all seven metric keys.
- [ ] Run `node --test tests/audit-prompt.test.mjs` and confirm it fails because `buildAuditPrompt` is not exported.
- [ ] Extract and export `buildAuditPrompt(text, options)` without changing the Gemini response schema.
- [ ] Run the focused test and confirm it passes.

### Task 2: Production Prompt Upgrade

**Files:**
- Modify: `src/lib/gemini.ts`
- Test: `tests/audit-prompt.test.mjs`

- [ ] Add the four new diagnostic signals and evidence-grounding rules to the prompt builder.
- [ ] Repair corrupted cliché text and require exactly one entry for each of the seven existing metric categories.
- [ ] Require rewrites to remove unsupported authority/statistics and use placeholders when evidence is absent.
- [ ] Run `node --test tests/*.test.mjs` and `npx tsc --noEmit`.

### Task 3: Read-Only Gemini Replay

**Files:**
- Create temporarily and remove after execution: `scripts/evaluate-audit-prompt.ts`
- Create: `docs/audit-prompt-comparison-2026-07-01.md`

- [ ] Load environment variables without printing secrets.
- [ ] Read valid audits, select the row with the highest combined fake-expert, missing-evidence, and templated-structure score, and save its original result in memory.
- [ ] Call `runSlopAudit` once with the same input/options and no credit or audit writes.
- [ ] Validate and compare old/new results using a rubric covering specificity, grounding, actionability, anti-fabrication, and rewrite quality.
- [ ] Write a redacted Markdown report with short excerpts and remove the temporary script.
- [ ] Re-query the selected audit and verify its stored result is byte-for-byte unchanged.
- [ ] Run the full tests, type-check, and production build.
