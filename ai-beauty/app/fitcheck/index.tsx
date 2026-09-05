import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { CheckCircle2, Wrench, RefreshCcw, ShoppingBag, Plus } from "lucide-react-native";
import { ScreenHeader, Card, ComingSoonNotice } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useWardrobeStore } from "@/state/wardrobeStore";
import { getAIProvider } from "@/services/providers/ai";
import { FitCheckResult, FitCheckOutcome } from "@/services/providers/ai/AIProvider";
import { useMediaFlowStore } from "@/state/mediaFlowStore";

const OUTCOME_META: Record<FitCheckOutcome, { icon: (c: string) => React.ReactNode; tone: "success" | "warning" | "accent" }> = {
  keep: { icon: (c) => <CheckCircle2 color={c} size={22} />, tone: "success" },
  adjust: { icon: (c) => <Wrench color={c} size={22} />, tone: "warning" },
  swap: { icon: (c) => <RefreshCcw color={c} size={22} />, tone: "accent" },
  buy: { icon: (c) => <ShoppingBag color={c} size={22} />, tone: "warning" },
};

export default function FitCheckResultScreen() {
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const photoUri = useMediaFlowStore((s) => s.fitCheckPhotoUri);
  const ctx = useTodayContextStore();
  const closetItems = useWardrobeStore((s) => s.items);
  const addClosetItem = useWardrobeStore((s) => s.addItem);
  const setTailorAdvice = useMediaFlowStore((s) => s.setTailorAdvice);
  const [addedCandidates, setAddedCandidates] = useState<Record<number, boolean>>({});

  const [result, setResult] = useState<FitCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setAnalysisFailed(false);
      if (!photoUri) {
        if (!cancelled) { setLoading(false); setResult(null); }
        return;
      }
      const provider = getAIProvider();
      const res = await provider.analyzeFitCheck({
        photoUri,
        planId: ctx.planId,
        styleId: ctx.styleId,
        weatherCondition: ctx.weatherCondition,
        closetItemLabels: closetItems.map((i) => [i.label, i.category, i.color, ...i.styleTags].filter(Boolean).join(" · ")),
        languageCode: i18n.language,
      });
      if (!cancelled) {
        setResult(res);
        setLoading(false);
      }
    }
    run().catch(() => { if (!cancelled) { setLoading(false); setResult(null); setAnalysisFailed(true); } });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoUri, retryNonce]);

  const meta = result ? OUTCOME_META[result.outcome] : null;
  const retake = () => {
    useMediaFlowStore.getState().setFitCheckPhotoUri(null);
    useMediaFlowStore.getState().setTailorAdvice(null);
    router.replace("/(tabs)/fitcheck-entry");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("fitCheck.title")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        )}

        {loading && (
          <Card style={{ marginTop: 16 }}>
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>{t("fitCheck.analyzing")}</Text>
            </View>
          </Card>
        )}

        {!loading && !result && !photoUri && (
          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>{t("camera.noPhoto")}</Text>
            <Button label={t("fitCheck.retake")} onPress={retake} variant="secondary" fullWidth />
          </Card>
        )}

        {!loading && analysisFailed && photoUri && (
          <Card style={{ marginTop: 16 }}>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, marginBottom: 12 }}>{t("fitCheck.analysisError")}</Text>
            <Button label={t("common.retry")} onPress={() => setRetryNonce((n) => n + 1)} variant="secondary" fullWidth />
            <View style={{ height: 8 }} />
            <Button label={t("fitCheck.retake")} onPress={retake} variant="ghost" fullWidth />
          </Card>
        )}

        {!loading && result && (
          <>
            {result.confidence === "low" && (
              <Card style={{ marginTop: 16 }}>
                <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>{t("fitCheck.lowConfidence")}</Text>
                <Button label={t("fitCheck.retake")} onPress={retake} variant="secondary" fullWidth />
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


            {result.confidence !== "low" && result.detectedItems?.length > 0 && (
              <Card style={{ marginTop: 12 }}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: theme.typography.title, marginBottom: 6 }}>{t("fitCheck.detectedPieces")}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 12 }}>{t("fitCheck.detectedPiecesHint")}</Text>
                {result.detectedItems.map((item, index) => {
                  const added = !!addedCandidates[index];
                  return (
                    <View key={`${item.label}_${index}`} style={{ backgroundColor: theme.colors.cardAlt, borderRadius: theme.radius.md, padding: 12, marginBottom: 10 }}>
                      <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{item.label}{item.color ? ` · ${item.color}` : ""}</Text>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 3 }}>{t(`closet.category.${item.category}`)} · {t(`fitCheck.confidence.${item.confidence}`)}</Text>
                      <View style={{ marginTop: 10 }}>
                        <Button
                          label={added ? t("fitCheck.addedToCloset") : t("fitCheck.addToCloset")}
                          disabled={added}
                          variant="secondary"
                          fullWidth
                          icon={<Plus size={16} color={theme.colors.textPrimary} />}
                          onPress={() => {
                            addClosetItem({ photoUri: null, category: item.category, label: item.label, color: item.color ?? undefined, styleTags: item.styleTags });
                            setAddedCandidates((prev) => ({ ...prev, [index]: true }));
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}

            {result.confidence !== "low" && result.tailorAdvice && (
              <View style={{ marginTop: 12 }}>
                <Button
                  label={t("tailor.title")}
                  onPress={() => {
                    setTailorAdvice(result.tailorAdvice);
                    router.push("/fitcheck/tailor");
                  }}
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
