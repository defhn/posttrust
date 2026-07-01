import assert from "node:assert/strict";
import test from "node:test";

import { calculateCredibilityScore } from "../src/lib/credibility-score.ts";

const metric = (category, score) => ({
  category,
  displayName: category,
  score,
  level: score >= 70 ? "High" : score >= 35 ? "Medium" : "Low",
  description: "",
});

const allMetrics = (score) => [
  metric("empty_language", score),
  metric("cliches", score),
  metric("fake_expert", score),
  metric("missing_experience", score),
  metric("missing_evidence", score),
  metric("templated_structure", score),
  metric("overly_perfect", score),
];

test("turns very high slop risk into a low but not demoralizing credibility score", () => {
  const result = calculateCredibilityScore({ overallScore: 95, metrics: allMetrics(95) });

  assert.equal(result.score, 24);
  assert.equal(result.tier.label, "Needs Real Proof");
  assert.ok(result.potentialScore > result.score);
  assert.ok(result.factors.every((factor) => factor.earned >= 0 && factor.earned <= factor.max));
});

test("awards a perfect credibility score when all risk metrics are clean", () => {
  const result = calculateCredibilityScore({ overallScore: 0, metrics: allMetrics(0) });

  assert.equal(result.score, 100);
  assert.equal(result.potentialScore, 100);
  assert.equal(result.tier.label, "Strong");
});

test("uses factor weights so the displayed score is explainable", () => {
  const result = calculateCredibilityScore({
    overallScore: 50,
    metrics: [
      metric("empty_language", 20),
      metric("cliches", 40),
      metric("fake_expert", 30),
      metric("missing_experience", 80),
      metric("missing_evidence", 90),
      metric("templated_structure", 25),
      metric("overly_perfect", 10),
    ],
  });

  assert.equal(result.score, 56);
  assert.deepEqual(
    result.factors.map((factor) => `${factor.label}:${factor.earned}/${factor.max}`),
    [
      "Specific experience:4/20",
      "Concrete evidence:2/20",
      "Clear point of view:9/12",
      "Natural human tone:9/12",
      "Non-template structure:6/8",
      "Useful takeaway:6/8",
    ],
  );
});

test("falls back to overall risk when a metric category is missing", () => {
  const result = calculateCredibilityScore({
    overallScore: 75,
    metrics: [metric("missing_evidence", 20)],
  });

  assert.equal(result.score, 51);
  assert.equal(result.factors.find((factor) => factor.label === "Concrete evidence")?.earned, 16);
});
