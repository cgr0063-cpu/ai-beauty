import React from "react";
import { View, Text, ScrollView, StyleSheet, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Copy, Share2, Wrench } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { ScreenHeader, Card } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useMediaFlowStore } from "@/state/mediaFlowStore";

export default function TailorScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const advice = useMediaFlowStore((s) => s.tailorAdvice) ?? [];
  const text = advice.map((line, i) => `${i + 1}. ${line}`).join("\n");

  if (!advice.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title={t("tailor.title")} />
        <View style={styles.scroll}>
          <Card>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: theme.typography.title }}>{t("tailor.missingTitle")}</Text>
            <Text style={{ color: theme.colors.textSecondary, marginTop: 8, marginBottom: 16 }}>{t("tailor.missingBody")}</Text>
            <Button label={t("tailor.backToFitCheck")} onPress={() => router.replace("/(tabs)/fitcheck-entry")} fullWidth />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("tailor.title")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Wrench color={theme.colors.accent} size={22} />
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: theme.typography.title, marginLeft: 10 }}>{t("tailor.showToTailor")}</Text>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 16 }}>{t("tailor.instructions")}</Text>
          {advice.map((line, i) => (
            <View key={i} style={[styles.adviceRow, { backgroundColor: theme.colors.cardAlt, borderRadius: theme.radius.md }]}>
              <Text style={{ color: theme.colors.textPrimary, fontSize: 15 }}>{i + 1}. {line}</Text>
            </View>
          ))}
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 14 }}>{t("tailor.measureOnPerson")}</Text>
          <Button label={t("tailor.copy")} onPress={() => Clipboard.setStringAsync(text)} variant="secondary" fullWidth icon={<Copy size={17} color={theme.colors.textPrimary} />} />
          <View style={{ height: 10 }} />
          <Button label={t("tailor.share")} onPress={() => Share.share({ message: text })} fullWidth icon={<Share2 size={17} color="#fff" />} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ scroll: { padding: 20, paddingBottom: 40 }, adviceRow: { padding: 14, marginBottom: 10 } });
