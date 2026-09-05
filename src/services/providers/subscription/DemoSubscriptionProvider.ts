import AsyncStorage from "@react-native-async-storage/async-storage";
import { EntitlementStatus, SubscriptionPlan, SubscriptionProvider } from "./SubscriptionProvider";

const ENTITLEMENT_KEY = "aibeauty.entitlement.sandbox.v1";

const PLANS: SubscriptionPlan[] = [
  { id: "plus_monthly", title: "AI Beauty Plus", priceDisplay: "$6.99", period: "monthly" },
  { id: "plus_yearly", title: "AI Beauty Plus", priceDisplay: "$49.99", period: "yearly", badge: "Best value" },
];

/**
 * No payment SDK is linked here — this is a local sandbox toggle so the
 * paywall UI and Plus-gated features (see savedLooksStore usage) can be
 * built and tested end-to-end before RevenueCat is configured. It can
 * never charge real money. Clearly surfaced to the user as "Sandbox mode"
 * in the paywall screen — never presented as a real purchase.
 */
export class DemoSubscriptionProvider implements SubscriptionProvider {
  async getOfferings(): Promise<SubscriptionPlan[]> {
    return PLANS;
  }

  async purchase(planId: string): Promise<EntitlementStatus> {
    if (!PLANS.some((p) => p.id === planId)) throw new Error("unknown_plan");
    await AsyncStorage.setItem(ENTITLEMENT_KEY, "plus");
    return "plus";
  }

  async restorePurchases(): Promise<EntitlementStatus> {
    return this.getEntitlementStatus();
  }

  async getEntitlementStatus(): Promise<EntitlementStatus> {
    const raw = await AsyncStorage.getItem(ENTITLEMENT_KEY);
    return raw === "plus" ? "plus" : "free";
  }

  async identifyUser(_userId: string): Promise<void> {}

  async clearUserIdentity(): Promise<void> {}

  async subscribeEntitlementChanges(_listener: (status: EntitlementStatus) => void): Promise<() => void> {
    return () => {};
  }
}
