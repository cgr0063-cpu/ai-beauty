import React from "react";
import { Redirect } from "expo-router";
import { useUserStore } from "@/state/userStore";

export default function Index() {
  const onboardingCompleted = useUserStore((s) => s.onboardingCompleted);
  const onboardingStarted = useUserStore((s) => s.onboardingStarted);

  if (onboardingCompleted) return <Redirect href="/(tabs)/home" />;
  if (onboardingStarted) return <Redirect href="/(onboarding)/language" />;
  return <Redirect href="/(onboarding)/welcome" />;
}
