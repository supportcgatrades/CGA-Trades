import { isAccountCountryNigeria } from '../services/paymentRouting';

export interface RegionalLimits {
  isRegisteredNigeria: boolean;
  minDeposit: number;
  regularPlanMin: number;
  regularPlanMax: number;
}

/**
 * Returns regional limits determined strictly by BOTH:
 * Registered/account country + current CGA interface (Lite vs Beta).
 *
 * Rules:
 * - Nigeria + CGA Lite:
 *     Minimum Deposit: $10
 *     Regular Investment Plan Minimum: $10
 *     Regular Plan maximum remains existing maximum ($90,000)
 *     All other investment plans and their limits remain exactly unchanged.
 * - Nigeria + CGA Beta:
 *     Minimum Deposit: $100
 *     Regular Investment Plan Minimum: $100
 *     Regular Plan maximum remains existing maximum ($90,000)
 *     All other investment plans remain exactly unchanged.
 * - All other countries:
 *     Existing behavior ($100 minimum deposit, $100 regular plan minimum)
 */
export function getRegionalLimits(profile: any, isLite: boolean): RegionalLimits {
  const isRegisteredNigeria = isAccountCountryNigeria(profile);

  const minDeposit = (isRegisteredNigeria && isLite) ? 10 : 100;
  const regularPlanMin = (isRegisteredNigeria && isLite) ? 10 : 100;
  const regularPlanMax = 90000;

  return {
    isRegisteredNigeria,
    minDeposit,
    regularPlanMin,
    regularPlanMax,
  };
}

/**
 * Applies regional plan limits dynamically to the investment plans list.
 * Only the Regular Plan minimum is adjusted according to Nigeria + CGA Lite/Beta rules.
 * All other plans, ROI rates, durations, and logic remain untouched.
 */
export function applyRegionalPlanLimits(plans: any[], profile: any, isLite: boolean): any[] {
  const { regularPlanMin } = getRegionalLimits(profile, isLite);

  return (plans || []).map((plan: any) => {
    const id = (plan.id || plan.name || '').toLowerCase();
    if (id.includes('regular')) {
      return {
        ...plan,
        min: regularPlanMin,
      };
    }
    return plan;
  });
}
