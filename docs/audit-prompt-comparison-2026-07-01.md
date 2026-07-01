# PostTrust Audit Prompt A/B Comparison

## Evaluation Setup

- Model: Gemini 2.5 Flash configured by the application
- Sample source: one existing Neon audit selected by the highest combined fake-expert, missing-evidence, and templated-structure risk
- Sample fingerprint: `5208864f599b240f`
- Content type: LinkedIn Post
- Voice Profile: not present for this sample
- Database behavior: read-only replay; the stored result hash was unchanged after both calls
- Privacy: only short excerpts are included below

Sample opening:

> AI is not just a tool. It’s a total game-changer. In today's fast-paced digital world, leveraging AI is key to staying ahead...

## Headline Result

The revised prompt is better for PostTrust's core diagnostic job. It is more explicit, more selective, and more actionable. The improvement is strongest in sentence-level diagnosis and evidence questions. Rewrite quality improved less than diagnostic quality, and the Conservative Rewrite still needs another iteration.

| Area | Stored result | Revised result | Better |
|---|---|---|---|
| Trust Score | 10/100 | 5/100 | Comparable; both correctly identify severe risk |
| Top problems | Accurate but combines several categories | Separates missing experience, clichés, and template structure | Revised |
| Annotations | 10, comprehensive but repetitive | 6, focused and non-overlapping | Revised |
| Engagement bait | Mentioned inside broader categories | Explicitly labeled Low-Value Engagement Bait | Revised |
| Evidence questions | 10, broad and somewhat repetitive | 4, consolidated around business, metrics, decisions, and outcomes | Revised |
| Conservative Rewrite | Introduces unsupported claims and Markdown | Plain text, but still replaces some empty language with milder empty language | Revised slightly |
| Authentic Rewrite | Useful placeholders but verbose and partly formatted | More structured placeholders and no Markdown | Revised |

## What Improved

### More Precise Diagnosis

The stored result already recognized generic advice and engagement bait. The revised prompt makes the reasoning cleaner by requiring each criticism to be grounded in draft evidence and by preferring a smaller number of non-overlapping annotations.

The revised result explicitly identified this ending as `Low-Value Engagement Bait`:

> What are your thoughts on the AI revolution? Let me know in the comments!

It also recommended deleting the line when no credible experience supports a more specific discussion question. That is more actionable than simply calling it a cliché.

### Better Evidence Questions

The stored result asked ten questions, several of which overlapped. The revised result reduced this to four stronger questions:

1. What type of business was scaled and what were its core operations?
2. Which metrics define the scaling, and over what period?
3. Which challenges or decisions produced the claimed lessons?
4. Which examples, numbers, or outcomes support each lesson?

This is easier for a user to complete and maps directly to the Authentic Rewrite placeholders.

### Cleaner Output Contract

The stored rewrite included Markdown emphasis despite the interface requiring plain text. The revised result followed the plain-text requirement. It also returned all seven metrics in the expected order.

## Remaining Weakness

The revised Conservative Rewrite still produced generalized statements such as “Adaptability holds value” and “Continuous learning is important.” These are safer than the original claims but remain low-value language. The prompt now explicitly forbids introducing new factual or universal claims, but a single Gemini run shows that instruction alone does not fully solve conservative rewriting when the source contains almost no evidence.

The product should treat this as a rewrite limitation rather than inflate the quality score. A future iteration should consider returning a shorter deletion-first rewrite when the draft lacks enough facts, instead of trying to preserve every original list item.

## Rubric

| Criterion | Stored | Revised |
|---|---:|---:|
| Specificity | 7/10 | 9/10 |
| Grounding in source text | 8/10 | 9/10 |
| Actionability | 7/10 | 9/10 |
| Anti-fabrication behavior | 7/10 | 8/10 |
| Annotation focus | 6/10 | 9/10 |
| Conservative rewrite quality | 4/10 | 5/10 |
| Authentic rewrite quality | 6/10 | 7/10 |
| **Total** | **45/70** | **56/70** |

## Conclusion

Use the revised prompt in production. It better supports PostTrust's positioning as a trust and evidence editor rather than an AI-authorship detector. The result is not a universal benchmark because it uses one real audit and Gemini output is nondeterministic, but it provides a clear directional win.

The next prompt experiment should focus narrowly on deletion-first Conservative Rewrites for drafts with very high missing-experience and missing-evidence scores.
