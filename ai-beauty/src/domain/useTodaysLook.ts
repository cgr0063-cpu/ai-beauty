import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useUserStore } from "@/state/userStore";
import { useSettingsStore } from "@/state/settingsStore";
import { getAIProvider } from "@/services/providers/ai";
import { getWeatherProvider } from "@/services/providers/weather/LocationWeatherProvider";
import { GeneratedLook, LookRequestInput } from "@/services/providers/ai/AIProvider";
import { ADDRESS_PRESETS } from "@/data/context";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useTodaysLook() {
  const { i18n } = useTranslation();
  const ctx = useTodayContextStore();
  const user = useUserStore();
  const settings = useSettingsStore();

  const [look, setLook] = useState<GeneratedLook | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string>("home.creatingLook");
  const [error, setError] = useState<string | null>(null);

  // Restore/reset the day's context automatically.
  useEffect(() => {
    if (ctx.dateKey !== todayKey()) {
      ctx.startNewDay(todayKey());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildInput = useCallback((): LookRequestInput => {
    const addressOptions = ADDRESS_PRESETS[settings.language] ?? ADDRESS_PRESETS.en;
    const addressLabel =
      settings.addressId === "none" || settings.addressId === "name"
        ? null
        : addressOptions.find((a) => a.id === settings.addressId)?.label ?? null;

    return {
      moodId: ctx.moodId,
      planId: ctx.planId,
      gymSubOptionId: ctx.gymSubOptionId,
      styleId: ctx.styleId ?? user.favoriteStyleIds[0] ?? null,
      weatherCondition: ctx.weatherCondition,
      temperatureC: ctx.temperatureC,
      interestedModules: user.interestedModules,
      tone: settings.tone,
      addressLabel,
      userName: settings.addressId === "name" ? user.name : null,
      zodiacSignId: user.zodiacSignId,
      tarotCardId: ctx.tarotCardId,
      languageCode: i18n.language,
    };
  }, [ctx, user, settings, i18n.language]);

  const ensureWeather = useCallback(async () => {
    if (ctx.weatherCondition) return;
    setLoadingLabel("home.checkingWardrobe");
    const provider = getWeatherProvider(settings.weatherAuto);
    const reading = await provider.getCurrentWeather({ regionCountryCode: settings.regionCountryCode });
    ctx.setWeather(reading.condition, reading.temperatureC);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.weatherCondition, settings.weatherAuto, settings.regionCountryCode]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingLabel("home.creatingLook");
    try {
      await ensureWeather();
      const provider = getAIProvider();
      const result = await provider.generateTodaysLook(buildInput());
      setLook(result);
    } catch (e) {
      setError("errors.generic");
    } finally {
      setLoading(false);
    }
  }, [buildInput, ensureWeather]);

  const regenerate = useCallback(
    async (direction: "bolder" | "softer" | "office" | "dateNight" | "another") => {
      setLoading(true);
      setError(null);
      setLoadingLabel("home.updatingLook");
      try {
        const provider = getAIProvider();
        const result = await provider.regenerateLook(buildInput(), direction);
        setLook(result);
      } catch {
        setError("errors.generic");
      } finally {
        setLoading(false);
      }
    },
    [buildInput]
  );

  return { look, loading, loadingLabel, error, generate, regenerate };
}
