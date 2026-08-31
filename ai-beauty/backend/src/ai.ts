import { generatedLookSchema, fitCheckResultSchema, closetItemResultSchema } from "./validation.js";

const apiKey = process.env.GEMINI_API_KEY;

export function isAIConfigured(): boolean {
  return !!apiKey;
}

const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").trim();

/**
 * Mirrors the priority order encoded in the mobile client's offline
 * `src/domain/lookEngine.ts`, so remote and demo output never contradict
 * each other conceptually:
 *   1. Safety (weather / activity requirements)
 *   2. Practicality (plan/formality)
 *   3. Style preference
 *   4. Mood
 *   5. Zodiac / Tarot — small flavor only, never structural
 *
 * Output is forced into strict JSON so the mobile client can render it
 * exactly like the demo engine's GeneratedLook shape.
 */
const LOOK_SYSTEM_PROMPT = `You are the styling engine behind "AI Beauty", a
beauty/fashion/grooming decision assistant. You never diagnose health
conditions, never comment on body weight, ethnicity or measurements, and
never body-shame. Weather/activity safety always outranks style; style
outranks mood; zodiac/tarot are small flavor touches only. If a selfie image is supplied, use only
visible, non-sensitive styling cues (for example current hair presentation, visible
makeup colors, garment colors and accessories) to make recommendations more
personal. Do not infer identity, ethnicity, health, attractiveness, body measurements
or other sensitive traits from the image. Never mention that you inferred a sensitive trait.
Use closetSummary before suggesting new purchases. Closet brand is user-entered metadata and may be used only as a practical styling hint, never as a status/value judgment. Respect favoriteColors/dislikedColors and explicit savedPreferenceSignals. Use saved detail signals only to infer broad recurring preferences such as palettes or garment directions; never copy an old look verbatim and never overfit from a small history. Respect coveragePreference only because the user explicitly selected it; never infer modesty, religion, culture, gender, or desired skin exposure from country, name, selfie, or other signals. If socialContext/companionName/companionZodiacSignId are supplied, use them only as light occasion context; never style the user to please another person at the expense of the user's own preferences. Companion zodiac is playful flavor only. If weeklyTrend is present, treat it only as a supporting signal. If weeklyTrend.stale is true, explicitly frame it as older trend data using its fetchedAt date; never call it current. If weeklyTrend is null, do not invent trend claims. For requestedAdjustment "another", materially change silhouette/palette/key pieces while still respecting safety and user preferences. If previousLookSummary is present, do not repeat its title/palette/key section direction; produce a visibly distinct alternative.

Respond with STRICT JSON matching this TypeScript type and nothing else,
no markdown fences, no commentary:

type LookSection = { key: string; title: string; content: string };
type GeneratedLook = {
  id: string;
  title: string;
  sections: LookSection[];
  whyThisLook: string;
  todaysEnergy: string;
  colorPaletteHex: string[];
};

If interestedModules is an empty array, treat it as "all modules" for backward compatibility. Otherwise only include sections for modules the user selected. Always produce at least one useful section; never return an empty sections array. Keep each section's content to 1-2 sentences. Write in the requested language (languageCode) and tone.`;

export interface LookGenerationRequest {
  moodId: string | null;
  planId: string | null;
  gymSubOptionId: string | null;
  styleId: string | null;
  weatherCondition: string | null;
  temperatureC: number | null;
  interestedModules: string[];
  tone: string;
  addressLabel: string | null;
  userName: string | null;
  zodiacSignId: string | null;
  tarotCardId: string | null;
  languageCode: string;
  selfieUri?: null;
  age: number | null;
  favoriteColors: string[];
  dislikedColors: string[];
  beautyIntensityPreference: string | null;
  coveragePreference: "no_preference" | "more_coverage" | "balanced" | "more_open";
  socialContext: "solo" | "friends" | "date" | "partner" | null;
  companionName: string | null;
  companionZodiacSignId: string | null;
  previousLookSummary: { title: string; colorPaletteHex: string[]; sectionKeys: string[] } | null;
  closetSummary: Array<{ category: string; label: string; color: string | null; brand: string | null; styleTags: string[] }>;
  savedPreferenceSignals: { likedTitles: string[]; dislikedTitles: string[]; bannedTitles: string[]; likedDetails: string[]; dislikedDetails: string[]; bannedDetails: string[] };
  weeklyTrend: any | null;
  variationSeed: number;
}

async function callGeminiForJSON(
  systemPrompt: string,
  userPrompt: string,
  image?: { imageBase64: string; mediaType: string },
  maxOutputTokens = 1200
): Promise<any> {
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const parts: any[] = [];

  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mediaType,
        data: image.imageBase64,
      },
    });
  }

  parts.push({ text: userPrompt });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Gemini API request failed (${response.status}): ${body.slice(0, 500)}`
    );
  }

  const payload: any = await response.json();

  const text = (payload?.candidates?.[0]?.content?.parts || [])
    .map((part: any) =>
      typeof part?.text === "string" ? part.text : ""
    )
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "");

  if (!text) {
    throw new Error("Gemini API returned no text content");
  }

  return JSON.parse(text);
}

export async function generateLook(input: LookGenerationRequest, selfie?: { imageBase64: string; mediaType: string }) {
  const result = await callGeminiForJSON(LOOK_SYSTEM_PROMPT, JSON.stringify(input), selfie);
  const parsed = generatedLookSchema.parse(result);
  return { ...parsed, id: parsed.id ?? `look_${Date.now()}` };
}

export async function regenerateLook(
  input: LookGenerationRequest,
  direction: "bolder" | "softer" | "office" | "dateNight" | "another",
  selfie?: { imageBase64: string; mediaType: string }
) {
  const prompt = JSON.stringify({ ...input, requestedAdjustment: direction });
  const result = await callGeminiForJSON(LOOK_SYSTEM_PROMPT, prompt, selfie);
  const parsed = generatedLookSchema.parse(result);
  return { ...parsed, id: parsed.id ?? `look_${Date.now()}_${direction}` };
}

const FIT_CHECK_SYSTEM_PROMPT = `You are the Fit Check engine for "AI Beauty".
You evaluate an outfit photo and respond with an honest, kind, practical
read — never a numerical attractiveness score, never a comment on the
person's body, weight, or worth. Use exactly one of four outcomes:
keep, adjust, swap, buy — in that order of preference. "buy" is a LAST
RESORT, only for a genuine wardrobe gap that closet items or a tailor
adjustment cannot solve. Never estimate or state exact body/garment measurements (cm, mm, inches, sizes) from a photo. For tailorAdvice use qualitative guidance such as waist take-in, hem, sleeve, shoulder or side-seam adjustment; when precision is needed say the tailor should measure it on the person.
If the photo isn't a clear, well-lit, front-facing
full-body shot, set confidence to "low" and explain briefly in the why field.
For detectedItems, list only clearly visible clothing/accessory pieces from the outfit (maximum 6). Do not infer hidden garments, brand, size, body measurements, identity, gender, age, ethnicity or price. If a piece is unclear, omit it rather than guessing.
Write every user-facing string in the requested languageCode.

Respond with STRICT JSON matching this TypeScript type, no markdown fences:

type FitCheckResult = {
  outcome: "keep" | "adjust" | "swap" | "buy";
  confidence: "low" | "medium" | "high";
  whatWorks: string[];
  whatToChange: string[];
  why: string;
  closetAlternative: string | null;
  tailorAdvice: string[] | null;
  shopSuggestion: string | null;
  detectedItems: Array<{
    category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory" | "other";
    label: string;
    color: string | null;
    styleTags: string[];
    confidence: "low" | "medium" | "high";
  }>;
};`;

export async function analyzeFitCheck(input: {
  imageBase64: string;
  mediaType: string;
  planId: string | null;
  styleId: string | null;
  weatherCondition: string | null;
  closetItemLabels: string[];
  languageCode: string;
}) {
  const result = await callGeminiForJSON(
    FIT_CHECK_SYSTEM_PROMPT,
    JSON.stringify({
      planId: input.planId,
      styleId: input.styleId,
      weatherCondition: input.weatherCondition,
      closetItemLabels: input.closetItemLabels,
      languageCode: input.languageCode,
    }),
    {
      imageBase64: input.imageBase64,
      mediaType: input.mediaType,
    },
    900
  );

  return fitCheckResultSchema.parse(result);
}

const CLOSET_ITEM_SYSTEM_PROMPT = `You classify one clothing/accessory photo for a wardrobe assistant.
Describe only the visible item. Do not infer the person's identity, body, health, ethnicity, age, gender or attractiveness.
If the photo is not clearly a clothing/accessory item, use category "other", confidence "low", and a neutral label.
Write label, color and styleTags in the requested language where natural. Return STRICT JSON only:
{
  "category": "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory" | "other",
  "label": string,
  "color": string | null,
  "styleTags": string[],
  "confidence": "low" | "medium" | "high"
}`;

export async function analyzeClosetItem(input: { imageBase64: string; mediaType: string; languageCode: string }) {
  const result = await callGeminiForJSON(
    CLOSET_ITEM_SYSTEM_PROMPT,
    JSON.stringify({ languageCode: input.languageCode }),
    { imageBase64: input.imageBase64, mediaType: input.mediaType }
  );
  return closetItemResultSchema.parse({
    category: result.category,
    label: typeof result.label === "string" ? result.label.trim().slice(0, 80) : result.label,
    color: typeof result.color === "string" ? result.color.trim().slice(0, 40) : result.color ?? null,
    styleTags: Array.isArray(result.styleTags) ? result.styleTags.slice(0, 6) : result.styleTags,
    confidence: result.confidence,
  });
}
