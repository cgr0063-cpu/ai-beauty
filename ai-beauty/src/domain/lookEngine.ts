import i18n from "@/i18n";
import { ZODIAC_SIGNS, TAROT_MAJOR_ARCANA, FRAGRANCE_FAMILIES } from "@/data/context";
import { GYM_SUBOPTIONS, getPlanById, isSafetyPriorityPlan } from "@/data/plans";
import { getStyleById } from "@/data/styles";
import { MOODS } from "@/data/moods";
import { GeneratedLook, LookRequestInput, LookSection } from "@/services/providers/ai/AIProvider";

/**
 * Decision philosophy (see product spec):
 *   understand person -> understand context -> narrow options -> recommend
 *   -> explain why -> let user modify.
 *
 * Priority order when signals conflict:
 *   1. Safety (weather / activity requirements)
 *   2. Practicality (plan/formality)
 *   3. Style preference
 *   4. Mood
 *   5. Zodiac / Tarot (small flavor only, never structural)
 *
 * All generated copy is pulled through i18next's `lookEngine.*` /
 * `styleLabels.*` / `planLabels.*` / `moodLabels.*` / `zodiacLabels.*` /
 * `zodiacKeywords.*` / `tarotLabels.*` / `tarotMessages.*` namespaces so the
 * offline demo engine produces fully localized EN/TR/RU output, matching
 * whatever language is active — not just the surrounding chrome.
 */

// Shorthand — resolves through the app's active language automatically.
const tr = (key: string, options?: Record<string, unknown>) => i18n.t(key, options) as string;

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function seedFromInput(input: LookRequestInput): number {
  const s = `${input.moodId}|${input.planId}|${input.styleId}|${input.weatherCondition}|${new Date().toDateString()}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function weatherAdjustedOutfitNote(weather: LookRequestInput["weatherCondition"], safetyPriority: boolean): string {
  if (!weather) return tr("lookEngine.outfit.breathable");
  switch (weather) {
    case "hot":
      return safetyPriority ? tr("lookEngine.outfit.hotSafety") : tr("lookEngine.outfit.hotNormal");
    case "warm":
      return tr("lookEngine.outfit.warm");
    case "cold":
      return safetyPriority ? tr("lookEngine.outfit.coldSafety") : tr("lookEngine.outfit.coldNormal");
    case "rainy":
      return safetyPriority ? tr("lookEngine.outfit.rainySafety") : tr("lookEngine.outfit.rainyNormal");
    case "snowy":
      return tr("lookEngine.outfit.snowy");
    case "windy":
      return tr("lookEngine.outfit.windy");
    default:
      return tr("lookEngine.outfit.defaultWeather");
  }
}

function sportOutfitNote(planId: string | null, gymSubOptionId: string | null): string | null {
  switch (planId) {
    case "crossfit":
      return tr("lookEngine.outfit.crossfit");
    case "gym_weights": {
      const subDef = GYM_SUBOPTIONS.find((s) => s.id === gymSubOptionId);
      const session = subDef ? tr(`planLabels.${subDef.id}`, { defaultValue: subDef.label }).toLowerCase() : tr("lookEngine.yourSession");
      return tr("lookEngine.outfit.gymWeights", { session });
    }
    case "pilates":
    case "yoga":
      return tr("lookEngine.outfit.pilatesYoga");
    case "hiit":
      return tr("lookEngine.outfit.hiit");
    case "running":
      return tr("lookEngine.outfit.running");
    case "cycling":
      return tr("lookEngine.outfit.cycling");
    case "outdoor_training":
      return tr("lookEngine.outfit.outdoorTraining");
    case "swimming":
      return tr("lookEngine.outfit.swimming");
    case "recovery_mobility":
      return tr("lookEngine.outfit.recoveryMobility");
    case "walking":
      return tr("lookEngine.outfit.walking");
    default:
      return null;
  }
}

export function buildTodaysLook(input: LookRequestInput): GeneratedLook {
  const seed = seedFromInput(input);
  const style = input.styleId ? getStyleById(input.styleId) : getStyleById(pick(["clean_girl", "casual_chic", "minimal", "old_money"], seed).toString()) ?? getStyleById("clean_girl")!;
  const plan = input.planId ? getPlanById(input.planId) : null;
  const mood = input.moodId ? MOODS.find((m) => m.id === input.moodId) : null;
  const safetyPriority = input.planId ? isSafetyPriorityPlan(input.planId) : false;

  const styleLabel = tr(`styleLabels.${style.id}`, { defaultValue: style.label });
  const planLabel = plan ? tr(`planLabels.${plan.id}`, { defaultValue: plan.label }) : null;
  const moodLabel = mood ? tr(`moodLabels.${mood.id}`, { defaultValue: mood.label }) : null;

  const sportNote = sportOutfitNote(input.planId, input.gymSubOptionId);
  const outfitNote = sportNote ?? weatherAdjustedOutfitNote(input.weatherCondition, safetyPriority);

  let intensityKey = "medium";
  const bias = mood?.intensityBias ?? 0;
  if (bias <= -2) intensityKey = "veryLight";
  else if (bias === -1) intensityKey = "light";
  else if (bias === 1) intensityKey = "defined";
  else if (bias >= 2) intensityKey = "glam";

  // Formality from plan tempers mood-driven boldness — practicality outranks mood.
  const formality = plan?.formality ?? 1;
  if (formality >= 3 && intensityKey === "glam") intensityKey = "defined";
  if (safetyPriority) intensityKey = "veryLight";
  const intensityWord = tr(`lookEngine.intensity.${intensityKey}`);

  const fragranceFamily = tr(`fragranceLabels.${pick(FRAGRANCE_FAMILIES, seed + 1).id}`, { defaultValue: pick(FRAGRANCE_FAMILIES, seed + 1).label });
  const fragranceFamily2 = tr(`fragranceLabels.${pick(FRAGRANCE_FAMILIES, seed + 7).id}`, { defaultValue: pick(FRAGRANCE_FAMILIES, seed + 7).label });

  const zodiac = input.zodiacSignId ? ZODIAC_SIGNS.find((z) => z.id === input.zodiacSignId) : null;
  const tarot = input.tarotCardId ? TAROT_MAJOR_ARCANA.find((t) => t.id === input.tarotCardId) : null;
  const zodiacLabel = zodiac ? tr(`zodiacLabels.${zodiac.id}`, { defaultValue: zodiac.label }) : null;
  const zodiacKeyword = zodiac ? tr(`zodiacKeywords.${zodiac.id}`, { defaultValue: zodiac.keyword }) : null;
  const tarotMessage = tarot ? tr(`tarotMessages.${tarot.id}`, { defaultValue: tarot.messageSeed }) : null;

  const sections: LookSection[] = [];
  const wantsModule = (m: string) => input.interestedModules.length === 0 || input.interestedModules.includes(m);

  if (wantsModule("skincare")) {
    sections.push({
      key: "skinPrep",
      title: "Skin prep",
      content:
        safetyPriority && (input.weatherCondition === "hot" || input.weatherCondition === "warm")
          ? tr("lookEngine.skinPrep.sun")
          : tr("lookEngine.skinPrep.normal"),
    });
  }
  if (wantsModule("makeup")) {
    sections.push({ key: "complexion", title: "Complexion", content: tr("lookEngine.complexion", { intensity: intensityWord }) });
    sections.push({
      key: "eyes",
      title: "Eyes",
      content: safetyPriority
        ? tr("lookEngine.eyesSafety")
        : intensityKey === "glam"
        ? tr("lookEngine.eyesGlamSmoky")
        : tr("lookEngine.eyesSoft"),
    });
    sections.push({ key: "brows", title: "Brows", content: tr("lookEngine.brows") });
    sections.push({
      key: "blush",
      title: "Blush",
      content: intensityKey === "veryLight" ? tr("lookEngine.blushBarelyThere") : tr("lookEngine.blush", { intensity: intensityWord }),
    });
    sections.push({ key: "lips", title: "Lips", content: intensityKey === "glam" ? tr("lookEngine.lipsGlam") : tr("lookEngine.lipsDefault") });
  }
  if (wantsModule("hair")) {
    sections.push({
      key: "hair",
      title: "Hair",
      content: safetyPriority ? tr("lookEngine.hairSafety") : tr("lookEngine.hairDefault"),
    });
  }
  if (wantsModule("grooming")) {
    sections.push({ key: "grooming", title: "Grooming", content: tr("lookEngine.grooming") });
  }
  if (wantsModule("nails")) {
    sections.push({ key: "nails", title: "Nails", content: safetyPriority ? tr("lookEngine.nailsSafety") : tr("lookEngine.nailsDefault") });
  }
  if (wantsModule("accessories")) {
    sections.push({
      key: "accessories",
      title: "Accessories",
      content: safetyPriority
        ? tr("lookEngine.accessoriesSafety")
        : style.detailNotes.includes("delicate")
        ? tr("lookEngine.accessoriesDelicate")
        : tr("lookEngine.accessoriesConsidered"),
    });
  }
  if (wantsModule("fragrance")) {
    sections.push({ key: "fragrance", title: "Fragrance", content: `${fragranceFamily} / ${fragranceFamily2}` });
  }
  if (wantsModule("outfits") || wantsModule("fitnessLooks")) {
    sections.push({ key: "outfit", title: "Outfit", content: outfitNote });
  }

  const whyParts: string[] = [];
  if (planLabel) whyParts.push(tr("lookEngine.partPlan", { plan: planLabel.toLowerCase() }));
  if (input.weatherCondition) whyParts.push(tr("lookEngine.partWeather"));
  if (styleLabel) whyParts.push(tr("lookEngine.partStyle", { style: styleLabel }));
  if (moodLabel) whyParts.push(tr("lookEngine.partMood", { mood: moodLabel.toLowerCase() }));

  const why =
    tr("lookEngine.whyIntro", { parts: whyParts.join(", ") || tr("lookEngine.whyNoParts") }) +
    (safetyPriority ? tr("lookEngine.whySafety") : "") +
    "." +
    (zodiacLabel ? tr("lookEngine.whyZodiac", { sign: zodiacLabel, keyword: zodiacKeyword }) : "") +
    (tarotMessage ? ` ${tarotMessage}` : "");

  const energy = moodLabel ? tr("lookEngine.energy", { mood: moodLabel }) : tr("lookEngine.energyBalanced");

  return {
    id: `look_${Date.now()}`,
    title: styleLabel,
    sections,
    whyThisLook: why,
    todaysEnergy: energy,
    colorPaletteHex: [...style.colorAccents, ...(zodiac ? [zodiac.accentColor] : [])],
    source: "demo",
  };
}

export function regenerateWithDirection(
  input: LookRequestInput,
  direction: "bolder" | "softer" | "office" | "dateNight" | "another"
): GeneratedLook {
  const adjusted: LookRequestInput = { ...input };
  if (direction === "bolder") {
    const mood = MOODS.find((m) => m.id === "bold");
    adjusted.moodId = mood?.id ?? input.moodId;
  } else if (direction === "softer") {
    const mood = MOODS.find((m) => m.id === "soft");
    adjusted.moodId = mood?.id ?? input.moodId;
  } else if (direction === "office") {
    adjusted.planId = "office_work";
  } else if (direction === "dateNight") {
    adjusted.planId = "date_night";
  }
  const base = buildTodaysLook(adjusted);
  return { ...base, id: `look_${Date.now()}_${direction}` };
}
