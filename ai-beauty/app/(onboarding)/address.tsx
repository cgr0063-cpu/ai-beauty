import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Chip } from "@/design-system/components/Primitives";
import { OnboardingStep } from "./_OnboardingStep";
import { ADDRESS_PRESETS } from "@/data/context";
import { useSettingsStore } from "@/state/settingsStore";

export default function AddressScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((s) => s.language);
  const addressId = useSettingsStore((s) => s.addressId);
  const setAddressId = useSettingsStore((s) => s.setAddressId);

  const options = ADDRESS_PRESETS[language] ?? ADDRESS_PRESETS.en;
  const next = () => router.push("/(onboarding)/modules");

  return (
    <OnboardingStep
      title={t("onboarding.addressQuestion")}
      onSkip={next}
      skipLabel={t("common.skip")}
      primaryLabel={t("common.continue")}
      onPrimaryPress={next}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={addressId === opt.id}
            onPress={() => setAddressId(opt.id)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
