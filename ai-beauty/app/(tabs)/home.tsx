import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Share, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Cloud, RefreshCw, Share2, Bookmark, BookmarkCheck } from "lucide-react-native";
import { Card, Chip, SectionTitle, Badge } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { useUserStore } from "@/state/userStore";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useSavedLooksStore } from "@/state/savedLooksStore";
import { useEntitlementStore, FREE_SAVED_LOOKS_LIMIT } from "@/state/entitlementStore";
import { useTodaysLook } from "@/domain/useTodaysLook";
import { MOODS } from "@/data/moods";
import { PLAN_OPTIONS } from "@/data/plans";
import { WEATHER_CONDITIONS } from "@/data/context";

function greetingKey(): "home.greetingMorning" | "home.greetingAfternoon" | "home.greetingEvening" {
  const h = new Date().getHours();
  if (h < 12) return "home.greetingMorning";
  if (h < 18) return "home.greetingAfternoon";
  return "home.greetingEvening";
}

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ startSelfie?: string; photoUri?: string }>();
  const name = useUserStore((s) => s.name);
  const setSelfieUri = useUserStore((s) => s.setSelfieUri);
  const ctx = useTodayContextStore();
  const { look, loading, loadingLabel, error, generate, regenerate } = useTodaysLook();
  const saveLook = useSavedLooksStore((s) => s.saveLook);
  const savedCount = useSavedLooksStore((s) => s.saved.length);
  const isSaved = useSavedLooksStore((s) => (look ? s.isSaved(look.id) : false));
  const entitlementStatus = useEntitlementStore((s) => s.status);
  const consumedPhotoParam = useRef<string | null>(null);

  const onSave = () => {
    if (!look) return;
    if (entitlementStatus !== "plus" && savedCount >= FREE_SAVED_LOOKS_LIMIT && !isSaved) {
      router.push("/subscription/paywall");
      return;
    }
    saveLook(look);
  };

  const onShare = async () => {
    if (!look) return;
    const summary = look.sections.map((s) => `${s.title}: ${s.content}`).join("\n");
    try {
      await Share.share({
        message: `${t("sharing.shareText")}\n\n${look.title}\n\n${summary}\n\n${t("home.whyThisLook")}: ${look.whyThisLook}`,
      });
    } catch {
      Alert.alert(t("errors.generic"));
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.moodId, ctx.planId, ctx.styleId, ctx.weatherCondition]);

  useEffect(() => {
    if (params.startSelfie === "1") {
      (async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(t("errors.cameraPermission"));
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          cameraType: ImagePicker.CameraType.front,
        });
        if (!result.canceled && result.assets[0]) {
          router.push({
            pathname: "/camera/enhance",
            params: { photoUri: result.assets[0].uri, mode: "selfie", returnTo: "/(tabs)/home" },
          });
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Picks up the (possibly enhanced) selfie handed back by /camera/enhance exactly once.
  useEffect(() => {
    if (params.photoUri && consumedPhotoParam.current !== params.photoUri) {
      consumedPhotoParam.current = params.photoUri;
      setSelfieUri(params.photoUri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.photoUri]);

  const weatherLabel = ctx.weatherCondition
    ? t(`weatherLabels.${ctx.weatherCondition}`, {
        defaultValue: WEATHER_CONDITIONS.find((w) => w.id === ctx.weatherCondition)?.label ?? "",
      })
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.body }}>
          {t(greetingKey())}
          {name ? `, ${name}` : ""} ☀️
        </Text>

        {/* Quick context chips — editing doesn't wipe other answers */}
        <View style={{ marginTop: 16 }}>
          <SectionTitle>{t("home.editContext")}</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            {MOODS.slice(0, 8).map((m) => (
              <Chip
                key={m.id}
                label={`${m.emoji} ${t(`moodLabels.${m.id}`, { defaultValue: m.label })}`}
                active={ctx.moodId === m.id}
                onPress={() => ctx.setMood(ctx.moodId === m.id ? null : m.id)}
              />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PLAN_OPTIONS.slice(0, 8).map((p) => (
              <Chip
                key={p.id}
                label={t(`planLabels.${p.id}`, { defaultValue: p.label })}
                active={ctx.planId === p.id}
                onPress={() => ctx.setPlan(ctx.planId === p.id ? null : p.id)}
              />
            ))}
            <Chip label={t("common.seeAll")} onPress={() => router.push("/(tabs)/explore")} />
          </ScrollView>
          {weatherLabel && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
              <Cloud size={14} color={theme.colors.textMuted} />
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginLeft: 6 }}>
                {weatherLabel}
                {ctx.temperatureC != null ? ` · ${ctx.temperatureC}°C` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Today's Look result */}
        <View style={{ marginTop: 24 }}>
          <SectionTitle>{t("home.todaysLook")}</SectionTitle>

          {loading && (
            <Card>
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <ActivityIndicator color={theme.colors.accent} />
                <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>{t(loadingLabel)}</Text>
              </View>
            </Card>
          )}

          {!loading && error && (
            <Card>
              <Text style={{ color: theme.colors.danger, marginBottom: 12 }}>{t(error)}</Text>
              <Button label={t("common.retry")} onPress={generate} variant="secondary" />
            </Card>
          )}

          {!loading && !error && look && (
            <>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: theme.typography.title, fontWeight: "800", flex: 1 }}>
                    {look.title}
                  </Text>
                  {look.source === "demo" && <Badge text="Offline" tone="warning" />}
                </View>
                <View style={{ flexDirection: "row", marginTop: 10, marginBottom: 4 }}>
                  {look.colorPaletteHex.map((c, i) => (
                    <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
                  ))}
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 12 }}>
                  {look.todaysEnergy}
                </Text>

                {look.sections.map((s) => (
                  <View key={s.key} style={{ marginBottom: 10 }}>
                    <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 }}>
                      {t(`beauty.sections.${s.key}`, { defaultValue: s.title })}
                    </Text>
                    <Text style={{ color: theme.colors.textPrimary, fontSize: 14, marginTop: 2 }}>{s.content}</Text>
                  </View>
                ))}

                <View style={[styles.whyBox, { backgroundColor: theme.colors.cardAlt, borderRadius: theme.radius.md }]}>
                  <Text style={{ color: theme.colors.accent, fontWeight: "700", fontSize: 12, marginBottom: 4 }}>
                    {t("home.whyThisLook")}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18 }}>
                    {look.whyThisLook}
                  </Text>
                </View>
              </Card>

              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
                <Chip label={t("home.makeItBolder")} onPress={() => regenerate("bolder")} />
                <Chip label={t("home.makeItSofter")} onPress={() => regenerate("softer")} />
                <Chip label={t("home.officeVersion")} onPress={() => regenerate("office")} />
                <Chip label={t("home.dateNightVersion")} onPress={() => regenerate("dateNight")} />
              </View>

              <View style={{ flexDirection: "row", marginTop: 12, gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t("common.regenerate")}
                    onPress={() => regenerate("another")}
                    variant="secondary"
                    icon={<RefreshCw size={16} color={theme.colors.textPrimary} />}
                    fullWidth
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t("common.save")}
                    onPress={onSave}
                    variant="secondary"
                    disabled={isSaved}
                    icon={
                      isSaved ? (
                        <BookmarkCheck size={16} color={theme.colors.success} />
                      ) : (
                        <Bookmark size={16} color={theme.colors.textPrimary} />
                      )
                    }
                    fullWidth
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t("common.share")}
                    onPress={onShare}
                    variant="secondary"
                    icon={<Share2 size={16} color={theme.colors.textPrimary} />}
                    fullWidth
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
  swatch: { width: 26, height: 26, borderRadius: 13, marginRight: -8, borderWidth: 2, borderColor: "#00000022" },
  whyBox: { padding: 14, marginTop: 8 },
});
