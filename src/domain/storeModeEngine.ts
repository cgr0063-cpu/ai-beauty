import { ClosetItem } from "@/state/wardrobeStore";
import { LookFeedback } from "@/state/savedLooksStore";
import { WeeklyTrendSnapshot } from "@/services/trends/weeklyTrends";
import { ClosetItemAnalysis } from "@/services/providers/ai/AIProvider";

export type StoreVerdict = "buy" | "consider" | "skip";

export interface StoreModeInput {
  product: string;
  productAnalysis?: ClosetItemAnalysis | null;
  store?: string;
  price?: number | null;
  budget?: number | null;
  closet: ClosetItem[];
  favoriteColors: string[];
  dislikedColors: string[];
  savedPreferenceSignals: Array<{ title: string; details?: string; feedback: LookFeedback }>;
  weeklyTrend: WeeklyTrendSnapshot | null;
}

export interface StoreModeDecision {
  verdict: StoreVerdict;
  duplicate: boolean;
  duplicateCount: number;
  compatibleClosetCount: number;
  compatibilityScore: number;
  topCompatibleLabels: string[];
  overBudget: boolean;
  dislikedColorMatch: boolean;
  favoriteColorMatch: boolean;
  trendSupport: string | null;
  analysisUsed: boolean;
  reasons: string[];
}

function norm(v: string | null | undefined) { return (v ?? "").trim().toLocaleLowerCase(); }
function words(v: string | null | undefined) { return norm(v).split(/[^\p{L}\p{N}]+/u).filter((x) => x.length > 2); }
function intersects(a: string[], b: string[]) { return a.some((x) => b.includes(x)); }

const COMPLEMENTS: Record<ClosetItem["category"], ClosetItem["category"][]> = {
  top: ["bottom", "outerwear", "shoes", "accessory"],
  bottom: ["top", "outerwear", "shoes", "accessory"],
  dress: ["outerwear", "shoes", "accessory"],
  outerwear: ["top", "bottom", "dress", "shoes", "accessory"],
  shoes: ["top", "bottom", "dress", "outerwear", "accessory"],
  accessory: ["top", "bottom", "dress", "outerwear", "shoes"],
  other: ["top", "bottom", "dress", "outerwear", "shoes", "accessory"],
};

const NEUTRALS = ["black", "white", "grey", "gray", "beige", "cream", "navy", "brown", "siyah", "beyaz", "gri", "bej", "lacivert", "kahverengi", "черный", "белый", "серый", "бежевый", "синий", "коричневый"];

function candidateText(input: StoreModeInput) {
  const a = input.productAnalysis;
  return norm([input.product, a?.label, a?.category, a?.color, ...(a?.styleTags ?? [])].filter(Boolean).join(" "));
}

function duplicateScore(item: ClosetItem, input: StoreModeInput): number {
  const a = input.productAnalysis;
  const itemText = norm(`${item.label} ${item.color ?? ""} ${item.category} ${item.styleTags.join(" ")}`);
  const tokens = words(candidateText(input));
  let score = tokens.length ? (tokens.filter((token) => itemText.includes(token)).length / Math.min(tokens.length, 5)) * 45 : 0;
  if (a && item.category === a.category) score += 30;
  if (a?.color && norm(item.color) === norm(a.color)) score += 15;
  if (a && intersects(item.styleTags.map(norm), a.styleTags.map(norm))) score += 10;
  return Math.min(100, Math.round(score));
}

function compatibilityScore(item: ClosetItem, input: StoreModeInput): number {
  const a = input.productAnalysis;
  if (!a) {
    const candidateTokens = words(input.product);
    const itemText = norm(`${item.label} ${item.color ?? ""} ${item.category} ${item.styleTags.join(" ")}`);
    const looksDuplicate = candidateTokens.length > 0 && candidateTokens.filter((x) => itemText.includes(x)).length >= Math.min(2, candidateTokens.length);
    return looksDuplicate ? 15 : 55;
  }

  let score = COMPLEMENTS[a.category]?.includes(item.category) ? 55 : item.category === a.category ? 20 : 40;
  const itemTags = item.styleTags.map(norm);
  const candidateTags = a.styleTags.map(norm);
  if (intersects(itemTags, candidateTags)) score += 20;

  const candidateColor = norm(a.color);
  const itemColor = norm(item.color);
  if (candidateColor && itemColor) {
    if (candidateColor === itemColor) score += 8;
    else if (NEUTRALS.includes(candidateColor) || NEUTRALS.includes(itemColor)) score += 12;
  }
  if (input.dislikedColors.some((c) => candidateColor.includes(norm(c)))) score -= 35;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function evaluateStoreMode(input: StoreModeInput): StoreModeDecision {
  const productText = candidateText(input);
  const duplicateItems = input.closet
    .map((item) => ({ item, score: duplicateScore(item, input) }))
    .filter((x) => x.score >= 65)
    .sort((a, b) => b.score - a.score);

  const compatibility = input.closet
    .map((item) => ({ item, score: compatibilityScore(item, input) }))
    .filter((x) => !duplicateItems.some((d) => d.item.id === x.item.id))
    .sort((a, b) => b.score - a.score);
  const compatible = compatibility.filter((x) => x.score >= 55);
  const compatibilityScoreValue = compatibility.length
    ? Math.round(compatibility.slice(0, 5).reduce((sum, x) => sum + x.score, 0) / Math.min(5, compatibility.length))
    : 0;

  const overBudget = !!input.price && !!input.budget && input.price > input.budget;
  const dislikedColorMatch = input.dislikedColors.some((c) => productText.includes(norm(c)));
  const favoriteColorMatch = input.favoriteColors.some((c) => productText.includes(norm(c)));
  const rejectedHistoryMatch = input.savedPreferenceSignals.some((signal) => (signal.feedback === "not_for_me" || signal.feedback === "never") && words(`${signal.title} ${signal.details ?? ""}`).some((w) => productText.includes(w)));
  const lovedHistoryMatch = input.savedPreferenceSignals.some((signal) => signal.feedback === "love" && words(`${signal.title} ${signal.details ?? ""}`).some((w) => productText.includes(w)));
  const trendHit = input.weeklyTrend?.items.find((item) => productText.includes(norm(item.label)) || words(item.label).some((w) => productText.includes(w)));
  const trendSupport = trendHit ? `${trendHit.category}: ${trendHit.label}` : null;

  const reasons: string[] = [];
  if (duplicateItems.length) reasons.push("duplicate");
  if (overBudget) reasons.push("over_budget");
  if (dislikedColorMatch) reasons.push("disliked_color");
  if (rejectedHistoryMatch) reasons.push("rejected_history");
  if (compatible.length >= 3) reasons.push("versatile");
  if (favoriteColorMatch) reasons.push("favorite_color");
  if (lovedHistoryMatch) reasons.push("loved_history");
  if (trendSupport) reasons.push(input.weeklyTrend?.stale ? "stale_trend_support" : "trend_support");
  if (!reasons.length) reasons.push("consider");

  let verdict: StoreVerdict = "consider";
  if (overBudget || duplicateItems.length > 0 || dislikedColorMatch || rejectedHistoryMatch) verdict = "skip";
  else if (input.closet.length >= 3 && compatible.length >= 3 && compatibilityScoreValue >= 58) verdict = "buy";

  return {
    verdict,
    duplicate: duplicateItems.length > 0,
    duplicateCount: duplicateItems.length,
    compatibleClosetCount: compatible.length,
    compatibilityScore: compatibilityScoreValue,
    topCompatibleLabels: compatible.slice(0, 3).map((x) => x.item.label),
    overBudget,
    dislikedColorMatch,
    favoriteColorMatch,
    trendSupport,
    analysisUsed: !!input.productAnalysis,
    reasons,
  };
}
