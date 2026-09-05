import { z } from "zod";

const shortString = (max = 120) => z.string().trim().max(max);
const nullableId = z.union([shortString(80), z.null()]);

export const weeklyTrendSchema = z.object({
  source: shortString(160),
  sourceUrl: z.string().url().max(1000).optional(),
  fetchedAt: z.string().datetime({ offset: true }).or(z.string().datetime()),
  publishedAt: z.string().datetime({ offset: true }).or(z.string().datetime()).nullable().optional(),
  region: shortString(80),
  stale: z.boolean(),
  items: z.array(z.object({
    category: z.enum(["color", "clothing", "shoes", "accessory", "makeup", "hair", "seasonal"]),
    label: shortString(160),
    notes: shortString(500).optional(),
  }).passthrough()).max(30),
}).passthrough();

export const lookRequestSchema = z.object({
  moodId: nullableId,
  planId: nullableId,
  gymSubOptionId: nullableId,
  styleId: nullableId,
  weatherCondition: z.union([shortString(80), z.null()]),
  temperatureC: z.number().finite().min(-80).max(70).nullable(),
  interestedModules: z.array(shortString(60)).max(20),
  tone: shortString(80),
  addressLabel: z.union([shortString(80), z.null()]),
  userName: z.union([shortString(100), z.null()]),
  zodiacSignId: nullableId,
  tarotCardId: nullableId,
  languageCode: shortString(12),
  selfieUri: z.null().optional(),
  age: z.number().int().min(13).max(120).nullable(),
  favoriteColors: z.array(shortString(40)).max(20),
  dislikedColors: z.array(shortString(40)).max(20),
  beautyIntensityPreference: z.union([shortString(60), z.null()]),
  coveragePreference: z.enum(["no_preference", "more_coverage", "balanced", "more_open"]).default("no_preference"),
  socialContext: z.enum(["solo", "friends", "date", "partner"]).nullable().default(null),
  companionName: z.union([shortString(60), z.null()]).default(null),
  companionZodiacSignId: nullableId.default(null),
  previousLookSummary: z.object({ title: shortString(160), colorPaletteHex: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(12), sectionKeys: z.array(shortString(80)).max(20) }).strict().nullable().default(null),
  closetSummary: z.array(z.object({
    category: shortString(50),
    label: shortString(120),
    color: z.union([shortString(50), z.null()]),
    brand: z.union([shortString(80), z.null()]).default(null),
    styleTags: z.array(shortString(50)).max(12),
  })).max(100),
  savedPreferenceSignals: z.object({
    likedTitles: z.array(shortString(160)).max(50),
    dislikedTitles: z.array(shortString(160)).max(50),
    bannedTitles: z.array(shortString(160)).max(50),
    likedDetails: z.array(shortString(450)).max(20).default([]),
    dislikedDetails: z.array(shortString(450)).max(20).default([]),
    bannedDetails: z.array(shortString(450)).max(20).default([]),
  }),
  weeklyTrend: weeklyTrendSchema.nullable(),
  variationSeed: z.number().finite(),
}).strict();

export const regenerateDirectionSchema = z.enum(["bolder", "softer", "office", "dateNight", "another"]);

export const closetAnalyzeFieldsSchema = z.object({
  languageCode: shortString(12).default("en"),
}).strict();

export const fitCheckFieldsSchema = z.object({
  planId: z.union([shortString(80), z.null()]).default(null),
  styleId: z.union([shortString(80), z.null()]).default(null),
  weatherCondition: z.union([shortString(80), z.null()]).default(null),
  closetItemLabels: z.array(shortString(120)).max(100).default([]),
  languageCode: shortString(12).default("en"),
}).strict();

export const generatedLookSchema = z.object({
  id: z.string().trim().max(160).optional(),
  title: shortString(160),
  sections: z.array(z.object({
    key: shortString(80),
    title: shortString(120),
    content: shortString(900),
  }).strict()).min(1).max(20),
  whyThisLook: shortString(1200),
  todaysEnergy: shortString(500),
  colorPaletteHex: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(1).max(12),
}).strict();

export const fitCheckResultSchema = z.object({
  outcome: z.enum(["keep", "adjust", "swap", "buy"]),
  confidence: z.enum(["low", "medium", "high"]),
  whatWorks: z.array(shortString(500)).max(12),
  whatToChange: z.array(shortString(500)).max(12),
  why: shortString(1200),
  closetAlternative: z.union([shortString(500), z.null()]),
  tailorAdvice: z.union([z.array(shortString(500)).max(12), z.null()]),
  shopSuggestion: z.union([shortString(500), z.null()]),
  detectedItems: z.array(z.object({
    category: z.enum(["top", "bottom", "dress", "outerwear", "shoes", "accessory", "other"]),
    label: shortString(80),
    color: z.union([shortString(40), z.null()]),
    styleTags: z.array(shortString(50)).max(6),
    confidence: z.enum(["low", "medium", "high"]),
  }).strict()).max(6).default([]),
}).strict();

export const closetItemResultSchema = z.object({
  category: z.enum(["top", "bottom", "dress", "outerwear", "shoes", "accessory", "other"]),
  label: shortString(80),
  color: z.union([shortString(40), z.null()]),
  styleTags: z.array(shortString(50)).max(6),
  confidence: z.enum(["low", "medium", "high"]),
}).strict();
