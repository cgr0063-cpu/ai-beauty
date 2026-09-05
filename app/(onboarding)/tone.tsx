import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Chip } from "@/design-system/components/Primitives";
import { OnboardingStep } from "./_OnboardingStep";
import { TONE_OPTIONS } from "@/data/context";
import { useSettingsStore } from "@/state/settingsStore";

export default function ToneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const tone = useSettingsStore((s) => s.tone);
  const setTone = useSettingsStore((s) => s.setTone);

  const next = () => router.push("/(onboarding)/address");

  return (
    <OnboardingStep
      title={t("onboarding.toneQuestion")}
      onSkip={next}
      skipLabel={t("common.skip")}
      primaryLabel={t("common.continue")}
      onPrimaryPress={next}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {TONE_OPTIONS.map((opt) => (
          <Chip
            key={opt.id}
            label={t(`onboarding.tone.${opt.id}`)}
            active={tone === opt.id}
            onPress={() => setTone(opt.id)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
