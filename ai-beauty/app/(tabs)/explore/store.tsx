import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ScreenHeader, Card, Badge } from "@/design-system/components/Primitives";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useTodayContextStore } from "@/state/todayContextStore";
import { getTrendProvider, TrendItem } from "@/services/providers/trend/TrendProvider";

const VERDICT_TONE: Record<TrendItem["verdict"], "success" | "warning" | "accent"> = {
  buy: "success",
  consider: "warning",
  skip: "accent",
};

export default function StoreModeScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const ctx = useTodayContextStore();
  const [items, setItems] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getTrendProvider()
      .getStoreModeSuggestions({ styleId: ctx.styleId, closetGaps: [] })
      .then((res) => {
        if (!cancelled) {
          setItems(res);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("store.title")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
        )}
        {!loading &&
          items.map((item) => (
            <Card key={item.id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", flex: 1 }}>{item.title}</Text>
                <Badge text={t(`store.${item.verdict}`)} tone={VERDICT_TONE[item.verdict]} />
              </View>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 6 }}>{item.reason}</Text>
            </Card>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ scroll: { padding: 20, paddingBottom: 40 } });
