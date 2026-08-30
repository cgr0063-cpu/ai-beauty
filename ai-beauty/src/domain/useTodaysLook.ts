import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useTranslation } from "react-i18next";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useUserStore } from "@/state/userStore";
import { useSettingsStore } from "@/state/settingsStore";
import { getAIProvider } from "@/services/providers/ai";
import { getWeatherProvider } from "@/services/providers/weather/LocationWeatherProvider";
import { GeneratedLook, LookRequestInput } from "@/services/providers/ai/AIProvider";
import { ADDRESS_PRESETS } from "@/data/context";
import { useWardrobeStore } from "@/state/wardrobeStore";
import { useSavedLooksStore } from "@/state/savedLooksStore";
import { getWeeklyTrend, WeeklyTrendSnapshot } from "@/services/trends/weeklyTrends";


function lookPreferenceDetail(look: GeneratedLook) {
  const sectionSummary = look.sections.slice(0, 2).map((s) => `${s.title}: ${s.content}`).join(" | ");
  const colors = look.colorPaletteHex.slice(0, 4).join(", ");
  return `${look.title}${colors ? ` | colors: ${colors}` : ""}${sectionSummary ? ` | ${sectionSummary}` : ""}`.slice(0, 420);
}

function localDayKey(date = new Date()) {
  const y = date.getFullYear(); const m = String(date.getMonth()+1).padStart(2,"0"); const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

export function useTodaysLook() {
  const { i18n } = useTranslation(); const ctx = useTodayContextStore(); const user = useUserStore(); const settings = useSettingsStore();
  const closetItems = useWardrobeStore((s) => s.items);
  const savedLooks = useSavedLooksStore((s) => s.saved);
  const feedback = useSavedLooksStore((s) => s.feedback);
  const [look, setLook] = useState<GeneratedLook | null>(null); const [loading, setLoading] = useState(false); const [loadingLabel, setLoadingLabel] = useState("home.creatingLook"); const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const resetDayIfNeeded = useCallback(() => { const key = localDayKey(); if (useTodayContextStore.getState().dateKey !== key) useTodayContextStore.getState().startNewDay(key); }, []);
  useEffect(() => { resetDayIfNeeded(); const sub = AppState.addEventListener("change", (s) => { if (s === "active") resetDayIfNeeded(); }); return () => sub.remove(); }, [resetDayIfNeeded]);

  const buildInput = useCallback((weather?: { condition: LookRequestInput["weatherCondition"]; temperatureC: number | null }, trend: WeeklyTrendSnapshot | null = null, variationSeed = 0, previousLookSummary: LookRequestInput["previousLookSummary"] = null): LookRequestInput => {
    const addressOptions = ADDRESS_PRESETS[settings.language] ?? ADDRESS_PRESETS.en;
    const addressLabel = settings.addressId === "none" || settings.addressId === "name" ? null : addressOptions.find((a) => a.id === settings.addressId)?.label ?? null;
    return { moodId: ctx.moodId, planId: ctx.planId, gymSubOptionId: ctx.gymSubOptionId, styleId: ctx.styleId ?? user.favoriteStyleIds[0] ?? null,
      weatherCondition: weather?.condition ?? ctx.weatherCondition, temperatureC: weather?.temperatureC ?? ctx.temperatureC, interestedModules: user.interestedModules,
      tone: settings.tone, addressLabel, userName: settings.addressId === "name" ? user.name : null, zodiacSignId: user.zodiacSignId, tarotCardId: ctx.tarotCardId,
      languageCode: settings.language, selfieUri: settings.photoAiConsentAccepted ? user.selfieUri : null, age: user.age, favoriteColors: user.favoriteColors, dislikedColors: user.dislikedColors,
      beautyIntensityPreference: user.beautyIntensityPreference, coveragePreference: user.coveragePreference ?? "no_preference", socialContext: ctx.socialContext, companionName: ctx.companionName, companionZodiacSignId: ctx.companionZodiacSignId, previousLookSummary,
      closetSummary: closetItems.slice(0, 40).map((item) => ({ category: item.category, label: item.label, color: item.color ?? null, brand: item.brand ?? null, styleTags: item.styleTags })),
      savedPreferenceSignals: {
        likedTitles: savedLooks.filter((l) => feedback[l.id] === "love").slice(0, 12).map((l) => l.title),
        dislikedTitles: savedLooks.filter((l) => feedback[l.id] === "not_for_me").slice(0, 12).map((l) => l.title),
        bannedTitles: savedLooks.filter((l) => feedback[l.id] === "never").slice(0, 12).map((l) => l.title),
        likedDetails: savedLooks.filter((l) => feedback[l.id] === "love").slice(0, 8).map(lookPreferenceDetail),
        dislikedDetails: savedLooks.filter((l) => feedback[l.id] === "not_for_me").slice(0, 8).map(lookPreferenceDetail),
        bannedDetails: savedLooks.filter((l) => feedback[l.id] === "never").slice(0, 8).map(lookPreferenceDetail),
      }, weeklyTrend: trend, variationSeed };
  }, [ctx.moodId, ctx.planId, ctx.gymSubOptionId, ctx.styleId, ctx.weatherCondition, ctx.temperatureC, ctx.tarotCardId, user.favoriteStyleIds, user.interestedModules, user.name, user.zodiacSignId, user.selfieUri, settings.language, settings.addressId, settings.tone, settings.photoAiConsentAccepted, user.age, user.favoriteColors, user.dislikedColors, user.beautyIntensityPreference, user.coveragePreference, ctx.socialContext, ctx.companionName, ctx.companionZodiacSignId, closetItems, savedLooks, feedback]);

  const resolveWeather = useCallback(async () => {
    if (ctx.weatherCondition) return { condition: ctx.weatherCondition, temperatureC: ctx.temperatureC };
    setLoadingLabel("home.checkingWardrobe");
    try { const reading = await getWeatherProvider(settings.weatherAuto).getCurrentWeather({ regionCountryCode: settings.regionCountryCode }); ctx.setWeather(reading.condition, reading.temperatureC); return { condition: reading.condition, temperatureC: reading.temperatureC }; }
    catch { return undefined; }
  }, [ctx.weatherCondition, ctx.temperatureC, ctx.setWeather, settings.weatherAuto, settings.regionCountryCode]);

  const generate = useCallback(async () => { const seq = ++requestSeq.current; setLoading(true); setError(null); setLoadingLabel("home.creatingLook");
    try { const weather = await resolveWeather(); const trend = await getWeeklyTrend(settings.regionCountryCode); const result = await getAIProvider().generateTodaysLook(buildInput(weather, trend, Date.now())); if (seq === requestSeq.current) setLook(result); }
    catch { if (seq === requestSeq.current) setError("errors.generic"); } finally { if (seq === requestSeq.current) setLoading(false); }
  }, [buildInput, resolveWeather, settings.regionCountryCode]);

  const regenerate = useCallback(async (direction: "bolder" | "softer" | "office" | "dateNight" | "another") => { const seq=++requestSeq.current; setLoading(true); setError(null); setLoadingLabel("home.updatingLook");
    try { const trend = await getWeeklyTrend(settings.regionCountryCode); const previous = look ? { title: look.title, colorPaletteHex: look.colorPaletteHex, sectionKeys: look.sections.map((s) => s.key) } : null; const result=await getAIProvider().regenerateLook(buildInput(undefined, trend, Date.now(), previous), direction); if(seq===requestSeq.current) setLook(result); } catch { if(seq===requestSeq.current) setError("errors.generic"); } finally { if(seq===requestSeq.current) setLoading(false); }
  }, [buildInput, settings.regionCountryCode, look]);
  return { look, loading, loadingLabel, error, generate, regenerate };
}
