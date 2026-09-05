import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import en from "./locales/en.json";
import tr from "./locales/tr.json";
import ru from "./locales/ru.json";

/**
 * Supported languages today. Adding a new language later only requires:
 *  1. src/i18n/locales/<code>.json (copy en.json and translate all keys)
 *  2. Registering it in `resources` and `SUPPORTED_LANGUAGES` below.
 * No other code changes are required — screens read via t("key"), never
 * hardcoded strings.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const RTL_LANGUAGES: string[] = ["ar"]; // reserved for future Arabic support

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  ru: { translation: ru },
};

function detectDefaultLanguage(): LanguageCode {
  const deviceLangs = Localization.getLocales?.() ?? [];
  for (const l of deviceLangs) {
    const code = l.languageCode as LanguageCode;
    if (SUPPORTED_LANGUAGES.some((s) => s.code === code)) return code;
  }
  return "en";
}

/**
 * Language and region are intentionally separate concerns.
 * - `language` (i18n) controls UI/AI copy.
 * - `regionCountryCode` (see settingsStore) controls weather/season/trend context.
 * A Russian-speaking user living in Germany can set language=ru, region=DE.
 */
i18n.use(initReactI18next).init({
  resources,
  lng: detectDefaultLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

export function setAppLanguage(code: LanguageCode) {
  i18n.changeLanguage(code);
}
