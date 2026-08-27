import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { Wrench } from "lucide-react-native";
import { ScreenHeader, Card } from "@/design-system/components/Primitives";
import { useAppTheme } from "@/design-system/ThemeProvider";

export default function TailorScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ advice: string }>();

  let advice: string[] = [];
  try {
    advice = params.advice ? JSON.parse(params.advice) : [];
  } catch {
    advice = [];
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("tailor.title")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Wrench color={theme.colors.accent} size={22} />
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: theme.typography.title, marginLeft: 10 }}>
              {t("tailor.showToTailor")}
            </Text>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 16 }}>
            {t("tailor.instructions")}
          </Text>
          {advice.map((line, i) => (
            <View
              key={i}
              style={[styles.adviceRow, { backgroundColor: theme.colors.cardAlt, borderRadius: theme.radius.md }]}
            >
              <Text style={{ color: theme.colors.textPrimary, fontSize: 15 }}>{i + 1}. {line}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  adviceRow: { padding: 14, marginBottom: 10 },
});
