import { AIProvider } from "./AIProvider";
import { DemoAIProvider } from "./DemoAIProvider";
import { RemoteAIProvider } from "./RemoteAIProvider";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const isDev = typeof __DEV__ !== "undefined" && __DEV__;
export const isRemoteAIConfigured = !!API_BASE_URL;

let cached: AIProvider | null = null;
export function getAIProvider(): AIProvider {
  if (cached) return cached;
  if (API_BASE_URL) cached = new RemoteAIProvider(API_BASE_URL);
  else if (isDev) cached = new DemoAIProvider();
  else throw new Error("ai_backend_not_configured_for_production");
  return cached;
}
