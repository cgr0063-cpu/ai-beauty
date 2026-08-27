import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export function isAIConfigured(): boolean {
  return !!apiKey;
}

const client = apiKey ? new Anthropic({ apiKey }) : null;

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
outranks mood; zodiac/tarot are small flavor touches only.

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

Only include sections for modules the user is actually interested in
(interestedModules in the request). Keep each section's content to 1-2
sentences. Write in the requested language (languageCode) and tone.`;

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
}

async function callClaudeForJSON(systemPrompt: string, userPrompt: string): Promise<any> {
  if (!client) throw new Error("ANTHROPIC_API_KEY not configured");
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(text);
}

export async function generateLook(input: LookGenerationRequest) {
  const result = await callClaudeForJSON(LOOK_SYSTEM_PROMPT, JSON.stringify(input));
  return { ...result, id: result.id ?? `look_${Date.now()}` };
}

export async function regenerateLook(
  input: LookGenerationRequest,
  direction: "bolder" | "softer" | "office" | "dateNight" | "another"
) {
  const prompt = JSON.stringify({ ...input, requestedAdjustment: direction });
  const result = await callClaudeForJSON(LOOK_SYSTEM_PROMPT, prompt);
  return { ...result, id: result.id ?? `look_${Date.now()}_${direction}` };
}

const FIT_CHECK_SYSTEM_PROMPT = `You are the Fit Check engine for "AI Beauty".
You evaluate an outfit photo and respond with an honest, kind, practical
read — never a numerical attractiveness score, never a comment on the
person's body, weight, or worth. Use exactly one of four outcomes:
keep, adjust, swap, buy — in that order of preference. "buy" is a LAST
RESORT, only for a genuine wardrobe gap that closet items or a tailor
adjustment cannot solve. If the photo isn't a clear, well-lit, front-facing
full-body shot, set confidence to "low" and explain briefly in the why field.

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
};`;

export async function analyzeFitCheck(input: {
  imageBase64: string;
  mediaType: string;
  planId: string | null;
  styleId: string | null;
  weatherCondition: string | null;
  closetItemLabels: string[];
}) {
  if (!client) throw new Error("ANTHROPIC_API_KEY not configured");
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    system: FIT_CHECK_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: input.mediaType as any, data: input.imageBase64 },
          },
          {
            type: "text",
            text: JSON.stringify({
              planId: input.planId,
              styleId: input.styleId,
              weatherCondition: input.weatherCondition,
              closetItemLabels: input.closetItemLabels,
            }),
          },
        ],
      },
    ],
  });
  const text = msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(text);
}
