import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Chip } from "@/design-system/components/Primitives";
import { OnboardingStep } from "./_OnboardingStep";
import { MODULE_OPTIONS } from "@/data/context";
import { useUserStore } from "@/state/userStore";

export default function ModulesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const interestedModules = useUserStore((s) => s.interestedModules);
  const toggleModule = useUserStore((s) => s.toggleModule);

  const next = () => router.push("/(onboarding)/style");

  return (
    <OnboardingStep
      title={t("onboarding.modulesQuestion")}
      subtitle={t("onboarding.modulesSubtitle")}
      onSkip={next}
      skipLabel={t("common.skip")}
      primaryLabel={t("common.continue")}
      onPrimaryPress={next}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {MODULE_OPTIONS.map((m) => (
          <Chip
            key={m}
            label={t(`modules.${m}`)}
            active={interestedModules.includes(m)}
            onPress={() => toggleModule(m)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
