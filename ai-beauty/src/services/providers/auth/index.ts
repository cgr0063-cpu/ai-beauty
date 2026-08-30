import { Platform } from "react-native";
import { AuthProvider } from "./AuthProvider";
import { DemoAuthProvider } from "./DemoAuthProvider";
import { RemoteAuthProvider } from "./RemoteAuthProvider";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const isDev = typeof __DEV__ !== "undefined" && __DEV__;
const demoAuth = new DemoAuthProvider();
const remoteAuth = API_BASE_URL ? new RemoteAuthProvider(API_BASE_URL) : null;

if (API_BASE_URL && !isDev && !API_BASE_URL.startsWith("https://")) {
  throw new Error("production_api_requires_https");
}

export function getAuthProvider(): AuthProvider {
  if (remoteAuth) return remoteAuth;
  if (isDev) return demoAuth;
  throw new Error("backend_auth_not_configured_for_production");
}

export function getAuthProviderForScope(scope: "local" | "remote" | null): AuthProvider {
  if (scope === "remote") {
    if (!remoteAuth) throw new Error("remote_session_backend_missing");
    return remoteAuth;
  }
  if (scope === "local") return demoAuth;
  return getAuthProvider();
}

export const isBackendAuthConfigured = !!API_BASE_URL;
export const isGoogleSignInConfigured = isBackendAuthConfigured && (
  Platform.OS === "ios"
    ? !!process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
    : Platform.OS === "android"
      ? !!process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
      : !!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
);
export const isAppleSignInConfigured = isBackendAuthConfigured && Platform.OS === "ios";
