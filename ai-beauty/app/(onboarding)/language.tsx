import React, { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Chip } from "@/design-system/components/Primitives";
import { OnboardingStep } from "./_OnboardingStep";
import { SUPPORTED_LANGUAGES, setAppLanguage } from "@/i18n";
import { useSettingsStore } from "@/state/settingsStore";
import { useUserStore } from "@/state/userStore";
import { getAuthProvider } from "@/services/providers/auth";
import { activateSession } from "@/services/sessionLifecycle";

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setGuest = useUserStore((s) => s.setGuest);
  const setOnboardingStarted = useUserStore((s) => s.setOnboardingStarted);
  const [loading, setLoading] = useState(false);

  const choose = (code: typeof language) => {
    setLanguage(code);
    setAppLanguage(code);
  };

  const continueOnboarding = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const existingUser = await getAuthProvider().getCurrentUser();

      if (!existingUser) {
        const result = await getAuthProvider().signInAsGuest();
        await activateSession(result.user, result.scope);
        setGuest(true);
      }

      setOnboardingStarted(true);
      router.push("/(onboarding)/profile-basics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingStep
      title={t("onboarding.languageQuestion")}
      primaryLabel={t("common.continue")}
      onPrimaryPress={continueOnboarding}
    >
      <View style={{ gap: 10 }}>
        {SUPPORTED_LANGUAGES.map((l) => (
          <Chip
            key={l.code}
            label={l.nativeLabel}
            active={language === l.code}
            onPress={() => choose(l.code)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
