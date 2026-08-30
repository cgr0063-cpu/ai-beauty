import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, Switch, Linking } from "react-native";
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
  Bell,
  Bookmark,
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
import { getAuthProviderForScope } from "@/services/providers/auth";
import { clearSession } from "@/services/sessionLifecycle";
import {
  scheduleDailyLookReminder, cancelDailyLookReminder,
  scheduleWeeklyTrendReminder, cancelWeeklyTrendReminder,
  scheduleSavedLookReminder, cancelSavedLookReminder,
  refreshInactivityReminder, cancelInactivityReminder, cancelAllBeautyReminders,
} from "@/services/notifications";
import { deletePersistedPhotos } from "@/services/storage/photoLibrary";
import { useTodayContextStore } from "@/state/todayContextStore";
import { useMediaFlowStore } from "@/state/mediaFlowStore";

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
  const [notificationBusy, setNotificationBusy] = useState(false);

  const addressOptions = ADDRESS_PRESETS[settings.language] ?? ADDRESS_PRESETS.en;

  const confirmDestructive = (title: string, action: () => void) => {
    Alert.alert(title, undefined, [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: action },
    ]);
  };

  const onExportData = async () => {
    setExporting(true);
    try {
      const providerAccountData = auth.scope ? await getAuthProviderForScope(auth.scope).exportAccountData().catch(() => null) : null;
      const payload = {
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        account: auth.currentUser ? { id: auth.currentUser.id, email: auth.currentUser.email, name: auth.currentUser.name, provider: auth.currentUser.provider, scope: auth.scope } : null,
        providerAccountData,
        profile: {
          name: user.name, age: user.age, interestedModules: user.interestedModules, favoriteStyleIds: user.favoriteStyleIds,
          favoriteColors: user.favoriteColors, dislikedColors: user.dislikedColors, beautyIntensityPreference: user.beautyIntensityPreference, coveragePreference: user.coveragePreference,
          zodiacSignId: user.zodiacSignId, onboardingStarted: user.onboardingStarted, onboardingCompleted: user.onboardingCompleted,
          photos: { selfieStoredLocally: !!user.selfieUri, fullBodyStoredLocally: !!user.fullBodyPhotoUri },
        },
        settings: {
          language: settings.language, regionCountryCode: settings.regionCountryCode, themeId: settings.themeId, tone: settings.tone, addressId: settings.addressId,
          weatherAuto: settings.weatherAuto, manualWeatherCondition: settings.manualWeatherCondition, notificationsEnabled: settings.notificationsEnabled,
          inactivityReminderEnabled: settings.inactivityReminderEnabled, weeklyTrendNotificationsEnabled: settings.weeklyTrendNotificationsEnabled,
          savedLookReminderEnabled: settings.savedLookReminderEnabled, photoAiConsentAccepted: settings.photoAiConsentAccepted,
          defaultCameraFilterId: settings.defaultCameraFilterId, defaultCameraIntensity: settings.defaultCameraIntensity,
        },
        todayContext: (() => { const x = useTodayContextStore.getState(); return { dateKey:x.dateKey,moodId:x.moodId,planId:x.planId,gymSubOptionId:x.gymSubOptionId,styleId:x.styleId,weatherCondition:x.weatherCondition,temperatureC:x.temperatureC,zodiacApplied:x.zodiacApplied,tarotCardId:x.tarotCardId,socialContext:x.socialContext,companionName:x.companionName,companionZodiacSignId:x.companionZodiacSignId }; })(),
        savedLooks,
        savedLookFeedback: useSavedLooksStore.getState().feedback,
        wardrobe: wardrobe.map(({ photoUri, ...item }) => ({ ...item, photoStoredLocally: !!photoUri })),
        entitlement,
        note: "Photos are kept as local app files and are not embedded in this JSON export.",
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

  const onToggleNotifications = async (value: boolean) => {
    setNotificationBusy(true);
    try {
      if (value) {
        const scheduled = await scheduleDailyLookReminder(
          t("notifications.dailyTitle"),
          t("notifications.dailyBody")
        );
        settings.setNotificationsEnabled(scheduled);
        if (!scheduled) showNotificationSettings();
      } else {
        await cancelDailyLookReminder();
        settings.setNotificationsEnabled(false);
      }
    } catch {
      settings.setNotificationsEnabled(false);
      Alert.alert(t("errors.generic"));
    } finally {
      setNotificationBusy(false);
    }
  };

  const showNotificationSettings = () => Alert.alert(
    t("notifications.permissionDeniedTitle"), t("notifications.permissionDeniedBody"),
    [{ text: t("common.cancel"), style: "cancel" }, { text: t("notifications.openSettings"), onPress: () => Linking.openSettings() }]
  );

  const onToggleInactivity = async (value: boolean) => {
    setNotificationBusy(true);
    try {
      const ok = value ? await refreshInactivityReminder(true, t("notifications.inactivityTitle"), t("notifications.inactivityBody")) : (await cancelInactivityReminder(), true);
      settings.setInactivityReminderEnabled(value && ok);
      if (value && !ok) showNotificationSettings();
    } finally { setNotificationBusy(false); }
  };

  const onToggleWeeklyTrend = async (value: boolean) => {
    setNotificationBusy(true);
    try {
      const ok = value ? await scheduleWeeklyTrendReminder(t("notifications.weeklyTrendTitle"), t("notifications.weeklyTrendBody")) : (await cancelWeeklyTrendReminder(), true);
      settings.setWeeklyTrendNotificationsEnabled(value && ok);
      if (value && !ok) showNotificationSettings();
    } finally { setNotificationBusy(false); }
  };

  const onToggleSavedLook = async (value: boolean) => {
    setNotificationBusy(true);
    try {
      const ok = value ? await scheduleSavedLookReminder(t("notifications.savedLookTitle"), t("notifications.savedLookBody")) : (await cancelSavedLookReminder(), true);
      settings.setSavedLookReminderEnabled(value && ok);
      if (value && !ok) showNotificationSettings();
    } finally { setNotificationBusy(false); }
  };

  const onSignOut = async () => {
    if (auth.scope) await getAuthProviderForScope(auth.scope).signOut();
    await clearSession();
    router.replace("/(onboarding)/welcome");
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

        {/* Saved looks */}
        <SectionRow icon={<Bookmark size={18} color={theme.colors.accent} />} title={t("savedLooks.title")}>
          <Card onPress={() => router.push("/(tabs)/saved")}>
            <Text style={{ color: theme.colors.textPrimary, fontWeight: "700" }}>{t("savedLooks.open")}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>
              {t("savedLooks.count", { count: savedLooks.length })}
            </Text>
          </Card>
        </SectionRow>

        {/* Notifications */}
        <SectionRow icon={<Bell size={18} color={theme.colors.accent} />} title={t("notifications.title")}>
          <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: "600" }}>{t("notifications.dailyLook")}</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{t("notifications.dailyLookHint")}</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={onToggleNotifications}
              disabled={notificationBusy}
              trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
              accessibilityLabel={t("notifications.dailyLook")}
            />
          </Card>
          <NotificationToggle title={t("notifications.inactivity")} hint={t("notifications.inactivityHint")} value={settings.inactivityReminderEnabled} onChange={onToggleInactivity} disabled={notificationBusy} />
          <NotificationToggle title={t("notifications.weeklyTrend")} hint={t("notifications.weeklyTrendHint")} value={settings.weeklyTrendNotificationsEnabled} onChange={onToggleWeeklyTrend} disabled={notificationBusy} />
          <NotificationToggle title={t("notifications.savedLook")} hint={t("notifications.savedLookHint")} value={settings.savedLookReminderEnabled} onChange={onToggleSavedLook} disabled={notificationBusy} />
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


        {/* Coverage preference — explicit only, never inferred */}
        <SectionRow icon={<ShieldCheck size={18} color={theme.colors.accent} />} title={t("profile.coveragePreference")}>
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, marginBottom: 8 }}>{t("profile.coveragePreferenceHint")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {(["no_preference", "more_coverage", "balanced", "more_open"] as const).map((id) => (
              <Chip key={id} label={t(`coveragePreference.${id}`)} active={user.coveragePreference === id} onPress={() => user.setCoveragePreference(id)} />
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
          <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingVertical: 12 }}>
            <View style={{ flex: 1, marginRight: 12 }}><Text style={{ color: theme.colors.textPrimary }}>{t("privacy.photoAiSetting")}</Text><Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{t("privacy.photoAiSettingHint")}</Text></View>
            <Switch value={settings.photoAiConsentAccepted} onValueChange={settings.setPhotoAiConsentAccepted} trackColor={{ true: theme.colors.accent, false: theme.colors.border }} />
          </Card>
          <PrivacyRow
            icon={<Trash2 size={16} color={theme.colors.danger} />}
            label={t("profile.deletePhotos")}
            onPress={() =>
              confirmDestructive(t("profile.deletePhotos"), async () => {
                const refs = [user.selfieUri, user.fullBodyPhotoUri, ...useWardrobeStore.getState().items.map((i) => i.photoUri)];
                await deletePersistedPhotos(refs);
                user.setSelfieUri(null);
                user.setFullBodyPhotoUri(null);
                useWardrobeStore.getState().clearPhotoUris();
                useMediaFlowStore.getState().clearEnhance();
                useMediaFlowStore.getState().setFitCheckPhotoUri(null);
              })
            }
          />
          <PrivacyRow
            icon={<Trash2 size={16} color={theme.colors.danger} />}
            label={t("profile.clearHistory")}
            onPress={() =>
              confirmDestructive(t("profile.clearHistory"), async () => {
                useSavedLooksStore.getState().reset();
                useTodayContextStore.getState().reset();
                await clearAllAppStorage(["aibeauty.savedLooks.v1", "aibeauty.todayContext.v1"]);
              })
            }
          />
          <PrivacyRow
            icon={<LogOut size={16} color={theme.colors.danger} />}
            label={t("profile.deleteAccount")}
            onPress={() =>
              confirmDestructive(t("profile.deleteAccount"), async () => {
                const refs = [user.selfieUri, user.fullBodyPhotoUri, ...useWardrobeStore.getState().items.map((i) => i.photoUri)];
                if (auth.scope) await getAuthProviderForScope(auth.scope).deleteAccount();
                await deletePersistedPhotos(refs).catch(() => {});
                await cancelAllBeautyReminders().catch(() => {});
                useMediaFlowStore.getState().clearEnhance();
                useMediaFlowStore.getState().setFitCheckPhotoUri(null);
                await clearSession({ preserveSnapshot: false });
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

function NotificationToggle({ title, hint, value, onChange, disabled }: { title: string; hint: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  const { theme } = useAppTheme();
  return <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
    <View style={{ flex: 1, marginRight: 12 }}><Text style={{ color: theme.colors.textPrimary, fontWeight: "600" }}>{title}</Text><Text style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 2 }}>{hint}</Text></View>
    <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: theme.colors.accent, false: theme.colors.border }} />
  </Card>;
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
