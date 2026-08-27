import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
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

const PLUS_PERKS = [
  "Unlimited saved looks",
  "Unlimited Fit Checks per day",
  "Priority AI generation",
  "Early access to new style modules",
];

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

  useEffect(() => {
    getSubscriptionProvider()
      .getOfferings()
      .then((p) => {
        setPlans(p);
        setSelected(p[0]?.id ?? null);
      })
      .finally(() => setLoadingPlans(false));
  }, []);

  const onPurchase = async () => {
    if (!selected) return;
    setError(null);
    setPurchasing(true);
    try {
      const newStatus = await getSubscriptionProvider().purchase(selected);
      setStatus(newStatus);
      if (newStatus === "plus") router.back();
    } catch {
      setError(t("errors.generic"));
    } finally {
      setPurchasing(false);
    }
  };

  const onRestore = async () => {
    setError(null);
    setRestoring(true);
    try {
      const newStatus = await getSubscriptionProvider().restorePurchases();
      setStatus(newStatus);
    } catch {
      setError(t("errors.generic"));
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
          {PLUS_PERKS.map((perk) => (
            <View key={perk} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Check size={16} color={theme.colors.success} />
              <Text style={{ color: theme.colors.textPrimary, marginLeft: 8, fontSize: 14 }}>{perk}</Text>
            </View>
          ))}
        </Card>

        {loadingPlans ? (
          <ActivityIndicator color={theme.colors.accent} />
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

        {error && <Text style={{ color: theme.colors.danger, marginTop: 8 }}>{error}</Text>}

        <View style={{ marginTop: 16 }}>
          <Button
            label={status === "plus" ? t("subscription.manage") : t("subscription.subscribe")}
            onPress={onPurchase}
            fullWidth
            size="lg"
            loading={purchasing}
            disabled={!selected}
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
