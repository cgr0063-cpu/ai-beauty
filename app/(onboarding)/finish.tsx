import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { Button } from "@/design-system/components/Button";
import { ScreenHeader } from "@/design-system/components/Primitives";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useUserStore } from "@/state/userStore";
import { useMediaFlowStore } from "@/state/mediaFlowStore";

export default function FinishScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const setOnboardingCompleted = useUserStore((s) => s.setOnboardingCompleted);
  const requestSelfieCapture = useMediaFlowStore((s) => s.requestSelfieCapture);

  const finishTo = (path: string) => {
    setOnboardingCompleted(true);
    router.replace(path as any);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="" />
      <View style={styles.container}>
        <View style={styles.hero}>
          <LinearGradient colors={theme.colors.accentGradient} style={styles.badge}>
            <Sparkles color="#fff" size={30} />
          </LinearGradient>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{t("onboarding.finishTitle")}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t("onboarding.finishSubtitle")}
          </Text>
        </View>
        <View>
          <Button
            label={t("onboarding.startWithSelfie")}
            onPress={() => { requestSelfieCapture(); finishTo("/(tabs)/home"); }}
            fullWidth
            size="lg"
          />
          <View style={{ height: 12 }} />
          <Button
            label={t("onboarding.createMyLook")}
            onPress={() => finishTo("/(tabs)/home")}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: "space-between", padding: 24, paddingBottom: 32 },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 21, paddingHorizontal: 16 },
});
