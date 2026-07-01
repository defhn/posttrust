# Audit Prompt Evaluation Design

## Goal

Strengthen the production audit prompt and evaluate it against one existing Neon audit without changing the stored record or consuming user credits.

## Prompt Changes

- Detect borrowed authority from schools, employers, titles, and institutions when it does not support the claim.
- Detect unsupported percentages, rankings, survey claims, and named-source claims.
- Detect forced business lessons that do not logically follow from the story.
- Detect low-value engagement bait designed mainly to solicit guesses, agreement, or comments.
- Require every criticism and annotation to point to evidence in the submitted draft.
- Keep the existing seven-metric response contract and both rewrite variants.

## Evaluation Flow

1. Read existing audit rows without exposing user identity.
2. Select the valid row with the strongest combined fake-expert, missing-evidence, and templated-structure risk.
3. Preserve its stored result as the baseline.
4. Run the same input and options through the revised production prompt once.
5. Do not insert or update database rows and do not modify the credit ledger.
6. Produce a redacted Markdown comparison containing scores, categories, annotations, questions, rewrite excerpts, and a rubric-based conclusion.

## Verification

- Unit test the prompt builder for all new rules and the unchanged output contract.
- Type-check and run the existing test suite.
- Validate both old and new results with the same Zod schema where possible.
- Verify the selected database row is unchanged after the replay.

## Safety

- Do not print database credentials, Gemini credentials, email addresses, or user IDs.
- Do not include the full private draft in the report; use short excerpts only.
- Treat the model comparison as one case study, not statistical proof.
