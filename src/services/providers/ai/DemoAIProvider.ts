import { AIProvider, ClosetItemAnalysis, FitCheckInput, FitCheckResult, GeneratedLook, LookRequestInput } from "./AIProvider";
import { buildTodaysLook, regenerateWithDirection } from "@/domain/lookEngine";
import { evaluateFitCheck } from "@/domain/fitCheckEngine";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fully offline provider. Used automatically whenever EXPO_PUBLIC_API_BASE_URL
 * is not configured, and as the automatic fallback if RemoteAIProvider fails
 * (see index.ts). Guarantees the app is useful with zero backend setup.
 */
export class DemoAIProvider implements AIProvider {
  async generateTodaysLook(input: LookRequestInput): Promise<GeneratedLook> {
    await delay(900);
    return buildTodaysLook(input);
  }

  async regenerateLook(
    input: LookRequestInput,
    direction: "bolder" | "softer" | "office" | "dateNight" | "another"
  ): Promise<GeneratedLook> {
    await delay(700);
    return regenerateWithDirection(input, direction);
  }

  async analyzeClosetItem(_photoUri: string, _languageCode: string): Promise<ClosetItemAnalysis> {
    throw new Error("closet_visual_analysis_requires_remote_ai");
  }

  async analyzeStoreProduct(_photoUri: string, _languageCode: string): Promise<ClosetItemAnalysis> {
    throw new Error("store_visual_analysis_requires_remote_ai");
  }

  async analyzeFitCheck(input: FitCheckInput): Promise<FitCheckResult> {
    await delay(1100);
    return evaluateFitCheck(input);
  }
}
