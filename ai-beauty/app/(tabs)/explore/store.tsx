import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenHeader, Card, Badge } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useWardrobeStore } from "@/state/wardrobeStore";
import { useUserStore } from "@/state/userStore";
import { useSavedLooksStore } from "@/state/savedLooksStore";
import { useSettingsStore } from "@/state/settingsStore";
import { evaluateStoreMode, StoreVerdict } from "@/domain/storeModeEngine";
import { getWeeklyTrend, WeeklyTrendSnapshot } from "@/services/trends/weeklyTrends";
import { useEntitlementStore } from "@/state/entitlementStore";
import { ClosetItemAnalysis } from "@/services/providers/ai/AIProvider";
import { getAIProvider } from "@/services/providers/ai";
import { ensureAiPhotoConsent } from "@/services/privacy/photoConsent";

export default function StoreModeScreen() {
  const { theme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const entitlement = useEntitlementStore((s) => s.status);
  const closet = useWardrobeStore((s) => s.items);
  const favoriteColors = useUserStore((s) => s.favoriteColors);
  const dislikedColors = useUserStore((s) => s.dislikedColors);
  const saved = useSavedLooksStore((s) => s.saved);
  const feedback = useSavedLooksStore((s) => s.feedback);
  const region = useSettingsStore((s) => s.regionCountryCode);
  const [store, setStore] = useState("");
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");
  const [budget, setBudget] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<ClosetItemAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof evaluateStoreMode> | null>(null);
  const [trend, setTrend] = useState<WeeklyTrendSnapshot | null>(null);

  const preferenceSignals = useMemo(() => saved.slice(0, 20).map((look) => ({
    title: look.title,
    details: `${look.colorPaletteHex.slice(0, 4).join(" ")} ${look.sections.slice(0, 2).map((section) => `${section.title} ${section.content}`).join(" ")}`.slice(0, 500),
    feedback: feedback[look.id],
  })).filter((x): x is { title: string; details: string; feedback: NonNullable<typeof x.feedback> } => !!x.feedback), [saved, feedback]);

  useEffect(() => {
    let active = true;
    getWeeklyTrend(region).then((snapshot) => { if (active) setTrend(snapshot); }).catch(() => {});
    return () => { active = false; };
  }, [region]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("errors.photoPermission"));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      setPhotoAnalysis(null);
      setAnalysisError(false);
      setResult(null);
    }
  };

  const parseMoney = (value: string) => {
    const n = Number(value.replace(",", ".").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const evaluate = async () => {
    if (!product.trim() && !photoUri) return;
    setLoading(true);
    setAnalysisError(false);
    let analysis = photoAnalysis;
    if (photoUri && !analysis) {
      const allowed = await ensureAiPhotoConsent(t);
      if (allowed) {
        try {
          analysis = await getAIProvider().analyzeStoreProduct(photoUri, i18n.language || "en");
          setPhotoAnalysis(analysis);
        } catch {
          setAnalysisError(true);
        }
      }
    }

    const effectiveProduct = product.trim() || analysis?.label || "";
    if (!effectiveProduct) {
      setLoading(false);
      return;
    }
    setResult(evaluateStoreMode({
      product: effectiveProduct,
      productAnalysis: analysis,
      store,
      price: parseMoney(price),
      budget: parseMoney(budget),
      closet,
      favoriteColors,
      dislikedColors,
      savedPreferenceSignals: preferenceSignals,
      weeklyTrend: trend,
    }));
    setLoading(false);
  };

  const tone: Record<StoreVerdict, "success" | "warning" | "accent"> = { buy: "success", consider: "warning", skip: "accent" };

  if (entitlement !== "plus") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScreenHeader title={t("store.title")} />
        <View style={{ padding: 20 }}>
          <Card>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: 18 }}>{t("subscription.plusRequiredTitle")}</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 8, marginBottom: 16 }}>{t("subscription.storePlusBody")}</Text>
            <Button label={t("subscription.viewPlus")} onPress={() => router.push("/subscription/paywall")} fullWidth />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("store.title")} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: 17 }}>{t("store.decisionTitle")}</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 5, marginBottom: 14 }}>{t("store.decisionHint")}</Text>
          <TextInput value={store} onChangeText={setStore} placeholder={t("store.storePlaceholder")} placeholderTextColor={theme.colors.textMuted} style={[styles.input,{color:theme.colors.textPrimary,borderColor:theme.colors.border}]} />
          <TextInput value={product} onChangeText={setProduct} placeholder={t("store.productPlaceholder")} placeholderTextColor={theme.colors.textMuted} style={[styles.input,{color:theme.colors.textPrimary,borderColor:theme.colors.border}]} />
          <TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder={t("store.pricePlaceholder")} placeholderTextColor={theme.colors.textMuted} style={[styles.input,{color:theme.colors.textPrimary,borderColor:theme.colors.border}]} />
          <TextInput value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder={t("store.budgetPlaceholder")} placeholderTextColor={theme.colors.textMuted} style={[styles.input,{color:theme.colors.textPrimary,borderColor:theme.colors.border}]} />
          {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
          <Button label={photoUri ? t("store.changePhoto") : t("store.addPhoto")} variant="secondary" onPress={pickPhoto} fullWidth />
          {photoAnalysis && (
            <View style={[styles.analysisBox, { borderColor: theme.colors.border }]}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{t("store.photoDetected")}: {photoAnalysis.label}</Text>
              <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{t("store.photoDetectedMeta", { category: photoAnalysis.category, color: photoAnalysis.color || t("store.unknownColor"), confidence: photoAnalysis.confidence })}</Text>
            </View>
          )}
          {analysisError && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.colors.textMuted, marginTop: 8 }}>{t("store.photoAnalysisUnavailable")}</Text>}
          <View style={{ height: 10 }} />
          <Button label={loading ? t("store.evaluating") : t("store.evaluate")} onPress={evaluate} disabled={loading || (!product.trim() && !photoUri)} fullWidth />
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{t("store.closetCheck")}</Text>
          <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>
            {closet.length ? t("store.closetCount", { count: closet.length }) : t("store.closetEmpty")}
          </Text>
        </Card>

        {result && (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", flex: 1 }}>{store || t("store.item")}: {product || photoAnalysis?.label}</Text>
              <Badge text={t(`store.${result.verdict}`)} tone={tone[result.verdict]} />
            </View>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", marginTop: 12 }}>{t("store.compatibilityScore", { score: result.compatibilityScore })}</Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 5 }}>{t("store.compatibilityMeaning")}</Text>
            {result.reasons.slice(0, 3).map((reason) => (
              <Text key={reason} style={{ color: theme.colors.textMuted, marginTop: 8 }}>• {t(`store.reason.${reason}`, { count: result.compatibleClosetCount })}</Text>
            ))}
            {result.compatibleClosetCount > 0 && <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>{t("store.compatibleCount", { count: result.compatibleClosetCount })}</Text>}
            {result.topCompatibleLabels.length > 0 && <Text style={{ color: theme.colors.textMuted, marginTop: 6 }}>{t("store.topMatches", { items: result.topCompatibleLabels.join(", ") })}</Text>}
            {result.trendSupport && <Text style={{ color: theme.colors.textMuted, marginTop: 8 }}>{trend?.stale ? t("store.staleTrend", { date: trend.fetchedAt.slice(0,10), trend: result.trendSupport }) : t("store.trendSupport", { trend: result.trendSupport })}</Text>}
            <Text style={{ color: theme.colors.textMuted, marginTop: 10, fontSize: 11 }}>{t("store.truthfulNote")}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  photo: { width: "100%", height: 180, borderRadius: 14, marginBottom: 10 },
  analysisBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 10 },
});
