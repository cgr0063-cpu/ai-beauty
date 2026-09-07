import React from "react";
import { Redirect } from "expo-router";
import { useUserStore } from "@/state/userStore";

export default function Index() {
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);

  if (onboardingCompleted) return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/(onboarding)/language" />;
}
