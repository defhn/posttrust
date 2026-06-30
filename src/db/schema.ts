import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // We will generate custom IDs (e.g. usr_...) or UUIDs
  email: text("email").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  voiceProfileEnabledAt: timestamp("voice_profile_enabled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Magic Links table (for passwordless auth)
export const magicLinks = pgTable("magic_links", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // Session token hash
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Credit Ledger (transactional audits/purchases)
export const creditLedger = pgTable("credit_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(), // positive for purchase, negative for usage
  reason: text("reason").notNull(), // 'purchase_quick_fix', 'purchase_voice_audit', 'purchase_monthly_audit', 'audit_cost', 'free_credit'
  stripeEventId: text("stripe_event_id").unique(), // For webhook idempotency
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Purchases (Stripe session logs)
export const purchases = pgTable("purchases", {
  id: text("id").primaryKey(),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  status: text("status").notNull(), // 'completed', 'pending'
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audits table (saves audit results)
export const audits = pgTable("audits", {
  id: text("id").primaryKey(), // UUID/custom key
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  input: text("input").notNull(), // The pasted post draft
  options: text("options").notNull(), // JSON stringified target details: { type: 'post'|'article', audience: string, goal: string, tone: boolean }
  result: text("result").notNull(), // JSON stringified Gemini audit output (scores, annotations, rewrites)
  creditCost: integer("credit_cost").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// One Voice Profile per verified email account.
export const voiceProfiles = pgTable("voice_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  sourcePosts: text("source_posts").notNull(),
  profile: text("profile").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
