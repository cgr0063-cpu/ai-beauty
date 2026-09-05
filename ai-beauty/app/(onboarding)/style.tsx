import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Chip } from "@/design-system/components/Primitives";
import { OnboardingStep } from "./_OnboardingStep";
import { STYLES } from "@/data/styles";
import { useUserStore } from "@/state/userStore";

export default function StyleScreen() {
 const { t } = useTranslation(); const router = useRouter(); const selected = useUserStore((s) => s.favoriteStyleIds); const toggle = useUserStore((s) => s.toggleFavoriteStyle); const coverage = useUserStore((s) => s.coveragePreference); const setCoverage = useUserStore((s) => s.setCoveragePreference);
 const next = () => router.push("/(onboarding)/theme");
 return <OnboardingStep title={t("onboarding.interestsQuestion")} subtitle={t("onboarding.interestsSubtitle")} onSkip={next} skipLabel={t("common.skip")} primaryLabel={t("common.continue")} onPrimaryPress={next}>
   <View style={{ flexDirection:"row", flexWrap:"wrap" }}>{STYLES.map((s) => <Chip key={s.id} label={t(`styleLabels.${s.id}`, { defaultValue: s.label })} active={selected.includes(s.id)} onPress={() => toggle(s.id)} />)}</View><Text style={{ marginTop: 18, marginBottom: 8, fontWeight: "700", color: "#F5EAF2" }}>{t("onboarding.coverageQuestion")}</Text><View style={{ flexDirection:"row", flexWrap:"wrap" }}>{(["no_preference","more_coverage","balanced","more_open"] as const).map((id) => <Chip key={id} label={t(`coveragePreference.${id}`)} active={coverage===id} onPress={() => setCoverage(id)} />)}</View>
 </OnboardingStep>;
}
