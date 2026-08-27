import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Store, Sparkles, Clapperboard } from "lucide-react-native";
import { Card, Chip, SectionTitle } from "@/design-system/components/Primitives";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { STYLES } from "@/data/styles";
import { MOODS } from "@/data/moods";
import { PLAN_CATEGORIES, PLAN_OPTIONS, GYM_SUBOPTIONS } from "@/data/plans";
import { ZODIAC_SIGNS, TAROT_MAJOR_ARCANA } from "@/data/context";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useUserStore } from "@/state/userStore";

export default function ExploreScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const ctx = useTodayContextStore();
  const user = useUserStore();
  const [drawnTarot, setDrawnTarot] = useState<string | null>(ctx.tarotCardId);

  const drawTarot = () => {
    const card = TAROT_MAJOR_ARCANA[Math.floor(Math.random() * TAROT_MAJOR_ARCANA.length)];
    setDrawnTarot(card.id);
    ctx.setTarotCard(card.id);
  };

  const startRunway = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t("errors.cameraPermission"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: "/camera/enhance",
        params: { photoUri: result.assets[0].uri, mode: "runway" },
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.typography.display, fontWeight: "800" }}>
          {t("nav.explore")}
        </Text>

        {/* Mood */}
        <View style={{ marginTop: 20 }}>
          <SectionTitle>{t("mood.title")}</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {MOODS.map((m) => (
              <Chip
                key={m.id}
                label={`${m.emoji} ${t(`moodLabels.${m.id}`, { defaultValue: m.label })}`}
                active={ctx.moodId === m.id}
                onPress={() => ctx.setMood(ctx.moodId === m.id ? null : m.id)}
              />
            ))}
          </View>
        </View>

        {/* Plan by category */}
        <View style={{ marginTop: 20 }}>
          <SectionTitle>{t("plan.title")}</SectionTitle>
          {PLAN_CATEGORIES.map((cat) => {
            const opts = PLAN_OPTIONS.filter((p) => p.category === cat.id);
            return (
              <View key={cat.id} style={{ marginBottom: 12 }}>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 6 }}>
                  {t(`planLabels.${cat.id}`, { defaultValue: cat.label })}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {opts.map((p) => (
                    <Chip
                      key={p.id}
                      label={t(`planLabels.${p.id}`, { defaultValue: p.label })}
                      active={ctx.planId === p.id}
                      onPress={() => ctx.setPlan(ctx.planId === p.id ? null : p.id)}
                    />
                  ))}
                </View>
                {cat.id === "sport" && ctx.planId === "gym_weights" && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
                    <Text style={{ width: "100%", color: theme.colors.textMuted, fontSize: 11, marginBottom: 4 }}>
                      {t("sport.gymDetail")}
                    </Text>
                    {GYM_SUBOPTIONS.map((g) => (
                      <Chip
                        key={g.id}
                        label={t(`planLabels.${g.id}`, { defaultValue: g.label })}
                        active={ctx.gymSubOptionId === g.id}
                        onPress={() => ctx.setGymSubOption(ctx.gymSubOptionId === g.id ? null : g.id)}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Styles */}
        <View style={{ marginTop: 8 }}>
          <SectionTitle subtitle={t("style.subtitle")}>{t("style.title")}</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {STYLES.map((s) => (
              <Chip
                key={s.id}
                label={t(`styleLabels.${s.id}`, { defaultValue: s.label })}
                active={ctx.styleId === s.id}
                onPress={() => ctx.setStyle(ctx.styleId === s.id ? null : s.id)}
              />
            ))}
          </View>
        </View>

        {/* Zodiac */}
        <View style={{ marginTop: 20 }}>
          <SectionTitle subtitle={t("zodiac.subtitle")}>{t("zodiac.title")}</SectionTitle>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {ZODIAC_SIGNS.map((z) => (
              <Chip
                key={z.id}
                label={t(`zodiacLabels.${z.id}`, { defaultValue: z.label })}
                active={user.zodiacSignId === z.id}
                onPress={() => user.setZodiacSignId(user.zodiacSignId === z.id ? null : z.id)}
              />
            ))}
          </View>
        </View>

        {/* Tarot */}
        <View style={{ marginTop: 20 }}>
          <SectionTitle>{t("tarot.title")}</SectionTitle>
          <Card onPress={drawTarot} accessibilityLabel={t("tarot.draw")}>
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <Sparkles color={theme.colors.accentAlt} size={28} />
              {drawnTarot ? (
                (() => {
                  const card = TAROT_MAJOR_ARCANA.find((c) => c.id === drawnTarot)!;
                  return (
                    <>
                      <Text style={{ color: theme.colors.textPrimary, fontWeight: "800", fontSize: 18, marginTop: 10 }}>
                        {t(`tarotLabels.${card.id}`, { defaultValue: card.label })}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: "center" }}>
                        {t(`tarotMessages.${card.id}`, { defaultValue: card.messageSeed })}
                      </Text>
                    </>
                  );
                })()
              ) : (
                <Text style={{ color: theme.colors.textMuted, marginTop: 10 }}>{t("tarot.draw")}</Text>
              )}
            </View>
          </Card>
          {drawnTarot && (
            <Chip
              label={t("tarot.skip")}
              onPress={() => {
                setDrawnTarot(null);
                ctx.setTarotCard(null);
              }}
            />
          )}
        </View>

        {/* Runway camera */}
        <View style={{ marginTop: 20 }}>
          <Card onPress={startRunway}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clapperboard color={theme.colors.accentAlt} size={22} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{t("runway.title")}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {t("runway.subtitle")}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Store Mode */}
        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <Card onPress={() => router.push("/(tabs)/explore/store")}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Store color={theme.colors.accent} size={22} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{t("store.title")}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  {t("store.buy")} / {t("store.consider")} / {t("store.skip")}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },
});
