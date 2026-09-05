import { Platform } from "react-native";
import { EntitlementStatus, SubscriptionPlan, SubscriptionProvider } from "./SubscriptionProvider";

export class RevenueCatSubscriptionProvider implements SubscriptionProvider {
  private configured = false;

  private async purchases() {
    const Purchases = (await import("react-native-purchases")).default;
    if (!this.configured) {
      const apiKey = Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
      if (!apiKey) throw new Error("revenuecat_not_configured_for_platform");
      Purchases.configure({ apiKey });
      this.configured = true;
    }
    return Purchases;
  }

  async identifyUser(userId: string): Promise<void> {
    const Purchases = await this.purchases();
    await Purchases.logIn(userId);
  }

  async clearUserIdentity(): Promise<void> {
    const Purchases = await this.purchases();
    const info = await Purchases.getCustomerInfo();
    if (!info.originalAppUserId.startsWith("$RCAnonymousID:")) await Purchases.logOut();
  }

  async getOfferings(): Promise<SubscriptionPlan[]> {
    const Purchases = await this.purchases();
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    return current.availablePackages.map((pkg: any) => ({
      id: pkg.identifier,
      title: pkg.product.title,
      priceDisplay: pkg.product.priceString,
      period: pkg.packageType === "ANNUAL" ? "yearly" : "monthly",
    }));
  }

  async purchase(planId: string): Promise<EntitlementStatus> {
    const Purchases = await this.purchases();
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p: any) => p.identifier === planId);
    if (!pkg) throw new Error("plan_not_found");
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active["plus"] ? "plus" : "free";
  }

  async restorePurchases(): Promise<EntitlementStatus> {
    const Purchases = await this.purchases();
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active["plus"] ? "plus" : "free";
  }

  async getEntitlementStatus(): Promise<EntitlementStatus> {
    const Purchases = await this.purchases();
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active["plus"] ? "plus" : "free";
  }

  async subscribeEntitlementChanges(listener: (status: EntitlementStatus) => void): Promise<() => void> {
    const Purchases = await this.purchases();
    const callback = (customerInfo: any) => {
      listener(customerInfo?.entitlements?.active?.["plus"] ? "plus" : "free");
    };
    Purchases.addCustomerInfoUpdateListener(callback);
    return () => Purchases.removeCustomerInfoUpdateListener(callback);
  }
}
