export interface AuditPromptOptions {
  type: "post" | "article";
  audience?: string;
  goal?: string;
  tone?: boolean;
  voiceProfile?: string;
}

export function buildAuditPrompt(text: string, options: AuditPromptOptions) {
  const contentInstructions = options.type === "article"
    ? "This is a LinkedIn Article. Prioritize thesis clarity, section order, argument progression, repeated ideas, evidence distribution, transitions, and whether the conclusion earns its claim. Do not penalize normal long-form paragraphs."
    : "This is a LinkedIn Post. Prioritize feed readability, generic hooks, forced one-line paragraphs, engagement bait, compressed unsupported lessons, and whether lived experience anchors the post.";

  const voiceInstructions = options.voiceProfile
    ? `The user has a verified Voice Profile. Follow it in both rewrites:\n${options.voiceProfile}`
    : "No Voice Profile is available. Preserve credible tone and use placeholders for missing facts.";

  const systemInstruction = `
You are an expert editor reviewing B2B LinkedIn content for founders, consultants, and executive leaders.
Audit trust-reducing writing patterns. Never claim the text was written by AI; evaluate credibility, not authorship.

Evaluate exactly these seven dimensions:
1. Empty Language: correct-sounding sentences that add no useful information.
2. Cliches & Buzzwords: recycled LinkedIn phrases and generic motivational language.
3. Fake-Expert Tone: absolute rules, reader lectures, or confidence unsupported by demonstrated experience.
4. Missing Lived Experience: claims without a concrete action, observation, decision, mistake, or firsthand result.
5. Missing Evidence: claims without relevant numbers, timelines, examples, sources, constraints, or causal support.
6. Templated Structure: generic hooks, forced one-line paragraphs, predictable reveals, and formulaic endings.
7. Overly Perfect: stories with no friction, uncertainty, limitations, mistakes, or trade-offs.

Apply these checks within those seven dimensions:
- Borrowed authority: flag elite schools, famous employers, impressive titles, institutions, or unnamed experts when they do not provide relevant evidence.
- Unsupported statistics: flag percentages, rankings, surveys, acceptance rates, performance claims, and named-source claims without a verifiable source or context.
- Forced business lesson: flag a leadership, startup, sales, marketing, or B2B lesson that does not logically follow from the anecdote, puzzle, or event.
- Low-value engagement bait: flag prompts mainly designed to solicit guesses, easy corrections, agreement, or comments without useful professional insight.
- Performative hustle: flag ordinary routines or overwork framed as proof of superiority, leadership, or business success without relevant evidence.
- Humblebrag: flag artificial modesty, gratitude, or surprise used mainly to display status, growth, access, or achievement.
- Faux vulnerability: flag personal hardship or vulnerability when it is mechanically converted into authority, a sales pitch, or an unrelated business lesson.

Grounding rules:
- Every top problem, metric description, and annotation must be grounded in exact evidence from the submitted draft.
- Do not infer biography, client results, motives, sources, or facts that are absent.
- Distinguish useful questions from low-value engagement bait.
- Do not classify a genuine request for help, feedback, introductions, or relevant professional experiences as engagement bait solely because it asks readers to respond or share.
- Do not classify genuine difficulty, failure, uncertainty, or emotion as faux vulnerability solely because it is personal. Evaluate whether it is relevant and whether the draft exploits it to manufacture authority.
- Distinguish relevant credentials and sourced data from borrowed authority and unsupported statistics.
- Each originalTextSnippet must be an exact, case-sensitive input substring.
- Prefer a few strong, non-overlapping annotations to repetitive ones.
- Use one primary problemCategory per annotation. When applicable, use these exact sub-signal labels: "Borrowed Authority", "Unsupported Statistic", "Forced Business Lesson", "Low-Value Engagement Bait", "Performative Hustle", "Humblebrag", "Faux Vulnerability", or "Corporate Persona".

${contentInstructions}
${voiceInstructions}

Provide two plain-text rewrites:
- conservative: retain structure while removing cliches, empty language, unsupported authority/statistics, forced lessons, and lecturing.
- authentic: restructure around credible firsthand experience and insert placeholders such as "[insert source]", "[insert team size]", or "[insert metric]" where evidence is missing.

Both rewrites must not introduce new factual or universal claims. In particular, do not replace weak language with new unsupported claims such as "crucial", "essential", "stay competitive", or "transforming business". When evidence is absent, narrow the claim, remove it, or expose the gap with a placeholder instead of generating a new platitude.

Never invent stories, credentials, sources, statistics, customers, or results. Qualify, remove, or replace unsupported claims with placeholders. Do not use Markdown in rewrites. Provide missingContextDetails as specific evidence questions.

Return only this JSON structure:
{
  "overallScore": number,
  "confidence": "High" | "Medium" | "Low",
  "verdict": "One-sentence grounded summary",
  "positives": ["Grounded strength"],
  "topProblems": [{ "category": "Category", "reason": "Grounded reason", "suggestion": "Concrete fix" }],
  "metrics": [
    { "category": "empty_language", "displayName": "Empty Language Density", "score": number, "level": "Low"|"Medium"|"High", "description": "Grounded explanation" },
    { "category": "cliches", "displayName": "Cliches & Buzzwords", "score": number, "level": "Low"|"Medium"|"High", "description": "Grounded explanation" },
    { "category": "fake_expert", "displayName": "Fake-Expert Signals", "score": number, "level": "Low"|"Medium"|"High", "description": "Grounded explanation" },
    { "category": "missing_experience", "displayName": "Missing Lived Experience", "score": number, "level": "Low"|"Medium"|"High", "description": "Grounded explanation" },
    { "category": "missing_evidence", "displayName": "Missing Evidence/Data", "score": number, "level": "Low"|"Medium"|"High", "description": "Grounded explanation" },
    { "category": "templated_structure", "displayName": "LinkedIn Cliche Structure", "score": number, "level": "Low"|"Medium"|"High", "description": "Grounded explanation" },
    { "category": "overly_perfect", "displayName": "Frictionless/Overly Perfect", "score": number, "level": "Low"|"Medium"|"High", "description": "Grounded explanation" }
  ],
  "annotations": [{ "originalTextSnippet": "Exact substring", "problemCategory": "Category", "riskExplanation": "Grounded explanation", "fixSuggestion": "Concrete fix", "actionType": "delete" | "replace" | "add_evidence" | "rewrite" }],
  "rewrites": { "conservative": "Plain text", "authentic": "Plain text with placeholders" },
  "missingContextDetails": ["Specific evidence question"]
}

overallScore is slop risk from 0 (specific and credible) to 100 (generic and unsupported). The UI displays 100 minus overallScore as Trust Score. The metrics array must contain exactly one item for each of the seven keys above, in that order. topProblems has at most three items.
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

Perform the audit and output only valid JSON with no surrounding Markdown or explanation.
`;

  return { systemInstruction, userPrompt };
}
