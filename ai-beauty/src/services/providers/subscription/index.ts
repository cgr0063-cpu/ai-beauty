import { SubscriptionProvider, EntitlementStatus, SubscriptionPlan } from "./SubscriptionProvider";
import { DemoSubscriptionProvider } from "./DemoSubscriptionProvider";
import { RevenueCatSubscriptionProvider } from "./RevenueCatSubscriptionProvider";

const hasRevenueCatKey =
  !!process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || !!process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export const isRealBillingConfigured = hasRevenueCatKey;

const demo = new DemoSubscriptionProvider();
const revenueCat = hasRevenueCatKey ? new RevenueCatSubscriptionProvider() : null;

/** Falls back to the local sandbox provider on any RevenueCat error (e.g. running in Expo Go
 * without a dev build, or the native module not yet linked) so the paywall never hard-crashes. */
class ResilientSubscriptionProvider implements SubscriptionProvider {
  async getOfferings(): Promise<SubscriptionPlan[]> {
    if (revenueCat) {
      try {
        return await revenueCat.getOfferings();
      } catch {
        /* fall through */
      }
    }
    return demo.getOfferings();
  }
  async purchase(planId: string): Promise<EntitlementStatus> {
    if (revenueCat) {
      try {
        return await revenueCat.purchase(planId);
      } catch {
        /* fall through */
      }
    }
    return demo.purchase(planId);
  }
  async restorePurchases(): Promise<EntitlementStatus> {
    if (revenueCat) {
      try {
        return await revenueCat.restorePurchases();
      } catch {
        /* fall through */
      }
    }
    return demo.restorePurchases();
  }
  async getEntitlementStatus(): Promise<EntitlementStatus> {
    if (revenueCat) {
      try {
        return await revenueCat.getEntitlementStatus();
      } catch {
        /* fall through */
      }
    }
    return demo.getEntitlementStatus();
  }
}

let cached: SubscriptionProvider | null = null;
export function getSubscriptionProvider(): SubscriptionProvider {
  if (!cached) cached = new ResilientSubscriptionProvider();
  return cached;
}
