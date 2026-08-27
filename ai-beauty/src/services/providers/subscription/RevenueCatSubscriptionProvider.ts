import { Platform } from "react-native";
import { EntitlementStatus, SubscriptionPlan, SubscriptionProvider } from "./SubscriptionProvider";

/**
 * Real RevenueCat integration. `react-native-purchases` is listed in
 * package.json; this file only imports it lazily so the app still boots
 * cleanly in environments where the native module hasn't been built yet
 * (e.g. Expo Go, which doesn't support custom native modules — this
 * provider requires a development build or EAS build to actually run).
 */
export class RevenueCatSubscriptionProvider implements SubscriptionProvider {
  private configured = false;

  private async ensureConfigured() {
    if (this.configured) return;
    const Purchases = (await import("react-native-purchases")).default;
    const apiKey =
      Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
    if (!apiKey) throw new Error("revenuecat_not_configured");
    Purchases.configure({ apiKey });
    this.configured = true;
  }

  async getOfferings(): Promise<SubscriptionPlan[]> {
    await this.ensureConfigured();
    const Purchases = (await import("react-native-purchases")).default;
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
    await this.ensureConfigured();
    const Purchases = (await import("react-native-purchases")).default;
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p: any) => p.identifier === planId);
    if (!pkg) throw new Error("plan_not_found");
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo.entitlements.active["plus"] ? "plus" : "free";
  }

  async restorePurchases(): Promise<EntitlementStatus> {
    await this.ensureConfigured();
    const Purchases = (await import("react-native-purchases")).default;
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo.entitlements.active["plus"] ? "plus" : "free";
  }

  async getEntitlementStatus(): Promise<EntitlementStatus> {
    await this.ensureConfigured();
    const Purchases = (await import("react-native-purchases")).default;
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active["plus"] ? "plus" : "free";
  }
}
