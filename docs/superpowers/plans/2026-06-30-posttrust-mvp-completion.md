# PostTrust MVP Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing PostTrust homepage promises correspond to working Post, Article, Voice Profile, history, and billing workflows.

**Architecture:** Extend the current Next.js App Router application with one Voice Profile per user, owner-scoped history routes, type-specific Gemini prompts, and Stripe lifecycle handling. Keep the UI compact and centered, with full-width section backgrounds only.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Neon Postgres, Drizzle ORM, Gemini 2.5 Flash, Stripe, Brevo, Node test runner.

---

### Task 1: Shared Product Rules And Database Schema

**Files:**
- Create: `src/lib/plans.ts`
- Modify: `src/db/schema.ts`
- Create: `tests/plans.test.mjs`

- [ ] Write failing tests for price-to-entitlement mapping and one-profile-per-user schema expectations.
- [ ] Run `node --test tests/plans.test.mjs` and confirm failure.
- [ ] Add plan constants for Quick Fix, Voice Audit, and Monthly Audit.
- [ ] Add user subscription fields and the unique `voice_profiles.user_id` table.
- [ ] Generate a Drizzle migration with `npm run db:generate`.
- [ ] Re-run tests and confirm pass.

### Task 2: Voice Profile Generation

**Files:**
- Modify: `src/lib/gemini.ts`
- Create: `src/lib/voice-profile.ts`
- Create: `src/app/api/voice-profile/route.ts`
- Create: `src/app/voice/page.tsx`
- Create: `src/components/voice-profile-client.tsx`
- Create: `tests/voice-profile.test.mjs`

- [ ] Write failing validation tests requiring 3-5 samples of 80-3,000 characters.
- [ ] Implement the structured Voice Profile schema and Gemini generator.
- [ ] Implement authenticated GET and POST with a user-scoped upsert.
- [ ] Build the single-profile create/regenerate page.
- [ ] Verify the saved profile is returned after regeneration without creating a second row.

### Task 3: Distinct Post And Article Audits

**Files:**
- Modify: `src/lib/gemini.ts`
- Modify: `src/app/api/audit/route.ts`
- Modify: `src/components/landing-client.tsx`
- Modify: `src/components/audit-result-client.tsx`
- Create: `tests/audit-input.test.mjs`

- [ ] Write failing tests for Post 3,000-character and Article 12,000-character boundaries.
- [ ] Split prompt instructions by content type.
- [ ] Load the current Voice Profile and inject rewrite instructions when available.
- [ ] Update editor limits and Article labels.
- [ ] Verify both types produce the shared result contract.

### Task 4: Basic History And Deletion

**Files:**
- Create: `src/app/history/page.tsx`
- Create: `src/components/history-list.tsx`
- Create: `src/app/api/audits/[id]/route.ts`

- [ ] Add an owner-scoped newest-50 audit query.
- [ ] Render type, score, date, excerpt, open action, and delete action.
- [ ] Add authenticated owner-only DELETE.
- [ ] Verify deleting an audit does not modify the credit ledger.

### Task 5: Complete Stripe Subscription Lifecycle

**Files:**
- Create: `src/lib/stripe.ts`
- Modify: `src/app/api/webhooks/stripe/route.ts`
- Create: `src/app/api/billing/portal/route.ts`
- Modify: `src/app/api/billing/status/route.ts`
- Create: `tests/billing-plans.test.mjs`

- [ ] Write failing tests for one-time grants, Voice access, and monthly grants.
- [ ] Move Stripe initialization behind `getStripe()`.
- [ ] Store Checkout customer and subscription IDs.
- [ ] Handle `invoice.paid`, `customer.subscription.updated`, and `customer.subscription.deleted` idempotently.
- [ ] Create authenticated Customer Portal sessions using the stored customer ID.
- [ ] Verify initial subscription checkout does not double-grant credits across Checkout and invoice events.

### Task 6: Homepage, Navigation, Footer, And Copy

**Files:**
- Modify: `src/components/landing-client.tsx`
- Modify: `src/components/auth-modal.tsx`
- Modify: `src/components/demo-audit.tsx`
- Create: `src/components/site-header.tsx`
- Create: `src/components/site-footer.tsx`

- [ ] Add centered `max-w-6xl` inner containers to header and footer.
- [ ] Add History, Voice Profile, and Billing navigation for authenticated users.
- [ ] Keep the magic-link confirmation modal open and make resend work.
- [ ] Replace absolute or unsupported claims with precise product language.
- [ ] Make Quick Fix the recommended first purchase and show Voice requirements accurately.

### Task 7: Legal Pages And Final Verification

**Files:**
- Create: `src/app/privacy/page.tsx`
- Create: `src/app/terms/page.tsx`
- Modify: `src/components/site-footer.tsx`
- Modify: `linkedin-ai-slop-audit-prd.md`
- Modify: `posttrust-landing-page-spec.md`

- [ ] Add concise Privacy and Terms pages matching actual storage and billing behavior.
- [ ] Update the PRD and landing specification to the final scope.
- [ ] Run all Node tests.
- [ ] Run `npm run build`.
- [ ] Verify desktop 1440px and mobile 390px screenshots.
- [ ] Verify no secret values are included in tracked files or browser bundles.

