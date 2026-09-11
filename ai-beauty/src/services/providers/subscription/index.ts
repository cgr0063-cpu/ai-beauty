import { Platform } from "react-native";
import { SubscriptionProvider } from "./SubscriptionProvider";
import { DemoSubscriptionProvider } from "./DemoSubscriptionProvider";
import { RevenueCatSubscriptionProvider } from "./RevenueCatSubscriptionProvider";
import { NoopSubscriptionProvider } from "./NoopSubscriptionProvider";

const platformKey = Platform.OS === "ios"
  ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
  : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export const isRealBillingConfigured = !!platformKey;
const isDev = typeof __DEV__ !== "undefined" && __DEV__;

/**
 * True when a production/preview build shipped without the RevenueCat key
 * baked in (e.g. an EAS build profile not linked to the right Environment
 * Variables "environment"). Read this where it's useful to surface a
 * warning to monitoring/UI — never use it to justify throwing from
 * getSubscriptionProvider(), which must always return a usable provider.
 */
export const isBillingMisconfigured = !isRealBillingConfigured && !isDev;

let cached: SubscriptionProvider | null = null;

export function getSubscriptionProvider(): SubscriptionProvider {
  if (cached) return cached;

  if (isRealBillingConfigured) {
    cached = new RevenueCatSubscriptionProvider();
  } else if (isDev) {
    cached = new DemoSubscriptionProvider();
  } else {
    if (__DEV__ !== true) {
      console.error(
        "[subscription] revenuecat_not_configured_for_production: falling back to no-op provider"
      );
    }

    cached = new NoopSubscriptionProvider();
  }

  return cached;
}
