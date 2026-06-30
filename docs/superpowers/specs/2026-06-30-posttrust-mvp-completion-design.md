# PostTrust MVP Completion Design

## Scope

Complete the existing MVP so homepage promises match working product behavior.

Included:

- Centered navigation and footer containers.
- Accurate landing-page copy and working account navigation.
- Passwordless email flow with visible confirmation and resend state.
- Full Post audit and a distinct basic Article audit.
- One Voice Profile per verified email account, generated from 3-5 sample posts.
- Automatic use of the Voice Profile in future rewrites.
- Basic audit history: list, open, and delete one audit.
- Stripe one-time packs, monthly renewals, and Customer Portal access.
- Privacy and Terms pages.

Excluded:

- Account deletion and data export.
- Automatic LinkedIn publishing.
- Advanced history filtering and search.
- Multiple Voice Profiles per account.

## Architecture

### Voice Profile

Add a `voice_profiles` table with a unique `user_id`, serialized source posts, serialized structured profile, and timestamps. `POST /api/voice-profile` validates 3-5 posts, generates a structured profile with Gemini, and upserts the single row. `GET` returns the current user's profile. Re-generating replaces the existing profile.

The structured profile contains summary, tone traits, rhythm rules, evidence habits, structure habits, phrases to avoid, and rewrite instructions. The audit endpoint loads the profile and includes it in the Gemini prompt. Voice Profile creation does not consume an audit credit; access is granted after a Voice Audit purchase.

### Article Audit

Post and Article share the result schema and result page, but use different instructions. Article supports up to 12,000 characters and emphasizes thesis clarity, section structure, evidence progression, repetition, and conclusion quality. Post remains limited to 3,000 characters and emphasizes LinkedIn-specific clichés and formatting.

### History

`/history` is server-rendered and limited to the newest 50 audits. Each item links to its result and can be deleted through an authenticated owner-only route. No filtering, search, export, or bulk actions.

### Billing

Checkout completion records Stripe customer and subscription IDs. One-time prices grant 3 or 10 credits. Monthly credits are granted from `invoice.paid`, keyed by Stripe Event ID for idempotency. Subscription status changes are reflected from `customer.subscription.updated` and `customer.subscription.deleted`. `/api/billing/portal` creates an authenticated Stripe Customer Portal session.

Voice Profile access is represented by a durable `voice_profile_enabled_at` timestamp on the user after the Voice Audit price is purchased. Monthly cancellation stops future grants but does not remove already granted credits.

### UI

Header and footer retain full-width backgrounds and borders, but all content sits in a shared `max-w-6xl` centered inner container. Logged-in navigation links to History, Voice Profile, and Billing. The landing page removes claims that cannot be verified and makes Quick Fix the primary first purchase.

## Error And Security Rules

- All routes authenticate on the server and enforce ownership.
- Voice samples and Article input are validated with Zod and bounded in length.
- Stripe webhooks use raw request bodies, signature verification, and unique event IDs.
- Stripe clients are initialized lazily.
- Marketing consent remains optional and separate from transactional email.
- User-facing errors do not expose provider responses or stack traces.

## Verification

- Unit tests cover plan mapping, Voice Profile validation/upsert semantics, audit input limits, and billing event-to-credit mapping.
- Production build must pass.
- Desktop and mobile screenshots verify centered layout and responsive controls.
- Manual flow checks cover sign-in confirmation, profile generation, Post/Article audit, history deletion, and billing portal error/success states.

