import { getPlanByPriceId, type ProductPlan } from "./plans.ts";

type PriceEnvironment = Partial<Record<ProductPlan["priceEnvKey"], string>>;

export interface BillingEntitlement {
  credits: number;
  enablesVoiceProfile: boolean;
  reason: string;
}

export function getCheckoutEntitlement(
  priceId: string,
  quantity = 1,
  env?: PriceEnvironment,
): BillingEntitlement | null {
  const plan = getPlanByPriceId(priceId, env);
  if (!plan || plan.recurring) return null;

  return {
    credits: plan.credits * quantity,
    enablesVoiceProfile: plan.enablesVoiceProfile,
    reason: `purchase_${plan.slug.replaceAll("-", "_")}`,
  };
}

export function getInvoiceEntitlement(
  priceId: string,
  env?: PriceEnvironment,
): BillingEntitlement | null {
  const plan = getPlanByPriceId(priceId, env);
  if (!plan?.recurring) return null;

  return {
    credits: plan.credits,
    enablesVoiceProfile: plan.enablesVoiceProfile,
    reason: `renewal_${plan.slug.replaceAll("-", "_")}`,
  };
}
