import React from "react";
import { Alert, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BookmarkX, Share2, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { Card } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useSavedLooksStore } from "@/state/savedLooksStore";

export default function SavedLooksScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const saved = useSavedLooksStore((s) => s.saved);
  const removeLook = useSavedLooksStore((s) => s.removeLook);
  const feedback = useSavedLooksStore((s) => s.feedback);
  const setFeedback = useSavedLooksStore((s) => s.setFeedback);
  const clear = useSavedLooksStore((s) => s.reset);

  const confirmRemove = (id: string) => {
    Alert.alert(t("savedLooks.removeTitle"), t("savedLooks.removeBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => removeLook(id) },
    ]);
  };

  const shareLook = async (title: string, sections: { title: string; content: string }[], why: string) => {
    const summary = sections.map((s) => `${s.title}: ${s.content}`).join("\n");
    await Share.share({ message: `${title}\n\n${summary}\n\n${why}` }).catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.textPrimary, fontSize: theme.typography.display, fontWeight: "800" }}>
              {t("savedLooks.title")}
            </Text>
            <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{t("savedLooks.count", { count: saved.length })}</Text>
          </View>
          <Button
            label={t("common.back")}
            variant="secondary"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/home");
            }}
          />
        </View>

        {saved.length === 0 ? (
          <Card style={{ marginTop: 20, alignItems: "center", paddingVertical: 28 }}>
            <BookmarkX size={30} color={theme.colors.textMuted} />
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "700", marginTop: 10 }}>{t("savedLooks.emptyTitle")}</Text>
            <Text style={{ color: theme.colors.textMuted, textAlign: "center", marginTop: 6, marginBottom: 14 }}>{t("savedLooks.emptyBody")}</Text>
            <Button label={t("savedLooks.createLook")} onPress={() => router.replace("/(tabs)/home")} fullWidth />
          </Card>
        ) : (
          <>
            {saved.map((look) => (
              <Card key={look.id} style={{ marginTop: 14 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: "800" }}>{look.title}</Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{look.todaysEnergy}</Text>
                <View style={{ marginTop: 12 }}>
                  {look.sections.map((section) => (
                    <View key={`${look.id}-${section.key}`} style={{ marginBottom: 9 }}>
                      <Text style={{ color: theme.colors.textSecondary, fontWeight: "700", fontSize: 13 }}>{section.title}</Text>
                      <Text style={{ color: theme.colors.textPrimary, marginTop: 2 }}>{section.content}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 8 }}>{t("savedLooks.feedbackPrompt")}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  <Button label={t("savedLooks.loveIt")} variant={feedback[look.id] === "love" ? "primary" : "secondary"} onPress={() => setFeedback(look.id, feedback[look.id] === "love" ? null : "love")} />
                  <Button label={t("savedLooks.notForMe")} variant={feedback[look.id] === "not_for_me" ? "primary" : "secondary"} onPress={() => setFeedback(look.id, feedback[look.id] === "not_for_me" ? null : "not_for_me")} />
                  <Button label={t("savedLooks.neverSuggest")} variant={feedback[look.id] === "never" ? "primary" : "secondary"} onPress={() => setFeedback(look.id, feedback[look.id] === "never" ? null : "never")} />
                </View>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("common.share")}
                      variant="secondary"
                      onPress={() => shareLook(look.title, look.sections, look.whyThisLook)}
                      icon={<Share2 size={16} color={theme.colors.textPrimary} />}
                      fullWidth
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("common.delete")}
                      variant="secondary"
                      onPress={() => confirmRemove(look.id)}
                      icon={<Trash2 size={16} color={theme.colors.danger} />}
                      fullWidth
                    />
                  </View>
                </View>
              </Card>
            ))}

            <View style={{ marginTop: 18 }}>
              <Button
                label={t("savedLooks.clearAll")}
                variant="secondary"
                onPress={() =>
                  Alert.alert(t("savedLooks.clearAll"), t("savedLooks.clearAllBody"), [
                    { text: t("common.cancel"), style: "cancel" },
                    { text: t("common.delete"), style: "destructive", onPress: clear },
                  ])
                }
                fullWidth
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
