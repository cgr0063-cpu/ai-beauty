import React from "react";
import { Redirect } from "expo-router";

export default function LegacySavedRedirect() {
  return <Redirect href="/(tabs)/saved" />;
}
