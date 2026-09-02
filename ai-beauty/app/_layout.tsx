import "@/i18n";
import React, { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useAppTheme } from "@/design-system/ThemeProvider";
import { getSubscriptionProvider } from "@/services/providers/subscription";
import { useEntitlementStore } from "@/state/entitlementStore";
import { useSettingsStore } from "@/state/settingsStore";
import i18n, { setAppLanguage } from "@/i18n";
import { arePersistedStoresHydrated, subscribeToHydration } from "@/services/appHydration";
import { reconcilePersistedSession } from "@/services/sessionLifecycle";
import { useUserStore } from "@/state/userStore";
import * as Notifications from "expo-notifications";
import { refreshInactivityReminder } from "@/services/notifications";

SplashScreen.preventAutoHideAsync().catch(() => {});

function InnerLayout() {
  const { theme, reducedMotion } = useAppTheme();
  const setEntitlementStatus = useEntitlementStore((s) => s.setStatus);
  const language = useSettingsStore((s) => s.language);
  const [hydrated, setHydrated] = useState(arePersistedStoresHydrated());
  const router = useRouter();
  const segments = useSegments();
  const onboardingStarted = useUserStore((s) => s.onboardingStarted);
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  const refreshInactivity = () => {
    const enabled = useSettingsStore.getState().inactivityReminderEnabled;
    refreshInactivityReminder(enabled, i18n.t("notifications.inactivityTitle"), i18n.t("notifications.inactivityBody")).catch(() => {});
  };

  useEffect(() => {
    if (hydrated) return;
    return subscribeToHydration(() => setHydrated(arePersistedStoresHydrated()));
  }, [hydrated]);

  useEffect(() => { if (hydrated) setAppLanguage(language); }, [hydrated, language]);

  // Reject direct/deep-link access to product routes until minimum onboarding is complete.
  // Auth screens remain reachable from Welcome. Root / is allowed to perform the canonical redirect.
  useEffect(() => {
    if (!hydrated || onboardingCompleted) return;
    const root = segments[0];
    const allowed = root == null || root === "(onboarding)" || root === "(auth)";
    if (!allowed) {
      router.replace(onboardingStarted ? "/(onboarding)/language" : "/(onboarding)/welcome");
    }
  }, [hydrated, onboardingCompleted, onboardingStarted, router, segments]);

  useEffect(() => {
    if (!hydrated) return;
    const allowed = new Set(["/(tabs)/home", "/(tabs)/saved", "/(tabs)/explore/store"]);
    const openResponse = (response: Notifications.NotificationResponse | null) => {
      const route = response?.notification.request.content.data?.route;
      if (typeof route === "string" && allowed.has(route)) router.push(route as any);
    };
    Notifications.getLastNotificationResponseAsync().then(openResponse).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(openResponse);
    return () => sub.remove();
  }, [hydrated, router]);

useEffect(() => {
  if (!hydrated) return;

  reconcilePersistedSession().catch(() => {});
  refreshInactivity();

  const appState = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      reconcilePersistedSession().catch(() => {});
      refreshInactivity();
    }
  });

  SplashScreen.hideAsync().catch(() => {});

  return () => {
    appState.remove();
  };
}, [hydrated]);
