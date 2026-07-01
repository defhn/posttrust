import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

import { buildAuditPrompt, type AuditPromptOptions } from "./audit-prompt";
import { buildRebuildPrompt, type RebuildAnswer } from "./audit-rebuild";
import { voiceProfileSchema, type VoiceProfile } from "./voice-profile";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const auditResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  confidence: z.enum(["High", "Medium", "Low"]),
  verdict: z.string(),
  positives: z.array(z.string()),
  topProblems: z.array(
    z.object({
      category: z.string(),
      reason: z.string(),
      suggestion: z.string(),
    }),
  ).max(3),
  metrics: z.array(
    z.object({
      category: z.string(),
      displayName: z.string(),
      score: z.number().min(0).max(100),
      level: z.enum(["Low", "Medium", "High"]),
      description: z.string(),
    }),
  ),
  annotations: z.array(
    z.object({
      originalTextSnippet: z.string(),
      problemCategory: z.string(),
      riskExplanation: z.string(),
      fixSuggestion: z.string(),
      actionType: z.enum(["delete", "replace", "add_evidence", "rewrite"]),
    }),
  ),
  rewrites: z.object({
    conservative: z.string(),
    authentic: z.string(),
  }),
  missingContextDetails: z.array(z.string()),
  rebuild: z.object({
    generatedAt: z.string().datetime(),
    answerCount: z.number().int().min(1).max(5),
  }).optional(),
});

export type AuditResult = z.infer<typeof auditResultSchema>;

function getModel() {
  if (!genAI) throw new Error("GEMINI_API_KEY is not configured.");
  return genAI.getGenerativeModel({ model: modelName });
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/\*([\s\S]+?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[\-*]\s+/gm, "• ")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .trim();
}

export async function generateVoiceProfile(posts: string[]): Promise<VoiceProfile> {
  const model = getModel();
  const samples = posts
    .map((post, index) => `Sample ${index + 1}:\n${post}`)
    .join("\n\n---\n\n");
  const prompt = `You are analyzing writing samples that the same B2B founder or consultant wrote personally.
Extract repeatable style rules. Describe what is present in the samples; do not invent biography, preferences, or results.
Return only JSON with this exact shape:
{
  "summary": "A concise description of the writer's recognizable voice",
  "toneTraits": ["trait"],
  "rhythmRules": ["sentence and paragraph rhythm rule"],
  "evidenceHabits": ["how the writer uses examples, numbers, and experience"],
  "structurePatterns": ["common opening, development, and ending pattern"],
  "phrasesToAvoid": ["phrases or templates that would sound unlike this writer"],
  "rewriteInstructions": ["specific instruction future rewrites must follow"]
}

Writing samples:
${samples}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  try {
    return voiceProfileSchema.parse(JSON.parse(result.response.text()));
  } catch (error) {
    console.error("Failed to validate Voice Profile response", error);
    throw new Error("The Voice Profile could not be generated. Please try again.");
  }
}

export async function runSlopAudit(
  text: string,
  options: AuditPromptOptions,
): Promise<AuditResult> {
  const model = getModel();
  const prompt = buildAuditPrompt(text, options);
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt.systemInstruction },
          { text: prompt.userPrompt },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json" },
  });

  try {
    const validated = auditResultSchema.parse(JSON.parse(result.response.text()));
    validated.rewrites.conservative = stripMarkdown(validated.rewrites.conservative);
    validated.rewrites.authentic = stripMarkdown(validated.rewrites.authentic);
    return validated;
  } catch (error) {
    console.error("Failed to parse or validate Gemini response JSON", error);
    throw new Error("The AI response was not formatted correctly. Please try again.");
  }
}

export async function rebuildAuthenticRewrite(input: {
  text: string;
  originalRewrite: string;
  answers: RebuildAnswer[];
  options: AuditPromptOptions;
  voiceProfile?: string;
}): Promise<string> {
  const model = getModel();
  const prompt = buildRebuildPrompt({
    input: input.text,
    originalRewrite: input.originalRewrite,
    answers: input.answers,
    options: input.options,
    voiceProfile: input.voiceProfile,
  });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const rewrite = stripMarkdown(result.response.text());

  if (!rewrite || /\[[^\]]+\]/.test(rewrite)) {
    throw new Error("The final rewrite still needs evidence. Please review your answers and try again.");
  }

  return rewrite;
}
