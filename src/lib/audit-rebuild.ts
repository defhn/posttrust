import { z } from "zod";

import type { AuditPromptOptions } from "./audit-prompt";

export const rebuildAuditRequestSchema = z.object({
  answers: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(500),
        answer: z.string().trim().min(2).max(1000),
      }),
    )
    .min(1, "Answer at least one evidence question")
    .max(5, "Answer no more than five evidence questions"),
});

export type RebuildAnswer = z.infer<typeof rebuildAuditRequestSchema>["answers"][number];

interface RebuildPromptInput {
  input: string;
  originalRewrite: string;
  answers: RebuildAnswer[];
  options: AuditPromptOptions;
  voiceProfile?: string;
}

export function buildRebuildPrompt({
  input,
  originalRewrite,
  answers,
  options,
  voiceProfile,
}: RebuildPromptInput) {
  const evidence = answers
    .map(({ question, answer }, index) => `${index + 1}. ${question}\nAnswer: ${answer}`)
    .join("\n\n");

  return `You are revising a previously audited LinkedIn ${options.type} for a B2B founder, consultant, or professional-services expert.

Use only the original draft and the user's supplied answers as factual material. Do not invent customers, credentials, sources, numbers, timelines, actions, emotions, or results. Do not turn an unrelated personal event into a business lesson. Do not add generic claims merely to make the writing sound polished.

Produce one final authentic rewrite that:
- incorporates the supplied facts naturally;
- preserves the user's credible tone${options.tone ? " and phrasing where practical" : ""};
- removes cliches, borrowed authority, unsupported statistics, forced lessons, humblebrags, performative hustle, and low-value engagement bait;
- narrows or deletes claims that remain unsupported;
- contains no bracketed placeholders;
- uses plain text only, with no Markdown headings, emphasis, or bullet markers.

Target audience: ${options.audience || "Not specified"}
Business goal: ${options.goal || "Not specified"}
${voiceProfile ? `Voice Profile:\n${voiceProfile}\n` : ""}
Original draft:
"""
${input}
"""

Previous authentic rewrite:
"""
${originalRewrite}
"""

User-supplied evidence:
${evidence}

Return only the final plain-text rewrite. No explanation and no bracketed placeholders.`;
}
