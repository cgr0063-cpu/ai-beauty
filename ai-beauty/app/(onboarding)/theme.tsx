import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react-native";
import { OnboardingStep } from "./_OnboardingStep";
import { themes, ThemeId } from "@/design-system/themes";
import { useAppTheme } from "@/design-system/ThemeProvider";

const THEME_ORDER: ThemeId[] = ["signature", "midnight", "minimalLight", "roseSoft"];

export default function ThemePickerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeId, setThemeId } = useAppTheme();

  const next = () => router.push("/(onboarding)/finish");

  return (
    <OnboardingStep
      title={t("onboarding.themeQuestion")}
      primaryLabel={t("common.continue")}
      onPrimaryPress={next}
    >
      <View style={{ gap: 12 }}>
        {THEME_ORDER.map((id) => {
          const th = themes[id];
          const selected = themeId === id;
          return (
            <Pressable
              key={id}
              onPress={() => setThemeId(id)}
              style={[
                styles.row,
                { backgroundColor: th.colors.card, borderRadius: 18, borderColor: selected ? th.colors.accent : th.colors.border, borderWidth: selected ? 2 : 1 },
              ]}
            >
              <View style={styles.swatches}>
                <View style={[styles.swatch, { backgroundColor: th.colors.background }]} />
                <View style={[styles.swatch, { backgroundColor: th.colors.accent }]} />
                <View style={[styles.swatch, { backgroundColor: th.colors.accentAlt }]} />
              </View>
              <Text style={{ color: th.colors.textPrimary, fontWeight: "700", flex: 1, marginLeft: 12 }}>
                {th.name}
              </Text>
              {selected ? <Check color={th.colors.accent} size={20} /> : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 16 },
  swatches: { flexDirection: "row" },
  swatch: { width: 22, height: 22, borderRadius: 11, marginRight: -8, borderWidth: 2, borderColor: "#00000022" },
});
