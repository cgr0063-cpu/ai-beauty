import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle2, Wrench, RefreshCcw, ShoppingBag } from "lucide-react-native";
import { ScreenHeader, Card, ComingSoonNotice } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useWardrobeStore } from "@/state/wardrobeStore";
import { getAIProvider } from "@/services/providers/ai";
import { FitCheckResult, FitCheckOutcome } from "@/services/providers/ai/AIProvider";

const OUTCOME_META: Record<FitCheckOutcome, { icon: (c: string) => React.ReactNode; tone: "success" | "warning" | "accent" }> = {
  keep: { icon: (c) => <CheckCircle2 color={c} size={22} />, tone: "success" },
  adjust: { icon: (c) => <Wrench color={c} size={22} />, tone: "warning" },
  swap: { icon: (c) => <RefreshCcw color={c} size={22} />, tone: "accent" },
  buy: { icon: (c) => <ShoppingBag color={c} size={22} />, tone: "warning" },
};

export default function FitCheckResultScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ photoUri: string }>();
  const ctx = useTodayContextStore();
  const closetItems = useWardrobeStore((s) => s.items);

  const [result, setResult] = useState<FitCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const provider = getAIProvider();
      const res = await provider.analyzeFitCheck({
        photoUri: params.photoUri,
        planId: ctx.planId,
        styleId: ctx.styleId,
        weatherCondition: ctx.weatherCondition,
        closetItemLabels: closetItems.map((i) => i.label),
      });
      if (!cancelled) {
        setResult(res);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.photoUri]);

  const meta = result ? OUTCOME_META[result.outcome] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("fitCheck.title")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {params.photoUri && (
          <Image source={{ uri: params.photoUri }} style={styles.photo} resizeMode="cover" />
        )}

        {loading && (
          <Card style={{ marginTop: 16 }}>
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>{t("fitCheck.analyzing")}</Text>
            </View>
          </Card>
        )}

        {!loading && result && (
          <>
            {result.confidence === "low" && (
              <Card style={{ marginTop: 16 }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t("fitCheck.lowConfidence")}</Text>
              </Card>
            )}

            <Card style={{ marginTop: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                {meta?.icon(theme.colors[meta.tone === "accent" ? "accent" : meta.tone])}
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.title,
                    fontWeight: "800",
                    marginLeft: 10,
                  }}
                >
                  {t(`fitCheck.outcome${cap(result.outcome)}`)}
                </Text>
              </View>

              <Section title={t("fitCheck.whatWorks")} items={result.whatWorks} color={theme.colors.success} />
              {result.whatToChange.length > 0 && (
                <Section title={t("fitCheck.whatToChange")} items={result.whatToChange} color={theme.colors.warning} />
              )}

              <View style={{ marginTop: 8 }}>
                <Text style={{ color: theme.colors.accent, fontWeight: "700", fontSize: 12, marginBottom: 4 }}>
                  {t("fitCheck.why")}
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18 }}>{result.why}</Text>
              </View>

              {result.closetAlternative && (
                <InfoBox label={t("fitCheck.closetAlternative")} text={result.closetAlternative} theme={theme} />
              )}
              {result.shopSuggestion && (
                <InfoBox label={t("fitCheck.shopOnlyIfNeeded")} text={result.shopSuggestion} theme={theme} />
              )}
            </Card>

            {result.outcome === "adjust" && result.tailorAdvice && (
              <View style={{ marginTop: 12 }}>
                <Button
                  label={t("tailor.title")}
                  onPress={() =>
                    router.push({
                      pathname: "/fitcheck/tailor",
                      params: { advice: JSON.stringify(result.tailorAdvice) },
                    })
                  }
                  fullWidth
                  icon={<Wrench size={18} color="#fff" />}
                />
              </View>
            )}

            <View style={{ marginTop: 12 }}>
              <ComingSoonNotice
                title={t("fitCheck.showItOnMeTitle")}
                description={t("fitCheck.showItOnMeDescription")}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color, fontWeight: "700", fontSize: 12, marginBottom: 4 }}>{title}</Text>
      {items.map((it, i) => (
        <Text key={i} style={{ color: theme.colors.textPrimary, fontSize: 14, marginBottom: 2 }}>
          • {it}
        </Text>
      ))}
    </View>
  );
}

function InfoBox({ label, text, theme }: { label: string; text: string; theme: ReturnType<typeof useAppTheme>["theme"] }) {
  return (
    <View style={{ backgroundColor: theme.colors.cardAlt, borderRadius: theme.radius.md, padding: 12, marginTop: 10 }}>
      <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 3 }}>{label}</Text>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  photo: { width: "100%", height: 280, borderRadius: 18 },
});
