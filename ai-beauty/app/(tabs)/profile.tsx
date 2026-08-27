import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  Palette,
  Globe,
  MessageCircle,
  Heart,
  ShieldCheck,
  Sparkles,
  Trash2,
  Download,
  LogOut,
  UserCircle2,
  CloudSun,
  Crown,
} from "lucide-react-native";
import { Card, Chip, Badge } from "@/design-system/components/Primitives";
import { Button } from "@/design-system/components/Button";
import { useAppTheme } from "@/design-system/ThemeProvider";
import { themes, ThemeId } from "@/design-system/themes";
import { useSettingsStore } from "@/state/settingsStore";
import { useUserStore } from "@/state/userStore";
import { useAuthStore } from "@/state/authStore";
import { useEntitlementStore } from "@/state/entitlementStore";
import { useSavedLooksStore } from "@/state/savedLooksStore";
import { useWardrobeStore } from "@/state/wardrobeStore";
import { SUPPORTED_LANGUAGES, setAppLanguage } from "@/i18n";
import { TONE_OPTIONS, ADDRESS_PRESETS, MODULE_OPTIONS } from "@/data/context";
import { clearAllAppStorage } from "@/services/storage/persist";
import { getAuthProvider } from "@/services/providers/auth";

const THEME_ORDER: ThemeId[] = ["signature", "midnight", "minimalLight", "roseSoft"];

export default function ProfileScreen() {
  const { theme, themeId, setThemeId } = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const settings = useSettingsStore();
  const user = useUserStore();
  const auth = useAuthStore();
  const entitlement = useEntitlementStore((s) => s.status);
  const savedLooks = useSavedLooksStore((s) => s.saved);
  const wardrobe = useWardrobeStore((s) => s.items);
  const [exporting, setExporting] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);

  const addressOptions = ADDRESS_PRESETS[settings.language] ?? ADDRESS_PRESETS.en;

  const confirmDestructive = (title: string, action: () => void) => {
    Alert.alert(title, undefined, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.done"), style: "destructive", onPress: action },
    ]);
  };

  const onExportData = async () => {
    setExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        profile: {
          name: user.name,
          age: user.age,
          interestedModules: user.interestedModules,
          favoriteStyleIds: user.favoriteStyleIds,
          zodiacSignId: user.zodiacSignId,
        },
        settings: {
          language: settings.language,
          regionCountryCode: settings.regionCountryCode,
          themeId: settings.themeId,
          tone: settings.tone,
          addressId: settings.addressId,
        },
        savedLooks,
        wardrobe,
      };
      const path = `${FileSystem.cacheDirectory}ai-beauty-export-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(path, { mimeType: "application/json" });
      } else {
        Alert.alert(t("common.done"), path);
      }
    } catch {
      Alert.alert(t("errors.generic"));
    } finally {
      setExporting(false);
    }
  };

  const onToggleWeatherAuto = async (value: boolean) => {
    setLocationBusy(true);
    settings.setWeatherAuto(value);
    setLocationBusy(false);
  };

  const onSignOut = async () => {
    await getAuthProvider().signOut();
    auth.setSession(null, null);
    user.setGuest(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.typography.display, fontWeight: "800" }}>
          {t("profile.title")}
        </Text>

        {/* Account */}
        <SectionRow icon={<UserCircle2 size={18} color={theme.colors.accent} />} title={t("profile.account")}>
          {auth.currentUser ? (
            <Card>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>
                {auth.currentUser.name ?? auth.currentUser.email}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {auth.scope === "local" ? t("profile.accountLocalOnly") : t("profile.accountSynced")}
              </Text>
              <View style={{ height: 10 }} />
              <Button label={t("profile.signOut")} onPress={onSignOut} variant="secondary" icon={<LogOut size={16} color={theme.colors.textPrimary} />} />
            </Card>
          ) : (
            <Card>
              <Text style={{ color: theme.colors.textSecondary, marginBottom: 10 }}>{t("profile.guestNotice")}</Text>
              <Button label={t("auth.signIn")} onPress={() => router.push("/(auth)/sign-in")} fullWidth />
            </Card>
          )}
        </SectionRow>

        {/* Subscription */}
        <SectionRow icon={<Crown size={18} color={theme.colors.accent} />} title={t("profile.subscription")}>
          <Card onPress={() => router.push("/subscription/paywall")}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{t("subscription.title")}</Text>
              <Badge text={entitlement === "plus" ? t("subscription.currentPlanPlus") : t("subscription.currentPlanFree")} tone={entitlement === "plus" ? "success" : "accent"} />
            </View>
          </Card>
        </SectionRow>

        {/* Appearance */}
        <SectionRow icon={<Palette size={18} color={theme.colors.accent} />} title={t("profile.appearance")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {THEME_ORDER.map((id) => (
              <Chip key={id} label={themes[id].name} active={themeId === id} onPress={() => setThemeId(id)} />
            ))}
          </View>
        </SectionRow>

        {/* Language & region */}
        <SectionRow icon={<Globe size={18} color={theme.colors.accent} />} title={t("profile.language")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {SUPPORTED_LANGUAGES.map((l) => (
              <Chip
                key={l.code}
                label={l.nativeLabel}
                active={settings.language === l.code}
                onPress={() => {
                  settings.setLanguage(l.code);
                  setAppLanguage(l.code);
                }}
              />
            ))}
          </View>
        </SectionRow>

        {/* Weather */}
        <SectionRow icon={<CloudSun size={18} color={theme.colors.accent} />} title={t("weather.title")}>
          <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: "600" }}>{t("weather.auto")}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {t("weather.autoHint")}
              </Text>
            </View>
            <Switch
              value={settings.weatherAuto}
              onValueChange={onToggleWeatherAuto}
              disabled={locationBusy}
              trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
              accessibilityLabel={t("weather.auto")}
            />
          </Card>
        </SectionRow>

        {/* Tone */}
        <SectionRow icon={<MessageCircle size={18} color={theme.colors.accent} />} title={t("profile.tone")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {TONE_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                label={t(`onboarding.tone.${opt.id}`)}
                active={settings.tone === opt.id}
                onPress={() => settings.setTone(opt.id)}
              />
            ))}
          </View>
        </SectionRow>

        {/* Address */}
        <SectionRow icon={<Heart size={18} color={theme.colors.accent} />} title={t("profile.address")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {addressOptions.map((opt) => (
              <Chip
                key={opt.id}
                label={opt.label}
                active={settings.addressId === opt.id}
                onPress={() => settings.setAddressId(opt.id)}
              />
            ))}
          </View>
        </SectionRow>

        {/* Modules */}
        <SectionRow icon={<Sparkles size={18} color={theme.colors.accent} />} title={t("profile.modules")}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {MODULE_OPTIONS.map((m) => (
              <Chip
                key={m}
                label={t(`modules.${m}`)}
                active={user.interestedModules.includes(m)}
                onPress={() => user.toggleModule(m)}
              />
            ))}
          </View>
        </SectionRow>

        {/* Privacy */}
        <SectionRow icon={<ShieldCheck size={18} color={theme.colors.accent} />} title={t("profile.privacy")}>
          <PrivacyRow
            icon={<Download size={16} color={theme.colors.textSecondary} />}
            label={exporting ? t("common.loading") : t("profile.exportData")}
            onPress={onExportData}
          />
          <PrivacyRow
            icon={<Trash2 size={16} color={theme.colors.danger} />}
            label={t("profile.deletePhotos")}
            onPress={() =>
              confirmDestructive(t("profile.deletePhotos"), () => {
                user.setSelfieUri(null);
                user.setFullBodyPhotoUri(null);
              })
            }
          />
          <PrivacyRow
            icon={<Trash2 size={16} color={theme.colors.danger} />}
            label={t("profile.clearHistory")}
            onPress={() =>
              confirmDestructive(t("profile.clearHistory"), () => {
                clearAllAppStorage(["aibeauty.savedLooks.v1", "aibeauty.todayContext.v1"]);
              })
            }
          />
          <PrivacyRow
            icon={<LogOut size={16} color={theme.colors.danger} />}
            label={t("profile.deleteAccount")}
            onPress={() =>
              confirmDestructive(t("profile.deleteAccount"), async () => {
                await getAuthProvider().signOut();
                auth.setSession(null, null);
                user.resetProfile();
                router.replace("/(onboarding)/welcome");
              })
            }
          />
        </SectionRow>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        {icon}
        <Text style={{ marginLeft: 8, fontWeight: "700", color: theme.colors.textPrimary }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function PrivacyRow({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Card onPress={onPress} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, paddingVertical: 12 }}>
      {icon}
      <Text style={{ marginLeft: 10, color: theme.colors.textPrimary }}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({ scroll: { padding: 20, paddingBottom: 60 } });
