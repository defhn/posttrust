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
    const result = JSON.parse(record.result) as { overallScore?: unknown; verdict?: unknown };
    if (typeof result.overallScore === "number") score = result.overallScore;
    if (typeof result.verdict === "string" && result.verdict.trim()) verdict = result.verdict;
  } catch {}

  return {
    type,
    score,
    verdict,
    excerpt: record.input.replace(/\s+/g, " ").trim().slice(0, 180),
  };
}
