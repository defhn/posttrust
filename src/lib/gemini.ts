import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { voiceProfileSchema, type VoiceProfile } from "./voice-profile";

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Zod schema for structured output validation
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
    })
  ).max(3),
  metrics: z.array(
    z.object({
      category: z.string(), // key names in English
      displayName: z.string(), // User-facing name in English
      score: z.number().min(0).max(100),
      level: z.enum(["Low", "Medium", "High"]),
      description: z.string(),
    })
  ),
  annotations: z.array(
    z.object({
      originalTextSnippet: z.string(), // The exact substring from the input post
      problemCategory: z.string(),
      riskExplanation: z.string(),
      fixSuggestion: z.string(),
      actionType: z.enum(["delete", "replace", "add_evidence", "rewrite"]),
    })
  ),
  rewrites: z.object({
    conservative: z.string(),
    authentic: z.string(),
  }),
  missingContextDetails: z.array(z.string()),
});

export type AuditResult = z.infer<typeof auditResultSchema>;

export async function generateVoiceProfile(posts: string[]): Promise<VoiceProfile> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = genAI.getGenerativeModel({ model: modelName });
  const samples = posts.map((post, index) => `Sample ${index + 1}:\n${post}`).join("\n\n---\n\n");
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
  options: {
    type: "post" | "article";
    audience?: string;
    goal?: string;
    tone?: boolean;
    voiceProfile?: string;
  }
): Promise<AuditResult> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const contentInstructions = options.type === "article"
    ? `This is a LinkedIn Article. Prioritize thesis clarity, section order, argument progression, repeated ideas, evidence distribution, transitions, and whether the conclusion earns its claim. Do not penalize normal long-form paragraphs. Rewrites should preserve the article's sections and improve structure rather than compressing it into a short post.`
    : `This is a LinkedIn Post. Prioritize feed readability, generic hooks, forced one-line paragraphs, engagement bait, compressed unsupported lessons, and whether a specific lived experience anchors the post.`;

  const voiceInstructions = options.voiceProfile
    ? `\nThe user has a verified Voice Profile. Follow it when producing both rewrites:\n${options.voiceProfile}`
    : "\nNo Voice Profile is available. Preserve the draft's credible existing tone and use placeholders for missing facts.";

  const systemInstruction = `
You are an expert editor who reviews B2B LinkedIn content for executive leaders, founders, and consultants.
Your task is to analyze the user's draft for "AI Slop" and trust-reducing patterns.
Analyze the text and return a JSON object that strictly adheres to the requested JSON structure.

DO NOT claim the text is written by AI. Focus instead on whether the text sounds like a generic, low-effort template or fake-expert advice, which destroys professional trust.

Evaluate the following dimensions:
1. Empty Language (Correct but zero-value sentences)
2. Clichés & Buzzwords (LinkedIn templates, "let that sink in", "agree?", "here is what I learned")
3. Fake-Expert Tone (Overly absolute rules, lecturing the reader)
4. Missing Lived Experience (No "I did", "we saw", "my client")
5. Missing Evidence (No numbers, no timelines, no details)
6. Templated Structure (Forced carriage returns, single-sentence paragraphs, fake hooks)
7. Overly Perfect (Too polished, no mention of friction, mistakes, or tradeoffs)

${contentInstructions}
${voiceInstructions}

Provide two rewrites:
- "conservative": Retains original structure but replaces clichés, flushes out empty language, and tempers fake-expert lecturing.
- "authentic": Re-structures the post, highlights personal/consulting experiences as anchors, and uses bracketed placeholders like "[insert your team size here]" or "[insert metric here]" where the user should add their own facts. Never make up stories; ask the user to fill them in.

Provide a list of "missingContextDetails" which are specific questions the user can answer to add evidence (e.g., "What specific software did you use?", "How many hours did this save?").

CRITICAL: In the "annotations" array, the "originalTextSnippet" MUST be an EXACT, CASE-SENSITIVE substring of the original text. Do not modify capitalization, punctuation, or whitespace.

JSON Schema format:
{
  "overallScore": number (0-100, where higher means MORE generic/AI-slop/less trust),
  "confidence": "High" | "Medium" | "Low" (based on length and detail),
  "verdict": "One-sentence summary of the main trust risk in the text.",
  "positives": ["Good aspect 1", "Good aspect 2"],
  "topProblems": [
    { "category": "Category Name", "reason": "Why it hurts trust", "suggestion": "How to fix it" }
  ] (max 3),
  "metrics": [
    { "category": "empty_language", "displayName": "Empty Language Density", "score": number, "level": "Low"|"Medium"|"High", "description": "brief explanation" },
    { "category": "cliches", "displayName": "Clichés & Buzzwords", "score": number, "level": "Low"|"Medium"|"High", "description": "brief explanation" },
    { "category": "fake_expert", "displayName": "Fake-Expert Signals", "score": number, "level": "Low"|"Medium"|"High", "description": "brief explanation" },
    { "category": "missing_experience", "displayName": "Missing Lived Experience", "score": number, "level": "Low"|"Medium"|"High", "description": "brief explanation" },
    { "category": "missing_evidence", "displayName": "Missing Evidence/Data", "score": number, "level": "Low"|"Medium"|"High", "description": "brief explanation" },
    { "category": "templated_structure", "displayName": "LinkedIn Cliché Structure", "score": number, "level": "Low"|"Medium"|"High", "description": "brief explanation" },
    { "category": "overly_perfect", "displayName": "Frictionless/Overly Perfect", "score": number, "level": "Low"|"Medium"|"High", "description": "brief explanation" }
  ],
  "annotations": [
    {
      "originalTextSnippet": "EXACT substring from the original input",
      "problemCategory": "e.g., Cliché / Empty Language / Fake Expert",
      "riskExplanation": "Why this specific sentence makes you sound like a generic AI or fake expert.",
      "fixSuggestion": "How to write this authentically.",
      "actionType": "delete" | "replace" | "add_evidence" | "rewrite"
    }
  ],
  "rewrites": {
    "conservative": "Text of conservative rewrite...",
    "authentic": "Text of authentic rewrite with brackets..."
  },
  "missingContextDetails": ["Question 1", "Question 2"]
}
`;

  const userPrompt = `
Input Draft:
"""
${text}
"""

Context Options:
- Content Type: ${options.type}
- Target Audience: ${options.audience || "Not specified"}
- Business Goal: ${options.goal || "Not specified"}
- Keep Tone: ${options.tone ? "Yes" : "No"}

Perform the audit. Output ONLY valid JSON matching the format description. Do not wrap in markdown blocks, do not add explanation text outside the JSON.
`;

  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: systemInstruction }, { text: userPrompt }] },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const responseText = result.response.text();
  
  try {
    const rawJson = JSON.parse(responseText);
    return auditResultSchema.parse(rawJson);
  } catch (err) {
    console.error("Failed to parse or validate Gemini response JSON:", responseText, err);
    throw new Error("The AI response was not formatted correctly. Please try again.");
  }
}
