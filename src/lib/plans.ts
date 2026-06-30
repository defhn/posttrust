export type PlanSlug = "quick-fix" | "voice-audit" | "monthly-audit";

export interface ProductPlan {
  slug: PlanSlug;
  name: string;
  credits: number;
  recurring: boolean;
  enablesVoiceProfile: boolean;
  priceEnvKey:
    | "STRIPE_PRICE_QUICK_FIX"
    | "STRIPE_PRICE_VOICE_AUDIT"
    | "STRIPE_PRICE_MONTHLY_AUDIT";
}

export const PLAN_CATALOG: Record<PlanSlug, ProductPlan> = {
  "quick-fix": {
    slug: "quick-fix",
    name: "Quick Fix",
    credits: 3,
    recurring: false,
    enablesVoiceProfile: false,
    priceEnvKey: "STRIPE_PRICE_QUICK_FIX",
  },
  "voice-audit": {
    slug: "voice-audit",
    name: "Voice Audit",
    credits: 10,
    recurring: false,
    enablesVoiceProfile: true,
    priceEnvKey: "STRIPE_PRICE_VOICE_AUDIT",
  },
  "monthly-audit": {
    slug: "monthly-audit",
    name: "Monthly Audit",
    credits: 30,
    recurring: true,
    enablesVoiceProfile: false,
    priceEnvKey: "STRIPE_PRICE_MONTHLY_AUDIT",
  },
};

export function getPlanBySlug(slug: PlanSlug): ProductPlan {
  return PLAN_CATALOG[slug];
}

export function getPlanByPriceId(
  priceId: string,
  env?: Partial<Record<ProductPlan["priceEnvKey"], string>>,
): ProductPlan | null {
  const source = env ?? process.env;
  return (
    Object.values(PLAN_CATALOG).find(
      (plan) => source[plan.priceEnvKey] && source[plan.priceEnvKey] === priceId,
    ) ?? null
  );
}
