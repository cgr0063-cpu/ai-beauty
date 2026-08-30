import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createAsyncStorageAdapter } from "@/services/storage/persist";
import { DEFAULT_THEME, ThemeId } from "@/design-system/themes";
import { LanguageCode } from "@/i18n";
import { ToneId } from "@/data/context";

interface SettingsState {
  themeId: ThemeId;
  language: LanguageCode;
  /** Region/country is intentionally decoupled from language (see i18n/index.ts). */
  regionCountryCode: string; // ISO 3166-1 alpha-2, e.g. "DE", "TR", "US"
  tone: ToneId;
  addressId: string; // key into ADDRESS_PRESETS[language]
  weatherAuto: boolean;
  manualWeatherCondition: string | null;
  notificationsEnabled: boolean;
  inactivityReminderEnabled: boolean;
  weeklyTrendNotificationsEnabled: boolean;
  savedLookReminderEnabled: boolean;
  photoAiConsentAccepted: boolean;
  defaultCameraFilterId: string;
  defaultCameraIntensity: number;
  setThemeId: (id: ThemeId) => void;
  setLanguage: (l: LanguageCode) => void;
  setRegion: (r: string) => void;
  setTone: (t: ToneId) => void;
  setAddressId: (a: string) => void;
  setWeatherAuto: (v: boolean) => void;
  setManualWeatherCondition: (c: string | null) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setInactivityReminderEnabled: (v: boolean) => void;
  setWeeklyTrendNotificationsEnabled: (v: boolean) => void;
  setSavedLookReminderEnabled: (v: boolean) => void;
  setPhotoAiConsentAccepted: (v: boolean) => void;
  setDefaultCameraStyle: (filterId: string, intensity: number) => void;
  reset: () => void;
}

const initialSettings = {
  themeId: DEFAULT_THEME,
  language: "en" as LanguageCode,
  regionCountryCode: "US",
  tone: "friendly" as ToneId,
  addressId: "none",
  weatherAuto: false,
  manualWeatherCondition: null as string | null,
  notificationsEnabled: false,
  inactivityReminderEnabled: false,
  weeklyTrendNotificationsEnabled: false,
  savedLookReminderEnabled: false,
  photoAiConsentAccepted: false,
  defaultCameraFilterId: "clean",
  defaultCameraIntensity: 40,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialSettings,
      setThemeId: (id) => set({ themeId: id }),
      setLanguage: (l) => set({ language: l }),
      setRegion: (r) => set({ regionCountryCode: r }),
      setTone: (t) => set({ tone: t }),
      setAddressId: (a) => set({ addressId: a }),
      setWeatherAuto: (v) => set({ weatherAuto: v }),
      setManualWeatherCondition: (c) => set({ manualWeatherCondition: c }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setInactivityReminderEnabled: (v) => set({ inactivityReminderEnabled: v }),
      setWeeklyTrendNotificationsEnabled: (v) => set({ weeklyTrendNotificationsEnabled: v }),
      setSavedLookReminderEnabled: (v) => set({ savedLookReminderEnabled: v }),
      setPhotoAiConsentAccepted: (v) => set({ photoAiConsentAccepted: v }),
      setDefaultCameraStyle: (filterId, intensity) =>
        set({ defaultCameraFilterId: filterId, defaultCameraIntensity: intensity }),
      reset: () => set({ ...initialSettings }),
    }),
    {
      name: "aibeauty.settings.v1",
      storage: createAsyncStorageAdapter(),
    }
  )
);
