export interface RiskMetric {
  category: string;
  score: number;
}

export interface CredibilityFactor {
  label: string;
  earned: number;
  max: number;
  description: string;
}

export interface CredibilityScoreInput {
  overallScore: number;
  metrics: RiskMetric[];
}

const BASE_DRAFT_POINTS = 20;

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const tierForScore = (score: number) => {
  if (score >= 85) return { label: "Strong", color: "text-[#176B4D]" };
  if (score >= 70) return { label: "Credible", color: "text-[#2D8B5A]" };
  if (score >= 50) return { label: "Usable After Edits", color: "text-[#B7791F]" };
  if (score >= 30) return { label: "Needs Specifics", color: "text-[#B7791F]" };
  return { label: "Needs Real Proof", color: "text-[#B5473C]" };
};

function riskFor(
  metricsByCategory: Map<string, number>,
  categories: string[],
  fallbackRisk: number,
) {
  const values = categories.map((category) => metricsByCategory.get(category) ?? fallbackRisk);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function factor(
  label: string,
  max: number,
  risk: number,
  description: string,
): CredibilityFactor {
  return {
    label,
    earned: Math.round(max * (1 - clampScore(risk) / 100)),
    max,
    description,
  };
}

export function calculateCredibilityScore(input: CredibilityScoreInput) {
  const fallbackRisk = clampScore(input.overallScore);
  const metricsByCategory = new Map(
    input.metrics.map((metric) => [metric.category, clampScore(metric.score)]),
  );

  const factors = [
    factor(
      "Specific experience",
      20,
      riskFor(metricsByCategory, ["missing_experience"], fallbackRisk),
      "Concrete action, decision, observation, mistake, or firsthand result.",
    ),
    factor(
      "Concrete evidence",
      20,
      riskFor(metricsByCategory, ["missing_evidence"], fallbackRisk),
      "Numbers, timelines, examples, sources, constraints, or causal support.",
    ),
    factor(
      "Clear point of view",
      12,
      riskFor(metricsByCategory, ["empty_language", "fake_expert"], fallbackRisk),
      "A specific claim without generic advice or unsupported authority.",
    ),
    factor(
      "Natural human tone",
      12,
      riskFor(metricsByCategory, ["cliches", "fake_expert", "overly_perfect"], fallbackRisk),
      "Low cliche density, less lecturing, and enough friction to feel real.",
    ),
    factor(
      "Non-template structure",
      8,
      riskFor(metricsByCategory, ["templated_structure"], fallbackRisk),
      "A structure that does not read like a standard LinkedIn prompt template.",
    ),
    factor(
      "Useful takeaway",
      8,
      riskFor(metricsByCategory, ["empty_language", "templated_structure"], fallbackRisk),
      "A reader can take away something more specific than a broad lesson.",
    ),
  ];

  const factorPoints = factors.reduce((sum, item) => sum + item.earned, 0);
  const score = clampScore(BASE_DRAFT_POINTS + factorPoints);
  const repairableDeficit = factors
    .map((item) => item.max - item.earned)
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((sum, value) => sum + value, 0);
  const potentialScore = clampScore(Math.min(100, score + Math.round(repairableDeficit * 0.7)));

  return {
    score,
    basePoints: BASE_DRAFT_POINTS,
    potentialScore,
    tier: tierForScore(score),
    factors,
  };
}
