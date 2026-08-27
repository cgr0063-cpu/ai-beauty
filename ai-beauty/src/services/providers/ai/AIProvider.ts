import { WeatherCondition } from "@/data/context";
import { ToneId } from "@/data/context";

export interface LookRequestInput {
  moodId: string | null;
  planId: string | null;
  gymSubOptionId: string | null;
  styleId: string | null;
  weatherCondition: WeatherCondition | null;
  temperatureC: number | null;
  interestedModules: string[];
  tone: ToneId;
  addressLabel: string | null; // resolved display string, e.g. "Kanka" or null
  userName: string | null;
  zodiacSignId: string | null;
  tarotCardId: string | null;
  languageCode: string;
}

export interface LookSection {
  key: string; // matches beauty.sections.* i18n keys where possible
  title: string;
  content: string;
}

export interface GeneratedLook {
  id: string;
  title: string;
  sections: LookSection[];
  whyThisLook: string;
  todaysEnergy: string;
  colorPaletteHex: string[];
  source: "demo" | "remote";
}

export interface FitCheckInput {
  photoUri: string;
  planId: string | null;
  styleId: string | null;
  weatherCondition: WeatherCondition | null;
  closetItemLabels: string[];
}

export type FitCheckOutcome = "keep" | "adjust" | "swap" | "buy";

export interface FitCheckResult {
  outcome: FitCheckOutcome;
  confidence: "low" | "medium" | "high";
  whatWorks: string[];
  whatToChange: string[];
  why: string;
  closetAlternative: string | null;
  tailorAdvice: string[] | null;
  shopSuggestion: string | null;
  source: "demo" | "remote";
}

/**
 * Every AI capability the app needs goes through this interface.
 * Screens/hooks never call a vendor SDK directly — they call
 * `getAIProvider()` (see index.ts), which picks DemoAIProvider or
 * RemoteAIProvider based on whether EXPO_PUBLIC_API_BASE_URL is set.
 */
export interface AIProvider {
  generateTodaysLook(input: LookRequestInput): Promise<GeneratedLook>;
  regenerateLook(input: LookRequestInput, direction: "bolder" | "softer" | "office" | "dateNight" | "another"): Promise<GeneratedLook>;
  analyzeFitCheck(input: FitCheckInput): Promise<FitCheckResult>;
}
