import { calculateCredibilityScore, type RiskMetric } from "./credibility-score.ts";

export interface StoredAuditSummaryInput {
  input: string;
  options: string;
  result: string;
}

export function createAuditSummary(record: StoredAuditSummaryInput) {
  let type: "post" | "article" = "post";
  let score: number | null = null;
  let verdict = "Audit result unavailable";

  try {
    const options = JSON.parse(record.options) as { type?: string };
    if (options.type === "article") type = "article";
  } catch {}

  try {
    const result = JSON.parse(record.result) as { overallScore?: unknown; verdict?: unknown; metrics?: unknown };
    if (typeof result.overallScore === "number") {
      const metrics = Array.isArray(result.metrics)
        ? result.metrics.filter((metric): metric is RiskMetric => {
            return (
              typeof metric === "object" &&
              metric !== null &&
              "category" in metric &&
              "score" in metric &&
              typeof metric.category === "string" &&
              typeof metric.score === "number"
            );
          })
        : [];
      score = calculateCredibilityScore({ overallScore: result.overallScore, metrics }).score;
    }
    if (typeof result.verdict === "string" && result.verdict.trim()) verdict = result.verdict;
  } catch {}

  return {
    type,
    score,
    verdict,
    excerpt: record.input.replace(/\s+/g, " ").trim().slice(0, 180),
  };
}
