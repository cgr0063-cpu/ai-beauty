import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Linking, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Sparkles, Check } from "lucide-react-native";
import { ScreenHeader, Card, Badge } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { getSubscriptionProvider, isRealBillingConfigured } from "@/services/providers/subscription";
import { SubscriptionPlan } from "@/services/providers/subscription/SubscriptionProvider";
import { useEntitlementStore } from "@/state/entitlementStore";

const PLUS_PERK_KEYS = [
  "subscription.perks.saved",
  "subscription.perks.runway",
  "subscription.perks.storeMode",
] as const;

export default function PaywallScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const status = useEntitlementStore((s) => s.status);
  const setStatus = useEntitlementStore((s) => s.setStatus);

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadPlans = async () => {
    setError(null);
    setLoadingPlans(true);
    try {
      const p = await getSubscriptionProvider().getOfferings();
      setPlans(p);
      setSelected(p[0]?.id ?? null);
      if (p.length === 0) setError(t("subscription.noPlans"));
    } catch {
      setPlans([]);
      setSelected(null);
      setError(t("subscription.loadError"));
    } finally { setLoadingPlans(false); }
  };

  useEffect(() => { loadPlans(); }, []);

  const onPurchase = async () => {
    if (status === "plus") {
      const url = Platform.OS === "ios"
        ? "https://apps.apple.com/account/subscriptions"
        : "https://play.google.com/store/account/subscriptions";
      await Linking.openURL(url);
      return;
    }
    if (!selected) return;
    setError(null);
    setNotice(null);
    setPurchasing(true);
    try {
      const newStatus = await getSubscriptionProvider().purchase(selected);
      setStatus(newStatus);
      if (newStatus === "plus") router.back();
    } catch (e: any) {
      const cancelled = e?.userCancelled === true || String(e?.code ?? "").toLowerCase().includes("cancel");
      if (!cancelled) setError(t("subscription.purchaseError"));
    } finally {
      setPurchasing(false);
    }
  };

  const onRestore = async () => {
    setError(null);
    setNotice(null);
    setRestoring(true);
    try {
      const newStatus = await getSubscriptionProvider().restorePurchases();
      setStatus(newStatus);
      setNotice(newStatus === "plus" ? t("subscription.restoreSuccess") : t("subscription.restoreNone"));
    } catch {
      setError(t("subscription.restoreError"));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title={t("subscription.title")} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Sparkles size={32} color={theme.colors.accent} />
          {status === "plus" && (
            <View style={{ marginTop: 10 }}>
              <Badge text={t("subscription.currentPlanPlus")} tone="success" />
            </View>
          )}
        </View>

        {!isRealBillingConfigured && (
          <Card style={{ marginBottom: 16, backgroundColor: theme.colors.cardAlt }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12 }}>{t("subscription.sandboxNotice")}</Text>
          </Card>
        )}

        <Card style={{ marginBottom: 16 }}>
          {PLUS_PERK_KEYS.map((perkKey) => (
            <View key={perkKey} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Check size={16} color={theme.colors.success} />
              <Text style={{ color: theme.colors.textPrimary, marginLeft: 8, fontSize: 14 }}>{t(perkKey)}</Text>
            </View>
          ))}
        </Card>

        {loadingPlans ? (
          <View accessibilityRole="progressbar" accessibilityLabel={t("common.loading")}><ActivityIndicator color={theme.colors.accent} /></View>
        ) : (
          plans.map((plan) => {
            const isSelected = selected === plan.id;
            return (
              <Card
                key={plan.id}
                onPress={() => setSelected(plan.id)}
                style={{
                  marginBottom: 10,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                  borderWidth: isSelected ? 2 : 1,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>
                      {plan.title} · {plan.period === "yearly" ? t("subscription.yearly") : t("subscription.monthly")}
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{plan.priceDisplay}</Text>
                  </View>
                  {plan.badge && <Badge text={plan.badge} tone="warning" />}
                </View>
              </Card>
            );
          })
        )}

        {notice && (
          <Card style={{ marginTop: 8 }}>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.colors.textPrimary }}>{notice}</Text>
          </Card>
        )}

        {error && (
          <Card style={{ marginTop: 8 }}>
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text>
            {plans.length === 0 && <Button label={t("common.retry")} variant="secondary" onPress={loadPlans} fullWidth />}
          </Card>
        )}

        <View style={{ marginTop: 16 }}>
          <Button
            label={status === "plus" ? t("subscription.manage") : t("subscription.subscribe")}
            onPress={onPurchase}
            fullWidth
            size="lg"
            loading={purchasing}
            disabled={status !== "plus" && !selected}
          />
          <View style={{ height: 10 }} />
          <Button
            label={t("subscription.restorePurchases")}
            onPress={onRestore}
            variant="ghost"
            fullWidth
            loading={restoring}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ scroll: { padding: 20, paddingBottom: 40 } });
