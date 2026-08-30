import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useUserStore } from "@/state/userStore";

export default function WelcomeScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const setOnboardingStarted = useUserStore((s) => s.setOnboardingStarted);
  const setGuest = useUserStore((s) => s.setGuest);

  const begin = () => {
    setOnboardingStarted(true);
    router.push("/(onboarding)/language");
  };

  const continueAsGuest = () => {
    setGuest(true);
    setOnboardingStarted(true);
    router.push("/(onboarding)/language");
  };

  return (
    <LinearGradient colors={[theme.colors.background, theme.colors.backgroundElevated]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <LinearGradient colors={theme.colors.accentGradient} style={styles.iconBadge}>
            <Sparkles color="#fff" size={32} />
          </LinearGradient>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t("onboarding.welcomeTitle")}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t("onboarding.welcomeSubtitle")}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button label={t("onboarding.getStarted")} onPress={begin} fullWidth size="lg" />
          <View style={{ height: 12 }} />
          <Button label={t("onboarding.signIn")} onPress={() => router.push("/(auth)/sign-in")} variant="secondary" fullWidth />
          <View style={{ height: 12 }} />
          <Button label={t("onboarding.continueAsGuest")} onPress={continueAsGuest} variant="ghost" fullWidth />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", padding: 24, paddingBottom: 32 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconBadge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  title: { fontSize: 30, fontWeight: "800", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: "center", lineHeight: 22, paddingHorizontal: 12 },
  actions: { width: "100%" },
});
