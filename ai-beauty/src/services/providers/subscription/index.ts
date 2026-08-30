import { Platform } from "react-native";
import { SubscriptionProvider } from "./SubscriptionProvider";
import { DemoSubscriptionProvider } from "./DemoSubscriptionProvider";
import { RevenueCatSubscriptionProvider } from "./RevenueCatSubscriptionProvider";

const platformKey = Platform.OS === "ios"
  ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
  : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export const isRealBillingConfigured = !!platformKey;
const isDev = typeof __DEV__ !== "undefined" && __DEV__;

let cached: SubscriptionProvider | null = null;
export function getSubscriptionProvider(): SubscriptionProvider {
  if (cached) return cached;
  if (isRealBillingConfigured) cached = new RevenueCatSubscriptionProvider();
  else if (isDev) cached = new DemoSubscriptionProvider();
  else throw new Error("revenuecat_not_configured_for_production");
  return cached;
}
