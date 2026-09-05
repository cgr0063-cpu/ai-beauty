// Weather -----------------------------------------------------------------
export type WeatherCondition = "hot" | "warm" | "cold" | "rainy" | "snowy" | "windy";

export const WEATHER_CONDITIONS: { id: WeatherCondition; label: string }[] = [
  { id: "hot", label: "Hot" },
  { id: "warm", label: "Warm" },
  { id: "cold", label: "Cold" },
  { id: "rainy", label: "Rainy" },
  { id: "snowy", label: "Snowy" },
  { id: "windy", label: "Windy" },
];

export type Season = "spring" | "summer" | "autumn" | "winter";

export function seasonFromDate(date: Date, hemisphereSouth = false): Season {
  const month = date.getMonth(); // 0-11
  let season: Season;
  if (month >= 2 && month <= 4) season = "spring";
  else if (month >= 5 && month <= 7) season = "summer";
  else if (month >= 8 && month <= 10) season = "autumn";
  else season = "winter";
  if (!hemisphereSouth) return season;
  const flip: Record<Season, Season> = { spring: "autumn", autumn: "spring", summer: "winter", winter: "summer" };
  return flip[season];
}

// Zodiac --------------------------------------------------------------------
export interface ZodiacSign {
  id: string;
  label: string;
  dateRange: string;
  accentColor: string;
  keyword: string;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { id: "aries", label: "Aries", dateRange: "Mar 21 – Apr 19", accentColor: "#E84C3D", keyword: "bold" },
  { id: "taurus", label: "Taurus", dateRange: "Apr 20 – May 20", accentColor: "#6E8B3D", keyword: "grounded" },
  { id: "gemini", label: "Gemini", dateRange: "May 21 – Jun 20", accentColor: "#E8C547", keyword: "playful" },
  { id: "cancer", label: "Cancer", dateRange: "Jun 21 – Jul 22", accentColor: "#B9D6E8", keyword: "soft" },
  { id: "leo", label: "Leo", dateRange: "Jul 23 – Aug 22", accentColor: "#E8A73D", keyword: "radiant" },
  { id: "virgo", label: "Virgo", dateRange: "Aug 23 – Sep 22", accentColor: "#8E7B5C", keyword: "polished" },
  { id: "libra", label: "Libra", dateRange: "Sep 23 – Oct 22", accentColor: "#E8B4C8", keyword: "balanced" },
  { id: "scorpio", label: "Scorpio", dateRange: "Oct 23 – Nov 21", accentColor: "#6E1E3A", keyword: "magnetic" },
  { id: "sagittarius", label: "Sagittarius", dateRange: "Nov 22 – Dec 21", accentColor: "#8E4EC6", keyword: "adventurous" },
  { id: "capricorn", label: "Capricorn", dateRange: "Dec 22 – Jan 19", accentColor: "#3D3D3D", keyword: "structured" },
  { id: "aquarius", label: "Aquarius", dateRange: "Jan 20 – Feb 18", accentColor: "#4C9CE8", keyword: "unconventional" },
  { id: "pisces", label: "Pisces", dateRange: "Feb 19 – Mar 20", accentColor: "#7BC6C4", keyword: "dreamy" },
];

// Tarot — full 22 Major Arcana ------------------------------------------------
export interface TarotCard {
  id: string;
  label: string;
  keyword: string;
  accentColor: string;
  messageSeed: string;
}

export const TAROT_MAJOR_ARCANA: TarotCard[] = [
  { id: "the_fool", label: "The Fool", keyword: "new beginnings", accentColor: "#F2C94C", messageSeed: "Today favors a light, open, spontaneous energy." },
  { id: "the_magician", label: "The Magician", keyword: "focus", accentColor: "#EB5757", messageSeed: "You have what you need — let today's look feel intentional." },
  { id: "the_high_priestess", label: "The High Priestess", keyword: "intuition", accentColor: "#2F4858", messageSeed: "A quieter, more mysterious mood suits today." },
  { id: "the_empress", label: "The Empress", keyword: "abundance", accentColor: "#6FCF97", messageSeed: "Soft, nurturing, sensory details feel right today." },
  { id: "the_emperor", label: "The Emperor", keyword: "structure", accentColor: "#B2542A", messageSeed: "Structured, grounded choices feel steady today." },
  { id: "the_hierophant", label: "The Hierophant", keyword: "tradition", accentColor: "#9B7653", messageSeed: "Classic, timeless choices resonate today." },
  { id: "the_lovers", label: "The Lovers", keyword: "connection", accentColor: "#EB6F92", messageSeed: "A warm, harmonious touch suits today." },
  { id: "the_chariot", label: "The Chariot", keyword: "momentum", accentColor: "#2D9CDB", messageSeed: "A confident, forward-moving energy fits today." },
  { id: "strength", label: "Strength", keyword: "quiet power", accentColor: "#D4A24C", messageSeed: "Calm confidence, not loudness, is today's note." },
  { id: "the_hermit", label: "The Hermit", keyword: "introspection", accentColor: "#4F4F4F", messageSeed: "A pared-back, minimal look matches today's mood." },
  { id: "wheel_of_fortune", label: "Wheel of Fortune", keyword: "change", accentColor: "#9B51E0", messageSeed: "Something a little different could be fun today." },
  { id: "justice", label: "Justice", keyword: "balance", accentColor: "#56CCF2", messageSeed: "Balanced, clean choices suit today." },
  { id: "the_hanged_man", label: "The Hanged Man", keyword: "pause", accentColor: "#6699CC", messageSeed: "A slower, comfortable approach fits today." },
  { id: "death", label: "Death / Transformation", keyword: "renewal", accentColor: "#333333", messageSeed: "A refreshed detail could feel meaningful today." },
  { id: "temperance", label: "Temperance", keyword: "harmony", accentColor: "#8FBFAF", messageSeed: "Balanced tones and easy pairing suit today." },
  { id: "the_devil", label: "The Devil", keyword: "boldness", accentColor: "#8B0000", messageSeed: "A little daring today wouldn't hurt." },
  { id: "the_tower", label: "The Tower", keyword: "shake-up", accentColor: "#1B1B1B", messageSeed: "Trying something unexpected could be freeing today." },
  { id: "the_star", label: "The Star", keyword: "hope", accentColor: "#56C1FF", messageSeed: "Light, hopeful, airy touches suit today." },
  { id: "the_moon", label: "The Moon", keyword: "softness", accentColor: "#5B5F97", messageSeed: "A dreamy, soft mood fits today." },
  { id: "the_sun", label: "The Sun", keyword: "joy", accentColor: "#F2C94C", messageSeed: "Bright, open, joyful energy suits today." },
  { id: "judgement", label: "Judgement", keyword: "clarity", accentColor: "#BB6BD9", messageSeed: "A clear, considered choice feels right today." },
  { id: "the_world", label: "The World", keyword: "completion", accentColor: "#27AE60", messageSeed: "A complete, well-rounded look suits today." },
];

// Fragrance families ---------------------------------------------------------
export const FRAGRANCE_FAMILIES = [
  { id: "fresh", label: "Fresh" },
  { id: "citrus", label: "Citrus" },
  { id: "floral", label: "Floral" },
  { id: "woody", label: "Woody" },
  { id: "musky", label: "Musky" },
  { id: "vanilla", label: "Vanilla" },
  { id: "amber", label: "Amber" },
  { id: "aquatic", label: "Aquatic" },
  { id: "spicy", label: "Spicy" },
];

// Accessories ------------------------------------------------------------
export const ACCESSORY_TYPES = [
  "bag",
  "earrings",
  "necklace",
  "watch",
  "bracelet",
  "glasses",
  "hat",
  "hair_accessory",
  "belt",
  "scarf",
] as const;

// Onboarding: tone & address presets -----------------------------------------
export type ToneId = "neutral" | "friendly" | "elegant" | "playful" | "motivational" | "concise";

export const TONE_OPTIONS: { id: ToneId; label: string }[] = [
  { id: "neutral", label: "Neutral" },
  { id: "friendly", label: "Friendly" },
  { id: "elegant", label: "Elegant" },
  { id: "playful", label: "Playful" },
  { id: "motivational", label: "Motivational" },
  { id: "concise", label: "Concise" },
];

/**
 * Address forms are opt-in and language/culture specific. Users pick these
 * themselves — never auto-assigned from gender or any inferred attribute.
 */
export const ADDRESS_PRESETS: Record<string, { id: string; label: string }[]> = {
  en: [
    { id: "name", label: "Use my name" },
    { id: "none", label: "No special address" },
    { id: "friend", label: "Friend" },
    { id: "love", label: "Love" },
    { id: "boss", label: "Boss" },
  ],
  tr: [
    { id: "name", label: "Adımı kullan" },
    { id: "none", label: "Özel hitap yok" },
    { id: "bro", label: "Bro" },
    { id: "kanka", label: "Kanka" },
    { id: "kanks", label: "Kanki / Kanks" },
    { id: "dostum", label: "Dostum" },
    { id: "askim", label: "Aşkım" },
    { id: "balim", label: "Balım" },
    { id: "guzelim", label: "Güzelim" },
    { id: "kraliçem", label: "Kraliçem" },
    { id: "prensesim", label: "Prensesim" },
    { id: "leydim", label: "Leydim" },
    { id: "sultanim", label: "Sultanım" },
    { id: "sahibem", label: "Sahibem" },
  ],
  ru: [
    { id: "name", label: "Используй моё имя" },
    { id: "none", label: "Без особого обращения" },
    { id: "friend", label: "Подруга/друг" },
    { id: "dear", label: "Дорогая/дорогой" },
    { id: "star", label: "Звезда" },
  ],
};

export const MODULE_OPTIONS = [
  "outfits",
  "makeup",
  "hair",
  "grooming",
  "skincare",
  "nails",
  "accessories",
  "fragrance",
  "fitnessLooks",
  "specialOccasions",
  "shopping",
] as const;

export type ModuleId = (typeof MODULE_OPTIONS)[number];
