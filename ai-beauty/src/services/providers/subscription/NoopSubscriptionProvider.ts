import { EntitlementStatus, SubscriptionPlan, SubscriptionProvider } from "./SubscriptionProvider";

/**
 * Used only when RevenueCat is NOT configured outside of development
 * (missing EXPO_PUBLIC_REVENUECAT_*_KEY in a production/preview build).
 *
 * This must never block authentication and must never grant a fake
 * entitlement the way DemoSubscriptionProvider intentionally does for local
 * sandbox testing. Every read resolves safely to "free"; every write is a
 * rejected no-op so it fails loudly if something ever tries to bill through it.
 */
export class NoopSubscriptionProvider implements SubscriptionProvider {
  async getOfferings(): Promise<SubscriptionPlan[]> {
    return [];
  }

  async purchase(_planId: string): Promise<EntitlementStatus> {
    throw new Error("billing_unavailable");
  }

  async restorePurchases(): Promise<EntitlementStatus> {
    return "free";
  }

  async getEntitlementStatus(): Promise<EntitlementStatus> {
    return "free";
  }

  async identifyUser(_userId: string): Promise<void> {}

  async clearUserIdentity(): Promise<void> {}

  async subscribeEntitlementChanges(_listener: (status: EntitlementStatus) => void): Promise<() => void> {
    return () => {};
  }
}
