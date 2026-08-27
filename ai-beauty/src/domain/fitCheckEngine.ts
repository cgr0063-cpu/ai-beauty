import { FitCheckInput, FitCheckResult } from "@/services/providers/ai/AIProvider";
import { getPlanById } from "@/data/plans";

/**
 * Demo Fit Check reasoning. A real vision-capable backend replaces the
 * "signal extraction" step only — the KEEP/ADJUST/SWAP/BUY policy below
 * (closet-first, tailor-before-buy, BUY only for genuine gaps) is the
 * product's philosophy and should be mirrored by the remote implementation.
 */
export function evaluateFitCheck(input: FitCheckInput): FitCheckResult {
  const plan = input.planId ? getPlanById(input.planId) : null;
  const hasClosetMatch = input.closetItemLabels.length > 0;

  // Deterministic-but-varied demo heuristic based on a hash of the photo uri,
  // so repeated tries with the same photo are stable, different photos vary.
  let h = 0;
  for (let i = 0; i < input.photoUri.length; i++) h = (h * 31 + input.photoUri.charCodeAt(i)) | 0;
  const bucket = Math.abs(h) % 10;

  if (bucket < 4) {
    return {
      outcome: "keep",
      confidence: "high",
      whatWorks: [
        "The proportions read balanced for the occasion.",
        "Color palette works well together.",
      ],
      whatToChange: [],
      why: plan
        ? `This works well for ${plan.label.toLowerCase()} as-is — no changes needed.`
        : "This works well as-is — no changes needed.",
      closetAlternative: null,
      tailorAdvice: null,
      shopSuggestion: null,
      source: "demo",
    };
  }

  if (bucket < 7) {
    return {
      outcome: "adjust",
      confidence: "medium",
      whatWorks: ["The core pieces and color story are solid."],
      whatToChange: ["The hem or sleeve length could be refined for a cleaner line."],
      why: "A small tailoring adjustment would elevate this rather than buying something new.",
      closetAlternative: null,
      tailorAdvice: [
        "Shorten hem by roughly 2–3 cm for a cleaner break.",
        "Take in the waist slightly if the silhouette feels loose.",
      ],
      shopSuggestion: null,
      source: "demo",
    };
  }

  if (bucket < 9 && hasClosetMatch) {
    return {
      outcome: "swap",
      confidence: "medium",
      whatWorks: ["The top half of the look is working."],
      whatToChange: ["The bottom piece is fighting the rest of the outfit."],
      why: "You already own a better match for this — no need to buy anything.",
      closetAlternative: `Try ${input.closetItemLabels[0]} from your closet instead.`,
      tailorAdvice: null,
      shopSuggestion: null,
      source: "demo",
    };
  }

  return {
    outcome: "buy",
    confidence: "medium",
    whatWorks: ["The overall direction and color choice are good."],
    whatToChange: ["There's a genuine gap — nothing in your closet currently fills this role."],
    why: "This is a real wardrobe gap, not a styling problem, so a targeted purchase makes sense here.",
    closetAlternative: null,
    tailorAdvice: null,
    shopSuggestion: "Look for one versatile piece that fills this gap rather than several similar items.",
    source: "demo",
  };
}
