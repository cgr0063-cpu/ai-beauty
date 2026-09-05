export interface SubscriptionPlan {
  id: string;
  title: string;
  priceDisplay: string;
  period: "monthly" | "yearly";
  badge?: string;
}

export type EntitlementStatus = "free" | "plus";

export interface SubscriptionProvider {
  getOfferings(): Promise<SubscriptionPlan[]>;
  purchase(planId: string): Promise<EntitlementStatus>;
  restorePurchases(): Promise<EntitlementStatus>;
  getEntitlementStatus(): Promise<EntitlementStatus>;
  identifyUser(userId: string): Promise<void>;
  clearUserIdentity(): Promise<void>;
  subscribeEntitlementChanges(listener: (status: EntitlementStatus) => void): Promise<() => void>;
}
