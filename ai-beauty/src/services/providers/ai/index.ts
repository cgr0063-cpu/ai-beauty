import { AIProvider, FitCheckInput, FitCheckResult, GeneratedLook, LookRequestInput } from "./AIProvider";
import { DemoAIProvider } from "./DemoAIProvider";
import { RemoteAIProvider } from "./RemoteAIProvider";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const demoProvider = new DemoAIProvider();
const remoteProvider = API_BASE_URL ? new RemoteAIProvider(API_BASE_URL) : null;

/**
 * Resilient wrapper: tries the remote provider (if configured), and
 * transparently falls back to the demo/local provider on any failure —
 * so a flaky network or unconfigured backend never breaks the app.
 * `source` on the result tells the UI which one actually answered, so
 * screens can show a subtle "offline suggestions" note when relevant.
 */
class ResilientAIProvider implements AIProvider {
  async generateTodaysLook(input: LookRequestInput): Promise<GeneratedLook> {
    if (remoteProvider) {
      try {
        return await remoteProvider.generateTodaysLook(input);
      } catch {
        // fall through to demo
      }
    }
    return demoProvider.generateTodaysLook(input);
  }

  async regenerateLook(
    input: LookRequestInput,
    direction: "bolder" | "softer" | "office" | "dateNight" | "another"
  ): Promise<GeneratedLook> {
    if (remoteProvider) {
      try {
        return await remoteProvider.regenerateLook(input, direction);
      } catch {
        // fall through to demo
      }
    }
    return demoProvider.regenerateLook(input, direction);
  }

  async analyzeFitCheck(input: FitCheckInput): Promise<FitCheckResult> {
    if (remoteProvider) {
      try {
        return await remoteProvider.analyzeFitCheck(input);
      } catch {
        // fall through to demo
      }
    }
    return demoProvider.analyzeFitCheck(input);
  }
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!cached) cached = new ResilientAIProvider();
  return cached;
}

export const isRemoteAIConfigured = !!API_BASE_URL;
