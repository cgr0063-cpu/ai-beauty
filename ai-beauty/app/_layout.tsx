import "@/i18n";
import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { ThemeProvider, useAppTheme } from "@/design-system/ThemeProvider";
import { getSubscriptionProvider } from "@/services/providers/subscription";
import { useEntitlementStore } from "@/state/entitlementStore";

SplashScreen.preventAutoHideAsync().catch(() => {});

function InnerLayout() {
  const { theme, reducedMotion } = useAppTheme();
  const setEntitlementStatus = useEntitlementStore((s) => s.setStatus);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    // Reconcile local entitlement cache with the real subscription provider
    // (RevenueCat, once configured) on every cold start — covers restores,
    // renewals, and cancellations that happened outside this app session.
    getSubscriptionProvider()
      .getEntitlementStatus()
      .then(setEntitlementStatus)
      .catch(() => {
        // Offline or provider unavailable — keep whatever was last cached locally.
      });
  }, [setEntitlementStatus]);

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: reducedMotion ? "none" : "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="fitcheck" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="subscription" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <InnerLayout />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
