import React from "react";
import { Stack } from "expo-router";
import { useAppTheme } from "@/design-system/ThemeProvider";

export default function ExploreLayout() {
  const { theme } = useAppTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
  );
}
