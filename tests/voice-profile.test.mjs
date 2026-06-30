import assert from "node:assert/strict";
import test from "node:test";

import { voiceProfileInputSchema } from "../src/lib/voice-profile.ts";

const sample = "A".repeat(120);

test("accepts three to five substantial sample posts", () => {
  assert.equal(voiceProfileInputSchema.safeParse({ posts: [sample, sample, sample] }).success, true);
  assert.equal(
    voiceProfileInputSchema.safeParse({ posts: [sample, sample, sample, sample, sample] }).success,
    true,
  );
});

test("rejects fewer than three or more than five sample posts", () => {
  assert.equal(voiceProfileInputSchema.safeParse({ posts: [sample, sample] }).success, false);
  assert.equal(
    voiceProfileInputSchema.safeParse({ posts: [sample, sample, sample, sample, sample, sample] }).success,
    false,
  );
});

test("rejects samples outside the supported length", () => {
  assert.equal(voiceProfileInputSchema.safeParse({ posts: ["short", sample, sample] }).success, false);
  assert.equal(
    voiceProfileInputSchema.safeParse({ posts: ["A".repeat(3001), sample, sample] }).success,
    false,
  );
});
