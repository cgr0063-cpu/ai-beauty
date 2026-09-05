import { WeatherCondition } from "@/data/context";
import { ToneId } from "@/data/context";
import { WeeklyTrendSnapshot } from "@/services/trends/weeklyTrends";

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
  /** Local selfie URI. Remote provider uploads it as multipart; never persisted server-side. */
  selfieUri: string | null;
  age: number | null;
  favoriteColors: string[];
  dislikedColors: string[];
  beautyIntensityPreference: "very_light" | "light" | "medium" | "defined" | "glam" | null;
  coveragePreference: "no_preference" | "more_coverage" | "balanced" | "more_open";
  socialContext: "solo" | "friends" | "date" | "partner" | null;
  companionName: string | null;
  companionZodiacSignId: string | null;
  previousLookSummary: { title: string; colorPaletteHex: string[]; sectionKeys: string[] } | null;
  closetSummary: Array<{ category: string; label: string; color: string | null; brand: string | null; styleTags: string[] }>;
  savedPreferenceSignals: { likedTitles: string[]; dislikedTitles: string[]; bannedTitles: string[]; likedDetails: string[]; dislikedDetails: string[]; bannedDetails: string[] };
  weeklyTrend: WeeklyTrendSnapshot | null;
  /** Changes on explicit regenerate so "Another" cannot deterministically repeat the same demo look. */
  variationSeed: number;
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

export interface ClosetItemAnalysis {
  category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory" | "other";
  label: string;
  color: string | null;
  styleTags: string[];
  confidence: "low" | "medium" | "high";
}

export interface FitCheckInput {
  photoUri: string;
  planId: string | null;
  styleId: string | null;
  weatherCondition: WeatherCondition | null;
  closetItemLabels: string[];
  languageCode: string;
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
  detectedItems: ClosetItemAnalysis[];
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
  analyzeClosetItem(photoUri: string, languageCode: string): Promise<ClosetItemAnalysis>;
  /** Premium Store Mode product-photo classification. Server enforces Plus. */
  analyzeStoreProduct(photoUri: string, languageCode: string): Promise<ClosetItemAnalysis>;
}
