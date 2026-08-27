import { AuthProvider } from "./AuthProvider";
import { DemoAuthProvider } from "./DemoAuthProvider";
import { RemoteAuthProvider } from "./RemoteAuthProvider";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const demoAuth = new DemoAuthProvider();
const remoteAuth = API_BASE_URL ? new RemoteAuthProvider(API_BASE_URL) : null;

/** Email/password always works — locally if no backend, synced if configured. */
export function getAuthProvider(): AuthProvider {
  return remoteAuth ?? demoAuth;
}

export const isBackendAuthConfigured = !!API_BASE_URL;

export const isGoogleSignInConfigured =
  isBackendAuthConfigured &&
  !!(
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  );

/** Apple sign-in also needs a native build (not Expo Go) + capability enabled; that can't be
 * detected at runtime, so this only reflects whether a backend exists to verify against. */
export const isAppleSignInConfigured = isBackendAuthConfigured;
