import React from "react";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Home, Compass, Shirt, Camera, User } from "lucide-react-native";
import { useAppTheme } from "@/design-system/ThemeProvider";

export default function TabsLayout() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t("nav.home"), tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: t("nav.explore"), tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="closet"
        options={{ title: t("nav.closet"), tabBarIcon: ({ color, size }) => <Shirt color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="fitcheck-entry"
        options={{ title: t("nav.fitCheck"), tabBarIcon: ({ color, size }) => <Camera color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("nav.profile"), tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
      <Tabs.Screen name="saved" options={{ href: null }} />
    </Tabs>
  );
}
