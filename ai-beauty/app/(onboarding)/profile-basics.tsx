import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { OnboardingStep } from "./_OnboardingStep";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useUserStore } from "@/state/userStore";

export default function ProfileBasicsScreen() {
  const { t } = useTranslation(); const { theme } = useAppTheme(); const router = useRouter();
  const storedName = useUserStore((s) => s.name); const storedAge = useUserStore((s) => s.age);
  const setName = useUserStore((s) => s.setName); const setAge = useUserStore((s) => s.setAge);
  const [name, setNameDraft] = useState(storedName ?? ""); const [age, setAgeDraft] = useState(storedAge ? String(storedAge) : "");
  const next = () => { const clean = name.trim(); if (clean) setName(clean); const n = Number(age); if (Number.isFinite(n) && n >= 13 && n <= 100) setAge(Math.round(n)); router.push("/(onboarding)/tone"); };
  return <OnboardingStep title={t("onboarding.basicsQuestion")} subtitle={t("onboarding.basicsSubtitle")} onSkip={next} skipLabel={t("common.skip")} primaryLabel={t("common.continue")} onPrimaryPress={next}>
    <View style={{ gap: 12 }}>
      <TextInput value={name} onChangeText={setNameDraft} placeholder={t("onboarding.namePlaceholder")} placeholderTextColor={theme.colors.textMuted} autoCapitalize="words" style={{ color: theme.colors.textPrimary, backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, padding: 14 }} />
      <TextInput value={age} onChangeText={setAgeDraft} placeholder={t("onboarding.agePlaceholder")} placeholderTextColor={theme.colors.textMuted} keyboardType="number-pad" maxLength={3} style={{ color: theme.colors.textPrimary, backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 14, padding: 14 }} />
    </View>
  </OnboardingStep>;
}
