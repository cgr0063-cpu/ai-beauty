import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Chip } from "@/design-system/components/Primitives";
import { OnboardingStep } from "./_OnboardingStep";
import { SUPPORTED_LANGUAGES, setAppLanguage } from "@/i18n";
import { useSettingsStore } from "@/state/settingsStore";

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const choose = (code: typeof language) => { setLanguage(code); setAppLanguage(code); };
  return <OnboardingStep title={t("onboarding.languageQuestion")} primaryLabel={t("common.continue")} onPrimaryPress={() => router.push("/(onboarding)/profile-basics")}>
    <View style={{ gap: 10 }}>{SUPPORTED_LANGUAGES.map((l) => <Chip key={l.code} label={l.nativeLabel} active={language === l.code} onPress={() => choose(l.code)} />)}</View>
  </OnboardingStep>;
}
